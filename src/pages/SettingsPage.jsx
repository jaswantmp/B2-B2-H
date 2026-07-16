// src/pages/SettingsPage.jsx
import { useState, useEffect } from 'react'
import {
  Settings, User, Bell, Palette, Shield, Save,
  CheckCircle, Eye, EyeOff, Sun, Moon, Monitor, Award
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import PulseAvatar from '../components/PulseAvatar.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { updateProfile } from '../services/api.js'
import SkillsSection from '../components/SkillsSection.jsx'

const SECTIONS = [
  { key: 'profile',       label: 'Profile',            icon: User    },
  { key: 'skills',        label: 'Skills',             icon: Award   },
  { key: 'appearance',    label: 'Appearance',         icon: Palette },
  { key: 'notifications', label: 'Notifications',      icon: Bell    },
  { key: 'privacy',       label: 'Privacy & Security', icon: Shield  },
]


const STATUS_OPTIONS = [
  { value: 'LOOKING_FOR_TEAM',    label: 'Looking For Team',    color: '#10B981' },
  { value: 'OPEN_TO_INVITES',     label: 'Open To Invitations', color: '#F59E0B' },
  { value: 'LOOKING_FOR_MEMBERS', label: 'Looking For Members', color: '#06B6D4' },
  { value: 'IN_TEAM',             label: 'Already In Team',     color: '#EF4444' },
  { value: 'OFFLINE',             label: 'Offline',             color: '#6B7280' },
]

const NOTIF_PREFS = [
  { key: 'invites',        label: 'Team Invitations',    desc: 'When someone invites you to their team' },
  { key: 'aiMatches',      label: 'AI Match Alerts',     desc: 'When new builders match your team needs' },
  { key: 'hackathons',     label: 'Hackathon Reminders', desc: 'Deadlines and updates for registered hackathons' },
  { key: 'projectUpdates', label: 'Project Updates',     desc: 'Activity from projects you are part of' },
  { key: 'system',         label: 'System Notifications', desc: 'Account, security, and platform updates' },
]

function SectionNav({ active, onChange }) {
  return (
    <nav
      className="rounded-2xl border p-2 flex lg:flex-col gap-1 overflow-x-auto whitespace-nowrap scrollbar-thin max-w-full"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
      aria-label="Settings sections"
    >
      {SECTIONS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-auto lg:w-full text-left flex-shrink-0 ${
            active === key
              ? 'bg-violet-50 dark:bg-violet-700/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700/30'
              : 'theme-muted hover:bg-[var(--bg-raised)] hover:theme-text border border-transparent'
          }`}
          aria-current={active === key ? 'page' : undefined}
        >
          <Icon size={16} aria-hidden="true" />
          {label}
        </button>
      ))}
    </nav>
  )
}

function SaveButton({ saving, saved, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold text-sm transition-all"
    >
      {saving ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : saved ? (
        <CheckCircle size={15} />
      ) : (
        <Save size={15} />
      )}
      {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
    </button>
  )
}

// ── Profile section ──────────────────────────────────────────────────────────
function ProfileSection() {
  const { user, refreshUser } = useAuth()
  const [form, setForm] = useState({
    name:       user?.name       ?? '',
    bio:        user?.bio        ?? '',
    location:   user?.location   ?? '',
    university: user?.university ?? '',
    college:    user?.college    ?? '',
    year:       user?.year       ?? '1st Year',
    branch:     user?.branch     ?? '',
    status:     user?.status     ?? 'LOOKING_FOR_TEAM',
    github:     user?.github     ?? '',
    linkedin:   user?.linkedin   ?? '',
    website:    user?.website    ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [showGithub, setShowGithub] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        name:       user.name       ?? '',
        bio:        user.bio        ?? '',
        location:   user.location   ?? '',
        university: user.university ?? '',
        college:    user.college    ?? '',
        year:       user.year       ?? '1st Year',
        branch:     user.branch     ?? '',
        status:     user.status     ?? 'LOOKING_FOR_TEAM',
        github:     user.github     ?? '',
        linkedin:   user.linkedin   ?? '',
        website:    user.website    ?? '',
      })
    }
  }, [user])

  const field = (key) => ({
    value: form[key],
    onChange: e => { setForm(f => ({ ...f, [key]: e.target.value })); setSaved(false) },
  })

  const handleSave = async () => {
    try {
      setSaving(true)
      console.log("[SaveProfile] Request Payload:", form)
      const response = await updateProfile(form)
      console.log("[SaveProfile] API Response:", response)
      const updatedUser = await refreshUser()
      console.log("[SaveProfile] AuthContext Updated User:", updatedUser)
      console.log("[SaveProfile] localStorage Updated Session:", localStorage.getItem("b2b2h-auth"))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error("[SaveProfile] Error saving profile:", err)
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "theme-input w-full px-3 py-2.5 text-sm"
  const labelClass = "block text-xs font-semibold theme-muted uppercase tracking-wider mb-1.5"

  return (
    <div className="space-y-6">
      {/* Avatar + name preview */}
      <div
        className="flex items-center gap-4 p-4 rounded-xl border"
        style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-subtle)' }}
      >
        <PulseAvatar user={{ ...user, status: form.status }} size="xl" />
        <div>
          <p className="font-bold theme-text text-lg">{form.name || user.name}</p>
          <p className="theme-muted text-sm">{form.branch} · {form.university}</p>
          <p className="theme-muted text-xs mt-0.5">{form.location}</p>
        </div>
      </div>

      {/* Name + Bio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Full Name</label>
          <input {...field('name')} className={inputClass} placeholder="Your full name" />
        </div>
        <div>
          <label className={labelClass}>Location</label>
          <input {...field('location')} className={inputClass} placeholder="City, Country" />
        </div>
      </div>

      <div>
        <label className={labelClass}>Bio</label>
        <textarea
          {...field('bio')}
          rows={3}
          className="theme-input w-full px-3 py-2.5 text-sm resize-none"
          placeholder="Describe yourself as a builder..."
        />
      </div>

      {/* Academic */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>University</label>
          <input {...field('university')} className={inputClass} placeholder="University name" />
        </div>
        <div>
          <label className={labelClass}>College</label>
          <input {...field('college')} className={inputClass} placeholder="College name" />
        </div>
        <div>
          <label className={labelClass}>Branch</label>
          <input {...field('branch')} className={inputClass} placeholder="e.g. Computer Science" />
        </div>
        <div>
          <label className={labelClass}>Year</label>
          <select {...field('year')} className={inputClass}>
            {['1st Year','2nd Year','3rd Year','4th Year','5th Year','Postgrad','Alumni'].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Availability */}
      <div>
        <label className={labelClass}>Availability Status</label>
        <div className="space-y-2">
          {STATUS_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="status"
                value={opt.value}
                checked={form.status === opt.value}
                onChange={() => { setForm(f => ({ ...f, status: opt.value })); setSaved(false) }}
                className="accent-violet-600 w-4 h-4"
              />
              <span className="flex items-center gap-2 text-sm theme-text group-hover:text-violet-300 transition-colors">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* GitHub */}
      <div>
        <label className={labelClass}>GitHub Username</label>
        <div className="relative">
          <input
            {...field('github')}
            type={showGithub ? 'text' : 'password'}
            className={inputClass + ' pr-10'}
            placeholder="your-github-username"
          />
          <button
            type="button"
            onClick={() => setShowGithub(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 theme-muted hover:text-violet-400 transition-colors"
            aria-label={showGithub ? 'Hide' : 'Show'}
          >
            {showGithub ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {/* LinkedIn */}
      <div>
        <label className={labelClass}>LinkedIn Profile URL</label>
        <input {...field('linkedin')} className={inputClass} placeholder="https://linkedin.com/in/username" />
      </div>

      {/* Website */}
      <div>
        <label className={labelClass}>Personal Website URL</label>
        <input {...field('website')} className={inputClass} placeholder="https://yourwebsite.com" />
      </div>

      <div className="flex justify-end pt-2">
        <SaveButton saving={saving} saved={saved} onClick={handleSave} />
      </div>
    </div>
  )
}

// ── Appearance section ───────────────────────────────────────────────────────
function AppearanceSection() {
  const { theme, setTheme } = useTheme()

  const THEMES = [
    { key: 'dark',   label: 'Dark',   desc: 'Easy on the eyes at night.',    icon: Moon    },
    { key: 'light',  label: 'Light',  desc: 'Clean and bright.',             icon: Sun     },
    { key: 'system', label: 'System', desc: 'Follows your OS preference.',   icon: Monitor },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold theme-text mb-1">Theme</h3>
        <p className="theme-muted text-sm mb-4">Choose how B2B2H looks for you.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {THEMES.map(({ key, label, desc, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTheme(key === 'system'
                ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                : key
              )}
              className={`p-4 rounded-xl border text-left transition-all ${
                theme === key || (key === 'system' && false)
                  ? 'border-violet-300 dark:border-violet-600 bg-violet-50 dark:bg-violet-900/20'
                  : 'border theme-divider hover:border-violet-500/50'
              }`}
              style={theme !== key ? { backgroundColor: 'var(--bg-raised)' } : {}}
              aria-pressed={theme === key}
            >
              <Icon
                size={22}
                className={`mb-2 ${theme === key ? 'text-violet-600 dark:text-violet-400' : 'theme-muted'}`}
                aria-hidden="true"
              />
              <p className={`font-semibold text-sm ${theme === key ? 'text-violet-700 dark:text-violet-300' : 'theme-text'}`}>
                {label}
              </p>
              <p className="text-xs theme-muted mt-0.5">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold theme-text mb-1">Accent Color</h3>
        <p className="theme-muted text-sm mb-3">Currently locked to Volt Violet — the B2B2H identity color.</p>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-violet-600 border-2 border-violet-400" aria-label="Volt Violet" />
          <span className="text-sm theme-muted">Volt Violet (#7C3AED)</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 border border-violet-400 dark:border-violet-800/40 text-violet-800 dark:text-violet-400 font-semibold ml-1">Active</span>
        </div>
      </div>
    </div>
  )
}

// ── Notifications section ────────────────────────────────────────────────────
function NotificationsSection() {
  const { user, refreshUser } = useAuth()
  const [prefs, setPrefs] = useState(
    user?.notificationPreferences || Object.fromEntries(NOTIF_PREFS.map(p => [p.key, true]))
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  useEffect(() => {
    if (user && user.notificationPreferences) {
      setPrefs(user.notificationPreferences)
    }
  }, [user])

  const toggle = key => {
    setPrefs(p => ({ ...p, [key]: !p[key] }))
    setSaved(false)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      console.log("[SaveNotifications] Request Payload:", { notificationPreferences: prefs })
      const response = await updateProfile({ notificationPreferences: prefs })
      console.log("[SaveNotifications] API Response:", response)
      const updatedUser = await refreshUser()
      console.log("[SaveNotifications] AuthContext Updated User:", updatedUser)
      console.log("[SaveNotifications] localStorage Updated Session:", localStorage.getItem("b2b2h-auth"))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error("[SaveNotifications] Error saving notifications:", err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold theme-text mb-1">Email & In-App Notifications</h3>
        <p className="theme-muted text-sm mb-4">Choose what you want to be notified about.</p>
        <div className="space-y-3">
          {NOTIF_PREFS.map(({ key, label, desc }) => (
            <div
              key={key}
              className="flex items-center justify-between gap-4 p-4 rounded-xl border theme-divider"
              style={{ backgroundColor: 'var(--bg-raised)' }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium theme-text">{label}</p>
                <p className="text-xs theme-muted mt-0.5">{desc}</p>
              </div>
              {/* Toggle switch */}
              <button
                role="switch"
                aria-checked={prefs[key]}
                onClick={() => toggle(key)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                  prefs[key] ? 'bg-violet-600' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    prefs[key] ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <SaveButton saving={saving} saved={saved} onClick={handleSave} />
      </div>
    </div>
  )
}

// ── Privacy section ──────────────────────────────────────────────────────────
function PrivacySection() {
  const { user, refreshUser } = useAuth()
  const [visibility, setVisibility] = useState(user?.profileVisibility || 'public')
  const [recruiterMode, setRecruiterMode] = useState(user?.recruiterMode || false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  useEffect(() => {
    if (user) {
      setVisibility(user.profileVisibility || 'public')
      setRecruiterMode(user.recruiterMode || false)
    }
  }, [user])

  const handleSave = async () => {
    try {
      setSaving(true)
      console.log("[SavePrivacy] Request Payload:", { profileVisibility: visibility, recruiterMode })
      const response = await updateProfile({ profileVisibility: visibility, recruiterMode })
      console.log("[SavePrivacy] API Response:", response)
      const updatedUser = await refreshUser()
      console.log("[SavePrivacy] AuthContext Updated User:", updatedUser)
      console.log("[SavePrivacy] localStorage Updated Session:", localStorage.getItem("b2b2h-auth"))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error("[SavePrivacy] Error saving privacy settings:", err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold theme-text mb-1">Profile Visibility</h3>
        <p className="theme-muted text-sm mb-4">Control who can see your profile and availability.</p>
        <div className="space-y-2">
          {[
            { value: 'public',   label: 'Public',           desc: 'Anyone on B2B2H can discover and view your profile.' },
            { value: 'builders', label: 'Builders Only',    desc: 'Only verified students can see your profile.' },
            { value: 'private',  label: 'Private',          desc: 'Only people you invite can see your profile.' },
          ].map(opt => (
            <label
              key={opt.value}
              className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border transition-all hover:border-violet-500/40"
              style={{ backgroundColor: visibility === opt.value ? 'var(--bg-raised)' : 'transparent', borderColor: 'var(--border-subtle)' }}
            >
              <input
                type="radio"
                name="visibility"
                value={opt.value}
                checked={visibility === opt.value}
                onChange={() => { setVisibility(opt.value); setSaved(false) }}
                className="accent-violet-600 w-4 h-4 mt-0.5"
              />
              <div>
                <p className="text-sm font-medium theme-text">{opt.label}</p>
                <p className="text-xs theme-muted">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div
        className="flex items-center justify-between p-4 rounded-xl border theme-divider"
        style={{ backgroundColor: 'var(--bg-raised)' }}
      >
        <div>
          <p className="font-medium theme-text text-sm">Recruiter Mode</p>
          <p className="text-xs theme-muted mt-0.5">
            Allow verified companies and sponsors to discover your profile. Fully opt-in.
          </p>
        </div>
        <button
          role="switch"
          aria-checked={recruiterMode}
          onClick={() => { setRecruiterMode(v => !v); setSaved(false) }}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-4 ${
            recruiterMode ? 'bg-violet-600' : 'bg-slate-600'
          }`}
        >
          <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${recruiterMode ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>

      <div className="flex justify-end pt-2">
        <SaveButton saving={saving} saved={saved} onClick={handleSave} />
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeSection, setActiveSection] = useState(searchParams.get('tab') || 'profile')

  const handleSectionChange = (section) => {
    setActiveSection(section)
    setSearchParams({ tab: section })
  }

  const CONTENT = {
    profile:       <ProfileSection />,
    skills:        <SkillsSection />,
    appearance:    <AppearanceSection />,
    notifications: <NotificationsSection />,
    privacy:       <PrivacySection />,
  }

  const activeLabel = SECTIONS.find(s => s.key === activeSection)?.label ?? 'Settings'

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold theme-text mb-1 flex items-center gap-2">
          <Settings size={22} className="text-violet-800 dark:text-violet-400" />
          Settings
        </h1>
        <p className="theme-muted text-sm">Manage your profile, preferences, and account.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Nav */}
        <div className="lg:w-52 flex-shrink-0">
          <SectionNav active={activeSection} onChange={handleSectionChange} />
        </div>

        {/* Content panel */}
        <div className="flex-1 min-w-0">
          <div
            className="rounded-2xl border p-6"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
          >
            <h2 className="font-bold theme-text text-lg mb-5 pb-4 border-b theme-divider">
              {activeLabel}
            </h2>
            {CONTENT[activeSection]}
          </div>
        </div>
      </div>

    </div>
  )
}
