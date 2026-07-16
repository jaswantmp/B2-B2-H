// src/pages/OnboardingPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap, Cpu, Check, Compass, Users, Sparkles,
  Link, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { completeOnboarding } from '../services/api.js'
import { useToast } from '../context/ToastContext.jsx'

const DOMAIN_OPTIONS = [
  'AI/ML', 'Web3', 'Blockchain', 'Mobile', 'Frontend',
  'Backend', 'UI/UX', 'Cybersecurity', 'Cloud/DevOps', 'IoT'
]

const SKILL_OPTIONS = [
  'React', 'Node.js', 'Python', 'TypeScript', 'Tailwind CSS',
  'Next.js', 'FastAPI', 'PostgreSQL', 'MongoDB', 'Docker',
  'Figma', 'Solidity', 'Web3.js', 'Kotlin', 'Swift', 'PyTorch'
]

export default function OnboardingPage() {
  const { user, refreshUser } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Form State
  const [college, setCollege] = useState('')
  const [university, setUniversity] = useState('')
  const [year, setYear] = useState('1st Year')
  const [branch, setBranch] = useState('')
  const [skills, setSkills] = useState([])
  const [domains, setDomains] = useState([])
  const [status, setStatus] = useState('LOOKING_FOR_TEAM')
  const [github, setGithub] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [website, setWebsite] = useState('')

  const totalSteps = 6
  const progressPercent = Math.round(((step - 1) / (totalSteps - 1)) * 100)

  const handleToggleSkill = (skill) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter(s => s !== skill))
    } else {
      setSkills([...skills, skill])
    }
  }

  const handleToggleDomain = (dom) => {
    if (domains.includes(dom)) {
      setDomains(domains.filter(d => d !== dom))
    } else {
      setDomains([...domains, dom])
    }
  }

  const handleNext = () => {
    if (step === 1 && (!college.trim() || !university.trim() || !branch.trim())) {
      push('Please fill in all education fields.', 'error')
      return
    }
    if (step === 2 && skills.length === 0) {
      push('Please select at least one skill.', 'error')
      return
    }
    if (step === 3 && domains.length === 0) {
      push('Please select at least one interested domain.', 'error')
      return
    }
    setStep(s => Math.min(s + 1, totalSteps))
  }

  const handleBack = () => {
    setStep(s => Math.max(s - 1, 1))
  }

  const handleSkip = () => {
    navigate('/dashboard')
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await completeOnboarding({
        college: college.trim(),
        university: university.trim(),
        year,
        branch: branch.trim(),
        skills,
        status,
        github: github.trim(),
        linkedin: linkedin.trim(),
        website: website.trim(),
        onboarding_completed: true
      })
      // Immediately call GET /auth/me to refresh context user state and localStorage
      await refreshUser()
      setStep(6)
    } catch (err) {
      console.error(err)
      push(err.message || 'Failed to save onboarding details. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-4 lg:p-8">
      {/* Container */}
      <div className="max-w-2xl w-full rounded-2xl border border-violet-500/20 bg-slate-950 p-4 sm:p-6 lg:p-10 shadow-2xl relative overflow-hidden">
        {/* Decorative Background Gradients */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl -z-10" />

        {/* Progress Bar & Header (only show for steps 1-5) */}
        {step < 6 && (
          <div className="mb-8">
            <div className="flex justify-between items-center text-xs text-violet-400 font-semibold mb-2">
              <span>STEP {step} OF 5</span>
              <span>{progressPercent}% COMPLETE</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* STEP 1: EDUCATION */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-900/30 border border-violet-800/40 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="text-violet-400" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">Tell us about your college</h2>
                <p className="text-xs text-slate-400">This helps us match you with builders nearby or in your university.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">College Name</label>
                <input
                  type="text"
                  placeholder="e.g. SKCET"
                  value={college}
                  onChange={e => setCollege(e.target.value)}
                  className="theme-input w-full px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-violet-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">University / Affiliation</label>
                <input
                  type="text"
                  placeholder="e.g. Anna University"
                  value={university}
                  onChange={e => setUniversity(e.target.value)}
                  className="theme-input w-full px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-violet-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Branch / Major</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science"
                  value={branch}
                  onChange={e => setBranch(e.target.value)}
                  className="theme-input w-full px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-violet-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Current Year</label>
                <select
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  className="theme-input w-full px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-violet-500 transition-all"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: SKILLS */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-900/30 border border-violet-800/40 flex items-center justify-center flex-shrink-0">
                <Cpu className="text-violet-400" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">Select your core skills</h2>
                <p className="text-xs text-slate-400">Select the tech stacks you actively build with.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {SKILL_OPTIONS.map(skill => {
                const active = skills.includes(skill)
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleToggleSkill(skill)}
                    className={`text-xs px-3.5 py-2 rounded-xl border transition-all flex items-center gap-1.5 font-medium ${
                      active
                        ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/15'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {active && <Check size={13} />}
                    {skill}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 3: DOMAINS */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-900/30 border border-violet-800/40 flex items-center justify-center flex-shrink-0">
                <Compass className="text-violet-400" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">What are your target domains?</h2>
                <p className="text-xs text-slate-400">Choose fields you are interested in hacking on.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {DOMAIN_OPTIONS.map(dom => {
                const active = domains.includes(dom)
                return (
                  <button
                    key={dom}
                    type="button"
                    onClick={() => handleToggleDomain(dom)}
                    className={`text-xs px-3.5 py-2 rounded-xl border transition-all flex items-center gap-1.5 font-medium ${
                      active
                        ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-600/15'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {active && <Check size={13} />}
                    {dom}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 4: STATUS */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-900/30 border border-violet-800/40 flex items-center justify-center flex-shrink-0">
                <Users className="text-violet-400" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">Current collaboration status</h2>
                <p className="text-xs text-slate-400">Let other builders know if you are actively recruiting or searching.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                { key: 'LOOKING_FOR_TEAM', title: 'Looking For Team', desc: 'I want to join an existing team.', color: 'border-emerald-500/20 hover:border-emerald-500' },
                { key: 'LOOKING_FOR_MEMBERS', title: 'Recruiting Builders', desc: 'I lead a team and need members.', color: 'border-cyan-500/20 hover:border-cyan-500' },
                { key: 'OPEN_TO_INVITES', title: 'Open to Invites', desc: 'Neutral, open to suggestions.', color: 'border-amber-500/20 hover:border-amber-500' },
                { key: 'OFFLINE', title: 'Exploring / Quiet', desc: 'Just looking around for now.', color: 'border-slate-500/20 hover:border-slate-500' }
              ].map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setStatus(opt.key)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    status === opt.key
                      ? 'bg-violet-900/10 border-violet-500 shadow-lg shadow-violet-500/5'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-900/50'
                  }`}
                >
                  <h3 className="font-semibold text-sm text-slate-200 mb-1">{opt.title}</h3>
                  <p className="text-xs text-slate-400">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: SOCIAL LINKS */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-900/30 border border-violet-800/40 flex items-center justify-center flex-shrink-0">
                <Link className="text-violet-400" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">Social handles (Optional)</h2>
                <p className="text-xs text-slate-400">Share your portfolios so recruiters can view your work.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">GitHub Profile URL</label>
                <input
                  type="url"
                  placeholder="https://github.com/username"
                  value={github}
                  onChange={e => setGithub(e.target.value)}
                  className="theme-input w-full px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-violet-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">LinkedIn URL</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={linkedin}
                  onChange={e => setLinkedin(e.target.value)}
                  className="theme-input w-full px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-violet-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Portfolio / Website</label>
                <input
                  type="url"
                  placeholder="https://myportfolio.com"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  className="theme-input w-full px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-violet-500 transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: COMPLETION SUCCESS SCREEN */}
        {step === 6 && (
          <div className="text-center py-6 space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="text-emerald-400" size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-100 mb-2">Profile Completed!</h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Thank you! Your profile data is successfully initialized. AI matchmaking, project matches, and recommendations are now customized for you.
              </p>
            </div>

            <div className="pt-4 max-w-sm mx-auto">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-500/20"
              >
                Go to Dashboard
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Navigation Actions (only show for steps 1-5) */}
        {step < 6 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-900">
            <div>
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all"
                >
                  <ArrowLeft size={14} /> Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSkip}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all"
                >
                  Skip for Now
                </button>
              )}
            </div>

            <div>
              {step < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all"
                >
                  Next
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-semibold text-sm transition-all"
                >
                  {loading ? 'Saving...' : 'Finish Onboarding'}
                  <Sparkles size={14} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
