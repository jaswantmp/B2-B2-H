// src/layouts/MainLayout.jsx
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import AppNavbar from '../components/AppNavbar.jsx'

export default function MainLayout() {
  return (
    <div className="min-h-screen flex theme-bg theme-text">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppNavbar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
