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
  btn.addEventListener("click", toggleSidebar);
  target.prepend(btn);
}

export function removeToggleButton(): void {
  const btn = document.getElementById("gitbrief-toggle");
  if (btn) btn.remove();
}

function toggleSidebar(): void {
  const sidebar = document.getElementById("gitbrief-root");
  if (sidebar) {
    sidebar.style.display = sidebar.style.display === "none" ? "block" : "none";
  }
}

export function checkForPrPage(url: string): void {
  if (url === lastCheckedUrl) return;
  lastCheckedUrl = url;

  if (isPrPage(url)) {
    injectToggleButton();
  } else {
    removeToggleButton();
  }
}

function init(): void {
  checkForPrPage(window.location.href);

  // GitHub uses Turbo Drive for SPA navigation
  document.addEventListener("turbo:load", () => {
    checkForPrPage(window.location.href);
  });

  // Back/forward navigation
  window.addEventListener("popstate", () => {
    checkForPrPage(window.location.href);
  });

  // Fallback: watch title changes for SPA navigation
  const titleEl = document.querySelector("title");
  if (titleEl) {
    const observer = new MutationObserver(() => {
      checkForPrPage(window.location.href);
    });
    observer.observe(titleEl, { childList: true });
  }
}

// Only run init in browser context (not in tests)
declare const __VITEST__: boolean | undefined;
if (typeof window !== "undefined" && typeof __VITEST__ === "undefined") {
  init();
}
