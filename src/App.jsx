import { useState } from 'react'
import './App.css'
import './gaming-home.css'
import ThemeToggle from './themeToggle'
import AnalysisPage from './pages/AnalysisPage'
import ProjectPage from './pages/ProjectPage'
import PlanPage from './pages/PlanPage'

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
  const [view, setView] = useState('home')

  if (view === 'analysis') {
    return <AnalysisPage onBack={() => setView('home')} />
  }

  if (view === 'project') {
    return <ProjectPage onBack={() => setView('home')} />
  }

  if (view === 'plan') {
    return <PlanPage onBack={() => setView('home')} />
  }

  return (
    <div className="gh-page">
      <header className="gh-header">
        <div className="gh-header__inner">
          <div>
            <p className="gh-header__label">Projektowanie Interfejsów WWW</p>
            <h1 className="gh-title" data-text="O nas">O nas</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="gh-main">
        <section>
          <h2 className="gh-section-title">Nasz zespół</h2>
          <div className="gh-team-grid">
            {TEAM.map((member, i) => (
              <GamingTeamMember key={member.name} {...member} index={i} />
            ))}
          </div>
        </section>

        <div className="gh-btn-group">
          <button className="gh-btn" onClick={() => setView('analysis')}>
            Analiza UX →
          </button>
          <button className="gh-btn" onClick={() => setView('project')}>
            O projekcie →
          </button>
          <button className="gh-btn" onClick={() => setView('plan')}>
            Plan realizacji →
          </button>
        </div>

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

      <footer className="gh-footer">
        <div className="gh-footer__inner">
          <p>Projekt &mdash; {new Date().getFullYear()}</p>
          <p>Ostatnio aktualizowany: {__BUILD_DATE__}</p>
        </div>
      </footer>
    </div>
  )
}
