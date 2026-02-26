use super::diff;
use super::log::parse_git_log;
use super::types::{CommitFile, FileDiff, GitLogResult};

#[tauri::command]
pub fn git_local_changes(cwd: String) -> Result<Vec<CommitFile>, String> {
    diff::get_local_changes(&cwd)
}

#[tauri::command]
pub fn git_local_file_diff(cwd: String, path: String) -> Result<FileDiff, String> {
    diff::get_local_file_diff(&cwd, &path)
}

#[tauri::command]
pub fn git_log(cwd: String, max_count: Option<u32>) -> Result<GitLogResult, String> {
    let count = max_count.unwrap_or(200);
    parse_git_log(&cwd, count)
}

#[tauri::command]
pub fn git_is_repo(cwd: String) -> bool {
    std::process::Command::new("git")
        .args(["rev-parse", "--is-inside-work-tree"])
        .current_dir(&cwd)
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

#[tauri::command]
pub fn git_commit_files(cwd: String, hash: String) -> Result<Vec<CommitFile>, String> {
    diff::get_commit_files(&cwd, &hash)
}

#[tauri::command]
pub fn git_file_diff(cwd: String, hash: String, path: String) -> Result<FileDiff, String> {
    diff::get_file_diff(&cwd, &hash, &path)
}
