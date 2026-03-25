import { useState } from 'react'
import './App.css'
import TeamMember from './components/TeamMember'
import TeamCanvas from './components/TeamCanvas'
import ThemeToggle from './themeToggle'
import AnalysisPage from './pages/AnalysisPage'

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

export default function App() {
  const [view, setView] = useState('home')

  if (view === 'analysis') {
    return <AnalysisPage onBack={() => setView('home')} />
  }

  return (
    <div className="page min-h-screen transition-colors duration-300">
      <header className="page-header relative">
        <div className="container">
          <div className="flex justify-between items-center">
            <div>
              <p className="page-header__label">Projektowanie Interfejsów WWW</p>
              <h1 className="page-header__title">O nas</h1>
            </div>
            <div>
              <ThemeToggle/>
            </div>
          </div>
        </div>
      </header>

      <main className="container">
        <section className="team-section">
          <h2 className="section-title">Nasz zespół</h2>
          <div className="team-grid">
            {TEAM.map((member, i) => (
              <TeamMember key={member.name + i} {...member} index={i} />
            ))}
          </div>
        </section>

        <button className="btn-analysis" onClick={() => setView('analysis')}>
          Analiza UX →
        </button>

        <TeamCanvas />
      </main>

      <footer className="page-footer">
        <div className="container flex">
          <p>Projekt &mdash; {new Date().getFullYear()}</p>
          <p className="ml-auto">Ostatnio aktualizowany: {__BUILD_DATE__}</p>
        </div>
      </footer>
    </div>
  )
}