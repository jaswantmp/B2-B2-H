// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import MainLayout from './layouts/MainLayout.jsx'

import LandingPage         from './pages/LandingPage.jsx'
import LoginPage           from './pages/auth/LoginPage.jsx'
import SignUpPage          from './pages/auth/SignUpPage.jsx'
import ForgotPasswordPage  from './pages/auth/ForgotPasswordPage.jsx'
import DashboardPage       from './pages/DashboardPage.jsx'
import DiscoverPage        from './pages/DiscoverPage.jsx'
import BuilderProfilePage  from './pages/BuilderProfilePage.jsx'
import RecommendationsPage from './pages/RecommendationsPage.jsx'
import TeamBuilderPage     from './pages/TeamBuilderPage.jsx'
import TeamsPage           from './pages/TeamsPage.jsx'
import ProjectsPage        from './pages/ProjectsPage.jsx'
import HackathonsPage      from './pages/HackathonsPage.jsx'
import GeneratorPage       from './pages/GeneratorPage.jsx'
import AIProjectIdeaPage   from './pages/AIProjectIdeaPage.jsx'
import NotificationsPage   from './pages/NotificationsPage.jsx'
import SettingsPage        from './pages/SettingsPage.jsx'
import AITeamMatcherPage   from './pages/AITeamMatcherPage.jsx'
import OnboardingPage      from './pages/OnboardingPage.jsx'

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login"           element={<LoginPage />} />
              <Route path="/signup"          element={<SignUpPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

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
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
