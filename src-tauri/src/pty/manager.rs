use parking_lot::RwLock;
use std::collections::HashMap;
use tauri::AppHandle;

use super::session::PtySession;

pub struct PtyManager {
    sessions: RwLock<HashMap<String, PtySession>>,
}

impl PtyManager {
    pub fn new() -> Self {
        PtyManager {
            sessions: RwLock::new(HashMap::new()),
        }
    }

    pub fn create_session(
        &self,
        app: AppHandle,
        session_id: String,
        cols: u16,
        rows: u16,
        cwd: Option<String>,
    ) -> Result<(), String> {
        let session = PtySession::spawn(app, session_id.clone(), cols, rows, cwd)?;
        self.sessions.write().insert(session_id, session);
        Ok(())
    }

    pub fn write_to_session(&self, session_id: &str, data: &[u8]) -> Result<(), String> {
        let sessions = self.sessions.read();
        let session = sessions
            .get(session_id)
            .ok_or_else(|| format!("Session {session_id} not found"))?;
        session.write(data)
    }

    pub fn resize_session(&self, session_id: &str, cols: u16, rows: u16) -> Result<(), String> {
        let sessions = self.sessions.read();
        let session = sessions
            .get(session_id)
            .ok_or_else(|| format!("Session {session_id} not found"))?;
        session.resize(cols, rows)
    }

    pub fn destroy_session(&self, session_id: &str) {
        self.sessions.write().remove(session_id);
    }

    pub fn get_session_cwd(&self, session_id: &str) -> Option<String> {
        self.sessions
            .read()
            .get(session_id)
            .map(|s| s.get_cwd())
    }
}
