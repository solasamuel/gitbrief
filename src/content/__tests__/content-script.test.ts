import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isPrPage,
  injectToggleButton,
  removeToggleButton,
  checkForPrPage,
  resetState,
} from "@/content/content-script";

// Mock the sidebar module to avoid chrome.runtime dependency in unit tests
vi.mock("@/content/sidebar/index", () => ({
  mountSidebar: vi.fn(),
  unmountSidebar: vi.fn(),
  isSidebarMounted: vi.fn(() => false),
}));

beforeEach(() => {
  document.body.innerHTML = "";
  resetState();
  vi.restoreAllMocks();
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("T-022: Content script detects PR pages and injects toggle button", () => {
  describe("isPrPage", () => {
    it("returns true for a standard PR URL", () => {
      expect(isPrPage("https://github.com/owner/repo/pull/123")).toBe(true);
    });

    it("returns true for a PR URL with /files suffix", () => {
      expect(isPrPage("https://github.com/owner/repo/pull/123/files")).toBe(true);
    });

    it("returns true for a PR URL with /commits suffix", () => {
      expect(isPrPage("https://github.com/owner/repo/pull/42/commits")).toBe(true);
    });

    it("returns false for a GitHub repo URL", () => {
      expect(isPrPage("https://github.com/owner/repo")).toBe(false);
    });

    it("returns false for a GitHub issues URL", () => {
      expect(isPrPage("https://github.com/owner/repo/issues/5")).toBe(false);
    });

    it("returns false for a non-GitHub URL", () => {
      expect(isPrPage("https://google.com")).toBe(false);
    });
  });

  describe("injectToggleButton", () => {
    it("injects a button with id gitbrief-toggle into .gh-header-actions", () => {
      const target = document.createElement("div");
      target.className = "gh-header-actions";
      document.body.appendChild(target);

      injectToggleButton();

      const btn = document.getElementById("gitbrief-toggle");
      expect(btn).not.toBeNull();
      expect(btn!.textContent).toContain("GitBrief");
      expect(target.contains(btn)).toBe(true);
    });

    it("does not inject a second button if one already exists", () => {
      const target = document.createElement("div");
      target.className = "gh-header-actions";
      document.body.appendChild(target);

      injectToggleButton();
      injectToggleButton();

      const buttons = document.querySelectorAll("#gitbrief-toggle");
      expect(buttons.length).toBe(1);
    });

    it("does nothing if .gh-header-actions is not in the DOM", () => {
      injectToggleButton();

      const btn = document.getElementById("gitbrief-toggle");
      expect(btn).toBeNull();
    });
  });

  describe("removeToggleButton", () => {
    it("removes the toggle button from the DOM", () => {
      const target = document.createElement("div");
      target.className = "gh-header-actions";
      document.body.appendChild(target);

      injectToggleButton();
      expect(document.getElementById("gitbrief-toggle")).not.toBeNull();

      removeToggleButton();
      expect(document.getElementById("gitbrief-toggle")).toBeNull();
    });

    it("does nothing if no button exists", () => {
      expect(() => removeToggleButton()).not.toThrow();
    });
  });

  describe("checkForPrPage", () => {
    it("injects button when on a PR page with .gh-header-actions", () => {
      const target = document.createElement("div");
      target.className = "gh-header-actions";
      document.body.appendChild(target);

      checkForPrPage("https://github.com/owner/repo/pull/1");

      expect(document.getElementById("gitbrief-toggle")).not.toBeNull();
    });

    it("removes button when navigating away from a PR page", () => {
      const target = document.createElement("div");
      target.className = "gh-header-actions";
      document.body.appendChild(target);

      checkForPrPage("https://github.com/owner/repo/pull/1");
      expect(document.getElementById("gitbrief-toggle")).not.toBeNull();

      checkForPrPage("https://github.com/owner/repo");
      expect(document.getElementById("gitbrief-toggle")).toBeNull();
    });

    it("does not re-inject if already on the same PR page", () => {
      const target = document.createElement("div");
      target.className = "gh-header-actions";
      document.body.appendChild(target);

      checkForPrPage("https://github.com/owner/repo/pull/1");
      checkForPrPage("https://github.com/owner/repo/pull/1");

      const buttons = document.querySelectorAll("#gitbrief-toggle");
      expect(buttons.length).toBe(1);
    });
  });
});
