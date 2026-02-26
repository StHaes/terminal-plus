use std::process::Command;

use super::types::{GitCommit, GitLogResult, GitRef, GitRefType};

pub fn parse_git_log(cwd: &str, max_count: u32) -> Result<GitLogResult, String> {
    let output = Command::new("git")
        .args([
            "log",
            "--all",
            "--topo-order",
            &format!("--max-count={max_count}"),
            "--format=%H%x00%h%x00%P%x00%an%x00%ae%x00%aI%x00%s%x00%D",
        ])
        .current_dir(cwd)
        .output()
        .map_err(|e| format!("Failed to run git log: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("git log failed: {stderr}"));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let commits: Vec<GitCommit> = stdout
        .lines()
        .filter(|line| !line.is_empty())
        .filter_map(|line| parse_commit_line(line))
        .collect();

    let current_branch = get_current_branch(cwd);

    Ok(GitLogResult {
        commits,
        current_branch,
    })
}

fn parse_commit_line(line: &str) -> Option<GitCommit> {
    let parts: Vec<&str> = line.splitn(8, '\0').collect();
    if parts.len() < 7 {
        return None;
    }

    let parents: Vec<String> = if parts[2].is_empty() {
        vec![]
    } else {
        parts[2].split(' ').map(|s| s.to_string()).collect()
    };

    let refs = if parts.len() > 7 && !parts[7].is_empty() {
        parse_refs(parts[7])
    } else {
        vec![]
    };

    Some(GitCommit {
        hash: parts[0].to_string(),
        short_hash: parts[1].to_string(),
        parents,
        author_name: parts[3].to_string(),
        author_email: parts[4].to_string(),
        date: parts[5].to_string(),
        subject: parts[6].to_string(),
        refs,
    })
}

fn parse_refs(refs_str: &str) -> Vec<GitRef> {
    refs_str
        .split(", ")
        .filter(|r| !r.is_empty())
        .map(|r| {
            let trimmed = r.trim();
            if trimmed.starts_with("HEAD -> ") {
                GitRef {
                    name: trimmed.strip_prefix("HEAD -> ").unwrap().to_string(),
                    ref_type: GitRefType::Head,
                }
            } else if trimmed == "HEAD" {
                GitRef {
                    name: "HEAD".to_string(),
                    ref_type: GitRefType::Head,
                }
            } else if trimmed.starts_with("tag: ") {
                GitRef {
                    name: trimmed.strip_prefix("tag: ").unwrap().to_string(),
                    ref_type: GitRefType::Tag,
                }
            } else if trimmed.contains('/') {
                GitRef {
                    name: trimmed.to_string(),
                    ref_type: GitRefType::RemoteBranch,
                }
            } else {
                GitRef {
                    name: trimmed.to_string(),
                    ref_type: GitRefType::LocalBranch,
                }
            }
        })
        .collect()
}

fn get_current_branch(cwd: &str) -> Option<String> {
    let output = Command::new("git")
        .args(["rev-parse", "--abbrev-ref", "HEAD"])
        .current_dir(cwd)
        .output()
        .ok()?;

    if output.status.success() {
        let branch = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if branch == "HEAD" {
            None
        } else {
            Some(branch)
        }
    } else {
        None
    }
}
