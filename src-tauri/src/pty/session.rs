use base64::Engine;
use parking_lot::Mutex;
use portable_pty::{native_pty_system, Child, CommandBuilder, MasterPty, PtySize};
use std::io::Read;
use tauri::{AppHandle, Emitter};

pub struct PtySession {
    master: Mutex<Box<dyn MasterPty + Send>>,
    writer: Mutex<Box<dyn std::io::Write + Send>>,
    child: Mutex<Box<dyn Child + Send + Sync>>,
    pub cwd: String,
}

/// Set up shell integration files for zsh.
/// Creates a ZDOTDIR that proxies the user's config and appends our prompt/colors.
fn setup_zsh_integration(home: &str) -> Result<String, String> {
    let integration_dir = format!("{home}/.terminal-plus/shell/zsh");
    std::fs::create_dir_all(&integration_dir)
        .map_err(|e| format!("Failed to create shell integration dir: {e}"))?;

    // .zshenv — restore user ZDOTDIR and source their .zshenv
    std::fs::write(
        format!("{integration_dir}/.zshenv"),
        concat!(
            "# Terminal Plus shell integration\n",
            "if [[ -n \"$TERMINAL_PLUS_ORIG_ZDOTDIR\" ]]; then\n",
            "  ZDOTDIR=\"$TERMINAL_PLUS_ORIG_ZDOTDIR\"\n",
            "else\n",
            "  unset ZDOTDIR\n",
            "fi\n",
            "[[ -f \"${ZDOTDIR:-$HOME}/.zshenv\" ]] && source \"${ZDOTDIR:-$HOME}/.zshenv\"\n",
        ),
    )
    .map_err(|e| format!("Failed to write .zshenv: {e}"))?;

    // .zprofile
    std::fs::write(
        format!("{integration_dir}/.zprofile"),
        "[[ -f \"${ZDOTDIR:-$HOME}/.zprofile\" ]] && source \"${ZDOTDIR:-$HOME}/.zprofile\"\n",
    )
    .map_err(|e| format!("Failed to write .zprofile: {e}"))?;

    // .zshrc — source user config first, then apply our integration
    std::fs::write(
        format!("{integration_dir}/.zshrc"),
        include_str!("shell_integration.zsh"),
    )
    .map_err(|e| format!("Failed to write .zshrc: {e}"))?;

    // .zlogin
    std::fs::write(
        format!("{integration_dir}/.zlogin"),
        "[[ -f \"${ZDOTDIR:-$HOME}/.zlogin\" ]] && source \"${ZDOTDIR:-$HOME}/.zlogin\"\n",
    )
    .map_err(|e| format!("Failed to write .zlogin: {e}"))?;

    Ok(integration_dir)
}

/// Set up shell integration files for bash.
fn setup_bash_integration(home: &str) -> Result<String, String> {
    let integration_dir = format!("{home}/.terminal-plus/shell/bash");
    std::fs::create_dir_all(&integration_dir)
        .map_err(|e| format!("Failed to create shell integration dir: {e}"))?;

    std::fs::write(
        format!("{integration_dir}/.bashrc"),
        include_str!("shell_integration.bash"),
    )
    .map_err(|e| format!("Failed to write .bashrc: {e}"))?;

    Ok(format!("{integration_dir}/.bashrc"))
}

impl PtySession {
    pub fn spawn(
        app: AppHandle,
        session_id: String,
        cols: u16,
        rows: u16,
        cwd: Option<String>,
    ) -> Result<Self, String> {
        let pty_system = native_pty_system();

        let size = PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        };

        let pair = pty_system
            .openpty(size)
            .map_err(|e| format!("Failed to open PTY: {e}"))?;

