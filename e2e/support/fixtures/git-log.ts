/** Mock git log fixture data for E2E tests */

export const MOCK_GIT_LOG = {
  commits: [
    {
      hash: "abc1234567890abcdef1234567890abcdef123456",
      short_hash: "abc1234",
      parents: ["def5678901234abcdef5678901234abcdef567890"],
      author_name: "Alice",
      author_email: "alice@test.com",
      date: "2025-06-01T12:00:00+00:00",
      subject: "feat: add dark mode",
      refs: [{ name: "main", ref_type: "head" }],
    },
    {
      hash: "def5678901234abcdef5678901234abcdef567890",
      short_hash: "def5678",
      parents: [],
      author_name: "Bob",
      author_email: "bob@test.com",
      date: "2025-05-31T10:00:00+00:00",
      subject: "Initial commit",
      refs: [],
    },
  ],
  current_branch: "main",
};
