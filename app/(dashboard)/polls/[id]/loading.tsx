export default function PollDetailLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="h-5 w-24 bg-slate-200 rounded animate-pulse" />
      <div className="border rounded-lg p-6 bg-white space-y-4">
        <div className="h-6 w-2/3 bg-slate-200 rounded animate-pulse" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-3 w-full bg-slate-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}


