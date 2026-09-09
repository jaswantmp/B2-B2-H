// src/App.jsx
import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
// Keep LandingPage synchronous for fast initial load
import LandingPage from './pages/LandingPage.jsx'

const ProtectedRoute = lazy(() => import('./components/ProtectedRoute.jsx'))
const MainLayout = lazy(() => import('./layouts/MainLayout.jsx'))
const AdminRoute = lazy(() => import('./components/AdminRoute.jsx'))
const AdminLayout = lazy(() => import('./layouts/AdminLayout.jsx'))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage.jsx'))
const AdminStudentsPage = lazy(() => import('./pages/admin/AdminStudentsPage.jsx'))
const AdminStudentDetailPage = lazy(() => import('./pages/admin/AdminStudentDetailPage.jsx'))
const AdminHackathonsPage = lazy(() => import('./pages/admin/AdminHackathonsPage.jsx'))
const AdminHackathonDetailPage = lazy(() => import('./pages/admin/AdminHackathonDetailPage.jsx'))
const AdminProjectsPage = lazy(() => import('./pages/admin/AdminProjectsPage.jsx'))
const AdminProjectDetailPage = lazy(() => import('./pages/admin/AdminProjectDetailPage.jsx'))
const AdminTeamsPage = lazy(() => import('./pages/admin/AdminTeamsPage.jsx'))
const AdminTeamDetailPage = lazy(() => import('./pages/admin/AdminTeamDetailPage.jsx'))
const AdminStatisticsPage = lazy(() => import('./pages/admin/AdminStatisticsPage.jsx'))

const LoginPage = lazy(() => import('./pages/auth/LoginPage.jsx'))
const SignUpPage = lazy(() => import('./pages/auth/SignUpPage.jsx'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage.jsx'))
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage.jsx'))
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'))
const OnboardingPage = lazy(() => import('./pages/OnboardingPage.jsx'))
const DiscoverPage = lazy(() => import('./pages/DiscoverPage.jsx'))
const BuilderProfilePage = lazy(() => import('./pages/BuilderProfilePage.jsx'))
const RecommendationsPage = lazy(() => import('./pages/RecommendationsPage.jsx'))
const TeamBuilderPage = lazy(() => import('./pages/TeamBuilderPage.jsx'))
const TeamsPage = lazy(() => import('./pages/TeamsPage.jsx'))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage.jsx'))
const HackathonsPage = lazy(() => import('./pages/HackathonsPage.jsx'))
const GeneratorPage = lazy(() => import('./pages/GeneratorPage.jsx'))
const AIProjectIdeaPage = lazy(() => import('./pages/AIProjectIdeaPage.jsx'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage.jsx'))
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'))
const AITeamMatcherPage = lazy(() => import('./pages/AITeamMatcherPage.jsx'))

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={
              <div className="min-h-screen bg-slate-950 flex items-center justify-center text-violet-400 font-medium">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading platform...</span>
                </div>
              </div>
            }>
              <Routes>
                {/* Public */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login"           element={<LoginPage />} />
                <Route path="/signup"          element={<SignUpPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password"  element={<ResetPasswordPage />} />

                {/* Protected app shell — redirects to /login if not authenticated */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<MainLayout />}>
                    <Route path="/dashboard"       element={<DashboardPage />} />
                    <Route path="/onboarding"      element={<OnboardingPage />} />
                    <Route path="/discover"        element={<DiscoverPage />} />
                    <Route path="/builders/:id"    element={<BuilderProfilePage />} />
                    <Route path="/profile/:id"     element={<BuilderProfilePage />} />
                    <Route path="/recommendations" element={<RecommendationsPage />} />
                    <Route path="/team-builder"    element={<TeamBuilderPage />} />
                    <Route path="/teams"           element={<TeamsPage />} />
                    <Route path="/projects"        element={<ProjectsPage />} />
                    <Route path="/hackathons"      element={<HackathonsPage />} />
                    <Route path="/generator"       element={<GeneratorPage />} />
                    <Route path="/ai-project-generator" element={<AIProjectIdeaPage />} />
                    <Route path="/notifications"   element={<NotificationsPage />} />
                    <Route path="/settings"        element={<SettingsPage />} />
                    <Route path="/ai-team-matcher" element={<AITeamMatcherPage />} />
                    <Route path="/ai-hackathon-recommender" element={<Navigate to="/hackathons" replace />} />
                  </Route>
                </Route>

                {/* Protected Admin Routes */}
                <Route element={<AdminRoute />}>
                  <Route element={<AdminLayout />}>
                    <Route path="/admin" element={<AdminDashboardPage />} />
                    <Route path="/admin/students" element={<AdminStudentsPage />} />
                    <Route path="/admin/students/:studentId" element={<AdminStudentDetailPage />} />
                    <Route path="/admin/hackathons" element={<AdminHackathonsPage />} />
                    <Route path="/admin/hackathons/:hackathonId" element={<AdminHackathonDetailPage />} />
                    <Route path="/admin/projects" element={<AdminProjectsPage />} />
                    <Route path="/admin/projects/:projectId" element={<AdminProjectDetailPage />} />
                    <Route path="/admin/teams" element={<AdminTeamsPage />} />
                    <Route path="/admin/teams/:teamId" element={<AdminTeamDetailPage />} />
                    <Route path="/admin/statistics" element={<AdminStatisticsPage />} />
                  </Route>
                </Route>

                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
