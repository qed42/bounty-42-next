export default function ProjectListSkeleton() {
  return (
    <section className="py-12 lg:py-20 px-4 container mx-auto animate-pulse">
      {/* Section Header Skeleton */}
      <div className="text-center mb-12">
        <div className="h-10 w-1/3 mx-auto bg-muted rounded mb-4" />
        <div className="h-6 w-1/2 mx-auto bg-muted rounded" />
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="flex flex-col bg-muted rounded-lg shadow  space-y-4"
          >
            <div className="h-60 w-full bg-border rounded mb-4" />
            <div className="h-4 w-2/3 bg-muted rounded" />
            <div className="h-6 w-1/2 bg-muted rounded" />
          </div>
        ))}
      </div>
    </section>
  );
}