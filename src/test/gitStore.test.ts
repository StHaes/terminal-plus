import { describe, it, expect, beforeEach } from "vitest";
import { useGitStore } from "../stores/gitStore";

describe("gitStore — localChanges state", () => {
  beforeEach(() => {
    // Reset store to default state
    useGitStore.setState({
      localChangesOpen: false,
    });
  });

  it("starts with localChangesOpen = false", () => {
    expect(useGitStore.getState().localChangesOpen).toBe(false);
  });

  it("openLocalChanges sets localChangesOpen to true", () => {
    useGitStore.getState().openLocalChanges();
    expect(useGitStore.getState().localChangesOpen).toBe(true);
  });

  it("closeLocalChanges sets localChangesOpen to false", () => {
    useGitStore.getState().openLocalChanges();
    expect(useGitStore.getState().localChangesOpen).toBe(true);
    useGitStore.getState().closeLocalChanges();
    expect(useGitStore.getState().localChangesOpen).toBe(false);
  });

  it("calling openLocalChanges twice is idempotent", () => {
    useGitStore.getState().openLocalChanges();
    useGitStore.getState().openLocalChanges();
    expect(useGitStore.getState().localChangesOpen).toBe(true);
  });

  it("calling closeLocalChanges when already closed is idempotent", () => {
    useGitStore.getState().closeLocalChanges();
    expect(useGitStore.getState().localChangesOpen).toBe(false);
  });
});
