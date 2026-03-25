import './AnalysisPage.css'
import ThemeToggle from '../themeToggle'
import TargetGroupSection from '../components/analysis/TargetGroupSection'
import PersonasSection from '../components/analysis/PersonasSection'
import OrganizerNeedsSection from '../components/analysis/OrganizerNeedsSection'
import GarrettLevelsSection from '../components/analysis/GarrettLevelsSection'

export default function AnalysisPage({ onBack }) {
  return (
    <div className="analysis-page">
      <header className="page-header relative">
        <div className="container">
          <div className="flex justify-between items-center">
            <div>
              <p className="page-header__label">Projektowanie Interfejsów WWW</p>
              <h1 className="page-header__title">Analiza UX</h1>
            </div>
            <div className="flex items-center gap-3">
              <button className="btn-back" onClick={onBack}>
                ← Wróć
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container">
        <TargetGroupSection />
        <PersonasSection />
        <OrganizerNeedsSection />
        <GarrettLevelsSection />
      </main>

      <footer className="page-footer">
        <div className="container flex">
          <p>Projekt &mdash; {new Date().getFullYear()}</p>
          <p className="ml-auto">GG WP for Good &mdash; Analiza UX</p>
        </div>
      </footer>
    </div>
  )
}
