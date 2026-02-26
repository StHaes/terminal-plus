import type { Terminal } from "@xterm/xterm";
import type { FitAddon } from "@xterm/addon-fit";
import type { SearchAddon } from "@xterm/addon-search";

/**
 * Module-level registry of live terminal instances.
 * Extracted to its own file to avoid circular imports between
 * useTerminal.ts and themeApplicator.ts.
 */
export const terminalInstances = new Map<string, { term: Terminal; fitAddon: FitAddon; searchAddon: SearchAddon }>();
