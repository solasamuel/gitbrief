import { useState, useEffect } from "react";
import { getApiKeys, setApiKeys, clearApiKeys } from "@/lib/storage";

export default function App() {
  const [anthropicKey, setAnthropicKey] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [status, setStatus] = useState<"idle" | "saved" | "cleared" | "error">("idle");

  useEffect(() => {
    getApiKeys().then((keys) => {
      if (keys.anthropicKey) setAnthropicKey(keys.anthropicKey);
      if (keys.githubToken) setGithubToken(keys.githubToken);
    });
  }, []);

  async function handleSave() {
    try {
      await setApiKeys({
        anthropicKey: anthropicKey,
        githubToken: githubToken,
      });
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
    }
  }

  async function handleClear() {
    try {
      await clearApiKeys();
      setAnthropicKey("");
      setGithubToken("");
      setStatus("cleared");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="w-[350px] p-4">
      <h1 className="text-lg font-bold mb-1">GitBrief Settings</h1>
      <p className="text-xs text-zinc-500 mb-4">
        Enter your API keys. They are stored locally in your browser.
      </p>

      <div className="space-y-3">
        <div>
          <label htmlFor="anthropic-key" className="block text-sm font-medium mb-1">
            Anthropic API Key
          </label>
          <input
            id="anthropic-key"
            type="password"
            value={anthropicKey}
            onChange={(e) => setAnthropicKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="github-token" className="block text-sm font-medium mb-1">
            GitHub Token
            <span className="text-zinc-400 font-normal ml-1">(optional)</span>
          </label>
          <input
            id="github-token"
            type="password"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            placeholder="ghp_..."
            className="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleSave}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save
        </button>
        <button
          onClick={handleClear}
          className="px-3 py-1.5 text-sm border border-zinc-300 rounded hover:bg-zinc-100"
        >
          Clear
        </button>
      </div>

      {status === "saved" && (
        <p className="text-sm text-green-600 mt-2">Settings saved.</p>
      )}
      {status === "cleared" && (
        <p className="text-sm text-zinc-500 mt-2">Keys cleared.</p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-600 mt-2">Failed to save. Please try again.</p>
      )}
    </div>
  );
}
