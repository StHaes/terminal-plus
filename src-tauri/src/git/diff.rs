use super::types::{CommitFile, DiffHunk, DiffLine, FileDiff};

/// Get the list of files changed in a commit.
pub fn get_commit_files(cwd: &str, hash: &str) -> Result<Vec<CommitFile>, String> {
    let output = std::process::Command::new("git")
        .args(["diff-tree", "--root", "--no-commit-id", "-r", "--name-status", hash])
        .current_dir(cwd)
        .output()
        .map_err(|e| format!("Failed to run git diff-tree: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("git diff-tree failed: {stderr}"));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut files = Vec::new();

    for line in stdout.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        // Format: "M\tpath/to/file" or "R100\told\tnew"
        let parts: Vec<&str> = line.splitn(3, '\t').collect();
        if parts.len() >= 2 {
            let status = parts[0].chars().next().unwrap_or('M').to_string();
            // For renames, show the new path
            let path = if parts.len() == 3 { parts[2] } else { parts[1] };
            files.push(CommitFile {
                path: path.to_string(),
                status,
            });
        }
    }

    Ok(files)
}

/// Get the unified diff for a specific file in a commit.
pub fn get_file_diff(cwd: &str, hash: &str, path: &str) -> Result<FileDiff, String> {
    let output = std::process::Command::new("git")
        .args(["show", "--format=", "--no-color", hash, "--", path])
        .current_dir(cwd)
        .output()
        .map_err(|e| format!("Failed to run git show: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("git show failed: {stderr}"));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let hunks = parse_unified_diff(&stdout);

    Ok(FileDiff {
        path: path.to_string(),
        hunks,
    })
}

/// Get the list of uncommitted changed files vs HEAD.
pub fn get_local_changes(cwd: &str) -> Result<Vec<CommitFile>, String> {
    let mut files = Vec::new();

    // Check if HEAD exists (brand new repo with no commits)
    let head_exists = std::process::Command::new("git")
        .args(["rev-parse", "HEAD"])
        .current_dir(cwd)
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false);

    if head_exists {
        // Tracked changes (staged + unstaged) vs HEAD
        let output = std::process::Command::new("git")
            .args(["diff", "HEAD", "--name-status"])
            .current_dir(cwd)
            .output()
            .map_err(|e| format!("Failed to run git diff HEAD: {e}"))?;

        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines() {
                let line = line.trim();
                if line.is_empty() {
                    continue;
                }
                let parts: Vec<&str> = line.splitn(3, '\t').collect();
                if parts.len() >= 2 {
                    let status = parts[0].chars().next().unwrap_or('M').to_string();
                    let path = if parts.len() == 3 { parts[2] } else { parts[1] };
                    files.push(CommitFile {
                        path: path.to_string(),
                        status,
                    });
                }
            }
        }
    } else {
        // No HEAD — show staged files
        let output = std::process::Command::new("git")
            .args(["diff", "--cached", "--name-status"])
            .current_dir(cwd)
            .output()
            .map_err(|e| format!("Failed to run git diff --cached: {e}"))?;

        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines() {
                let line = line.trim();
                if line.is_empty() {
                    continue;
                }
                let parts: Vec<&str> = line.splitn(3, '\t').collect();
                if parts.len() >= 2 {
                    let status = parts[0].chars().next().unwrap_or('A').to_string();
                    let path = if parts.len() == 3 { parts[2] } else { parts[1] };
                    files.push(CommitFile {
                        path: path.to_string(),
                        status,
                    });
                }
            }
        }
    }

    // Untracked files
    let output = std::process::Command::new("git")
        .args(["ls-files", "--others", "--exclude-standard"])
        .current_dir(cwd)
        .output()
        .map_err(|e| format!("Failed to run git ls-files: {e}"))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        for line in stdout.lines() {
            let line = line.trim();
            if !line.is_empty() {
                files.push(CommitFile {
                    path: line.to_string(),
                    status: "A".to_string(),
                });
            }
        }
    }

    Ok(files)
}

