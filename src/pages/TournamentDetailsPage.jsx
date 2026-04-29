import React, { useState, useEffect } from 'react'
import './TournamentDetailsPage.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import api from '../lib/api'
import WizardRegistrationModal from '../components/WizardRegistrationModal'
import LoginModal from '../components/LoginModal'
import { useParams } from 'react-router-dom'
import '../components/button.css'
import { useAuthGuard } from '../hooks/useAuthGuard.jsx'

export default function TournamentDetailsPage({ tournamentId: propsTournamentId, onNavigate, user, onAuthChange }) {
  const { id } = useParams()
  const tournamentId = id || propsTournamentId

  const { requireAuth, AuthModal } = useAuthGuard(user, onAuthChange)

  const [showPageAuthGate, setShowPageAuthGate] = useState(!user)
  useEffect(() => {
    if (user) setShowPageAuthGate(false)
  }, [user])

  const [tournament, setTournament] = useState(null)
  const [teams, setTeams] = useState([])
  const [myTeam, setMyTeam] = useState(null)
  const [isLeader, setIsLeader] = useState(false)
  const [pendingRequests, setPendingRequests] = useState([])
  const [loading, setLoading] = useState(true)

  const [showCreateTeam, setShowCreateTeam] = useState(false)

  useEffect(() => {
    async function fetchData() {
      if (!tournamentId) {
        setTournament({
          id: '1', title: 'GG WP Charity Cup #1', game: 'League of Legends', date: 'Brak',
          status: 'upcoming', description: 'Wybierz turniej z listy aby zobaczyć szczegóły.'
        })
        setLoading(false)
        return
      }

      try {
        const tourData = await api.get(`/ggwp/tournaments/${tournamentId}`)
        if (!tourData?.id) throw new Error('Tournament not found')

        setTournament({
          id: tourData.id,
          title: tourData.name,
          game: tourData.game,
          date: tourData.start_date
            ? new Date(tourData.start_date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
            : 'Brak daty',
          prize_pool: tourData.prize_pool || 'Brak',
          status: tourData.status === 'open' ? 'upcoming'
            : (tourData.status === 'ongoing' ? 'live'
              : tourData.status === 'finished' ? 'completed' : tourData.status),
          max_participants: tourData.max_teams || 0,
          team_size: tourData.team_size || 5,
          description: tourData.description || 'Brak opisu.',
          rules: tourData.rules || 'Zasady dołączania do turnieju uzupełnione zostaną przez administrację.'
        })

        const teamsData = await api.get(`/ggwp/teams?tournament_id=${tournamentId}`)
        if (Array.isArray(teamsData)) {
          const mappedTeams = teamsData.map(t => ({
            id: t.id,
            team_name: t.team_name,
            tag: t.tag,
            leader_id: t.leader_id,
            avatar_url: t.avatar_url,
            member_count: t.members_count ?? 0,
          }))
          setTeams(mappedTeams)

          if (user) {
            // Find my team — first by leader, then by membership via /teams/mine
            let myT = mappedTeams.find(t => t.leader_id === user.id)
            let leader = !!myT

            if (!myT) {
              try {
                const myTeams = await api.get('/ggwp/teams/mine')
                if (Array.isArray(myTeams)) {
                  myT = mappedTeams.find(t => myTeams.some(mt => mt.id === t.id))
                }
              } catch {
                // ignore
              }
            }

            if (myT) {
              setMyTeam(myT)
              setIsLeader(leader)

              if (leader) {
                // Pending requests = team_members with status='pending' for my team
                try {
                  const teamDetail = await api.get(`/ggwp/teams/${myT.id}`)
                  const pending = (teamDetail.members || []).filter(m => m.status === 'pending')
                  setPendingRequests(pending.map(r => ({
                    id: r.id,
                    user_id: r.user_id,
                    user_name: r.nickname || `Gracz (${r.user_id.split('-')[0]}...)`,
                    status: r.status,
                  })))
                } catch {
                  // ignore
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
      tag: newTeamData.tag,
      leader_id: newTeamData.leader_id,
      member_count: 1,
      avatar_url: newTeamData.avatar_url,
    }
    setTeams([...teams, completeTeamInfo])
    setMyTeam(completeTeamInfo)
    setIsLeader(true)
    setShowCreateTeam(false)
  }

  const handleJoinTeam = (teamId) => {
    requireAuth(async () => {
      try {
        await api.post('/ggwp/team-members', { team_id: teamId, user_id: user.id })
        alert('Wysłano prośbę do lidera drużyny! Oczekuj na akceptację.')
      } catch {
        alert('Błąd podczas wysyłania prośby. Możliwe że jesteś już zaproszony lub należysz do drużyny.')
      }
    })
  }

  const handleLeaderAction = async (memberId, action) => {
    try {
      if (action === 'rejected') {
        await api.patch(`/ggwp/team-members/${memberId}/reject`)
      } else {
        await api.patch(`/ggwp/team-members/${memberId}/accept`)
      }
      setPendingRequests(prev => prev.filter(req => req.id !== memberId))
      alert(action === 'accepted' ? 'Użytkownik został dodany do drużyny!' : 'Odrzuciłeś prośbę użytkownika.')
    } catch {
      alert('Wystąpił błąd podczas zmiany statusu.')
    }
  }

  if (loading) return <div className="gh-page"><div className="gh-main">Ładowanie...</div></div>

  return (
    <div className="gh-page">
      <Navbar onNavigate={onNavigate} currentView="project" user={user} onAuthChange={onAuthChange} />

      {showPageAuthGate && (
        <LoginModal
          initialMode="register"
          onClose={() => onNavigate('project')}
          onSuccess={(loggedUser) => {
            onAuthChange(loggedUser)
            setShowPageAuthGate(false)
          }}
        />
      )}

      {AuthModal}

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
          <div className="td-main-content">

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
                  const limit = tournament?.team_size || 5
                  const isFull = t.member_count >= limit

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
