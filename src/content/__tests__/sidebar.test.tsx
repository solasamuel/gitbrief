import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "@testing-library/react";
import { mountSidebar, unmountSidebar } from "@/content/sidebar/index";

beforeEach(() => {
  document.body.innerHTML = "";

  vi.stubGlobal("chrome", {
    runtime: {
      sendMessage: vi.fn((_msg: unknown, callback?: (resp: unknown) => void) => {
        if (callback) callback({ hasKeys: true });
      }),
      connect: vi.fn(() => ({
        postMessage: vi.fn(),
        onMessage: { addListener: vi.fn() },
        disconnect: vi.fn(),
      })),
    },
  });
});

afterEach(async () => {
  await act(async () => {
    unmountSidebar();
  });
  document.body.innerHTML = "";
});

describe("T-023: Sidebar mounts in shadow DOM with isolated styles", () => {
  it("creates a host element with id gitbrief-root", async () => {
    await act(async () => { mountSidebar(); });

    expect(document.getElementById("gitbrief-root")).not.toBeNull();
  });

  it("attaches a shadow root to the host element", async () => {
    await act(async () => { mountSidebar(); });

    const host = document.getElementById("gitbrief-root")!;
    expect(host.shadowRoot).not.toBeNull();
  });

  it("renders React content inside the shadow root", async () => {
    await act(async () => { mountSidebar(); });

    const shadow = document.getElementById("gitbrief-root")!.shadowRoot!;
    const app = shadow.getElementById("gitbrief-app");
    expect(app).not.toBeNull();
    expect(app!.innerHTML).not.toBe("");
  });

  it("host element is fixed position on the right side", async () => {
    await act(async () => { mountSidebar(); });

    const host = document.getElementById("gitbrief-root")!;
    expect(host.style.position).toBe("fixed");
    expect(host.style.right).toBe("0px");
    expect(host.style.top).toBe("0px");
  });

  it("host element has a width of 350px", async () => {
    await act(async () => { mountSidebar(); });

    expect(document.getElementById("gitbrief-root")!.style.width).toBe("350px");
  });

  it("injects a style element into the shadow root", async () => {
    await act(async () => { mountSidebar(); });

    const shadow = document.getElementById("gitbrief-root")!.shadowRoot!;
    expect(shadow.querySelector("style")).not.toBeNull();
  });

  it("does not mount a second sidebar if one already exists", async () => {
    await act(async () => { mountSidebar(); });
    await act(async () => { mountSidebar(); });

    expect(document.querySelectorAll("#gitbrief-root").length).toBe(1);
  });

  it("unmountSidebar removes the host element", async () => {
    await act(async () => { mountSidebar(); });
    expect(document.getElementById("gitbrief-root")).not.toBeNull();

    await act(async () => { unmountSidebar(); });
    expect(document.getElementById("gitbrief-root")).toBeNull();
  });

  it("unmountSidebar does nothing if sidebar is not mounted", async () => {
    await act(async () => {
      expect(() => unmountSidebar()).not.toThrow();
    });
  });
});
