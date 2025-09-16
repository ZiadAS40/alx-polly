'use client'

export default function DashboardError({ error, reset }: { error: Error & { digest?: string } ; reset: () => void }) {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-xl mx-auto border rounded-lg p-6 bg-white">
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-slate-600 mb-6">{error.message || 'An unexpected error occurred.'}</p>
        <button onClick={reset} className="inline-flex items-center px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-700">
          Try again
        </button>
      </div>
    </div>
  );
}