/// Get the unified diff for a local (uncommitted) file vs HEAD.
pub fn get_local_file_diff(cwd: &str, path: &str) -> Result<FileDiff, String> {
    // Try diff against HEAD first
    let output = std::process::Command::new("git")
        .args(["diff", "HEAD", "--", path])
        .current_dir(cwd)
        .output()
        .map_err(|e| format!("Failed to run git diff: {e}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout);

    // If empty diff, file might be untracked — use --no-index against /dev/null
    if stdout.trim().is_empty() {
        let output = std::process::Command::new("git")
            .args(["diff", "--no-index", "/dev/null", path])
            .current_dir(cwd)
            .output()
            .map_err(|e| format!("Failed to run git diff --no-index: {e}"))?;

        // --no-index returns exit code 1 when files differ, which is expected
        let stdout = String::from_utf8_lossy(&output.stdout);
        let hunks = parse_unified_diff(&stdout);
        return Ok(FileDiff {
            path: path.to_string(),
            hunks,
        });
    }

    let hunks = parse_unified_diff(&stdout);
    Ok(FileDiff {
        path: path.to_string(),
        hunks,
    })
}

/// Parse unified diff output into structured hunks.
fn parse_unified_diff(diff: &str) -> Vec<DiffHunk> {
    let mut hunks = Vec::new();
    let mut current_hunk: Option<DiffHunk> = None;
    let mut old_line: u32 = 0;
    let mut new_line: u32 = 0;

    for line in diff.lines() {
        // Skip diff header lines
        if line.starts_with("diff --git")
            || line.starts_with("index ")
            || line.starts_with("--- ")
            || line.starts_with("+++ ")
            || line.starts_with("new file")
            || line.starts_with("deleted file")
            || line.starts_with("old mode")
            || line.starts_with("new mode")
            || line.starts_with("similarity index")
            || line.starts_with("rename from")
            || line.starts_with("rename to")
            || line.starts_with("Binary files")
        {
            continue;
        }

        // Hunk header: @@ -old_start,old_count +new_start,new_count @@
        if line.starts_with("@@") {
            if let Some(hunk) = current_hunk.take() {
                hunks.push(hunk);
            }

            let (os, oc, ns, nc) = parse_hunk_header(line);
            old_line = os;
            new_line = ns;
            current_hunk = Some(DiffHunk {
                old_start: os,
                old_count: oc,
                new_start: ns,
                new_count: nc,
                lines: Vec::new(),
            });
            continue;
        }

        if let Some(ref mut hunk) = current_hunk {
            if let Some(content) = line.strip_prefix('+') {
                hunk.lines.push(DiffLine {
                    kind: "add".to_string(),
                    content: content.to_string(),
                    old_lineno: None,
                    new_lineno: Some(new_line),
                });
                new_line += 1;
            } else if let Some(content) = line.strip_prefix('-') {
                hunk.lines.push(DiffLine {
                    kind: "remove".to_string(),
                    content: content.to_string(),
                    old_lineno: Some(old_line),
                    new_lineno: None,
                });
                old_line += 1;
            } else {
                // Context line (starts with space or is empty)
                let content = line.strip_prefix(' ').unwrap_or(line);
                hunk.lines.push(DiffLine {
                    kind: "context".to_string(),
                    content: content.to_string(),
                    old_lineno: Some(old_line),
                    new_lineno: Some(new_line),
                });
                old_line += 1;
                new_line += 1;
            }
        }
    }

    if let Some(hunk) = current_hunk {
        hunks.push(hunk);
    }

    hunks
}

/// Parse "@@ -1,5 +1,7 @@" into (old_start, old_count, new_start, new_count).
fn parse_hunk_header(line: &str) -> (u32, u32, u32, u32) {
    // Find the range between the @@ markers
    let inner = line
        .trim_start_matches("@@")
        .split("@@")
        .next()
        .unwrap_or("")
        .trim();

    let parts: Vec<&str> = inner.split_whitespace().collect();

    let (old_start, old_count) = parse_range(parts.first().unwrap_or(&"-1,1"));
    let (new_start, new_count) = parse_range(parts.get(1).unwrap_or(&"+1,1"));

    (old_start, old_count, new_start, new_count)
}

fn parse_range(s: &str) -> (u32, u32) {
    let s = s.trim_start_matches(['+', '-']);
    let parts: Vec<&str> = s.split(',').collect();
    let start = parts.first().and_then(|v| v.parse().ok()).unwrap_or(1);
    let count = parts.get(1).and_then(|v| v.parse().ok()).unwrap_or(1);
    (start, count)
}
