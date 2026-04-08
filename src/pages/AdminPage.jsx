import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './AdminPage.css'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const TOURNAMENT_STATUSES = ['draft', 'open', 'ongoing', 'finished', 'cancelled']

const STATUS_MAP = {
  draft: 'Szkic',
  open: 'Otwarty',
  ongoing: 'Na żywo',
  finished: 'Zakończony',
  cancelled: 'Anulowany'
};

const getEffectiveStatus = (t) => {
  if (t.status === 'open' && t.start_date && new Date(t.start_date) <= new Date()) {
    return 'ongoing';
  }
  return t.status;
};

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
// Tournament Center Component (Drill Down)
// ════════════════════════════════════════════
function TournamentCenter({ tournament, teams, members, users, onBack, onRefresh }) {
  const tournamentTeams = teams.filter(t => t.tournament_id === tournament.id);
  
  const getUserData = (userId) => {
    const u = users.find(u => u.id === userId);
    const nick = u?.user_metadata?.nickname || u?.user_metadata?.display_name || u?.email?.split('@')[0] || 'Unknown';
    const avatar = u?.user_metadata?.avatar_url;
    const isBanned = !!u?.banned_until && new Date(u.banned_until) > new Date();
    return { nick, avatar, isBanned };
  };

  const handleKickMember = async (memberId) => {
    if (!confirm('Czy na pewno chcesz wyrzucić tego gracza z drużyny?')) return;
    const { error } = await supabase.from('team_members').delete().eq('id', memberId);
    if (!error) onRefresh();
  };

  const handleKickTeam = async (teamId) => {
    if (!confirm('Czy na pewno chcesz usunąć całą drużynę z turnieju?')) return;
    const { error } = await supabase.from('teams').delete().eq('id', teamId);
    if (!error) onRefresh();
  };

  const handleBanUser = async (userId, nick) => {
    if (!confirm(`ZBANOWAĆ całkowicie użytkownika ${nick}?`)) return;
    try {
      await adminFetch('ban', { userId });
      onRefresh();
    } catch (err) {
      alert('Błąd banowania: ' + err.message);
    }
  };

  const handleChangeLeader = async (teamId, newLeaderId) => {
    const { error } = await supabase.from('teams').update({ leader_id: newLeaderId }).eq('id', teamId);
    if (!error) onRefresh();
  };

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
          const teamMembers = members.filter(m => m.team_id === team.id);
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
                  const userData = getUserData(m.user_id);
                  const isLeader = team.leader_id === m.user_id;
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
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
// Main Admin Page
// ════════════════════════════════════════════
export default function AdminPage({ onNavigate, user, onAuthChange }) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);
  
  // Tournament Creation/Edit Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTournamentId, setEditingTournamentId] = useState(null);
  const [newTournament, setNewTournament] = useState({
    name: '', game: 'League of Legends', status: 'draft', 
    max_teams: 16, team_size: 5, prize_pool: '', description: '', rules: '', start_date: ''
  });

  const isAdmin = user?.app_metadata?.role === 'admin';

  const loadData = async () => {
    setLoading(true);
    try {
      const userData = await adminFetch('list');
      setUsers(userData.users || []);

      const { data: tData } = await supabase.from('tournaments').select('*').order('created_at', { ascending: false });
      setTournaments(tData || []);

      const { data: teamData } = await supabase.from('teams').select('*').order('created_at', { ascending: false });
      setTeams(teamData || []);

      const { data: memberData } = await supabase.from('team_members').select('*');
      setMembers(memberData || []);
    } catch (err) {
      console.error('Admin load error:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin]);

  const handleSaveTournament = async (e) => {
    e.preventDefault();
    if (!newTournament.name.trim()) return alert('Podaj nazwę turnieju');
    
    if (editingTournamentId) {
      // Update
      const { error } = await supabase
        .from('tournaments')
        .update(newTournament)
        .eq('id', editingTournamentId);
        
      if (error) {
        alert('Błąd podczas aktualizacji: ' + error.message);
      } else {
        setEditingTournamentId(null);
        setShowCreateForm(false);
        loadData();
      }
    } else {
      // Create
      const { error } = await supabase.from('tournaments').insert(newTournament);
      if (error) {
        alert('Błąd podczas tworzenia: ' + error.message);
      } else {
        setShowCreateForm(false);
        loadData();
      }
    }
  };

  const handleEditTournament = (t) => {
    setEditingTournamentId(t.id);
    setNewTournament({
      name: t.name || '',
      game: t.game || 'League of Legends',
      status: t.status || 'draft',
      max_teams: t.max_teams || 16,
      team_size: t.team_size || 5,
      prize_pool: t.prize_pool || '',
      description: t.description || '',
      rules: t.rules || '',
      start_date: t.start_date ? new Date(t.start_date).toISOString().slice(0, 16) : ''
    });
    setShowCreateForm(true);
  };

  const handleBanUser = async (userId, nick) => {
    if (!confirm(`ZBANOWAĆ użytkownika ${nick}?`)) return;
    try {
      await adminFetch('ban', { userId });
      loadData();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteUser = async (userId, nick) => {
    if (!confirm(`USUNĄĆ całkowicie użytkownika ${nick}?`)) return;
    try {
      await adminFetch('delete', { userId });
      loadData();
    } catch (err) { alert(err.message); }
  };

  if (!user || !isAdmin) {
    return (
      <div className="gh-page">
        <Navbar onNavigate={onNavigate} currentView="admin" user={user} onAuthChange={onAuthChange} />
        <main className="gh-main" style={{ marginTop: '73px', textAlign: 'center', padding: '10rem 1rem' }}>
          <h1 className="gh-title" data-text="Brak dostępu">Brak dostępu</h1>
        </main>
        <Footer />
      </div>
    );
  }

  // --- Filtering Logic ---
  const query = searchQuery.toLowerCase().trim();
  const searchResults = {
    users: query ? users.filter(u => (u.user_metadata?.nickname || u.email || '').toLowerCase().includes(query)) : [],
    teams: query ? teams.filter(t => (t.team_name || '').toLowerCase().includes(query) || (t.tag || '').toLowerCase().includes(query)) : [],
    tournaments: query ? tournaments.filter(t => (t.name || '').toLowerCase().includes(query)) : []
  };
  const isSearching = !!query;

  return (
    <div className="gh-page">
      <Navbar onNavigate={onNavigate} currentView="admin" user={user} onAuthChange={onAuthChange} />

      <main className="gh-main" style={{ marginTop: '73px' }}>
        <h1 className="gh-title" data-text="ADMIN PANEL" style={{ marginBottom: '2rem' }}>ADMIN PANEL</h1>

        {/* Global Search */}
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
          /* SEARCH RESULTS OVERLAY */
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
                          <td>{u.user_metadata?.nickname || u.email}</td>
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
                    <div key={t.id} className="admin-card" onClick={() => { setSelectedTournamentId(t.id); setSearchQuery(''); }} style={{ cursor: 'pointer' }}>
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
          /* DRILL DOWN VIEW */
          <TournamentCenter 
            tournament={tournaments.find(t => t.id === selectedTournamentId)}
            teams={teams}
            members={members}
            users={users}
            onBack={() => setSelectedTournamentId(null)}
            onRefresh={loadData}
          />
        ) : (
          /* HYBRID TABS VIEW */
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
                                  <td>{u.user_metadata?.nickname || 'Gracz'}</td>
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
                              const isBanned = !!u.banned_until && new Date(u.banned_until) > new Date();
                              const isSelf = u.id === user.id;
                              return (
                                <tr key={u.id}>
                                  <td>{u.user_metadata?.nickname || u.email}</td>
                                  <td><span className={`admin-badge ${u.app_metadata?.role === 'admin' ? 'admin-badge--admin' : ''}`}>{u.app_metadata?.role}</span></td>
                                  <td><span className={`admin-badge ${isBanned ? 'admin-badge--banned' : 'admin-badge--open'}`}>{isBanned ? 'Banned' : 'Aktywny'}</span></td>
                                  <td className="admin-actions">
                                    {!isSelf && (
                                      <>
                                        <button className="admin-btn admin-btn--danger" onClick={() => handleBanUser(u.id, u.email)}>BAN</button>
                                        <button className="admin-btn admin-btn--danger" onClick={() => handleDeleteUser(u.id, u.email)}>USUŃ</button>
                                      </>
                                    )}
                                    {isSelf && <span style={{fontSize:'0.7rem', color:'var(--gh-muted)'}}>— to Ty</span>}
                                  </td>
                                </tr>
                              );
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
                          setShowCreateForm(!showCreateForm);
                          if (!showCreateForm) {
                            setEditingTournamentId(null);
                            setNewTournament({ name: '', game: 'League of Legends', status: 'draft', max_teams: 16, team_size: 5, prize_pool: '', description: '', rules: '', start_date: '' });
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
                              <input type="text" className="admin-form__input" value={newTournament.name} onChange={e => setNewTournament({...newTournament, name: e.target.value})} placeholder="np. GG WP Cup #2" />
                            </div>
                            <div className="admin-form__group">
                              <label className="admin-form__label">Gra</label>
                              <select className="admin-form__select" value={newTournament.game} onChange={e => setNewTournament({...newTournament, game: e.target.value})}>
                                <option>League of Legends</option>
                                <option>CS2</option>
                                <option>Valorant</option>
                                <option>Chess</option>
                                <option>FIFA / EA Sports FC</option>
                              </select>
                            </div>
                            <div className="admin-form__group">
                              <label className="admin-form__label">Status</label>
                              <select className="admin-form__select" value={newTournament.status} onChange={e => setNewTournament({...newTournament, status: e.target.value})}>
                                {TOURNAMENT_STATUSES.map(s => <option key={s} value={s}>{STATUS_MAP[s]}</option>)}
                              </select>
                            </div>
                            <div className="admin-form__group">
                              <label className="admin-form__label">Data Startu</label>
                              <input 
                                type="datetime-local" 
                                className="admin-form__input" 
                                value={newTournament.start_date} 
                                onChange={e => setNewTournament({...newTournament, start_date: e.target.value})}
                                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                              />
                            </div>
                            <div className="admin-form__group">
                              <label className="admin-form__label">Max Drużyn</label>
                              <input type="number" className="admin-form__input" value={newTournament.max_teams} onChange={e => setNewTournament({...newTournament, max_teams: parseInt(e.target.value) || 0})} />
                            </div>
                            <div className="admin-form__group">
                              <label className="admin-form__label">Rozmiar Drużyny</label>
                              <input type="number" className="admin-form__input" value={newTournament.team_size} onChange={e => setNewTournament({...newTournament, team_size: parseInt(e.target.value) || 0})} />
                            </div>
                            <div className="admin-form__group">
                              <label className="admin-form__label">Pula Nagród</label>
                              <input type="text" className="admin-form__input" value={newTournament.prize_pool} onChange={e => setNewTournament({...newTournament, prize_pool: e.target.value})} placeholder="np. 500 PLN" />
                            </div>
                            <div className="admin-form__group admin-form--full">
                                <label className="admin-form__label">Krótki Opis (Hero)</label>
                                <textarea className="admin-form__input" style={{ height: '80px' }} value={newTournament.description} onChange={e => setNewTournament({...newTournament, description: e.target.value})} placeholder="Kilka słów zachęty widocznych na górze strony..." />
                            </div>
                            <div className="admin-form__group admin-form--full">
                                <label className="admin-form__label">Regulamin / Zasady</label>
                                <textarea className="admin-form__input" style={{ height: '160px' }} value={newTournament.rules} onChange={e => setNewTournament({...newTournament, rules: e.target.value})} placeholder="Pełna treść regulaminu..." />
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
                            <p style={{ fontSize: '0.8rem', color: 'var(--gh-muted)' }}>Turniej_ID: {t.tournament_id}</p>
                            <button className="admin-btn admin-btn--mini" style={{ marginTop: '0.5rem' }} onClick={() => setSelectedTournamentId(t.tournament_id)}>Przejdź do turnieju</button>
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
      <Footer />
    </div>
  );
}
