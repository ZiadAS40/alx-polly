export default function DashboardLoading() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-40 bg-slate-200 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}


