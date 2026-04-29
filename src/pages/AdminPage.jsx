import { useState, useEffect } from 'react'
import api from '../lib/api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './AdminPage.css'

const TOURNAMENT_STATUSES = ['draft', 'open', 'closed', 'finished', 'cancelled']

const STATUS_MAP = {
  draft: 'Szkic',
  open: 'Otwarty',
  closed: 'Zamknięty',
  finished: 'Zakończony',
  cancelled: 'Anulowany',
}

const getEffectiveStatus = (t) => {
  if (t.status === 'open' && t.start_date && new Date(t.start_date) <= new Date()) {
    return 'ongoing'
  }
  return t.status
}

const DEFAULT_BAN_MINUTES = 60 * 24 * 7 // 1 week

// ════════════════════════════════════════════
// Tournament Center Component (Drill Down)
// ════════════════════════════════════════════
function TournamentCenter({ tournament, teams, members, users, onBack, onRefresh }) {
  const tournamentTeams = teams.filter(t => t.tournament_id === tournament.id)

  const getUserData = (userId) => {
    const u = users.find(x => x.id === userId)
    const nick = u?.nickname || u?.email?.split('@')[0] || 'Unknown'
    const avatar = u?.avatar_url
    const isBanned = !!u?.banned_until && new Date(u.banned_until) > new Date()
    return { nick, avatar, isBanned }
  }

  const handleKickMember = async (memberId) => {
    if (!confirm('Czy na pewno chcesz wyrzucić tego gracza z drużyny?')) return
    try {
      await api.delete(`/ggwp/admin/kick/${memberId}`)
      onRefresh()
    } catch {
      alert('Błąd przy wyrzucaniu gracza.')
    }
  }

  const handleKickTeam = async (teamId) => {
    if (!confirm('Czy na pewno chcesz usunąć całą drużynę z turnieju?')) return
    try {
      await api.delete(`/ggwp/teams/${teamId}`)
      onRefresh()
    } catch {
      alert('Błąd przy usuwaniu drużyny.')
    }
  }

  const handleChangeLeader = async (teamId, newLeaderId) => {
    try {
      await api.patch(`/ggwp/teams/${teamId}`, { leader_id: newLeaderId })
      onRefresh()
    } catch {
      alert('Błąd przy zmianie lidera.')
    }
  }

  return (
    <div className="admin-panel" style={{ marginTop: '1rem' }}>
      <div className="tournament-center-header">
        <div>
          <button className="tournament-center-back" onClick={onBack}>← Powrót do panelu</button>
          <h2 className="gh-title" style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>{tournament.name}</h2>
          <p style={{ color: 'var(--gh-cyan)', fontSize: '0.8rem' }}>Zarządzanie drużynami i uczestnikami</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className={`admin-badge admin-badge--${getEffectiveStatus(tournament)}`}>
            {STATUS_MAP[getEffectiveStatus(tournament)] || tournament.status}
          </span>
        </div>
      </div>

      <div className="admin-cards">
        {tournamentTeams.map(team => {
          const teamMembers = members.filter(m => m.team_id === team.id)
          return (
            <div key={team.id} className="admin-card">
              <div className="admin-card__header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {team.avatar_url ? (
                    <img src={team.avatar_url} alt="" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                  ) : <div style={{ width: '40px', height: '40px', background: 'var(--gh-border)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎮</div>}
                  <div>
                    <h4 className="admin-card__title">[{team.tag}] {team.team_name}</h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--gh-muted)' }}>Lider: {getUserData(team.leader_id).nick}</span>
                  </div>
                </div>
                <button className="admin-btn admin-btn--danger admin-btn--mini" onClick={() => handleKickTeam(team.id)}>Usuń Team</button>
              </div>

              <div className="admin-members" style={{ marginTop: '1rem' }}>
                {teamMembers.map(m => {
                  const userData = getUserData(m.user_id)
                  const isLeader = team.leader_id === m.user_id
                  return (
                    <div key={m.id} className="admin-team-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: userData.isBanned ? '#f87171' : 'inherit' }}>
                          {userData.nick} {isLeader && '👑'}
                        </span>
                      </div>
                      <div className="admin-member-actions">
                        {!isLeader && <button className="admin-btn admin-btn--mini" onClick={() => handleChangeLeader(team.id, m.user_id)}>👑</button>}
                        <button className="admin-btn admin-btn--mini admin-btn--danger" onClick={() => handleKickMember(m.id)}>👢</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════
// Main Admin Page
// ════════════════════════════════════════════
export default function AdminPage({ onNavigate, user, onAuthChange }) {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [users, setUsers] = useState([])
  const [tournaments, setTournaments] = useState([])
  const [teams, setTeams] = useState([])
  const [members, setMembers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTournamentId, setSelectedTournamentId] = useState(null)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTournamentId, setEditingTournamentId] = useState(null)
  const [newTournament, setNewTournament] = useState({
    name: '', game: 'League of Legends', status: 'draft',
    max_teams: 16, team_size: 5, prize_pool: '', description: '', rules: '', start_date: '',
  })
  const [resetPasswordResult, setResetPasswordResult] = useState(null)

  const isAdmin = !!user?.is_admin

  const loadData = async () => {
    setLoading(true)
    try {
      const [usersData, tData, teamData, memberData] = await Promise.all([
        api.get('/ggwp/admin/users').catch(() => []),
        api.get('/ggwp/tournaments').catch(() => []),
        api.get('/ggwp/teams').catch(() => []),
        api.get('/ggwp/admin/team-members').catch(() => []),
      ])
      setUsers(Array.isArray(usersData) ? usersData : [])
      setTournaments(Array.isArray(tData) ? tData : [])
      setTeams(Array.isArray(teamData) ? teamData : [])
      setMembers(Array.isArray(memberData) ? memberData : [])
    } catch (err) {
      console.error('Admin load error:', err)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (isAdmin) loadData()
  }, [isAdmin])

  const handleSaveTournament = async (e) => {
    e.preventDefault()
    if (!newTournament.name.trim()) return alert('Podaj nazwę turnieju')

    const payload = {
      ...newTournament,
      start_date: newTournament.start_date ? new Date(newTournament.start_date).toISOString() : null,
      prize_pool: newTournament.prize_pool || null,
      description: newTournament.description || null,
      rules: newTournament.rules || null,
    }

    try {
      if (editingTournamentId) {
        await api.patch(`/ggwp/tournaments/${editingTournamentId}`, payload)
        setEditingTournamentId(null)
      } else {
        await api.post('/ggwp/tournaments', payload)
      }
      setShowCreateForm(false)
      loadData()
    } catch {
      alert('Błąd zapisu turnieju.')
    }
  }

  const handleEditTournament = (t) => {
    setEditingTournamentId(t.id)
    setNewTournament({
      name: t.name || '',
      game: t.game || 'League of Legends',
      status: t.status || 'draft',
      max_teams: t.max_teams || 16,
      team_size: t.team_size || 5,
      prize_pool: t.prize_pool || '',
      description: t.description || '',
      rules: t.rules || '',
      start_date: t.start_date ? new Date(t.start_date).toISOString().slice(0, 16) : '',
    })
    setShowCreateForm(true)
  }

  const handleBanUser = async (userId, nick) => {
    if (!confirm(`ZBANOWAĆ użytkownika ${nick} na 7 dni?`)) return
    try {
      await api.post('/ggwp/admin/ban', { user_id: userId, duration_minutes: DEFAULT_BAN_MINUTES })
      loadData()
    } catch {
      alert('Błąd banowania.')
    }
  }

  const handleResetPassword = async (userId, nick) => {
    if (!confirm(`Wygenerować nowe tymczasowe hasło dla użytkownika ${nick}? Wszystkie aktywne sesje zostaną unieważnione.`)) return
    try {
      const result = await api.post(`/ggwp/admin/users/${userId}/reset-password`)
      setResetPasswordResult({ ...result, nick })
      loadData()
    } catch {
      alert('Błąd przy resetowaniu hasła.')
    }
  }

  const handleDeleteUser = async (userId, nick) => {
    if (!confirm(`USUNĄĆ całkowicie użytkownika ${nick}?`)) return
    try {
      await api.delete(`/ggwp/admin/users/${userId}`)
      loadData()
    } catch {
      alert('Błąd usuwania.')
    }
  }

  if (!user || !isAdmin) {
    return (
      <div className="gh-page">
        <Navbar onNavigate={onNavigate} currentView="admin" user={user} onAuthChange={onAuthChange} />
        <main className="gh-main" style={{ marginTop: '73px', textAlign: 'center', padding: '10rem 1rem' }}>
          <h1 className="gh-title" data-text="Brak dostępu">Brak dostępu</h1>
        </main>
        <Footer />
      </div>
    )
  }

  // --- Filtering Logic ---
  const query = searchQuery.toLowerCase().trim()
  const searchResults = {
    users: query ? users.filter(u => (u.nickname || u.email || '').toLowerCase().includes(query)) : [],
    teams: query ? teams.filter(t => (t.team_name || '').toLowerCase().includes(query) || (t.tag || '').toLowerCase().includes(query)) : [],
    tournaments: query ? tournaments.filter(t => (t.name || '').toLowerCase().includes(query)) : [],
  }
  const isSearching = !!query

  return (
    <div className="gh-page">
      <Navbar onNavigate={onNavigate} currentView="admin" user={user} onAuthChange={onAuthChange} />

      <main className="gh-main" style={{ marginTop: '73px' }}>
        <h1 className="gh-title" data-text="ADMIN PANEL" style={{ marginBottom: '2rem' }}>ADMIN PANEL</h1>

        <div className="admin-search">
          <span className="admin-search-icon">🔍</span>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Szukaj wszędzie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {isSearching ? (
          <div className="search-results admin-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 className="gh-title" style={{ fontSize: '1.2rem' }}>Wyniki wyszukiwania</h3>
              <button className="admin-btn" onClick={() => setSearchQuery('')}>Wróć do paneli</button>
            </div>

            {searchResults.users.length > 0 && (
              <div className="search-section">
                <h4 className="search-section-title">👤 Gracze ({searchResults.users.length})</h4>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <tbody>
                      {searchResults.users.map(u => (
                        <tr key={u.id}>
                          <td>{u.nickname || u.email}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="admin-btn admin-btn--danger" onClick={() => handleBanUser(u.id, u.email)}>BAN</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {searchResults.tournaments.length > 0 && (
              <div className="search-section">
                <h4 className="search-section-title">🏆 Turnieje ({searchResults.tournaments.length})</h4>
                <div className="admin-cards">
                  {searchResults.tournaments.map(t => (
                    <div key={t.id} className="admin-card" onClick={() => { setSelectedTournamentId(t.id); setSearchQuery('') }} style={{ cursor: 'pointer' }}>
                      {t.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchResults.users.length === 0 && searchResults.tournaments.length === 0 && searchResults.teams.length === 0 && (
              <div className="admin-empty">Brak wyników dla "{searchQuery}"</div>
            )}
          </div>
        ) : selectedTournamentId ? (
          <TournamentCenter
            tournament={tournaments.find(t => t.id === selectedTournamentId)}
            teams={teams}
            members={members}
            users={users}
            onBack={() => setSelectedTournamentId(null)}
            onRefresh={loadData}
          />
        ) : (
          <>
            <div className="admin-tabs">
              <button className={`admin-tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                📊 Dashboard
              </button>
              <button className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                👥 Użytkownicy <span className="admin-tab__badge">{users.length}</span>
              </button>
              <button className={`admin-tab ${activeTab === 'tournaments' ? 'active' : ''}`} onClick={() => setActiveTab('tournaments')}>
                🏆 Turnieje <span className="admin-tab__badge">{tournaments.length}</span>
              </button>
              <button className={`admin-tab ${activeTab === 'teams' ? 'active' : ''}`} onClick={() => setActiveTab('teams')}>
                🎮 Drużyny <span className="admin-tab__badge">{teams.length}</span>
              </button>
            </div>

            <div className="admin-content">
              {loading ? (
                <div className="admin-loading">⏳ Synchronizacja z bazą danych...</div>
              ) : (
                <>
                  {activeTab === 'dashboard' && (
                    <div className="admin-tab-content">
                      <div className="admin-stats">
                        <div className="admin-stat">
                          <span className="admin-stat__value">{users.length}</span>
                          <span className="admin-stat__label">Użytkowników</span>
                        </div>
                        <div className="admin-stat">
                          <span className="admin-stat__value">{tournaments.length}</span>
                          <span className="admin-stat__label">Turniejów</span>
                        </div>
                        <div className="admin-stat">
                          <span className="admin-stat__value">{teams.length}</span>
                          <span className="admin-stat__label">Drużyn</span>
                        </div>
                        <div className="admin-stat">
                          <span className="admin-stat__value" style={{ color: 'var(--gh-cyan)' }}>
                            {tournaments.filter(t => getEffectiveStatus(t) === 'open' || getEffectiveStatus(t) === 'ongoing').length}
                          </span>
                          <span className="admin-stat__label">Aktywne turnieje</span>
                        </div>
                      </div>

                      <div className="admin-panel">
                        <h3 className="admin-panel__title">📋 Ostatni Użytkownicy</h3>
                        <div className="admin-table-wrap" style={{ marginTop: '1rem' }}>
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Użytkownik</th>
                                <th>Email</th>
                                <th>Dołączył</th>
                              </tr>
                            </thead>
                            <tbody>
                              {users.slice(0, 5).map(u => (
                                <tr key={u.id}>
                                  <td>{u.nickname || 'Gracz'}</td>
                                  <td>{u.email}</td>
                                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'users' && (
                    <div className="admin-panel">
                      <h3 className="admin-panel__title">👥 Zarządzanie Użytkownikami</h3>
                      <div className="admin-table-wrap" style={{ marginTop: '1rem' }}>
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Nick</th>
                              <th>Rola</th>
                              <th>Status</th>
                              <th>Akcje</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.map(u => {
                              const isBanned = !!u.banned_until && new Date(u.banned_until) > new Date()
                              const isDeleted = !!u.deleted_at
                              const isSelf = u.id === user.id
                              return (
                                <tr key={u.id}>
                                  <td>{u.nickname || u.email}</td>
                                  <td><span className={`admin-badge ${u.is_admin ? 'admin-badge--admin' : ''}`}>{u.is_admin ? 'admin' : 'user'}</span></td>
                                  <td>
                                    <span className={`admin-badge ${isDeleted ? 'admin-badge--banned' : isBanned ? 'admin-badge--banned' : 'admin-badge--open'}`}>
                                      {isDeleted ? 'Usunięty' : isBanned ? 'Banned' : 'Aktywny'}
                                    </span>
                                  </td>
                                  <td className="admin-actions">
                                    {!isSelf && !isDeleted && (
                                      <>
                                        <button className="admin-btn" onClick={() => handleResetPassword(u.id, u.nickname || u.email)}>🔑 RESET HASŁA</button>
                                        <button className="admin-btn admin-btn--danger" onClick={() => handleBanUser(u.id, u.email)}>BAN</button>
                                        <button className="admin-btn admin-btn--danger" onClick={() => handleDeleteUser(u.id, u.email)}>USUŃ</button>
                                      </>
                                    )}
                                    {isSelf && <span style={{ fontSize: '0.7rem', color: 'var(--gh-muted)' }}>— to Ty</span>}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeTab === 'tournaments' && (
                    <>
                      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                        <button className="admin-btn admin-btn--primary admin-btn--lg" onClick={() => {
                          setShowCreateForm(!showCreateForm)
                          if (!showCreateForm) {
                            setEditingTournamentId(null)
                            setNewTournament({ name: '', game: 'League of Legends', status: 'draft', max_teams: 16, team_size: 5, prize_pool: '', description: '', rules: '', start_date: '' })
                          }
                        }}>
                          {showCreateForm ? '✕ Anuluj' : '+ Nowy Turniej'}
                        </button>
                      </div>

                      {showCreateForm && (
                        <div className="admin-panel">
                          <h3 className="admin-panel__title">{editingTournamentId ? '📝 Edytuj Turniej' : '🏆 Nowy Turniej'}</h3>
                          <form onSubmit={handleSaveTournament} className="admin-form" style={{ marginTop: '1rem' }}>
                            <div className="admin-form__group">
                              <label className="admin-form__label">Nazwa</label>
                              <input type="text" className="admin-form__input" value={newTournament.name} onChange={e => setNewTournament({ ...newTournament, name: e.target.value })} placeholder="np. GG WP Cup #2" />
                            </div>
                            <div className="admin-form__group">
                              <label className="admin-form__label">Gra</label>
                              <select className="admin-form__select" value={newTournament.game} onChange={e => setNewTournament({ ...newTournament, game: e.target.value })}>
                                <option>League of Legends</option>
                                <option>CS2</option>
                                <option>Valorant</option>
                                <option>Chess</option>
                                <option>FIFA / EA Sports FC</option>
                              </select>
                            </div>
                            <div className="admin-form__group">
                              <label className="admin-form__label">Status</label>
                              <select className="admin-form__select" value={newTournament.status} onChange={e => setNewTournament({ ...newTournament, status: e.target.value })}>
                                {TOURNAMENT_STATUSES.map(s => <option key={s} value={s}>{STATUS_MAP[s]}</option>)}
                              </select>
                            </div>
                            <div className="admin-form__group">
                              <label className="admin-form__label">Data Startu</label>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                  type="date"
                                  className="admin-form__input"
                                  value={newTournament.start_date ? newTournament.start_date.split('T')[0] : ''}
                                  onChange={e => {
                                    const time = newTournament.start_date ? (newTournament.start_date.split('T')[1] || '00:00') : '00:00'
                                    setNewTournament({ ...newTournament, start_date: `${e.target.value}T${time}` })
                                  }}
                                />
                                <input
                                  type="text"
                                  className="admin-form__input"
                                  placeholder="HH:MM"
                                  maxLength={5}
                                  pattern="[0-2][0-9]:[0-5][0-9]"
                                  value={newTournament.start_date ? (newTournament.start_date.split('T')[1] || '') : ''}
                                  onChange={e => {
                                    let val = e.target.value.replace(/[^0-9:]/g, '')
                                    if (val.length === 2 && !val.includes(':')) val = val + ':'
                                    const [hh, mm] = val.split(':')
                                    if (hh !== undefined && hh.length === 2 && parseInt(hh) > 23) return
                                    if (mm !== undefined && mm.length === 2 && parseInt(mm) > 59) return
                                    const date = newTournament.start_date ? (newTournament.start_date.split('T')[0] || '') : ''
                                    setNewTournament({ ...newTournament, start_date: `${date}T${val}` })
                                  }}
                                  style={{ maxWidth: '80px' }}
                                />
                              </div>
                            </div>
                            <div className="admin-form__group">
                              <label className="admin-form__label">Max Drużyn</label>
                              <input type="number" className="admin-form__input" value={newTournament.max_teams} onChange={e => setNewTournament({ ...newTournament, max_teams: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div className="admin-form__group">
                              <label className="admin-form__label">Rozmiar Drużyny</label>
                              <input type="number" className="admin-form__input" value={newTournament.team_size} onChange={e => setNewTournament({ ...newTournament, team_size: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div className="admin-form__group">
                              <label className="admin-form__label">Pula Nagród</label>
                              <input type="text" className="admin-form__input" value={newTournament.prize_pool} onChange={e => setNewTournament({ ...newTournament, prize_pool: e.target.value })} placeholder="np. 500 PLN" />
                            </div>
                            <div className="admin-form__group admin-form--full">
                              <label className="admin-form__label">Krótki Opis (Hero)</label>
                              <textarea className="admin-form__input" style={{ height: '80px' }} value={newTournament.description} onChange={e => setNewTournament({ ...newTournament, description: e.target.value })} placeholder="Kilka słów zachęty widocznych na górze strony..." />
                            </div>
                            <div className="admin-form__group admin-form--full">
                              <label className="admin-form__label">Regulamin / Zasady</label>
                              <textarea className="admin-form__input" style={{ height: '160px' }} value={newTournament.rules} onChange={e => setNewTournament({ ...newTournament, rules: e.target.value })} placeholder="Pełna treść regulaminu..." />
                            </div>
                            <button type="submit" className="admin-btn admin-btn--primary admin-btn--lg admin-form--full">
                              {editingTournamentId ? 'Zapisz zmiany treści' : 'Utwórz Wydarzenie'}
                            </button>
                          </form>
                        </div>
                      )}

                      <div className="admin-cards">
                        {tournaments.map(t => (
                          <div key={t.id} className="admin-card">
                            <div className="admin-card__header">
                              <h4 className="admin-card__title">{t.name}</h4>
                              <span className={`admin-badge admin-badge--${getEffectiveStatus(t)}`}>
                                {STATUS_MAP[getEffectiveStatus(t)] || t.status}
                              </span>
                            </div>
                            <div className="admin-card__meta">
                              <span>🎮 {t.game}</span>
                              <span>👥 {teams.filter(team => team.tournament_id === t.id).length} / {t.max_teams} drużyn</span>
                            </div>
                            <div className="admin-card__footer">
                              <button className="admin-btn admin-btn--primary" style={{ flex: 1 }} onClick={() => setSelectedTournamentId(t.id)}>
                                Zarządzaj
                              </button>
                              <button className="admin-btn" style={{ flex: 1 }} onClick={() => handleEditTournament(t)}>
                                Edytuj
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {activeTab === 'teams' && (
                    <div className="admin-panel">
                      <h3 className="admin-panel__title">🎮 Wszystkie Drużyny</h3>
                      <div className="admin-cards" style={{ marginTop: '1rem' }}>
                        {teams.map(t => (
                          <div key={t.id} className="admin-card">
                            <h4 className="admin-card__title">[{t.tag}] {t.team_name}</h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--gh-muted)' }}>Turniej_ID: {t.tournament_id || '—'}</p>
                            {t.tournament_id && (
                              <button className="admin-btn admin-btn--mini" style={{ marginTop: '0.5rem' }} onClick={() => setSelectedTournamentId(t.tournament_id)}>Przejdź do turnieju</button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </main>

      {resetPasswordResult && (
        <div className="modal-overlay" onClick={() => setResetPasswordResult(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--gh-bg-secondary)', border: '1px solid var(--gh-border)', borderRadius: '8px', padding: '2rem', maxWidth: '480px', width: '90%' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--gh-cyan)' }}>🔑 Tymczasowe hasło wygenerowane</h3>
            <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--gh-text-c)' }}>
              Hasło dla <strong>{resetPasswordResult.nick}</strong> ({resetPasswordResult.email}):
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input
                type="text"
                value={resetPasswordResult.temporary_password}
                readOnly
                style={{ flex: 1, fontFamily: 'monospace', fontSize: '1.1rem', padding: '0.75rem', background: 'var(--gh-bg)', border: '1px solid var(--gh-border)', color: 'var(--gh-cyan)', borderRadius: '4px', letterSpacing: '0.05em' }}
                onFocus={e => e.target.select()}
              />
              <button
                className="admin-btn admin-btn--primary"
                onClick={() => navigator.clipboard.writeText(resetPasswordResult.temporary_password)}
              >
                📋 Kopiuj
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--gh-muted)', marginBottom: '1.5rem' }}>
              ⚠️ Przekaż hasło użytkownikowi out-of-band (np. Discord, SMS). Po zalogowaniu powinien je zmienić w ustawieniach konta. Wszystkie aktywne sesje tego użytkownika zostały unieważnione.
            </p>
            <button className="admin-btn admin-btn--primary admin-btn--lg" style={{ width: '100%' }} onClick={() => setResetPasswordResult(null)}>
              Zamknij
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
