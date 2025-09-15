// src/components/Navbar.jsx
export default function Navbar({ setSidebarOpen }) {
  return (
    <header className="flex justify-between items-center p-4 bg-white border-b">
      <button onClick={() => setSidebarOpen(true)} className="md:hidden">
        {/* Simple hamburger icon */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <h1 className="text-xl font-semibold">MealBox</h1>
      <div>{/* Future user profile icon can go here */}</div>
    </header>
  );
}