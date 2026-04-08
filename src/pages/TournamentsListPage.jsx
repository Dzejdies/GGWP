import { useState, useEffect } from 'react'
import './ProjectPage.css' // Używamy wspóldzielonych stylów kart turniejów
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'

const TOURNAMENTS_FALLBACK = [
  {
    id: '1',
    title: 'GG WP Charity Cup #1',
    game: 'League of Legends',
    date: '2026-05-15',
    prize_pool: '5 000 zł',
    participants_count: 32,
    max_participants: 64,
    status: 'upcoming',
    description: 'Pierwszy turniej charytatywny GG WP! Drużyny 5v5 walczą o puchar.',
  },
  {
    id: '2',
    title: 'Valorant for Good',
    game: 'Valorant',
    date: '2026-06-01',
    prize_pool: '3 000 zł',
    participants_count: 16,
    max_participants: 32,
    status: 'upcoming',
    description: 'Turniej Valorant — środki trafiają do lokalnych domów dziecka.',
  },
  {
    id: '3',
    title: 'CS2 Retro Showdown',
    game: 'Counter-Strike 2',
    date: '2026-04-01',
    prize_pool: '2 500 zł',
    participants_count: 64,
    max_participants: 64,
    status: 'completed',
    description: 'Zakończony turniej CS2, zebrano ponad 8 000 zł na cele charytatywne!',
  },
]

const STATUS_LABELS = {
  upcoming: '📅 Nadchodzący',
  live: '🔴 Na żywo',
  completed: '✅ Zakończony',
}

function TournamentSkeleton() {
  return (
    <div className="tournament-skeleton skeleton">
      <div className="img-box skeleton" />
      <div className="title-box skeleton" />
      <div className="text-box skeleton" />
      <div className="text-box skeleton" style={{ width: '60%' }} />
      <div className="btn-box skeleton" />
    </div>
  )
}

export default function TournamentsListPage({ onNavigate, user, onAuthChange }) {
  const [tournaments, setTournaments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Wyszukiwanie i Filtrowanie
  const [searchQuery, setSearchQuery] = useState('')
  const [gameFilter, setGameFilter] = useState('all')

  useEffect(() => {
    let mounted = true
    
    const timeout = setTimeout(() => {
      if (mounted && isLoading) {
        setTournaments(TOURNAMENTS_FALLBACK)
        setIsLoading(false)
      }
    }, 3000)

    const fetchData = async () => {
      if (!supabase) return

      try {
        const { data: tData } = await supabase
          .from('tournaments')
          .select('*, teams(count)')
          .order('start_date', { ascending: true })

        if (mounted && tData) {
          const mappedData = tData.map(t => ({
            id: t.id,
            title: t.name,
            game: t.game,
            description: t.description,
            date: t.start_date,
            max_participants: t.max_teams,
            status: t.status === 'open' ? 'upcoming' : (t.status === 'ongoing' ? 'live' : (t.status === 'finished' ? 'completed' : t.status)),
            prize_pool: t.prize_pool,
            participants_count: t.teams?.[0]?.count || 0
          }))
          
          if (mappedData.length > 0) {
            setTournaments(mappedData)
          } else {
            setTournaments(TOURNAMENTS_FALLBACK)
          }
        }
      } catch (err) {
        if (mounted) setTournaments(TOURNAMENTS_FALLBACK)
      } finally {
        if (mounted) {
          clearTimeout(timeout)
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      mounted = false
      clearTimeout(timeout)
    }
  }, [])

  // Lista gier do comboboxa
  const uniqueGames = Array.from(new Set(tournaments.map(t => t.game))).filter(Boolean)

  const filteredTournaments = tournaments.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGame = gameFilter === 'all' ? true : t.game === gameFilter
    
    return matchesSearch && matchesGame
  })

  return (
    <div className="gh-page">
      <Navbar onNavigate={onNavigate} currentView="project" user={user} onAuthChange={onAuthChange} />

      <main className="gh-main" style={{ marginTop: '73px' }}>
        
        <button className="gh-btn gh-btn--outline" onClick={() => onNavigate('dashboard')} style={{marginBottom:'1rem'}}>
          ← Powrót do Panelu
        </button>

        <section className="project-section" style={{ marginTop: '1rem' }}>
          <div className="project-section__header">
            <h1 className="project-section__title" style={{ fontSize: '2.5rem', textShadow: '0 0 20px rgba(0, 240, 255, 0.4)' }}>
              Baza Turniejów
            </h1>
            <p className="project-section__subtitle">
              Znajdź interesujące Cię wydarzenia. Przeglądaj, wyszukuj i dołączaj do walki o wyższe cele.
            </p>
          </div>
          
          {/* PasekWyszukiwania / Kontrolki */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem', padding: '1rem', background: 'var(--gh-bg-secondary)', borderRadius: '8px', border: '1px solid var(--gh-border)' }}>
            
            <div style={{ flex: '1 1 300px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--gh-text-c)' }}>Wyszukaj po nazwie</label>
              <input 
                type="text" 
                placeholder="Szukaj..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--gh-border)', background: 'var(--gh-bg)', color: 'var(--gh-text)', outline: 'none' }}
              />
            </div>

            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--gh-text-c)' }}>Filtruj grę</label>
              <select 
                value={gameFilter}
                onChange={(e) => setGameFilter(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--gh-border)', background: 'var(--gh-bg)', color: 'var(--gh-text)', outline: 'none' }}
              >
                <option value="all">Wszystkie Gry</option>
                {uniqueGames.map(game => (
                  <option key={game} value={game}>{game}</option>
                ))}
              </select>
            </div>
            
          </div>

          {isLoading ? (
            <div className="project-grid project-grid--3">
              <TournamentSkeleton />
              <TournamentSkeleton />
              <TournamentSkeleton />
            </div>
          ) : filteredTournaments.length > 0 ? (
            <div className="project-grid project-grid--3">
              {filteredTournaments.map((t) => (
                <div key={t.id} className={`tournament-card tournament-card--${t.status}`}>
                  <div className="tournament-card__header">
                    <span className={`tournament-card__badge tournament-card__badge--${t.status}`}>
                      {STATUS_LABELS[t.status] || t.status}
                    </span>
                    <span className="tournament-card__game">{t.game}</span>
                  </div>
                  <h3 className="tournament-card__title">{t.title}</h3>
                  <p className="tournament-card__desc">{t.description}</p>
                  <div className="tournament-card__meta">
                    <div className="tournament-card__meta-item">
                      <span className="tournament-card__meta-label">📅 Data</span>
                      <span className="tournament-card__meta-value">
                        {new Date(t.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    {t.prize_pool && (
                      <div className="tournament-card__meta-item">
                        <span className="tournament-card__meta-label">💰 Pula</span>
                        <span className="tournament-card__meta-value">{t.prize_pool}</span>
                      </div>
                    )}
                    <div className="tournament-card__meta-item">
                      <span className="tournament-card__meta-label">👥 Uczestnicy</span>
                      <span className="tournament-card__meta-value">
                        {t.participants_count}{t.max_participants ? ` / ${t.max_participants}` : ''}
                      </span>
                    </div>
                  </div>
                  <button className="tournament-card__btn" onClick={() => onNavigate('tournament-details', t.id)}>
                    🔍 Zobacz szczegóły
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="gh-empty-state">
              <span className="gh-empty-state__icon">🕵️</span>
              <p>Brak turniejów spełniających kryteria wyszukiwania.</p>
              <button className="gh-btn gh-btn--outline" onClick={() => {setSearchQuery(''); setGameFilter('all')}} style={{marginTop: '1rem'}}>
                Wyczyść filtry
              </button>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
