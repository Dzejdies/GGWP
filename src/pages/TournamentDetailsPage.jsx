import React, { useState, useEffect } from 'react'
import './TournamentDetailsPage.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'
import WizardRegistrationModal from '../components/WizardRegistrationModal'
import LoginModal from '../components/LoginModal'
import { useParams } from 'react-router-dom'
import '../components/button.css'
import { useAuthGuard } from '../hooks/useAuthGuard.jsx'

export default function TournamentDetailsPage({ tournamentId: propsTournamentId, onNavigate, user, onAuthChange }) {
  const { id } = useParams()
  const tournamentId = id || propsTournamentId;

  const { requireAuth, AuthModal } = useAuthGuard(user, onAuthChange)

  // Auth gate — blokada strony dla niezalogowanych
  const [showPageAuthGate, setShowPageAuthGate] = useState(!user)
  useEffect(() => {
    if (user) setShowPageAuthGate(false)
  }, [user])

  // Stan turnieju
  const [tournament, setTournament] = useState(null)
  const [teams, setTeams] = useState([])
  const [myTeam, setMyTeam] = useState(null) // Twoja drużyna
  const [isLeader, setIsLeader] = useState(false)
  const [pendingRequests, setPendingRequests] = useState([]) // Prośby do mojej drużyny
  const [loading, setLoading] = useState(true)

  // Okienka (Modals)
  const [showCreateTeam, setShowCreateTeam] = useState(false)

  useEffect(() => {
    async function fetchData() {
      if (!supabase) {
        setLoading(false)
        return
      }

      if (!tournamentId) {
        // Fallback dla debugowania bez ID
        setTournament({
          id: '1', title: 'GG WP Charity Cup #1', game: 'League of Legends', date: 'Brak',
          status: 'upcoming', description: 'Wybierz turniej z listy aby zobaczyć szczegóły.'
        })
        setLoading(false)
        return
      }

      try {
        const { data: tourData, error: tourError } = await supabase
          .from('tournaments')
          .select('*')
          .eq('id', tournamentId)
          .single()

        if (tourError || !tourData) throw tourError

        setTournament({
          id: tourData.id,
          title: tourData.name,
          game: tourData.game,
          date: tourData.start_date ? new Date(tourData.start_date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Brak daty',
          prize_pool: tourData.prize_pool || 'Brak',
          status: tourData.status === 'open' ? 'upcoming' : (tourData.status === 'ongoing' ? 'live' : tourData.status === 'finished' ? 'completed' : tourData.status),
          max_participants: tourData.max_teams || 0,
          team_size: tourData.team_size || 5,
          description: tourData.description || 'Brak opisu.',
          rules: tourData.rules || 'Zasady dołączania do turnieju uzupełnione zostaną przez administrację.'
        })

        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('id, team_name, tag, leader_id, avatar_url, team_members(id, status)')
          .eq('tournament_id', tournamentId)

        if (!teamsError && teamsData) {
          const mappedTeams = teamsData.map(t => ({
            id: t.id,
            team_name: t.team_name,
            tag: t.tag,
            leader_id: t.leader_id,
            avatar_url: t.avatar_url,
            member_count: t.team_members ? t.team_members.filter(m => m.status === 'accepted').length : 1
          }))
          setTeams(mappedTeams)

          if (user) {
            let myT = mappedTeams.find(t => t.leader_id === user.id)
            let leader = !!myT;

            if (!myT) {
              const { data: memberData } = await supabase
                .from('team_members')
                .select('team_id, status')
                .eq('user_id', user.id)
                .eq('status', 'accepted');

              if (memberData && memberData.length > 0) {
                myT = mappedTeams.find(t => memberData.some(m => m.team_id === t.id));
              }
            }

            if (myT) {
              setMyTeam(myT)
              setIsLeader(leader)

              if (leader) {
                const { data: reqData } = await supabase
                  .from('team_members')
                  .select('id, user_id, status')
                  .eq('team_id', myT.id)
                  .eq('status', 'pending')

                if (reqData) {
                  setPendingRequests(reqData.map(r => ({
                    id: r.id,
                    user_id: r.user_id,
                    user_name: 'Nowa prośba (ID: ' + r.user_id.split('-')[0] + '...)',
                    status: r.status
                  })))
                }
              }

            }
          }
        }
      } catch (err) {
        console.error('Wystąpił błąd przy pobieraniu turnieju:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [tournamentId, user])

  const handleTeamCreated = (newTeamData) => {
    const completeTeamInfo = {
      id: newTeamData.id,
      team_name: newTeamData.team_name,
      leader_id: newTeamData.leader_id,
      member_count: 1,
      avatar_url: newTeamData.avatar_url
    }
    setTeams([...teams, completeTeamInfo])
    setMyTeam(completeTeamInfo)
    setIsLeader(true)
    setShowCreateTeam(false)
  }

  const handleJoinTeam = (teamId) => {
    requireAuth(async () => {
      try {
        const { error } = await supabase
          .from('team_members')
          .insert({ team_id: teamId, user_id: user.id, status: 'pending' })

        if (error) throw error

        alert('Wysłano prośbę do lidera drużyny! Oczekuj na akceptację.')
      } catch (err) {
        alert('Błąd podczas wysyłania prośby: ' + err.message)
      }
    })
  }

  const handleLeaderAction = async (reqId, action) => {
    // action: 'accepted' | 'rejected'
    try {
      if (action === 'rejected') {
        const { error } = await supabase.from('team_members').delete().eq('id', reqId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('team_members').update({ status: 'accepted' }).eq('id', reqId);
        if (error) throw error;
      }

      setPendingRequests(prev => prev.filter(req => req.id !== reqId))

      if (action === 'accepted') {
        alert('Użytkownik został dodany do drużyny!')
      } else {
        alert('Odrzuciłeś prośbę użytkownika.')
      }
    } catch (err) {
      alert('Wystąpił błąd podczas zmiany statusu: ' + err.message);
    }
  }

  if (loading) return <div className="gh-page"><div className="gh-main">Ładowanie...</div></div>

  return (
    <div className="gh-page">
      <Navbar onNavigate={onNavigate} currentView="project" user={user} onAuthChange={onAuthChange} />

      {/* Auth gate — blokada dla niezalogowanych */}
      {showPageAuthGate && (
        <LoginModal
          initialMode="register"
          onClose={() => onNavigate('project')}
          onSuccess={(session) => {
            onAuthChange(session.user)
            setShowPageAuthGate(false)
          }}
        />
      )}

      {/* Modal inline guard (dla akcji w środku strony) */}
      {AuthModal}

      {/* Modal tworzenia drużyny */}
      {showCreateTeam && (
        <WizardRegistrationModal
          tournament={tournament}
          user={user}
          onClose={() => setShowCreateTeam(false)}
          onSuccess={handleTeamCreated}
        />
      )}

      <main className="gh-main" style={{ marginTop: '73px' }}>
        <button className="gh-btn gh-btn--outline" onClick={() => onNavigate('project')} style={{ marginBottom: '1rem' }}>
          ← Powrót do projektów
        </button>

        <section className="td-hero">
          <span className="td-hero__badge">{tournament?.game}</span>
          <h1 className="td-hero__title">{tournament?.title}</h1>
          <p className="td-hero__subtitle">{tournament?.description}</p>
          {!myTeam && (
            <button className="gh-btn" onClick={() => requireAuth(() => setShowCreateTeam(true))}>
              🛡️ Utwórz własną drużynę
            </button>
          )}
        </section>

        <div className="td-content-grid">
          {/* Główna sekcja */}
          <div className="td-main-content">

            {/* Panel Drużyny */}
            {myTeam && (
              <section className="td-section td-team-panel">
                <h2 className="td-section__title" style={{ color: 'var(--gh-cyan)' }}>🛡️ Twoja Drużyna: {myTeam.team_name}</h2>

                {isLeader && pendingRequests.length > 0 && (
                  <div className="td-requests-mini-panel" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--gh-bg-secondary)', borderRadius: '6px', border: '1px solid var(--gh-border)' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--gh-text)' }}>Oczekujące prośby o dołączenie</h3>
                    {pendingRequests.map(req => (
                      <div key={req.id} className="td-request-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem' }}>{req.user_name}</span>
                        <div className="td-btn-group">
                          <button className="gh-btn gh-btn--sm" onClick={() => handleLeaderAction(req.id, 'accepted')}>✓ Akceptuj</button>
                          <button className="gh-btn gh-btn--sm gh-btn--danger" onClick={() => handleLeaderAction(req.id, 'rejected')}>✕ Odrzuć</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <p style={{ color: 'var(--gh-muted)', fontSize: '0.85rem' }}>
                  Czat drużyny dostępny w zakładce <strong>Moje Drużyny</strong> na stronie konta.
                </p>
              </section>
            )}

            <section className="td-section">
              <h2 className="td-section__title">Zgłoszone drużyny</h2>
              {teams.length === 0 ? <p>Brak drużyn. Bądź pierwszy!</p> : (
                teams.map(t => {
                  const limit = tournament?.team_size || 5;
                  const isFull = t.member_count >= limit;

                  return (
                    <div key={t.id} className="td-team-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {t.avatar_url ? (
                        <img src={t.avatar_url} alt="Logo" style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--gh-border)' }} />
                      ) : (
                        <div style={{ width: '50px', height: '50px', borderRadius: '8px', background: 'var(--gh-bg-secondary)', border: '1px solid var(--gh-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🖼️</div>
                      )}
                      <div className="td-team-info" style={{ flex: 1 }}>
                        <h4>
                          {t.tag && <span style={{ color: 'var(--gh-cyan)', marginRight: '0.4rem' }}>[{t.tag}]</span>}
                          {t.team_name} {myTeam?.id === t.id && '(Twoja drużyna)'} {isFull && <span style={{ color: 'var(--gh-danger)', fontSize: '0.75rem', marginLeft: '0.5rem', fontWeight: 'normal' }}>PEŁNA</span>}
                        </h4>
                        <p>Graczy: {t.member_count} / {limit}</p>
                      </div>
                      {myTeam?.id !== t.id && !isFull && (
                        <button className="gh-btn gh-btn--outline" onClick={() => handleJoinTeam(t.id)}>
                          Dołącz do nich
                        </button>
                      )}
                    </div>
                  )
                })
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="td-sidebar">
            <section className="td-section">
              <h2 className="td-section__title">Szczegóły</h2>
              <div className="td-sidebar-stat">
                <span>Data</span>
                <span>{tournament?.date}</span>
              </div>
              <div className="td-sidebar-stat">
                <span>Pula nagród</span>
                <span>{tournament?.prize_pool}</span>
              </div>
              <div className="td-sidebar-stat">
                <span>Status</span>
                <span style={{ color: 'var(--gh-purple-lt)' }}>{tournament?.status}</span>
              </div>
              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Zasady</h3>
                <p style={{ color: 'var(--gh-text-c)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {tournament?.rules}
                </p>
              </div>
            </section>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  )
}
