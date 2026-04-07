import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function ConfirmationPage({ onNavigate, user, onAuthChange }) {
    return (
        <div className="gh-page">
            <Navbar onNavigate={onNavigate} currentView="confirmed" user={user} onAuthChange={onAuthChange} />
            <main className="gh-main" style={{ marginTop: '73px', textAlign: 'center', padding: '4rem 1rem' }}>
                <span style={{ fontSize: '4rem' }}>✅</span>
                <h1 className="gh-title">E-mail potwierdzony!</h1>
                <p style={{ color: 'var(--gh-text-dim)', fontSize: '1.1rem', marginTop: '1rem' }}>
                    Twoje konto zostało aktywowane. Witamy w GG WP for Good!
                </p>
                <button className="btn-cta" onClick={() => onNavigate('landing')} style={{ marginTop: '2rem' }}>
                    🎮 Przejdź do strony głównej
                </button>
            </main>
            <Footer />
        </div>
    )
}
