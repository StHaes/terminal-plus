use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct GitCommit {
    pub hash: String,
    pub short_hash: String,
    pub parents: Vec<String>,
    pub author_name: String,
    pub author_email: String,
    pub date: String,
    pub subject: String,
    pub refs: Vec<GitRef>,
}

#[derive(Debug, Clone, Serialize)]
pub struct GitRef {
    pub name: String,
    pub ref_type: GitRefType,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum GitRefType {
    Head,
    LocalBranch,
    RemoteBranch,
    Tag,
}

#[derive(Debug, Clone, Serialize)]
pub struct GitLogResult {
    pub commits: Vec<GitCommit>,
    pub current_branch: Option<String>,
}

// --- Commit detail / diff types ---

#[derive(Debug, Clone, Serialize)]
pub struct CommitFile {
    pub path: String,
    pub status: String, // "A" added, "M" modified, "D" deleted, "R" renamed
}

#[derive(Debug, Clone, Serialize)]
pub struct DiffHunk {
    pub old_start: u32,
    pub old_count: u32,
    pub new_start: u32,
    pub new_count: u32,
    pub lines: Vec<DiffLine>,
}

#[derive(Debug, Clone, Serialize)]
pub struct DiffLine {
    pub kind: String, // "add", "remove", "context"
    pub content: String,
    pub old_lineno: Option<u32>,
    pub new_lineno: Option<u32>,
}

#[derive(Debug, Clone, Serialize)]
pub struct FileDiff {
    pub path: String,
    pub hunks: Vec<DiffHunk>,
}
