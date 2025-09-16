export default function PollsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-9 w-40 bg-slate-200 rounded animate-pulse" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-40 bg-slate-200 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}


