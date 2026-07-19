// src/components/SkillsSection.jsx
import { useState, useEffect, useRef } from 'react'
import { Plus, X, Search, Award, HelpCircle, Loader2, Sparkles } from 'lucide-react'
import { getUserSkills, addUserSkill, deleteUserSkill, SUGGESTED_SKILLS } from '../services/api.js'
import { useToast } from '../context/ToastContext.jsx'
import SkillBadge from './SkillBadge.jsx'

const CATEGORIES = ["Technical", "Design", "Product", "Communication", "Hackathon"]

export default function SkillsSection() {
  const [userSkills, setUserSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('All')
  
  // Search and Suggestions
  const [search, setSearch] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [proficiency, setProficiency] = useState('intermediate')
  const [customCategory, setCustomCategory] = useState('Technical')
  
  const { push } = useToast()
  const dropdownRef = useRef(null)

  useEffect(() => {
    loadSkills()
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadSkills = async () => {
    try {
      setLoading(true)
      const data = await getUserSkills()
      setUserSkills(data)
    } catch (err) {
      console.error(err)
      push('Failed to load your skills. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSkill = async (skillData) => {
    try {
      setActionLoading(true)
      setShowSuggestions(false)
      setSearch('')
      
      const added = await addUserSkill(skillData)
      setUserSkills(prev => [...prev, added])
      push(`Skill '${added.skill.name}' added successfully!`, 'success')
    } catch (err) {
      push(err.message || 'Failed to add skill', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveSkill = async (skillId, skillName) => {
    try {
      setActionLoading(true)
      await deleteUserSkill(skillId)
      setUserSkills(prev => prev.filter(us => us.skill_id !== skillId))
      push(`Skill '${skillName}' removed.`, 'info')
    } catch (err) {
      push(err.message || 'Failed to remove skill', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // Filter suggested skills based on input
  const currentSkillNames = new Set(userSkills.map(us => us.skill?.name.toLowerCase()))
  const filteredSuggestions = search.trim() === ''
    ? []
    : SUGGESTED_SKILLS.filter(s => 
        s.name.toLowerCase().includes(search.toLowerCase()) && 
        !currentSkillNames.has(s.name.toLowerCase())
      )

  const isExactMatch = SUGGESTED_SKILLS.some(s => s.name.toLowerCase() === search.trim().toLowerCase())
  const showCustomOption = search.trim().length > 0 && !isExactMatch && !currentSkillNames.has(search.trim().toLowerCase())

  // Group user skills by category
  const groupedSkills = {
    Technical: [],
    Design: [],
    Product: [],
    Communication: [],
    Hackathon: []
  }

  userSkills.forEach(us => {
    if (us.skill && groupedSkills[us.skill.category] !== undefined) {
      groupedSkills[us.skill.category].push(us)
    } else if (us.skill) {
      // Fallback
      if (!groupedSkills["Technical"]) groupedSkills["Technical"] = []
      groupedSkills["Technical"].push(us)
    }
  })

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-slate-800/60 rounded-xl w-3/4" />
        <div className="h-12 bg-slate-800/60 rounded-xl w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div className="h-32 bg-slate-800/60 rounded-xl" />
          <div className="h-32 bg-slate-800/60 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search & Add bar */}
      <div className="relative" ref={dropdownRef}>
        <label className="block text-xs font-semibold theme-muted uppercase tracking-wider mb-2">
          Search or Add Skills
        </label>
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Type skill name e.g., Python, Figma, Pitching..."
            className="theme-input w-full pl-10 pr-10 py-3 text-sm rounded-xl border transition-all"
            disabled={actionLoading}
          />
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 theme-muted" />
          {actionLoading && (
            <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-violet-400 animate-spin" />
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {showSuggestions && (search.trim().length > 0) && (
          <div 
            className="absolute left-0 right-0 mt-2 rounded-xl border shadow-2xl overflow-hidden z-50 divide-y theme-divider"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-strong)' }}
          >
            {filteredSuggestions.length > 0 && (
              <div className="max-h-60 overflow-y-auto py-1">
                <p className="text-xs theme-muted px-4 py-1.5 font-medium uppercase tracking-wide">Suggested Skills</p>
                {filteredSuggestions.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleAddSkill({ skill_id: s.id, proficiency })}
                    className="w-full text-left px-4 py-2.5 text-sm theme-text hover:bg-violet-900/20 hover:text-violet-800 dark:hover:text-violet-300 transition-colors flex items-center justify-between"
                  >
                    <span>{s.name}</span>
                    <span className="text-xs theme-muted px-2 py-0.5 rounded bg-[var(--bg-raised)]">{s.category}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Custom Skill Creation Form */}
            {showCustomOption && (
              <div className="p-4 space-y-3 bg-[var(--bg-raised)]">
                <div className="flex items-center gap-1.5 text-violet-800 dark:text-violet-400 text-sm font-semibold">
                  <Sparkles size={14} />
                  <span>Create Custom Skill: "{search.trim()}"</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold theme-muted uppercase tracking-wider mb-1.5">
                      Skill Category
                    </label>
                    <select
                      value={customCategory}
                      onChange={e => setCustomCategory(e.target.value)}
                      className="theme-input w-full text-xs py-2 px-2.5 rounded-lg"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold theme-muted uppercase tracking-wider mb-1.5">
                      Your Proficiency
                    </label>
                    <select
                      value={proficiency}
                      onChange={e => setProficiency(e.target.value)}
                      className="theme-input w-full text-xs py-2 px-2.5 rounded-lg"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddSkill({ 
                    skill_name: search.trim(), 
                    category: customCategory, 
                    proficiency 
                  })}
                  className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} /> Add Skill to Profile
                </button>
              </div>
            )}

            {filteredSuggestions.length === 0 && !showCustomOption && (
              <div className="p-4 text-center text-sm theme-muted">
                No matching skills found or already added.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b theme-divider pb-3">
        {['All', ...CATEGORIES].map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-all border ${
              activeTab === tab
                ? 'bg-violet-100 dark:bg-violet-700/20 border-violet-400 dark:border-violet-500 text-violet-800 dark:text-violet-300 font-semibold'
                : 'theme-btn-ghost hover:text-violet-400 border-transparent'
            }`}
            style={activeTab !== tab ? { backgroundColor: 'var(--bg-raised)' } : {}}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Skills Display Grid */}
      <div className="space-y-6">
        {CATEGORIES.map(category => {
          // If active tab is not All and doesn't match current category, skip
          if (activeTab !== 'All' && activeTab !== category) return null
          
          const skillsInCategory = groupedSkills[category] || []
          if (skillsInCategory.length === 0 && activeTab !== 'All') {
            return (
              <div key={category} className="text-center py-10 rounded-2xl border border-dashed theme-divider">
                <Award className="mx-auto theme-muted mb-2 opacity-40" size={32} />
                <h4 className="text-sm font-semibold theme-text">No skills in {category}</h4>
                <p className="text-xs theme-muted mt-1">Search and add skills to categorize them here.</p>
              </div>
            )
          }

          if (skillsInCategory.length === 0) return null

          const seenSkills = new Set()
          const uniqueSkillsInCategory = skillsInCategory.filter(us => {
            const nameLower = us.skill?.name?.toLowerCase()
            if (!nameLower || seenSkills.has(nameLower)) return false
            seenSkills.add(nameLower)
            return true
          })

          return (
            <div key={category} className="space-y-3">
              <h3 className="text-xs font-bold text-violet-800 dark:text-violet-400 font-semibold uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                {category} Skills
              </h3>
              
              <div className="flex flex-wrap gap-2.5">
                {uniqueSkillsInCategory.map(us => (
                  <div
                    key={us.id}
                    className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-xl border transition-all hover:border-violet-500/40 select-none group"
                    style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-subtle)' }}
                  >
                    <span className="text-xs font-medium theme-text">{us.skill.name}</span>
                    {us.proficiency && (
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-100 dark:bg-[var(--bg-surface)] text-violet-800 dark:text-violet-300 font-semibold border border-violet-300 dark:border-transparent">
                        {us.proficiency}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(us.skill_id, us.skill.name)}
                      className="p-0.5 rounded-full hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all flex-shrink-0"
                      aria-label={`Remove ${us.skill.name}`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {userSkills.length === 0 && activeTab === 'All' && (
          <div className="text-center py-16 rounded-2xl border border-dashed theme-divider bg-[var(--bg-raised)]/30">
            <Award className="mx-auto theme-muted mb-3 animate-bounce" size={40} />
            <h4 className="text-sm font-semibold theme-text">Your Skills list is empty</h4>
            <p className="text-xs theme-muted mt-1 max-w-xs mx-auto">
              Start building your student profile! Search and add your core technical, design, or hackathon skills above.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
