import './AnalysisPage.css'
import ThemeToggle from '../themeToggle'
import TargetGroupSection from '../components/analysis/TargetGroupSection'
import PersonasSection from '../components/analysis/PersonasSection'
import OrganizerNeedsSection from '../components/analysis/OrganizerNeedsSection'
import GarrettLevelsSection from '../components/analysis/GarrettLevelsSection'

export default function AnalysisPage({ onBack }) {
  return (
    <div className="gh-page">
      <header className="gh-header">
        <div className="gh-header__inner">
          <div>
            <p className="gh-header__label">Projektowanie Interfejsów WWW</p>
            <h1 className="gh-title" data-text="Analiza UX">Analiza UX</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="gh-btn" style={{ marginTop: 0, marginBottom: 0 }} onClick={onBack}>
              ← Wróć
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="gh-main">
        <TargetGroupSection />
        <PersonasSection />
        <OrganizerNeedsSection />
        <GarrettLevelsSection />
      </main>

      <footer className="gh-footer">
        <div className="gh-footer__inner">
          <p>Projekt &mdash; {new Date().getFullYear()}</p>
          <p>Analiza UX</p>
        </div>
      </footer>
    </div>
  )
}
