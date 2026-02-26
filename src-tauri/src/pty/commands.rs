use base64::Engine;
use tauri::{AppHandle, State};

use super::manager::PtyManager;

#[tauri::command]
pub fn pty_create(
    app: AppHandle,
    state: State<'_, PtyManager>,
    session_id: String,
    cols: u16,
    rows: u16,
    cwd: Option<String>,
) -> Result<(), String> {
    state.create_session(app, session_id, cols, rows, cwd)
}

#[tauri::command]
pub fn pty_write(
    state: State<'_, PtyManager>,
    session_id: String,
    data: String,
) -> Result<(), String> {
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(&data)
        .map_err(|e| format!("Invalid base64: {e}"))?;
    state.write_to_session(&session_id, &bytes)
}

#[tauri::command]
pub fn pty_resize(
    state: State<'_, PtyManager>,
    session_id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    state.resize_session(&session_id, cols, rows)
}

#[tauri::command]
pub fn pty_destroy(state: State<'_, PtyManager>, session_id: String) {
    state.destroy_session(&session_id);
}

#[tauri::command]
pub fn pty_get_cwd(
    state: State<'_, PtyManager>,
    session_id: String,
) -> Result<String, String> {
    state
        .get_session_cwd(&session_id)
        .ok_or_else(|| format!("Session {session_id} not found"))
}
