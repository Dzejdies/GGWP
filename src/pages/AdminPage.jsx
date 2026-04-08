import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './AdminPage.css'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const TABS = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'users', icon: '👥', label: 'Użytkownicy' },
  { id: 'tournaments', icon: '🏆', label: 'Turnieje' },
  { id: 'teams', icon: '🎮', label: 'Drużyny' },
]

const TOURNAMENT_STATUSES = ['draft', 'open', 'ongoing', 'finished', 'cancelled']
const TEAM_ROLES = ['captain', 'player', 'substitute']

// ════════════════════════════════════════════
// Helper: call admin Edge Function
// ════════════════════════════════════════════
async function adminFetch(action, body = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-manage-users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ action, ...body }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error')
  return data
}

// ════════════════════════════════════════════
// Dashboard Tab
// ════════════════════════════════════════════
function DashboardTab({ users, tournaments, teams }) {
  return (
    <>
      <div className="admin-stats">
        <div className="admin-stat">
          <span className="admin-stat__icon">👥</span>
          <span className="admin-stat__value">{users.length}</span>
          <span className="admin-stat__label">Użytkowników</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__icon">🏆</span>
          <span className="admin-stat__value">{tournaments.length}</span>
          <span className="admin-stat__label">Turniejów</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__icon">🎮</span>
          <span className="admin-stat__value">{teams.length}</span>
          <span className="admin-stat__label">Drużyn</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__icon">🟢</span>
          <span className="admin-stat__value">
            {tournaments.filter(t => t.status === 'open' || t.status === 'ongoing').length}
          </span>
          <span className="admin-stat__label">Aktywne turnieje</span>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel__header">
          <h3 className="admin-panel__title">📋 Ostatni użytkownicy</h3>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Użytkownik</th>
                <th>Email</th>
                <th>Dołączył</th>
              </tr>
            </thead>
            <tbody>
              {users.slice(0, 5).map(u => {
                const nick = u.user_metadata?.nickname || u.user_metadata?.display_name || u.email?.split('@')[0]
                const initials = (nick || '?').slice(0, 2).toUpperCase()
                const avatarUrl = u.user_metadata?.avatar_url
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="admin-table__user">
                        <div className="admin-table__avatar">
                          {avatarUrl ? <img src={avatarUrl} alt="" /> : initials}
                        </div>
                        {nick}
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>{new Date(u.created_at).toLocaleDateString('pl-PL')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

// ════════════════════════════════════════════
// Users Tab
// ════════════════════════════════════════════
function UsersTab({ users, currentUserId, onRefresh }) {
  const [actionLoading, setActionLoading] = useState(null)
  const [message, setMessage] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)

  const executeAction = async (action, userId, userName) => {
    setActionLoading(userId)
    setMessage(null)
    try {
      await adminFetch(action, { userId })
      setMessage({
        type: 'success',
        text: action === 'ban' ? `🚫 ${userName} został zbanowany`
            : action === 'unban' ? `✅ ${userName} został odbanowany`
            : `🗑️ ${userName} został usunięty`
      })
      onRefresh()
    } catch (err) {
      setMessage({ type: 'error', text: `❌ Błąd: ${err.message}` })
    }
    setActionLoading(null)
    setConfirmAction(null)
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel__header">
        <h3 className="admin-panel__title">👥 Lista użytkowników</h3>
        <button className="admin-btn admin-btn--primary" onClick={onRefresh}>🔄 Odśwież</button>
      </div>

      {message && (
        <div className={`admin-message admin-message--${message.type}`}>{message.text}</div>
      )}

      {/* Confirmation modal */}
      {confirmAction && (
        <div className="modal-overlay" onClick={() => setConfirmAction(null)}>
          <div className="modal admin-confirm" onClick={e => e.stopPropagation()}>
            <button className="modal__close" onClick={() => setConfirmAction(null)}>✕</button>
            <h2 className="modal__title" style={{ color: '#f87171' }}>
              {confirmAction.action === 'delete' ? '⚠️ Usuwanie konta' : '🚫 Banowanie'}
            </h2>
            <p className="admin-confirm__text">
              {confirmAction.action === 'delete'
                ? `Czy na pewno chcesz usunąć konto "${confirmAction.name}"? Ta operacja jest nieodwracalna.`
                : `Czy na pewno chcesz zbanować "${confirmAction.name}"?`
              }
            </p>
            <div className="admin-confirm__actions">
              <button className="admin-btn admin-btn--lg" onClick={() => setConfirmAction(null)}>
                Anuluj
              </button>
              <button
                className="admin-btn admin-btn--lg admin-btn--danger"
                disabled={actionLoading === confirmAction.userId}
                onClick={() => executeAction(confirmAction.action, confirmAction.userId, confirmAction.name)}
              >
                {actionLoading === confirmAction.userId ? 'Ładowanie…' : 'Potwierdź'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Użytkownik</th>
              <th>Email</th>
              <th>Rola</th>
              <th>Status</th>
              <th>Dołączył</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const nick = u.user_metadata?.nickname || u.user_metadata?.display_name || u.email?.split('@')[0]
              const initials = (nick || '?').slice(0, 2).toUpperCase()
              const avatarUrl = u.user_metadata?.avatar_url
              const isAdmin = u.app_metadata?.role === 'admin'
              const isBanned = !!u.banned_until && new Date(u.banned_until) > new Date()
              const isSelf = u.id === currentUserId

              return (
                <tr key={u.id}>
                  <td>
                    <div className="admin-table__user">
                      <div className="admin-table__avatar">
                        {avatarUrl ? <img src={avatarUrl} alt="" /> : initials}
                      </div>
                      {nick}
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    {isAdmin
                      ? <span className="admin-badge admin-badge--admin">Admin</span>
                      : <span className="admin-badge admin-badge--draft">User</span>
                    }
                  </td>
                  <td>
                    {isBanned
                      ? <span className="admin-badge admin-badge--banned">Zbanowany</span>
                      : <span className="admin-badge admin-badge--active">Aktywny</span>
                    }
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString('pl-PL')}</td>
                  <td>
                    {isSelf ? (
                      <span style={{ fontSize: '0.7rem', color: 'var(--gh-muted)' }}>— to Ty</span>
                    ) : (
                      <div className="admin-actions">
                        {isBanned ? (
                          <button
                            className="admin-btn admin-btn--success"
                            disabled={actionLoading === u.id}
                            onClick={() => executeAction('unban', u.id, nick)}
                          >
                            Odbanuj
                          </button>
                        ) : (
                          <button
                            className="admin-btn admin-btn--danger"
                            disabled={actionLoading === u.id}
                            onClick={() => setConfirmAction({ action: 'ban', userId: u.id, name: nick })}
                          >
                            Ban
                          </button>
                        )}
                        <button
                          className="admin-btn admin-btn--danger"
                          disabled={actionLoading === u.id}
                          onClick={() => setConfirmAction({ action: 'delete', userId: u.id, name: nick })}
                        >
                          Usuń
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════
// Tournaments Tab
// ════════════════════════════════════════════
function TournamentsTab({ tournaments, onRefresh }) {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ name: '', game: '', description: '', max_teams: '', start_date: '', end_date: '', status: 'draft', prize_pool: '' })
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  const resetForm = () => {
    setForm({ name: '', game: '', description: '', max_teams: '', start_date: '', end_date: '', status: 'draft', prize_pool: '' })
    setEditId(null)
    setShowForm(false)
  }

  const startEdit = (t) => {
    setForm({
      name: t.name,
      game: t.game,
      description: t.description || '',
      max_teams: t.max_teams || '',
      start_date: t.start_date ? t.start_date.slice(0, 16) : '',
      end_date: t.end_date ? t.end_date.slice(0, 16) : '',
      status: t.status,
      prize_pool: t.prize_pool || '',
    })
    setEditId(t.id)
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.game.trim()) {
      setMessage({ type: 'error', text: 'Nazwa i gra są wymagane' })
      return
    }
    setLoading(true)
    setMessage(null)

    const payload = {
      name: form.name.trim(),
      game: form.game.trim(),
      description: form.description.trim() || null,
      max_teams: form.max_teams ? parseInt(form.max_teams) : null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      status: form.status,
      prize_pool: form.prize_pool.trim() || null,
    }

    let error
    if (editId) {
      ({ error } = await supabase.from('tournaments').update(payload).eq('id', editId))
    } else {
      ({ error } = await supabase.from('tournaments').insert(payload))
    }

    if (error) {
      setMessage({ type: 'error', text: `Błąd: ${error.message}` })
    } else {
      setMessage({ type: 'success', text: editId ? '✅ Turniej zaktualizowany' : '✅ Turniej utworzony' })
      resetForm()
      onRefresh()
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Na pewno usunąć ten turniej?')) return
    const { error } = await supabase.from('tournaments').delete().eq('id', id)
    if (error) {
      setMessage({ type: 'error', text: `Błąd: ${error.message}` })
    } else {
      setMessage({ type: 'success', text: '🗑️ Turniej usunięty' })
      onRefresh()
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    const { error } = await supabase.from('tournaments').update({ status: newStatus }).eq('id', id)
    if (!error) onRefresh()
  }

  return (
    <>
      <div className="admin-panel">
        <div className="admin-panel__header">
          <h3 className="admin-panel__title">🏆 Turnieje</h3>
          <button className="admin-btn admin-btn--primary admin-btn--lg" onClick={() => { resetForm(); setShowForm(true) }}>
            ➕ Nowy turniej
          </button>
        </div>

        {message && (
          <div className={`admin-message admin-message--${message.type}`}>{message.text}</div>
        )}

        {showForm && (
          <div className="admin-panel" style={{ marginBottom: '1.5rem' }}>
            <h4 className="admin-panel__title" style={{ marginBottom: '1rem' }}>
              {editId ? '✏️ Edycja turnieju' : '🆕 Nowy turniej'}
            </h4>
            <div className="admin-form">
              <div className="admin-form__group">
                <label className="admin-form__label">Nazwa *</label>
                <input className="admin-form__input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="np. GG WP Cup #1" />
              </div>
              <div className="admin-form__group">
                <label className="admin-form__label">Gra *</label>
                <input className="admin-form__input" value={form.game} onChange={e => setForm(f => ({ ...f, game: e.target.value }))} placeholder="np. CS2, Valorant, LoL" />
              </div>
              <div className="admin-form__group">
                <label className="admin-form__label">Max drużyn</label>
                <input className="admin-form__input" type="number" value={form.max_teams} onChange={e => setForm(f => ({ ...f, max_teams: e.target.value }))} placeholder="np. 16" />
              </div>
              <div className="admin-form__group">
                <label className="admin-form__label">Pula nagród</label>
                <input className="admin-form__input" value={form.prize_pool} onChange={e => setForm(f => ({ ...f, prize_pool: e.target.value }))} placeholder="np. 5000 zł" />
              </div>
              <div className="admin-form__group">
                <label className="admin-form__label">Data rozpoczęcia</label>
                <input className="admin-form__input" type="datetime-local" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div className="admin-form__group">
                <label className="admin-form__label">Data zakończenia</label>
                <input className="admin-form__input" type="datetime-local" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
              <div className="admin-form__group">
                <label className="admin-form__label">Status</label>
                <select className="admin-form__select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {TOURNAMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="admin-form__group admin-form--full">
                <label className="admin-form__label">Opis</label>
                <textarea className="admin-form__input admin-form__textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Opis turnieju…" rows={3} />
              </div>
              <div className="admin-form__actions">
                <button className="admin-btn admin-btn--primary admin-btn--lg" disabled={loading} onClick={handleSubmit}>
                  {loading ? 'Zapisywanie…' : editId ? '💾 Zapisz zmiany' : '🚀 Utwórz turniej'}
                </button>
                <button className="admin-btn admin-btn--lg" onClick={resetForm}>Anuluj</button>
              </div>
            </div>
          </div>
        )}

        {tournaments.length === 0 ? (
          <div className="admin-empty">
            <span className="admin-empty__icon">🏆</span>
            <p className="admin-empty__text">Brak turniejów. Utwórz pierwszy!</p>
          </div>
        ) : (
          <div className="admin-cards">
            {tournaments.map(t => (
              <div key={t.id} className="admin-card">
                <div className="admin-card__header">
                  <h4 className="admin-card__title">{t.name}</h4>
                  <span className={`admin-badge admin-badge--${t.status}`}>{t.status}</span>
                </div>
                <div className="admin-card__meta">
                  <span>🎮 {t.game}</span>
                  {t.max_teams && <span>👥 Max {t.max_teams} drużyn</span>}
                  {t.prize_pool && <span>💰 {t.prize_pool}</span>}
                  {t.start_date && <span>📅 {new Date(t.start_date).toLocaleDateString('pl-PL')}</span>}
                </div>
                {t.description && <p className="admin-card__desc">{t.description}</p>}
                <div className="admin-card__footer">
                  <button className="admin-btn admin-btn--primary" onClick={() => startEdit(t)}>✏️ Edytuj</button>
                  <select
                    className="admin-form__select"
                    value={t.status}
                    onChange={e => handleStatusChange(t.id, e.target.value)}
                    style={{ padding: '0.3rem 1.8rem 0.3rem 0.5rem', fontSize: '0.7rem' }}
                  >
                    {TOURNAMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button className="admin-btn admin-btn--danger" onClick={() => handleDelete(t.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ════════════════════════════════════════════
// Teams Tab
// ════════════════════════════════════════════
function TeamsTab({ teams, tournaments, users, onRefresh }) {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ name: '', tag: '', tournament_id: '', captain_id: '' })
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  // Members management
  const [memberForm, setMemberForm] = useState({ teamId: null, user_id: '', role: 'player' })
  const [teamMembers, setTeamMembers] = useState({})

  useEffect(() => {
    loadAllMembers()
  }, [teams])

  const loadAllMembers = async () => {
    if (!teams.length) return
    const { data } = await supabase
      .from('team_members')
      .select('*')
      .in('team_id', teams.map(t => t.id))
    if (data) {
      const grouped = {}
      data.forEach(m => {
        if (!grouped[m.team_id]) grouped[m.team_id] = []
        grouped[m.team_id].push(m)
      })
      setTeamMembers(grouped)
    }
  }

  const resetForm = () => {
    setForm({ name: '', tag: '', tournament_id: '', captain_id: '' })
    setEditId(null)
    setShowForm(false)
  }

  const startEdit = (t) => {
    setForm({
      name: t.name,
      tag: t.tag || '',
      tournament_id: t.tournament_id || '',
      captain_id: t.captain_id || '',
    })
    setEditId(t.id)
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) { setMessage({ type: 'error', text: 'Nazwa jest wymagana' }); return }
    setLoading(true)
    setMessage(null)

    const payload = {
      name: form.name.trim(),
      tag: form.tag.trim() || null,
      tournament_id: form.tournament_id || null,
      captain_id: form.captain_id || null,
    }

    let error
    if (editId) {
      ({ error } = await supabase.from('teams').update(payload).eq('id', editId))
    } else {
      ({ error } = await supabase.from('teams').insert(payload))
    }

    if (error) {
      setMessage({ type: 'error', text: `Błąd: ${error.message}` })
    } else {
      setMessage({ type: 'success', text: editId ? '✅ Drużyna zaktualizowana' : '✅ Drużyna utworzona' })
      resetForm()
      onRefresh()
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Na pewno usunąć tę drużynę?')) return
    const { error } = await supabase.from('teams').delete().eq('id', id)
    if (!error) { setMessage({ type: 'success', text: '🗑️ Drużyna usunięta' }); onRefresh() }
  }

  const addMember = async () => {
    if (!memberForm.teamId || !memberForm.user_id) return
    setLoading(true)
    const { error } = await supabase.from('team_members').insert({
      team_id: memberForm.teamId,
      user_id: memberForm.user_id,
      role: memberForm.role,
    })
    if (error) {
      setMessage({ type: 'error', text: `Błąd: ${error.message}` })
    } else {
      setMemberForm(f => ({ ...f, user_id: '', role: 'player' }))
      loadAllMembers()
    }
    setLoading(false)
  }

  const removeMember = async (memberId) => {
    const { error } = await supabase.from('team_members').delete().eq('id', memberId)
    if (!error) loadAllMembers()
  }

  const getUserName = (userId) => {
    const u = users.find(u => u.id === userId)
    return u?.user_metadata?.nickname || u?.user_metadata?.display_name || u?.email?.split('@')[0] || userId.slice(0, 8)
  }

  return (
    <>
      <div className="admin-panel">
        <div className="admin-panel__header">
          <h3 className="admin-panel__title">🎮 Drużyny</h3>
          <button className="admin-btn admin-btn--primary admin-btn--lg" onClick={() => { resetForm(); setShowForm(true) }}>
            ➕ Nowa drużyna
          </button>
        </div>

        {message && (
          <div className={`admin-message admin-message--${message.type}`}>{message.text}</div>
        )}

        {showForm && (
          <div className="admin-panel" style={{ marginBottom: '1.5rem' }}>
            <h4 className="admin-panel__title" style={{ marginBottom: '1rem' }}>
              {editId ? '✏️ Edycja drużyny' : '🆕 Nowa drużyna'}
            </h4>
            <div className="admin-form">
              <div className="admin-form__group">
                <label className="admin-form__label">Nazwa *</label>
                <input className="admin-form__input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="np. Team Rocket" />
              </div>
              <div className="admin-form__group">
                <label className="admin-form__label">Tag (2-5 znaków)</label>
                <input className="admin-form__input" value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} placeholder="np. TR" maxLength={5} />
              </div>
              <div className="admin-form__group">
                <label className="admin-form__label">Turniej</label>
                <select className="admin-form__select" value={form.tournament_id} onChange={e => setForm(f => ({ ...f, tournament_id: e.target.value }))}>
                  <option value="">— Brak —</option>
                  {tournaments.map(t => <option key={t.id} value={t.id}>{t.name} ({t.game})</option>)}
                </select>
              </div>
              <div className="admin-form__group">
                <label className="admin-form__label">Kapitan</label>
                <select className="admin-form__select" value={form.captain_id} onChange={e => setForm(f => ({ ...f, captain_id: e.target.value }))}>
                  <option value="">— Brak —</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.user_metadata?.nickname || u.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-form__actions">
                <button className="admin-btn admin-btn--primary admin-btn--lg" disabled={loading} onClick={handleSubmit}>
                  {loading ? 'Zapisywanie…' : editId ? '💾 Zapisz' : '🚀 Utwórz'}
                </button>
                <button className="admin-btn admin-btn--lg" onClick={resetForm}>Anuluj</button>
              </div>
            </div>
          </div>
        )}

        {teams.length === 0 ? (
          <div className="admin-empty">
            <span className="admin-empty__icon">🎮</span>
            <p className="admin-empty__text">Brak drużyn. Utwórz pierwszą!</p>
          </div>
        ) : (
          <div className="admin-cards">
            {teams.map(t => {
              const tournament = tournaments.find(tr => tr.id === t.tournament_id)
              const members = teamMembers[t.id] || []
              const managingMembers = memberForm.teamId === t.id

              return (
                <div key={t.id} className="admin-card">
                  <div className="admin-card__header">
                    <h4 className="admin-card__title">
                      {t.tag && <span style={{ color: 'var(--gh-cyan)', marginRight: '0.4rem' }}>[{t.tag}]</span>}
                      {t.name}
                    </h4>
                  </div>
                  <div className="admin-card__meta">
                    {tournament && <span>🏆 {tournament.name}</span>}
                    {t.captain_id && <span>👑 {getUserName(t.captain_id)}</span>}
                    <span>👥 {members.length} członków</span>
                  </div>

                  {/* Members list */}
                  {members.length > 0 && (
                    <ul className="admin-members">
                      {members.map(m => (
                        <li key={m.id}>
                          <span>
                            {getUserName(m.user_id)}
                            <span className="admin-members__role" style={{ marginLeft: '0.4rem' }}>{m.role}</span>
                          </span>
                          <button className="admin-btn admin-btn--danger" style={{ fontSize: '0.55rem', padding: '0.2rem 0.4rem' }} onClick={() => removeMember(m.id)}>✕</button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Add member inline */}
                  {managingMembers && (
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      <select
                        className="admin-form__select"
                        value={memberForm.user_id}
                        onChange={e => setMemberForm(f => ({ ...f, user_id: e.target.value }))}
                        style={{ flex: 1, fontSize: '0.75rem', padding: '0.35rem 1.8rem 0.35rem 0.5rem', minWidth: '120px' }}
                      >
                        <option value="">Wybierz gracza…</option>
                        {users.filter(u => !members.some(m => m.user_id === u.id)).map(u => (
                          <option key={u.id} value={u.id}>{u.user_metadata?.nickname || u.email}</option>
                        ))}
                      </select>
                      <select
                        className="admin-form__select"
                        value={memberForm.role}
                        onChange={e => setMemberForm(f => ({ ...f, role: e.target.value }))}
                        style={{ fontSize: '0.75rem', padding: '0.35rem 1.8rem 0.35rem 0.5rem' }}
                      >
                        {TEAM_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <button className="admin-btn admin-btn--success" onClick={addMember} disabled={!memberForm.user_id}>➕</button>
                    </div>
                  )}

                  <div className="admin-card__footer">
                    <button className="admin-btn admin-btn--primary" onClick={() => startEdit(t)}>✏️ Edytuj</button>
                    <button
                      className={`admin-btn ${managingMembers ? 'admin-btn--success' : ''}`}
                      onClick={() => setMemberForm(f => ({ ...f, teamId: managingMembers ? null : t.id, user_id: '', role: 'player' }))}
                    >
                      {managingMembers ? '✔ Gotowe' : '👥 Skład'}
                    </button>
                    <button className="admin-btn admin-btn--danger" onClick={() => handleDelete(t.id)}>🗑️</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

// ════════════════════════════════════════════
// Main Admin Page
// ════════════════════════════════════════════
export default function AdminPage({ onNavigate, user, onAuthChange }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [users, setUsers] = useState([])
  const [tournaments, setTournaments] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  const isAdmin = user?.app_metadata?.role === 'admin'

  const loadData = async () => {
    setLoading(true)
    try {
      // Load users via Edge Function
      const userData = await adminFetch('list')
      setUsers(userData.users || [])

      // Load tournaments
      const { data: tData } = await supabase.from('tournaments').select('*').order('created_at', { ascending: false })
      setTournaments(tData || [])

      // Load teams
      const { data: teamData } = await supabase.from('teams').select('*').order('created_at', { ascending: false })
      setTeams(teamData || [])
    } catch (err) {
      console.error('Admin load error:', err)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (isAdmin) loadData()
  }, [isAdmin])

  // Guard: not admin
  if (!user || !isAdmin) {
    return (
      <div className="gh-page">
        <Navbar onNavigate={onNavigate} currentView="admin" user={user} onAuthChange={onAuthChange} />
        <main className="gh-main" style={{ marginTop: '73px', textAlign: 'center', padding: '4rem 1rem' }}>
          <span style={{ fontSize: '4rem' }}>🛡️</span>
          <h1 className="gh-title" data-text="Brak dostępu">Brak dostępu</h1>
          <p style={{ color: 'var(--gh-muted)', marginTop: '1rem' }}>
            Panel administracyjny jest dostępny tylko dla administratorów.
          </p>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="gh-page">
      <Navbar onNavigate={onNavigate} currentView="admin" user={user} onAuthChange={onAuthChange} />

      <main className="gh-main" style={{ marginTop: '73px' }}>
        <h1 className="gh-title" data-text="Admin Panel" style={{ marginBottom: '2rem' }}>Admin Panel</h1>

        {/* Tabs */}
        <div className="admin-tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`admin-tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {tab.id === 'users' && users.length > 0 && (
                <span className="admin-tab__badge">{users.length}</span>
              )}
              {tab.id === 'tournaments' && tournaments.length > 0 && (
                <span className="admin-tab__badge">{tournaments.length}</span>
              )}
              {tab.id === 'teams' && teams.length > 0 && (
                <span className="admin-tab__badge">{teams.length}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="admin-loading">⏳ Ładowanie danych…</div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardTab users={users} tournaments={tournaments} teams={teams} />
            )}
            {activeTab === 'users' && (
              <UsersTab users={users} currentUserId={user.id} onRefresh={loadData} />
            )}
            {activeTab === 'tournaments' && (
              <TournamentsTab tournaments={tournaments} onRefresh={loadData} />
            )}
            {activeTab === 'teams' && (
              <TeamsTab teams={teams} tournaments={tournaments} users={users} onRefresh={loadData} />
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
