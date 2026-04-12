import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/popup/App";

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
              {} as Record<string, unknown>,
            ),
          ),
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

describe("T-021: Popup settings renders fields, saves keys, shows feedback", () => {
  it("renders Anthropic API key and GitHub token inputs", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByLabelText(/anthropic/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/github/i)).toBeInTheDocument();
    });
  });

  it("renders save and clear buttons", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();
    });
  });

  it("inputs are password type for masking", async () => {
    render(<App />);

    await waitFor(() => {
      const anthropicInput = screen.getByLabelText(/anthropic/i);
      expect(anthropicInput).toHaveAttribute("type", "password");
    });
  });

  it("pre-populates inputs with existing stored keys", async () => {
    mockStorage["anthropicKey"] = "sk-ant-existing";
    mockStorage["githubToken"] = "ghp_existing";

    render(<App />);

    await waitFor(() => {
      expect(screen.getByLabelText(/anthropic/i)).toHaveValue("sk-ant-existing");
      expect(screen.getByLabelText(/github/i)).toHaveValue("ghp_existing");
    });
  });

  it("saves keys to chrome.storage.sync on save click", async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByLabelText(/anthropic/i)).toBeInTheDocument();
    });

    const anthropicInput = screen.getByLabelText(/anthropic/i);
    const githubInput = screen.getByLabelText(/github/i);

    await user.clear(anthropicInput);
    await user.type(anthropicInput, "sk-ant-new-key");
    await user.clear(githubInput);
    await user.type(githubInput, "ghp_new_token");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        anthropicKey: "sk-ant-new-key",
        githubToken: "ghp_new_token",
      });
    });
  });

  it("shows success feedback after saving", async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByLabelText(/anthropic/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/anthropic/i), "sk-ant-test");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/saved/i)).toBeInTheDocument();
    });
  });

  it("clears keys on clear click", async () => {
    mockStorage["anthropicKey"] = "sk-ant-existing";
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByLabelText(/anthropic/i)).toHaveValue("sk-ant-existing");
    });

    await user.click(screen.getByRole("button", { name: /clear/i }));

    await waitFor(() => {
      expect(chrome.storage.sync.remove).toHaveBeenCalledWith([
        "anthropicKey",
        "githubToken",
      ]);
      expect(screen.getByLabelText(/anthropic/i)).toHaveValue("");
    });
  });
});
