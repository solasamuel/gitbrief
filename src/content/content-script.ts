import { mountSidebar, unmountSidebar, isSidebarMounted } from "./sidebar/index";

const PR_URL_PATTERN = /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/;

let lastCheckedUrl = "";

export function resetState(): void {
  lastCheckedUrl = "";
}

export function isPrPage(url: string): boolean {
  return PR_URL_PATTERN.test(url);
}

export function injectToggleButton(): void {
  if (document.getElementById("gitbrief-toggle")) return;

  const target = document.querySelector(".gh-header-actions");
  if (!target) return;

  const btn = document.createElement("button");
  btn.id = "gitbrief-toggle";
  btn.textContent = "GitBrief";
  btn.className = "btn btn-sm";
  btn.addEventListener("click", () => {
    if (isSidebarMounted()) {
      unmountSidebar();
    } else {
      mountSidebar();
    }
  });
  target.prepend(btn);
}

export function removeToggleButton(): void {
  const btn = document.getElementById("gitbrief-toggle");
  if (btn) btn.remove();
}

export function checkForPrPage(url: string): void {
  if (url === lastCheckedUrl) return;
  lastCheckedUrl = url;

  if (isPrPage(url)) {
    injectToggleButton();
  } else {
    removeToggleButton();
    unmountSidebar();
  }
}

function init(): void {
  checkForPrPage(window.location.href);

  document.addEventListener("turbo:load", () => {
    checkForPrPage(window.location.href);
  });

  window.addEventListener("popstate", () => {
    checkForPrPage(window.location.href);
  });

  const titleEl = document.querySelector("title");
  if (titleEl) {
    const observer = new MutationObserver(() => {
      checkForPrPage(window.location.href);
    });
    observer.observe(titleEl, { childList: true });
  }
}

declare const __VITEST__: boolean | undefined;
if (typeof window !== "undefined" && typeof __VITEST__ === "undefined") {
  init();
}
