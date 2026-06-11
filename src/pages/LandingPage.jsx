// src/pages/LandingPage.jsx
import { Link } from 'react-router-dom';

const FEATURES = [
  { icon: '🍱', title: 'Kitchen View',     desc: 'See exactly how many tiffins to pack, spice batches, and chapati counts every morning.' },
  { icon: '🚚', title: 'Delivery Route',   desc: 'Mark deliveries done one tap at a time. Track skips and add extras on the go.' },
  { icon: '📄', title: 'Auto Billing',     desc: 'Generate PDF bills per client per month with UPI QR code. Share instantly on WhatsApp.' },
  { icon: '📊', title: 'Live Analytics',   desc: 'Revenue collected vs outstanding, client breakdown, and delivery trends at a glance.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <img src="/MealBox.png" alt="MealBox" className="w-8 h-8 rounded-lg object-cover" />
          <span className="text-lg font-bold text-gray-900">MealBox</span>
        </div>
        <Link
          to="/auth"
          className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
        >
          Sign in →
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center max-w-2xl mx-auto w-full">
        <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-xl mb-6">
          <img src="/MealBox.png" alt="MealBox" className="w-full h-full object-cover" />
        </div>

        <h1 className="text-4xl font-extrabold text-gray-900 leading-tight tracking-tight">
          Run your tiffin<br />
          <span className="text-red-600">service with ease</span>
        </h1>
        <p className="mt-4 text-base text-gray-500 max-w-sm leading-relaxed">
          Kitchen planning, delivery tracking, and billing — everything a home tiffin business needs, in one simple app.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full sm:w-auto">
          <Link
            to="/auth"
            className="bg-red-600 hover:bg-red-700 active:scale-[0.97] text-white font-semibold px-8 py-3.5 rounded-2xl transition-all shadow-sm text-base"
          >
            Get started free
          </Link>
          <Link
            to="/auth"
            className="bg-gray-100 hover:bg-gray-200 active:scale-[0.97] text-gray-700 font-semibold px-8 py-3.5 rounded-2xl transition-all text-base"
          >
            Sign in
          </Link>
        </div>
      </main>

      {/* Features */}
      <section className="px-6 pb-16 max-w-2xl mx-auto w-full">
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-gray-50 rounded-2xl p-4">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="text-sm font-bold text-gray-900">{f.title}</div>
              <div className="text-xs text-gray-500 mt-1 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
