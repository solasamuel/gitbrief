import { describe, it, expect, vi, beforeEach } from "vitest";
import { getApiKeys, setApiKeys, clearApiKeys } from "@/lib/storage";

// Mock chrome.storage.sync
const mockStorage: Record<string, unknown> = {};

beforeEach(() => {
  vi.restoreAllMocks();
  Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);

  vi.stubGlobal("chrome", {
    storage: {
      sync: {
        get: vi.fn((keys: string[]) =>
          Promise.resolve(
            keys.reduce(
              (acc, key) => {
                if (key in mockStorage) acc[key] = mockStorage[key];
                return acc;
              },
              {} as Record<string, unknown>
            )
          )
        ),
        set: vi.fn((items: Record<string, unknown>) => {
          Object.assign(mockStorage, items);
          return Promise.resolve();
        }),
        remove: vi.fn((keys: string[]) => {
          keys.forEach((key) => delete mockStorage[key]);
          return Promise.resolve();
        }),
      },
    },
  });
});

describe("T-020: storage.ts getApiKeys/setApiKeys via chrome.storage.sync", () => {
  it("getApiKeys returns null when no keys are stored", async () => {
    const result = await getApiKeys();
    expect(result).toEqual({ anthropicKey: undefined, githubToken: undefined });
  });

  it("setApiKeys persists keys to chrome.storage.sync", async () => {
    await setApiKeys({ anthropicKey: "sk-ant-test", githubToken: "ghp_test" });

    expect(chrome.storage.sync.set).toHaveBeenCalledWith({
      anthropicKey: "sk-ant-test",
      githubToken: "ghp_test",
    });
  });

  it("getApiKeys returns stored keys", async () => {
    mockStorage["anthropicKey"] = "sk-ant-stored";
    mockStorage["githubToken"] = "ghp_stored";

    const result = await getApiKeys();
    expect(result).toEqual({
      anthropicKey: "sk-ant-stored",
      githubToken: "ghp_stored",
    });
  });

  it("getApiKeys returns partial keys when only anthropicKey is set", async () => {
    mockStorage["anthropicKey"] = "sk-ant-only";

    const result = await getApiKeys();
    expect(result).toEqual({
      anthropicKey: "sk-ant-only",
      githubToken: undefined,
    });
  });

  it("clearApiKeys removes all keys from storage", async () => {
    mockStorage["anthropicKey"] = "sk-ant-test";
    mockStorage["githubToken"] = "ghp_test";

    await clearApiKeys();

    expect(chrome.storage.sync.remove).toHaveBeenCalledWith([
      "anthropicKey",
      "githubToken",
    ]);
  });

  it("setApiKeys works with only anthropicKey", async () => {
    await setApiKeys({ anthropicKey: "sk-ant-only" });

    expect(chrome.storage.sync.set).toHaveBeenCalledWith({
      anthropicKey: "sk-ant-only",
    });
  });
});
