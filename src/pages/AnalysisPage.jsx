import './AnalysisPage.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import TargetGroupSection from '../components/analysis/TargetGroupSection'
import PersonasSection from '../components/analysis/PersonasSection'
import OrganizerNeedsSection from '../components/analysis/OrganizerNeedsSection'
import GarrettLevelsSection from '../components/analysis/GarrettLevelsSection'

export default function AnalysisPage({ onNavigate, user, onAuthChange }) {
  return (
    <div className="gh-page">
      <Navbar onNavigate={onNavigate} currentView="analysis" user={user} onAuthChange={onAuthChange} />

      <main className="gh-main" style={{ marginTop: '73px' }}>
        <h1 className="gh-title" data-text="Analiza UX" style={{ marginBottom: '2rem' }}>Analiza UX</h1>
        <TargetGroupSection />
        <PersonasSection />
        <OrganizerNeedsSection />
        <GarrettLevelsSection />
      </main>

      <Footer />
    </div>
  )
}
