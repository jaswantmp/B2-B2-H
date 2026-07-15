// src/services/data.js — B2B2H expanded sample data (cleaned of demo fallbacks)
export const STATUSES = {
  LOOKING_FOR_TEAM:    { label: 'Looking For Team',    color: 'green',  ring: '#10B981' },
  OPEN_TO_INVITES:     { label: 'Open To Invitations', color: 'yellow', ring: '#F59E0B' },
  LOOKING_FOR_MEMBERS: { label: 'Looking For Members', color: 'blue',   ring: '#06B6D4' },
  IN_TEAM:             { label: 'Already In Team',     color: 'red',    ring: '#EF4444' },
  OFFLINE:             { label: 'Offline',             color: 'gray',   ring: '#6B7280' },
}

export const users = []
export const hackathons = []
export const projects = []
export const myTeam = null
export const notifications = []
export const recommendations = []

export const currentUser = {
  id: '61ace078-841c-48e7-b038-4e485a54a187',
  name: 'Jaswant MP',
  username: 'jaswantmp',
  avatar: 'https://api.dicebear.com/8.x/adventurer/svg?seed=JaswantMP',
  university: 'SKCET',
  college: 'SKCET',
  year: '2nd Year',
  branch: 'Computer Science and Engineering',
  bio: 'Computer Science student at SKCET passionate about AI, Full Stack Development, Hackathons, and Open Source.',
  status: 'LOOKING_FOR_TEAM',
  skills: ['React', 'Node.js', 'Python', 'Tailwind CSS', 'TypeScript'],
  verifiedSkills: ['React', 'Node.js', 'TypeScript'],
  github: 'jaswantmp',
  githubStats: { repos: 18, commits: 247, stars: 36 },
  hackathonsWon: 2,
  projects: [],
  location: 'Dindigul, Tamil Nadu',
  interests: ['Full-Stack Development', 'AI/ML', 'Hackathons', 'Open Source'],
  domains: ['Web', 'AI/ML', 'EdTech'],
  joined: '2024-06',
  social: { github: 'jaswantmp', linkedin: 'jaswantmp' },
  achievements: ['Hack Tamil Nadu 2025 Finalist', 'SKCET Tech Fest Winner 2024', 'Open Source Contributor'],
}