        let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());
        let home = std::env::var("HOME").unwrap_or_else(|_| "/".to_string());

        let mut cmd = CommandBuilder::new(&shell);
        cmd.arg("-l");

        let working_dir = cwd.unwrap_or_else(|| home.clone());
        cmd.cwd(&working_dir);

        // Inherit common env vars
        for key in &["HOME", "USER", "LOGNAME", "PATH", "TERM", "LANG", "LC_ALL"] {
            if let Ok(val) = std::env::var(key) {
                cmd.env(key, val);
            }
        }
        cmd.env("TERM", "xterm-256color");
        cmd.env("TERMINAL_PLUS", "1");
        cmd.env("CLICOLOR", "1");
        cmd.env("CLICOLOR_FORCE", "1");

        // Shell integration
        if shell.contains("zsh") {
            if let Ok(zdotdir) = setup_zsh_integration(&home) {
                if let Ok(orig) = std::env::var("ZDOTDIR") {
                    cmd.env("TERMINAL_PLUS_ORIG_ZDOTDIR", orig);
                }
                cmd.env("ZDOTDIR", zdotdir);
            }
        } else if shell.contains("bash") {
            if let Ok(rcfile) = setup_bash_integration(&home) {
                cmd.env("TERMINAL_PLUS_BASH_RCFILE", &rcfile);
                // For login bash, .bash_profile is read, not .bashrc.
                // We set BASH_ENV so non-interactive sub-shells also pick it up.
                cmd.env("BASH_ENV", &rcfile);
            }
        }

        let child = pair
            .slave
            .spawn_command(cmd)
            .map_err(|e| format!("Failed to spawn shell: {e}"))?;

        let writer = pair
            .master
            .take_writer()
            .map_err(|e| format!("Failed to get PTY writer: {e}"))?;

        let mut reader = pair
            .master
            .try_clone_reader()
            .map_err(|e| format!("Failed to get PTY reader: {e}"))?;

        let sid = session_id.clone();

        // Dedicated reader thread — blocking I/O
        std::thread::spawn(move || {
            let mut buf = [0u8; 8192];
            let event_name = format!("pty-output-{sid}");
            loop {
                match reader.read(&mut buf) {
                    Ok(0) => break,
                    Ok(n) => {
                        let encoded = base64::engine::general_purpose::STANDARD.encode(&buf[..n]);
                        let _ = app.emit(&event_name, encoded);
                    }
                    Err(_) => break,
                }
            }
            let _ = app.emit(&format!("pty-exit-{sid}"), ());
        });

        Ok(PtySession {
            master: Mutex::new(pair.master),
            writer: Mutex::new(writer),
            child: Mutex::new(child),
            cwd: working_dir,
        })
    }

    pub fn write(&self, data: &[u8]) -> Result<(), String> {
        use std::io::Write;
        let mut writer = self.writer.lock();
        writer
            .write_all(data)
            .map_err(|e| format!("PTY write failed: {e}"))?;
        writer
            .flush()
            .map_err(|e| format!("PTY flush failed: {e}"))
    }

    pub fn resize(&self, cols: u16, rows: u16) -> Result<(), String> {
        self.master
            .lock()
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| format!("PTY resize failed: {e}"))
    }

    /// Get the current working directory of the shell process.
    /// Queries the OS for the live cwd (handles `cd` in the shell).
    /// Falls back to the initial cwd if the OS query fails.
    pub fn get_cwd(&self) -> String {
        let child = self.child.lock();
        if let Some(pid) = child.process_id() {
            if let Some(cwd) = get_pid_cwd(pid) {
                return cwd;
            }
        }
        self.cwd.clone()
    }
}

/// Query the OS for the current working directory of a process by PID.
#[cfg(target_os = "macos")]
fn get_pid_cwd(pid: u32) -> Option<String> {
    // On macOS, use `lsof -a -p <pid> -d cwd -Fn` to get the cwd
    let output = std::process::Command::new("lsof")
        .args(["-a", "-p", &pid.to_string(), "-d", "cwd", "-Fn"])
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    let stdout = String::from_utf8_lossy(&output.stdout);
    // Output format: lines starting with 'n' contain the path
    for line in stdout.lines() {
        if let Some(path) = line.strip_prefix('n') {
            if path.starts_with('/') {
                return Some(path.to_string());
            }
        }
    }
    None
}

#[cfg(target_os = "linux")]
fn get_pid_cwd(pid: u32) -> Option<String> {
    std::fs::read_link(format!("/proc/{pid}/cwd"))
        .ok()
        .map(|p| p.to_string_lossy().to_string())
}

#[cfg(not(any(target_os = "macos", target_os = "linux")))]
fn get_pid_cwd(_pid: u32) -> Option<String> {
    None
}
