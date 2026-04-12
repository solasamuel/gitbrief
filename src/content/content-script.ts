import { mountSidebar, unmountSidebar, isSidebarMounted } from "./sidebar/index";

const PR_URL_PATTERN = /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/;

let lastCheckedUrl = "";

export function resetState(): void {
  lastCheckedUrl = "";
}

export function isPrPage(url: string): boolean {
  return PR_URL_PATTERN.test(url);
}

// GitHub's DOM changes over time — try multiple selectors
const HEADER_SELECTORS = [
  ".gh-header-actions",                    // classic layout
  ".pr-header-actions",                    // newer layout
  "#partial-discussion-header .gh-header-show .flex-md-row",
  ".gh-header-meta",                       // fallback: PR meta area
];

export function injectToggleButton(): void {
  if (document.getElementById("gitbrief-toggle")) return;

  const btn = document.createElement("button");
  btn.id = "gitbrief-toggle";
  btn.textContent = "GitBrief";
  btn.addEventListener("click", () => {
    if (isSidebarMounted()) {
      unmountSidebar();
    } else {
      mountSidebar();
    }
  });

  // Try to inject into GitHub's header
  for (const selector of HEADER_SELECTORS) {
    const target = document.querySelector(selector);
    if (target) {
      btn.className = "btn btn-sm";
      target.prepend(btn);
      return;
    }
  }

  // Fallback: floating button in bottom-right corner
  btn.style.position = "fixed";
  btn.style.bottom = "20px";
  btn.style.right = "20px";
  btn.style.zIndex = "2147483646";
  btn.style.padding = "8px 16px";
  btn.style.fontSize = "13px";
  btn.style.fontWeight = "600";
  btn.style.color = "#fff";
  btn.style.backgroundColor = "#2da44e";
  btn.style.border = "none";
  btn.style.borderRadius = "6px";
  btn.style.cursor = "pointer";
  btn.style.fontFamily = "system-ui, sans-serif";
  document.body.appendChild(btn);
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
