import React from "react";
import ReactDOM from "react-dom/client";
import Sidebar from "./Sidebar";

let root: ReactDOM.Root | null = null;

const SIDEBAR_STYLES = `
  :host {
    all: initial;
  }
  #gitbrief-app {
    height: 100%;
    box-sizing: border-box;
  }
`;

export function mountSidebar(): void {
  if (document.getElementById("gitbrief-root")) return;

  const host = document.createElement("div");
  host.id = "gitbrief-root";
  host.style.position = "fixed";
  host.style.top = "0px";
  host.style.right = "0px";
  host.style.width = "350px";
  host.style.height = "100vh";
  host.style.zIndex = "2147483647";

  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = SIDEBAR_STYLES;
  shadow.appendChild(style);

  const mountPoint = document.createElement("div");
  mountPoint.id = "gitbrief-app";
  mountPoint.style.height = "100%";
  shadow.appendChild(mountPoint);

  document.body.appendChild(host);

  root = ReactDOM.createRoot(mountPoint);
  root.render(
    <React.StrictMode>
      <Sidebar />
    </React.StrictMode>,
  );
}

export function unmountSidebar(): void {
  const host = document.getElementById("gitbrief-root");
  if (!host) return;

  if (root) {
    root.unmount();
    root = null;
  }
  host.remove();
}
