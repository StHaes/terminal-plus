/** Mock commit files and diff fixture data for E2E tests */

export const MOCK_COMMIT_FILES = [
  { path: "src/theme.ts", status: "A" },
  { path: "src/App.tsx", status: "M" },
];

export const MOCK_FILE_DIFF = {
  path: "src/theme.ts",
  hunks: [
    {
      old_start: 0,
      old_count: 0,
      new_start: 1,
      new_count: 3,
      lines: [
        { kind: "add", content: "export const darkMode = true;", old_lineno: null, new_lineno: 1 },
        { kind: "add", content: "", old_lineno: null, new_lineno: 2 },
        { kind: "add", content: "export default darkMode;", old_lineno: null, new_lineno: 3 },
      ],
    },
  ],
};
