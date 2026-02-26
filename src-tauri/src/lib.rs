mod commands;
mod git;
mod pty;

use pty::manager::PtyManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(PtyManager::new())
        .invoke_handler(tauri::generate_handler![
            pty::commands::pty_create,
            pty::commands::pty_write,
            pty::commands::pty_resize,
            pty::commands::pty_destroy,
            pty::commands::pty_get_cwd,
            git::commands::git_log,
            git::commands::git_is_repo,
            git::commands::git_commit_files,
            git::commands::git_file_diff,
            git::commands::git_local_changes,
            git::commands::git_local_file_diff,
            commands::read_file,
            commands::write_file,
            commands::list_dir,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
