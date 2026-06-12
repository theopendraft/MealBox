// src/components/ui/Skeleton.jsx

function Bone({ className = '' }) {
  return (
    <div className={`bg-gray-200 animate-pulse rounded-lg ${className}`} />
  );
}

// Full app-shell skeleton shown while settings load in ProtectedRoute
export function AppShellSkeleton() {
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar skeleton (desktop only) */}
      <div className="hidden md:flex flex-col w-72 bg-gray-900 p-4 gap-3 flex-shrink-0">
        <Bone className="h-10 w-36 mb-4 bg-gray-700" />
        {[...Array(8)].map((_, i) => (
          <Bone key={i} className="h-10 w-full bg-gray-700/60" />
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 flex-shrink-0">
          <Bone className="h-6 w-32" />
          <div className="flex-1" />
          <Bone className="h-8 w-8 rounded-full" />
        </div>

        {/* Content area */}
        <div className="flex-1 p-6 space-y-4 overflow-hidden">
          <Bone className="h-8 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <Bone key={i} className="h-24" />)}
          </div>
          <Bone className="h-48 w-full" />
          <Bone className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}

// Simple card skeleton for inline page content
export function CardSkeleton({ rows = 4 }) {
  return (
    <div className="bg-white rounded-2xl p-5 space-y-3 shadow-sm ring-1 ring-black/[0.04]">
      <Bone className="h-5 w-32" />
      {[...Array(rows)].map((_, i) => (
        <Bone key={i} className={`h-4 ${i % 3 === 2 ? 'w-3/4' : 'w-full'}`} />
      ))}
    </div>
  );
}

// List skeleton for table/list pages
export function ListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-2">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 ring-1 ring-black/[0.04]">
          <Bone className="w-2.5 h-2.5 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Bone className="h-4 w-32" />
            <Bone className="h-3 w-48" />
          </div>
          <Bone className="h-5 w-14 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default Bone;
