// src/components/auth/PasswordStrength.jsx

// Scores 0-4 based on length, casing, numbers, symbols.
function scorePassword(pw) {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

const LEVELS = [
  { label: 'Too weak',  color: '#EF4444' },
  { label: 'Weak',      color: '#F59E0B' },
  { label: 'Fair',      color: '#F59E0B' },
  { label: 'Good',      color: '#06B6D4' },
  { label: 'Strong',    color: '#10B981' },
]

export default function PasswordStrength({ password }) {
  if (!password) return null
  const score = scorePassword(password)
  const level = LEVELS[score]

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1.5">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-colors duration-200"
            style={{ backgroundColor: i < score ? level.color : 'var(--bg-raised)' }}
          />
        ))}
      </div>
      <p className="text-xs" style={{ color: score > 0 ? level.color : 'var(--text-muted)' }}>
        {level.label}
        {score < 3 && (
          <span className="theme-muted"> — use 8+ characters, a number, and a symbol</span>
        )}
      </p>
    </div>
  )
}

export { scorePassword }
