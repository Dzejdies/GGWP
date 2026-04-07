import { useState, useEffect, useRef } from 'react'
import './LandingPage.css'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'
import Footer from '../components/Footer'


const STATS_FALLBACK = [
    { value: '50+', label: 'Turniejów' },
    { value: '12k+', label: 'Uczestników' },
    { value: '320k zł', label: 'Zebrane środki' },
    { value: '25+', label: 'Partnerów' },
]

const GOALS = [
    {
        icon: '🎮',
        title: 'Turnieje gamingowe',
        text: 'Organizujemy turnieje e-sportowe, w których gracze rywalizują wspierając szczytne cele. Każdy turniej to zabawa i realna pomoc.',
    },
    {
        icon: '💰',
        title: 'Zbiórki charytatywne',
        text: 'Zbieramy fundusze podczas wydarzeń na żywo i online. Środki trafiają do organizacji pomagających dzieciom i osobom w kryzysie.',
    },
    {
        icon: '🤝',
        title: 'Budowanie społeczności',
        text: 'Łączymy graczy, streamerów i twórców wokół wspólnej idei — że gamingowa społeczność może zmieniać świat na lepsze.',
    },
]

const STEPS = [
    { n: '01', title: 'Zgłoś się do turnieju', text: 'Wybierz turniej i zarejestruj się jako uczestnik lub drużyna. Rejestracja jest bezpłatna.' },
    { n: '02', title: 'Graj i zbieraj wsparcie', text: 'Podczas turnieju widzowie i sponsorzy wpłacają datki. Im dalej zajdziesz, tym więcej uwagi przyciągasz.' },
    { n: '03', title: 'Środki trafiają dalej', text: 'Po każdym wydarzeniu zebrane fundusze przekazywane są transparentnie do wybranych organizacji.' },
    { n: '04', title: 'Raport i podziękowania', text: 'Publikujemy pełny raport z zebranych środków. Każdy uczestnik otrzymuje podziękowanie i certyfikat.' },
]

// Particle component
function Particles() {
    const particles = Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 12}s`,
        duration: `${10 + Math.random() * 15}s`,
        size: Math.random() > 0.7 ? 3 : 2,
        color: Math.random() > 0.5 ? 'var(--gh-cyan)' : 'var(--gh-purple-lt)',
    }))

    return (
        <div className="lp-particles">
            {particles.map((p) => (
                <span
                    key={p.id}
                    className="lp-particle"
                    style={{
                        left: p.left,
                        width: p.size,
                        height: p.size,
                        background: p.color,
                        animationDelay: p.delay,
                        animationDuration: p.duration,
                    }}
                />
            ))}
        </div>
    )
}

// Typing effect hook
function useTyping(phrases, speed = 60, pause = 2200) {
    const [displayed, setDisplayed] = useState('')
    const [phase, setPhase] = useState('typing')
    const [phraseIdx, setPhraseIdx] = useState(0)
    const charIdx = useRef(0)

    useEffect(() => {
        const current = phrases[phraseIdx]

        if (phase === 'typing') {
            if (charIdx.current < current.length) {
                const t = setTimeout(() => {
                    setDisplayed(current.slice(0, charIdx.current + 1))
                    charIdx.current++
                }, speed)
                return () => clearTimeout(t)
            } else {
                const t = setTimeout(() => setPhase('deleting'), pause)
                return () => clearTimeout(t)
            }
        }

        if (phase === 'deleting') {
            if (charIdx.current > 0) {
                const t = setTimeout(() => {
                    charIdx.current--
                    setDisplayed(current.slice(0, charIdx.current))
                }, speed / 2)
                return () => clearTimeout(t)
            } else {
                setPhraseIdx((i) => (i + 1) % phrases.length)
                setPhase('typing')
            }
        }
    }, [displayed, phase, phraseIdx, phrases, speed, pause])

    return displayed
}

export default function LandingPage({ onNavigate, user, onAuthChange }) {
    const [stats, setStats] = useState(STATS_FALLBACK)

    const subtitle = useTyping([
        'Grasz. Pomagasz. Zmieniasz świat.',
        'Gaming z misją. Turnieje dla dobra.',
        'Każda gra może zmienić czyjeś życie.',
    ])

    useEffect(() => {
        if (!supabase) return
        supabase
            .from('stats')
            .select('value, label, sort_order')
            .order('sort_order')
            .then(({ data, error }) => {
                if (!error && data && data.length > 0) setStats(data)
            })
    }, [])

    return (
        <div className="gh-page">
            <Navbar onNavigate={onNavigate} currentView="landing" user={user} onAuthChange={onAuthChange} />
            {/* Hero */}
            <section className="lp-hero">
                <Particles />
                <div className="lp-hero__content">
                    <div className="lp-hero__tag">
                        Fundacja charytatywna e-sport
                    </div>
                    <h1
                        className="lp-hero__title"
                        data-text="GG WP for Good"
                    >
                        GG WP for Good
                    </h1>
                    <p className="lp-hero__subtitle">
                        {subtitle}
                        <span className="lp-hero__cursor" />
                    </p>
                    <button className="lp-hero__cta" onClick={() => onNavigate('project')}>
                        🎮 Poznaj naszą fundację
                    </button>
                </div>
            </section>

            {/* Stats strip */}
            <div className="lp-stats">
                {stats.map((s) => (
                    <div key={s.label} className="lp-stat">
                        <span className="lp-stat__value">{s.value}</span>
                        <span className="lp-stat__label">{s.label}</span>
                    </div>
                ))}
            </div>

            {/* Co robimy */}
            <section className="lp-section">
                <p className="lp-section__tag">Co robimy</p>
                <h2 className="lp-section__title">Gaming dla dobra</h2>
                <p className="lp-section__sub">
                    Trzy filary działalności fundacji GG WP for Good — łączymy pasję do gier z realnym wpływem społecznym.
                </p>
                <div className="lp-cards">
                    {GOALS.map((g) => (
                        <div key={g.title} className="lp-card">
                            <span className="lp-card__icon">{g.icon}</span>
                            <h3 className="lp-card__title">{g.title}</h3>
                            <p className="lp-card__text">{g.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Jak to działa */}
            <section className="lp-section" style={{ paddingTop: 0 }}>
                <p className="lp-section__tag">Jak to działa</p>
                <h2 className="lp-section__title">Od gracza do bohatera</h2>
                <p className="lp-section__sub">
                    Cztery proste kroki — od rejestracji do realnej pomocy.
                </p>
                <div className="lp-timeline">
                    {STEPS.map((s) => (
                        <div key={s.n} className="lp-step">
                            <div className="lp-step__dot">{s.n}</div>
                            <div>
                                <h3 className="lp-step__title">{s.title}</h3>
                                <p className="lp-step__text">{s.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA końcowe */}
            <div className="lp-cta">
                <h2 className="lp-cta__title">Chcesz dołączyć?</h2>
                <p className="lp-cta__sub">Dowiedz się więcej o projekcie i tym jak możesz pomóc.</p>
                <button className="lp-cta__btn" onClick={() => onNavigate('project')}>
                    🏆 Dowiedz się więcej
                </button>
            </div>

            {/* Footer */}
            <Footer />
        </div>
    )
}
