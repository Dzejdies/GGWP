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
import { ToastProvider } from './components/Toast'
import { supabase } from './lib/supabase'

const TEAM = [
  {
    name: 'Brajan Szczepańczyk',
    role: 'Backend',
    description: 'Umiem w Javę (2/10) /s',
  },
  {
    name: 'Mateusz Kołodziejczyk',
    role: 'Frontend',
    description: 'Umiem w jezyk programowania HTML (3/10) /s',
  },
]

const CANVAS_SECTIONS = [
  {
    id: 'purpose',
    label: 'Cel zespołu',
    content: 'Zbieranie środków na cele charytatywne akcją GG WP',
    wide: false,
  },
  {
    id: 'values',
    label: 'Wartości',
    content: ['Kreatywność', 'Szczerość', 'Jakość ponad ilość', 'Wzajemny szacunek', 'Nienawiść do Analizy'],
    wide: false,
  },
  {
    id: 'strengths',
    label: 'Mocne strony',
    content: ['Frontend development', 'Projektowanie UI/UX', 'Szybkie prototypowanie', 'Praca zespołowa'],
    wide: false,
  },
  {
    id: 'roles',
    label: 'Role',
    content: ['Brajan — Backend lub Frontend', 'Mateusz — Frontend lub backend'],
    wide: false,
  },
  {
    id: 'rules',
    label: 'Zasady',
    content: ['Branch Main jest święty, nie pushuj', 'Code review przed mergem', 'Ja merguje (no chyba ze nie)'],
    wide: false,
  },
  {
    id: 'goals',
    label: 'Cele wspólne',
    content: 'Zaliczyć projekt.',
    wide: true,
  },
]

function CanvasCell({ label, content, wide }) {
  return (
    <div className={`gh-canvas-cell${wide ? ' gh-canvas-cell--wide' : ''}`}>
      <div className="gh-canvas-cell__header">
        <span className="gh-canvas-cell__label">{label}</span>
      </div>
      {Array.isArray(content) ? (
        <ul className="gh-canvas-cell__list">
          {content.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="gh-canvas-cell__text">{content}</p>
      )}
    </div>
  )
}

function GamingTeamMember({ name, role, description, index = 0 }) {
  const gradients = [
    'var(--gh-avatar-g1)',
    'var(--gh-avatar-g2)',
  ]
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  const bg = gradients[index % gradients.length]

  return (
    <div className="gh-card">
      <div
        className="gh-avatar"
        data-initials={initials}
        style={{ background: bg }}
      >
        {initials}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'center' }}>
        <span className="gh-member-name">{name}</span>
        <span className="gh-member-role">{role}</span>
        {description && <p className="gh-member-desc">{description}</p>}
      </div>
    </div>
  )
}

export default function App() {
  const [view, setView] = useState('landing')
  const [user, setUser] = useState(null)
  const [team, setTeam] = useState(TEAM)
  const [selectedData, setSelectedData] = useState(null)
  
  // Ref to store scroll positions for different views/states
  const scrollPositions = useRef({})

  useEffect(() => {
    const key = view + (selectedData ? '-' + selectedData : '');
    const saved = scrollPositions.current[key] || 0;
    
    // We need a tiny delay to allow the new view to render its content length
    const handle = requestAnimationFrame(() => {
      window.scrollTo(0, saved);
    });
    return () => cancelAnimationFrame(handle);
  }, [view, selectedData]);

  useEffect(() => {
    if (!supabase) return

    // Restore session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        setView(prev => prev === 'landing' ? 'dashboard' : prev)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session?.user ?? null)
        if (window.location.hash.includes('access_token')) {
          setView('confirmed')
          window.history.replaceState(null, '', window.location.pathname)
        } else {
          setView('dashboard')
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setView('landing')
      }
    })

    // Fetch team members from DB
    supabase
      .from('website_team')
      .select('name, role, description, sort_order')
      .order('sort_order')
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) setTeam(data)
      })

    return () => subscription.unsubscribe()
  }, [])

  const handleAuthChange = (newUser) => setUser(newUser)

  const navigate = (target, data = null) => {
    // Save current scroll position before leaving
    const key = view + (selectedData ? '-' + selectedData : '');
    scrollPositions.current[key] = window.scrollY;
    
    setView(target)
    setSelectedData(data)
  }

  const renderPage = () => {
    if (view === 'dashboard' && user) return <DashboardPage onNavigate={navigate} user={user} onAuthChange={handleAuthChange} />
    if (view === 'landing') return <LandingPage onNavigate={navigate} user={user} onAuthChange={handleAuthChange} />
    if (view === 'analysis') return <AnalysisPage onNavigate={navigate} user={user} onAuthChange={handleAuthChange} />
    if (view === 'project') return <ProjectPage onNavigate={navigate} user={user} onAuthChange={handleAuthChange} />
    if (view === 'plan') return <PlanPage onNavigate={navigate} user={user} onAuthChange={handleAuthChange} />
    if (view === 'confirmed') return <ConfirmationPage onNavigate={navigate} user={user} onAuthChange={handleAuthChange} />
    if (view === 'account') {
      return <AccountPage 
        onNavigate={navigate} 
        user={user} 
        onAuthChange={handleAuthChange} 
        initialTabData={selectedData}
      />
    }
    if (view === 'admin') return <AdminPage onNavigate={navigate} user={user} onAuthChange={handleAuthChange} />
    if (view === 'tournament-details') {
      return <TournamentDetailsPage tournamentId={selectedData} onNavigate={navigate} user={user} onAuthChange={handleAuthChange} />
    }
    if (view === 'tournaments-list') return <TournamentsListPage onNavigate={navigate} user={user} onAuthChange={handleAuthChange} />

    // Default: 'home' — O zespole
    return (
      <div className="gh-page">
        <Navbar 
          onNavigate={navigate} 
          currentView={view} 
          user={user} 
          onAuthChange={handleAuthChange} 
          initialTabData={selectedData}
        />
        <main className="gh-main" style={{ marginTop: '73px' }}>
          <h1 className="gh-title" data-text="O nas" style={{ marginBottom: '2rem' }}>O nas</h1>
          <section>
            <h2 className="gh-section-title">Nasz zespół</h2>
            <div className="gh-team-grid">
              {team.map((member, i) => (
                <GamingTeamMember key={member.name} {...member} index={i} />
              ))}
            </div>
          </section>

          <section className="gh-canvas">
            <div className="gh-canvas-header">
              <h2 className="gh-canvas-title">Team Canvas</h2>
              <p className="gh-canvas-subtitle">Jak pracujemy i co nas łączy</p>
            </div>
            <div className="gh-canvas-grid">
              {CANVAS_SECTIONS.map((s) => (
                <CanvasCell key={s.id} {...s} />
              ))}
            </div>
          </section>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <ToastProvider>
      {renderPage()}
    </ToastProvider>
  )
}
