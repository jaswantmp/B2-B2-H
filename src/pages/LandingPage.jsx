// src/pages/LandingPage.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Code2, Sparkles, ShieldCheck, Users, Zap, ArrowRight,
  Github, Star, Trophy, ChevronRight, Circle,
} from 'lucide-react'
import logo from '../assets/logo.png'
import PulseAvatar from '../components/PulseAvatar.jsx'
import SkillBadge from '../components/SkillBadge.jsx'
import { getBuilders } from '../services/api.js'


const FEATURES = [
  {
    icon: Sparkles,
    color: 'text-violet-400',
    bg: 'bg-violet-900/30 border-violet-800/40',
    title: 'AI-Powered Matching',
    desc: 'Our AI doesn\'t just show you a score. It explains exactly why a builder fits your team — what they\'ve built, what gap they fill, and why it matters.',
  },
  {
    icon: ShieldCheck,
    color: 'text-cyan-400',
    bg: 'bg-cyan-900/30 border-cyan-800/40',
    title: 'Verified Skills',
    desc: 'Skills are verified against real GitHub activity, not self-reported claims. A shield icon means they\'ve actually shipped code in that technology.',
  },
  {
    icon: Circle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-900/30 border-emerald-800/40',
    title: 'Live Availability',
    desc: 'Every builder displays their real-time status — Looking For Team, Open To Invitations, or In A Team — so you never chase someone who isn\'t available.',
  },
  {
    icon: Users,
    color: 'text-amber-400',
    bg: 'bg-amber-900/30 border-amber-800/40',
    title: 'Team Health Radar',
    desc: 'Before you lock in your team, see the balance across Frontend, Backend, AI/ML, Design, and Product. Fix gaps before the hackathon starts.',
  },
  {
    icon: Zap,
    color: 'text-violet-400',
    bg: 'bg-violet-900/30 border-violet-800/40',
    title: 'AI Team Generator',
    desc: 'Type your idea. Get a complete team blueprint with roles and matched builders instantly. "I want to build an AI healthcare app" → team ready.',
  },
  {
    icon: Trophy,
    color: 'text-cyan-400',
    bg: 'bg-cyan-900/30 border-cyan-800/40',
    title: 'Reputation System',
    desc: 'Post-project reviews build a trustworthy reputation over time. No more ghosting — accountability is baked into how builders grow on the platform.',
  },
]

const TESTIMONIALS_RAW = [
  {
    quote: 'I found my entire hackathon team in under 10 minutes. The AI explained exactly why each person fit — I didn\'t have to cold DM anyone.',
    name: 'Jaswant MP',
    role: 'CSE · SKCET, Dindigul',
    wins: '2 hackathon wins',
    userIndex: 0,
  },
  {
    quote: 'As a designer, I was always picked last. B2B2H let me signal that I\'m actively looking and teams started coming to me. That\'s a first.',
    name: 'Priya Sharma',
    role: 'Design + CS · IIT Bombay',
    wins: '2 hackathon wins',
    userIndex: 2,
  },
  {
    quote: 'The Team Health Radar showed we had no backend engineer before we registered. We found one in 15 minutes. We ended up winning.',
    name: 'Karan Mehta',
    role: 'CS · BITS Pilani',
    wins: '7 hackathon wins',
    userIndex: 3,
  },
]


