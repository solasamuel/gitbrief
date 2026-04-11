export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center">
      <main className="flex flex-col items-center gap-4 text-center px-4">
        <h1 className="text-4xl font-bold tracking-tight">GitBrief</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          AI-Powered GitHub PR Explainer &amp; Review Assistant
        </p>
      </main>
    </div>
  );
}
