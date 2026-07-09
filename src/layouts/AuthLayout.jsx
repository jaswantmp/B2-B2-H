// src/layouts/AuthLayout.jsx
import { Link } from 'react-router-dom'
import { Code2 } from 'lucide-react'
import ThemeToggle from '../components/ThemeToggle.jsx'

// Shared shell for Login / Sign Up / Forgot Password.
// Split layout: brand panel on the left (desktop only), form card on the right.
export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex theme-bg theme-text">
      {/* ── Left brand panel — desktop only ── */}
      <div
        className="hidden lg:flex lg:w-[44%] xl:w-[40%] flex-col justify-between p-10 relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #1a1530 0%, #0F172A 55%, #0c1322 100%)',
        }}
      >
        {/* Decorative glow */}
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.25), transparent 70%)' }}
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.18), transparent 70%)' }}
          aria-hidden="true"
        />

        <Link to="/" className="flex items-center gap-2.5 relative z-10" aria-label="B2B2H Home">
          <div className="w-9 h-9 rounded-lg bg-violet-600 flex items-center justify-center">
            <Code2 size={18} className="text-white" aria-hidden="true" />
          </div>
          <div>
            <span className="font-bold text-white text-base tracking-tight block leading-none">B2B2H</span>
            <span className="text-xs text-slate-400 leading-none">Born 2 Build. Built 2 Hack.</span>
          </div>
        </Link>

        <div className="relative z-10 max-w-sm">
          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            Stop building alone.<br />
            <span className="gradient-text">Find your team.</span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Join 12,000+ student builders finding verified teammates, forming balanced teams,
            and shipping real projects together.
          </p>

          <div className="flex items-center gap-3 mt-8">
            <div className="flex -space-x-2">
              {['b6e3f4', 'ffdfbf', 'd1d4f9', 'c0aede', 'ffd5dc'].map((bg, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-[#0F172A]"
                  style={{ backgroundColor: `#${bg}` }}
                  aria-hidden="true"
                />
              ))}
            </div>
            <p className="text-xs text-slate-500">
              <span className="text-emerald-400 font-semibold">12,000+</span> builders already in
            </p>
          </div>
        </div>

        <p className="relative z-10 text-xs text-slate-600">© 2026 B2B2H. All rights reserved.</p>
      </div>

      {/* ── Right: form panel ── */}
      <div className="flex-1 flex flex-col">
        {/* Mobile top bar */}
        <div className="flex lg:hidden items-center justify-between p-5">
          <Link to="/" className="flex items-center gap-2" aria-label="B2B2H Home">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <Code2 size={16} className="text-white" aria-hidden="true" />
            </div>
            <span className="font-bold text-sm theme-text">B2B2H</span>
          </Link>
          <ThemeToggle />
        </div>

        {/* Desktop theme toggle */}
        <div className="hidden lg:flex justify-end p-6">
          <ThemeToggle />
        </div>

        <div className="flex-1 flex items-center justify-center px-5 pb-10 lg:px-10">
          <div className="w-full max-w-sm">
            <div className="mb-7">
              <h1 className="text-2xl font-bold theme-text mb-1.5">{title}</h1>
              {subtitle && <p className="text-sm theme-muted leading-relaxed">{subtitle}</p>}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
