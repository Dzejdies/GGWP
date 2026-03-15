import './App.css'
import TeamMember from './components/TeamMember'
import TeamCanvas from './components/TeamCanvas'

const TEAM = [
  {
    name: 'Brajan Szczepańczyk',
    role: 'Backend',
    description: 'El Idiot 1.',
  },
  {
    name: 'Mateusz Kołodziejczyk',
    role: 'Frontend',
    description: 'EL Idiot 2.',
  },
]

export default function App() {
  return (
    <div className="page">
      <header className="page-header">
        <div className="container">
          <p className="page-header__label">Projektowanie Interfejsów WWW</p>
          <h1 className="page-header__title">O nas</h1>
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

        <TeamCanvas />
      </main>

      <footer className="page-footer">
        <div className="container">
          <p>Projekt zaliczeniowy &mdash; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  )
}
