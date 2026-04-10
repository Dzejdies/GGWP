import { useState, useEffect, useRef } from 'react'
import './App.css'
import './gaming-home.css'
import ThemeToggle from './themeToggle'
import Navbar from './components/Navbar'
import AnalysisPage from './pages/AnalysisPage'
import ProjectPage from './pages/ProjectPage'
import PlanPage from './pages/PlanPage'
import LandingPage from './pages/LandingPage'
import Footer from './components/Footer'
import ConfirmationPage from './pages/ConfirmationPage'
import AccountPage from './pages/AccountPage'
import AdminPage from './pages/AdminPage'
import TournamentDetailsPage from './pages/TournamentDetailsPage'
import DashboardPage from './pages/DashboardPage'
import TournamentsListPage from './pages/TournamentsListPage'
import AboutPage from './pages/AboutPage'
import LiveStreamPage from './pages/liveStreamPage'
import FloatingStream from './components/FloatingStream'
import { ToastProvider } from './components/Toast'
import { supabase } from './lib/supabase'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'

export default function App() {
  const [user, setUser] = useState(null)

  const routerNavigate = useNavigate()
  const location = useLocation()

  // Dawny selectedData staje się teraz stanem routingu (location.state)
  const selectedData = location.state || null;

  // Ref to store scroll positions for different views/states
  const scrollPositions = useRef({})

  // Odtwarzanie pozycji scrolla przy zmianie URL
  useEffect(() => {
    const key = location.pathname + (selectedData ? '-' + selectedData : '');
    const saved = scrollPositions.current[key] || 0;

    const handle = requestAnimationFrame(() => {
      window.scrollTo(0, saved);
    });
    return () => cancelAnimationFrame(handle);
  }, [location.pathname, selectedData]);

  // Autoryzacja i trzymanie sesji
  useEffect(() => {
    if (!supabase) return

    // Restore session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session?.user ?? null)
        if (window.location.hash.includes('access_token')) {
          routerNavigate('/confirmed')
          window.history.replaceState(null, '', window.location.pathname)
        } else if (location.pathname === '/' || location.pathname === '/landing') {
          routerNavigate('/dashboard')
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        //routerNavigate('/')
      }
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAuthChange = (newUser) => setUser(newUser)

  // Pomost/Wrapper nawigacji - tłumaczy stare stringi stanu na ścieżki reat-router-dom!
  const navigate = (target, data = null) => {
    // Save current scroll position before leaving
    const key = location.pathname + (selectedData ? '-' + selectedData : '');
    scrollPositions.current[key] = window.scrollY;

    let path = '/'
    if (target === 'dashboard') path = '/dashboard'
    else if (target === 'landing') path = '/'
    else if (target === 'analysis') path = '/analysis'
    else if (target === 'project') path = '/project'
    else if (target === 'plan') path = '/plan'
    else if (target === 'account') path = '/account'
    else if (target === 'admin') path = '/admin'
    else if (target === 'tournaments-list') path = '/tournaments-list'
    else if (target === 'tournament-details') path = `/tournaments/${data}`
    else if (target === 'confirmed') path = '/confirmed'
    else if (target === 'home') path = '/about' // nowy routing do AboutPage
    else if (target === 'live-stream') path = '/live-stream'

    routerNavigate(path, { state: data })
  }

  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<LandingPage onNavigate={navigate} user={user} onAuthChange={handleAuthChange} />} />

        {/* Zabezpieczenie ścieżek przez user ? ... : ... */}
        <Route path="/dashboard" element={user ? <DashboardPage onNavigate={navigate} user={user} onAuthChange={handleAuthChange} /> : <LandingPage onNavigate={navigate} user={user} onAuthChange={handleAuthChange} />} />

        <Route path="/analysis" element={<AnalysisPage onNavigate={navigate} user={user} onAuthChange={handleAuthChange} />} />
        <Route path="/project" element={<ProjectPage onNavigate={navigate} user={user} onAuthChange={handleAuthChange} />} />
        <Route path="/plan" element={<PlanPage onNavigate={navigate} user={user} onAuthChange={handleAuthChange} />} />
        <Route path="/confirmed" element={<ConfirmationPage onNavigate={navigate} user={user} onAuthChange={handleAuthChange} />} />
        <Route path="/account" element={<AccountPage onNavigate={navigate} user={user} onAuthChange={handleAuthChange} initialTabData={selectedData} />} />
        <Route path="/admin" element={user ? <AdminPage onNavigate={navigate} user={user} onAuthChange={handleAuthChange} /> : <LandingPage onNavigate={navigate} user={user} onAuthChange={handleAuthChange} />} />

        {/* Parametry w URL! */}
        <Route path="/tournaments/:id" element={<TournamentDetailsPage tournamentId={selectedData} onNavigate={navigate} user={user} onAuthChange={handleAuthChange} />} />
        <Route path="/tournaments-list" element={<TournamentsListPage onNavigate={navigate} user={user} onAuthChange={handleAuthChange} />} />

        <Route path="/about" element={<AboutPage onNavigate={navigate} user={user} onAuthChange={handleAuthChange} initialTabData={selectedData} />} />
        {/* Change channel to official channel, this is just a elite dangerous streamer :P */}
        <Route path="/live-stream" element={<LiveStreamPage onNavigate={navigate} user={user} onAuthChange={handleAuthChange} initialTabData={selectedData} channel="roots_rat" />} />
      </Routes>
      {/* Change channel to official channel, this is just a elite dangerous streamer :P */}
      <FloatingStream channel="roots_rat" isActive={true} />
    </ToastProvider>
  )
}