const STATS = [
  { value: '12,000+', label: 'Student Builders' },
  { value: '340+',    label: 'Universities' },
  { value: '2,800+',  label: 'Teams Formed' },
  { value: '94%',     label: 'Find a Team in < 24h' },
]
export default function LandingPage() {
  const [usersList, setUsersList] = useState([])

  useEffect(() => {
    const controller = new AbortController()
    getBuilders({ limit: 5, signal: controller.signal })
      .then(setUsersList)
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error(err)
        }
      })
    return () => {
      controller.abort()
    }
  }, [])

  const testimonials = TESTIMONIALS_RAW.map(t => ({
    ...t,
    user: usersList[t.userIndex] || null
  }))

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">

      {/* ── Top nav ─────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="B2B2H Logo" className="w-[40px] h-[40px] object-contain flex-shrink-0" />
            <div>
              <span className="font-bold text-white tracking-tight text-base block leading-none">B2B2H</span>
              <span className="hidden sm:block text-xs text-slate-500 mt-0.5">Born 2 Build. Built 2 Hack.</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400" aria-label="Landing navigation">
            <a href="#features" className="hover:text-slate-200 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-200 transition-colors">How It Works</a>
            <a href="#testimonials" className="hover:text-slate-200 transition-colors">Stories</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/dashboard" className="text-sm text-slate-400 hover:text-slate-200 transition-colors hidden sm:block">
              Sign in
            </Link>
            <Link
              to="/dashboard"
              className="text-sm px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="pt-28 pb-20 px-5 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute top-20 right-1/4 w-64 h-64 bg-cyan-600/8 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="max-w-4xl mx-auto text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-700/50 bg-violet-900/20 text-violet-300 text-xs font-medium mb-8">
            <Sparkles size={12} aria-hidden="true" />
            AI-Powered Student Collaboration OS
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
            Stop building alone.{' '}
            <span className="gradient-text">Find your team.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            B2B2H is the operating system for student builders. Find verified teammates, form balanced teams, and ship something that matters — for hackathons, projects, research, or your next startup.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all glow-violet"
            >
              Start building for free
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              to="/discover"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-medium text-sm transition-all"
            >
              Discover builders
            </Link>
          </div>

          {/* Live builder previews */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex -space-x-2">
              {usersList.slice(0, 5).map(u => (
                <div key={u.id} className="relative">
                  <PulseAvatar user={u} size="md" showTooltip={true} />
                </div>
              ))}
            </div>

            <p className="text-sm text-slate-400">
              <span className="text-emerald-400 font-semibold">12,000+ builders</span> ready to team up right now
            </p>
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <section className="border-y border-slate-800/60 py-12 px-5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-bold gradient-text mb-1">{value}</div>
              <div className="text-sm text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Builder cards preview ────────────────────────────────────────── */}
      <section className="py-20 px-5" id="how-it-works">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">See who's building right now</h2>
            <p className="text-slate-400">Every builder shows their live status, verified skills, and what they're looking for.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {usersList.slice(0, 3).map(user => (

              <article
                key={user.id}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-violet-700/40 transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <PulseAvatar user={user} size="md" />
                  <div>
                    <p className="font-semibold text-sm text-slate-100">{user.name}</p>
                    <p className="text-xs text-slate-400">{user.university}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">{user.bio}</p>
                <div className="flex flex-wrap gap-1.5">
                  {[...new Set(user.skills || [])].slice(0, 3).map(skill => (
                    <SkillBadge key={skill} skill={skill} verified={user.verifiedSkills?.includes(skill)} />
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              to="/discover"
              className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              See all builders
              <ChevronRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section className="py-20 px-5 bg-slate-900/40" id="features">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Everything you need to build with the right team</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Built for serious student builders. Not a class project. Not a side feature. The entire platform is designed around one problem: finding the right people.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title} className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-5 hover:border-slate-600 transition-all">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${bg}`}>
                  <Icon size={20} className={color} aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-slate-100 mb-2">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Team Generator preview ───────────────────────────────────── */}
      <section className="py-20 px-5">
        <div className="max-w-3xl mx-auto">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/8 rounded-full blur-3xl" aria-hidden="true" />

            <div className="flex items-center gap-2 text-violet-400 text-sm font-semibold mb-3">
              <Zap size={15} aria-hidden="true" />
              AI Team Generator
            </div>
            <h2 className="text-2xl font-bold mb-2">Type your idea. Get your team.</h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Describe your project and our AI instantly generates the roles you need and matches builders who can fill them.
            </p>

            {/* Demo input */}
            <div className="relative mb-4">
              <input
                type="text"
                readOnly
                defaultValue="I want to build an AI healthcare app for rural diagnosis"
                className="w-full px-4 py-3.5 bg-slate-900 border border-slate-600 rounded-xl text-sm text-slate-200 pr-20 cursor-default"
                aria-label="Example project idea"
              />
              <Link
                to="/generator"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs font-medium text-white transition-colors"
              >
                Generate
              </Link>
            </div>

            {/* Mock result */}
            <div className="space-y-2">
              {['AI / ML Engineer', 'Frontend Developer', 'Healthcare Domain Expert', 'Backend Developer'].map((role, i) => (
                <div key={role} className="flex items-center gap-3 p-2.5 bg-slate-900/60 rounded-lg border border-slate-700/50 text-sm">
                  <span className="w-5 h-5 rounded-full bg-violet-700/40 border border-violet-600/50 flex items-center justify-center text-xs text-violet-300 flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-slate-300">{role}</span>
                  <span className="ml-auto text-xs text-emerald-400">matched</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────────── */}
      <section className="py-20 px-5 bg-slate-900/40" id="testimonials">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">From builders who've been there</h2>
            <p className="text-slate-400">Real stories from students who found their teams on B2B2H.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map(({ quote, name, role, wins, user }) => (

              <figure key={name} className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-5">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="text-amber-400 fill-amber-400" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="text-sm text-slate-300 leading-relaxed mb-5">"{quote}"</blockquote>
                <figcaption className="flex items-center gap-3">
                  <PulseAvatar user={user} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">{name}</p>
                    <p className="text-xs text-slate-500">{role}</p>
                    <p className="text-xs text-amber-400">{wins}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <section className="py-24 px-5 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/20 to-transparent pointer-events-none" aria-hidden="true" />
        <div className="max-w-2xl mx-auto relative">
          <h2 className="text-4xl font-bold mb-4">
            Your next team is <span className="gradient-text">one connection away.</span>
          </h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Join 12,000+ student builders who found their teams, shipped their projects, and won their hackathons on B2B2H.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-base transition-all glow-violet"
          >
            Start building for free
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <p className="text-xs text-slate-600 mt-4">No credit card. Just your college email.</p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 py-8 px-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Code2 size={15} aria-hidden="true" />
            <span>B2B2H — Born 2 Build. Built 2 Hack.</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Terms</a>
            <a href="https://github.com" className="hover:text-slate-400 transition-colors flex items-center gap-1">
              <Github size={14} aria-hidden="true" /> GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
