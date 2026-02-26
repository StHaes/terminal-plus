import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { GitLogResult } from "../types/git";

// --- PTY ---

export async function ptyCreate(
  sessionId: string,
  cols: number,
  rows: number,
  cwd?: string
): Promise<void> {
  await invoke("pty_create", {
    sessionId,
    cols,
    rows,
    cwd: cwd ?? null,
  });
}

export async function ptyWrite(
  sessionId: string,
  data: string
): Promise<void> {
  await invoke("pty_write", { sessionId, data });
}

export async function ptyResize(
  sessionId: string,
  cols: number,
  rows: number
): Promise<void> {
  await invoke("pty_resize", { sessionId, cols, rows });
}

export async function ptyDestroy(sessionId: string): Promise<void> {
  await invoke("pty_destroy", { sessionId });
}

export async function ptyGetCwd(sessionId: string): Promise<string> {
  return invoke("pty_get_cwd", { sessionId });
}

export function onPtyOutput(
  sessionId: string,
  callback: (data: string) => void
): Promise<UnlistenFn> {
  return listen<string>(`pty-output-${sessionId}`, (event) => {
    callback(event.payload);
  });
}

export function onPtyExit(
  sessionId: string,
  callback: () => void
): Promise<UnlistenFn> {
  return listen<void>(`pty-exit-${sessionId}`, () => {
    callback();
  });
}

// --- File system ---

export async function readFile(path: string): Promise<string> {
  return invoke<string>("read_file", { path });
}

export async function writeFile(path: string, contents: string): Promise<void> {
  await invoke("write_file", { path, contents });
}

interface DirEntry {
  name: string;
  is_dir: boolean;
}

export async function listDir(path: string): Promise<DirEntry[]> {
  return invoke<DirEntry[]>("list_dir", { path });
}

// --- Git ---

export async function gitLog(
  cwd: string,
  maxCount?: number
): Promise<GitLogResult> {
  return invoke("git_log", { cwd, maxCount: maxCount ?? null });
}

export async function gitIsRepo(cwd: string): Promise<boolean> {
  return invoke("git_is_repo", { cwd });
}

export async function gitCommitFiles(
  cwd: string,
  hash: string
): Promise<import("../types/git").CommitFile[]> {
  return invoke("git_commit_files", { cwd, hash });
}

export async function gitFileDiff(
  cwd: string,
  hash: string,
  path: string
): Promise<import("../types/git").FileDiff> {
  return invoke("git_file_diff", { cwd, hash, path });
}

export async function gitLocalChanges(
  cwd: string
): Promise<import("../types/git").CommitFile[]> {
  return invoke("git_local_changes", { cwd });
}

export async function gitLocalFileDiff(
  cwd: string,
  path: string
): Promise<import("../types/git").FileDiff> {
  return invoke("git_local_file_diff", { cwd, path });
}
