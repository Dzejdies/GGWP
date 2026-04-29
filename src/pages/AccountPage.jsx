import { useState, useRef, useEffect } from 'react'
import api, { getAccessToken, clearAccessToken } from '../lib/api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useToast } from '../components/Toast'
import PartyChat from '../components/PartyChat'
import './AccountPage.css'
import '../components/button.css'

const BASE_URL = import.meta.env.VITE_API_URL
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_REGEX = /^[\d\s\-]{4,}$/

const DIAL_CODES = [
  { code: '+48', label: '🇵🇱 +48' },
  { code: '+1', label: '🇺🇸 +1' },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+49', label: '🇩🇪 +49' },
  { code: '+33', label: '🇫🇷 +33' },
  { code: '+34', label: '🇪🇸 +34' },
  { code: '+39', label: '🇮🇹 +39' },
  { code: '+380', label: '🇺🇦 +380' },
  { code: '+420', label: '🇨🇿 +420' },
  { code: '+36', label: '🇭🇺 +36' },
]

function parsePhone(fullPhone) {
  if (!fullPhone) return { dialCode: '+48', phone: '' }
  for (const d of DIAL_CODES) {
    if (fullPhone.startsWith(d.code + ' ')) {
      return { dialCode: d.code, phone: fullPhone.slice(d.code.length + 1) }
    }
  }
  return { dialCode: '+48', phone: fullPhone }
}

export default function AccountPage({ onNavigate, user, onAuthChange, initialTabData }) {
  const parsed = parsePhone(user?.phone)
  const { showToast } = useToast()

  // Profile state
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [dialCode, setDialCode] = useState(parsed.dialCode)
  const [phone, setPhone] = useState(parsed.phone)
  const [message, setMessage] = useState(user?.message || '')
  const [profileStatus, setProfileStatus] = useState('idle')
  const [profileError, setProfileError] = useState('')

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileInputRef = useRef(null)

  // Email state
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [emailStatus, setEmailStatus] = useState('idle')
  const [emailError, setEmailError] = useState('')

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState('idle')
  const [passwordError, setPasswordError] = useState('')

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteStatus, setDeleteStatus] = useState('idle')

  // Teams state
  const activeTab = initialTabData?.tab || 'profile'
  const [myTeams, setMyTeams] = useState([])
  const [invites, setInvites] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [teamsLoading, setTeamsLoading] = useState(false)
  const [openChatTeamId, setOpenChatTeamId] = useState(null)

  // Create Team state
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamTag, setNewTeamTag] = useState('')

  useEffect(() => {
    if (user && activeTab === 'teams') {
      fetchTeamsData()
    }
  }, [user, activeTab])

  const fetchTeamsData = async () => {
    setTeamsLoading(true)
    try {
      const [teams, inviteList] = await Promise.all([
        api.get('/ggwp/teams/mine'),
        api.get('/ggwp/team-members/invites'),
      ])
      setMyTeams(Array.isArray(teams) ? teams : [])
      setInvites(Array.isArray(inviteList) ? inviteList : [])
    } catch {
      showToast('Błąd pobierania danych drużyn.', 'error')
    } finally {
      setTeamsLoading(false)
    }
  }

  const handleSearchUsers = async (value) => {
    if (value.length < 2) { setSearchResults([]); return }
    setSearching(true)
    try {
      const data = await api.get(`/ggwp/users?search=${encodeURIComponent(value)}`)
      setSearchResults(Array.isArray(data) ? data : [])
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleInvitePlayer = async (teamId, targetUserId) => {
    try {
      await api.post('/ggwp/team-members', { team_id: teamId, user_id: targetUserId })
      const targetTeam = myTeams.find(t => t.id === teamId)
      await api.post('/ggwp/notifications', {
        user_id: targetUserId,
        title: '📩 Nowe Zaproszenie',
        message: `Zostałeś zaproszony do drużyny ${targetTeam?.team_name || 'Nowej Drużyny'}.`,
        type: 'team',
      })
      showToast('Zaproszenie wysłane!')
      setSearchResults([])
      setSearchQuery('')
    } catch {
      showToast('Ten gracz jest już zaproszony lub należy do drużyny.', 'error')
    }
  }

  const handleRespondInvite = async (invite, action) => {
    try {
      await api.patch(`/ggwp/team-members/${invite.id}/${action}`)
      if (invite.leader_id) {
        await api.post('/ggwp/notifications', {
          user_id: invite.leader_id,
          title: action === 'accept' ? '✅ Zaproszenie Zaakceptowane' : '❌ Zaproszenie Odrzucone',
          message: `Gracz ${user.nickname} ${action === 'accept' ? 'dołączył do' : 'odrzucił zaproszenie do'} drużyny ${invite.team_name}.`,
          type: 'team',
        })
      }
      showToast(action === 'accept' ? 'Dołączyłeś do drużyny!' : 'Zaproszenie odrzucone.')
      fetchTeamsData()
    } catch {
      showToast('Błąd podczas odpowiedzi na zaproszenie.', 'error')
    }
  }

  const handleKickMember = async (memberId) => {
    if (!confirm('Czy na pewno chcesz usunąć tego członka?')) return
    try {
      await api.delete(`/ggwp/team-members/${memberId}`)
      fetchTeamsData()
    } catch {
      showToast('Błąd przy usuwaniu członka.', 'error')
    }
  }

  const handleLeaveTeam = async (teamId) => {
    const targetTeam = myTeams.find(t => t.id === teamId)
    if (!targetTeam) return

    const isLeader = targetTeam.leader_id === user.id
    const myMember = targetTeam.members?.find(m => m.user_id === user.id && m.status === 'accepted')
    if (!myMember) return

    const promptMsg = isLeader
      ? 'Jesteś liderem tej drużyny. Jeśli ją opuścisz, dowodzenie zostanie przekazane losowemu członkowi. Kontynuować?'
      : 'Czy na pewno chcesz opuścić drużynę?'
    if (!confirm(promptMsg)) return

    try {
      if (isLeader) {
        const others = targetTeam.members.filter(m => m.user_id !== user.id && m.status === 'accepted')
        if (others.length > 0) {
          const newLeader = others[Math.floor(Math.random() * others.length)]
          await api.patch(`/ggwp/teams/${teamId}`, { leader_id: newLeader.user_id })
          await api.post('/ggwp/notifications', {
            user_id: newLeader.user_id,
            title: '👑 Zostałeś Liderem!',
            message: `Gracz ${user.nickname} opuścił drużynę ${targetTeam.team_name}. Dowodzenie przekazano Tobie.`,
            type: 'team',
          })
          showToast(`Przekazałeś dowodzenie graczowi ${newLeader.nickname}`)
        } else {
          await api.delete(`/ggwp/teams/${teamId}`)
          showToast('Wszyscy opuścili drużynę. Zespół został rozwiązany.')
          fetchTeamsData()
          return
        }
      }

      await api.delete(`/ggwp/team-members/${myMember.id}`)
      showToast('Opuściłeś drużynę.')
      fetchTeamsData()
    } catch {
      showToast('Wystąpił błąd przy opuszczaniu drużyny.', 'error')
    }
  }

  const handleCreateTeam = async () => {
    if (!newTeamName || !newTeamTag) return
    try {
      await api.post('/ggwp/teams', {
        team_name: newTeamName,
        tag: newTeamTag.toUpperCase(),
      })
      setNewTeamName('')
      setNewTeamTag('')
      fetchTeamsData()
    } catch {
      showToast('Błąd tworzenia drużyny.', 'error')
    }
  }

  // ── Avatar upload ──
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('Wybierz plik JPG, PNG lub WebP')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Plik jest zbyt duży. Maksymalny rozmiar to 2 MB.')
      return
    }

    setAvatarUploading(true)
    const formData = new FormData()
    formData.append('avatar', file)

    try {
      const res = await fetch(`${BASE_URL}/ggwp/avatar`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + getAccessToken() },
        credentials: 'include',
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json()
        alert('Błąd przesyłania: ' + (err.error || 'Nieznany błąd'))
        return
      }
      const updated = await api.get('/ggwp/auth/me')
      if (updated?.id) {
        onAuthChange(updated)
        setAvatarUrl(updated.avatar_url || '')
      }
    } catch {
      alert('Błąd połączenia')
    } finally {
      setAvatarUploading(false)
    }
  }

  // ── Profile update ──
  const handleProfileSave = async () => {
    if (!nickname.trim()) { setProfileError('Nick nie może być pusty'); return }
    if (phone && !PHONE_REGEX.test(phone)) { setProfileError('Nieprawidłowy numer telefonu'); return }

    setProfileStatus('loading')
    setProfileError('')

    const fullPhone = phone.trim() ? `${dialCode} ${phone.trim()}` : null

    try {
      const updated = await api.patch('/ggwp/auth/me', {
        nickname: nickname.trim(),
        phone: fullPhone,
        message: message.trim() || null,
      })
      if (updated?.id) onAuthChange(updated)
      setProfileStatus('success')
      setTimeout(() => setProfileStatus('idle'), 3000)
    } catch {
      setProfileError('Błąd aktualizacji profilu')
      setProfileStatus('error')
    }
  }

  // ── Email change ──
  const handleEmailChange = async () => {
    if (!EMAIL_REGEX.test(newEmail)) { setEmailError('Podaj prawidłowy adres e-mail'); return }
    if (newEmail === user.email) { setEmailError('To jest Twój obecny e-mail'); return }
    if (!emailPassword) { setEmailError('Podaj obecne hasło'); return }

    setEmailStatus('loading')
    setEmailError('')

    try {
      await api.patch('/ggwp/auth/me/email', { email: newEmail, password: emailPassword })
      setEmailStatus('success')
      setTimeout(() => {
        clearAccessToken()
        onAuthChange(null)
        onNavigate('landing')
      }, 2000)
    } catch (err) {
      const msg = err?.message || ''
      if (msg.includes('409') || msg.includes('already')) {
        setEmailError('Ten e-mail jest już zajęty')
      } else if (msg.includes('401') || msg.includes('Invalid')) {
        setEmailError('Nieprawidłowe hasło')
      } else {
        setEmailError('Błąd zmiany e-maila')
      }
      setEmailStatus('error')
    }
  }

  // ── Password change ──
  const handlePasswordChange = async () => {
    if (!currentPassword) { setPasswordError('Podaj obecne hasło'); return }
    if (!PASSWORD_REGEX.test(newPassword)) {
      setPasswordError('Hasło musi zawierać min. 8 znaków, dużą literę, małą literę i cyfrę')
      return
    }
    if (newPassword !== confirmPassword) { setPasswordError('Hasła się nie zgadzają'); return }

    setPasswordStatus('loading')
    setPasswordError('')

    try {
      await api.patch('/ggwp/auth/me/password', {
        old_password: currentPassword,
        new_password: newPassword,
      })
      setPasswordStatus('success')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        clearAccessToken()
        onAuthChange(null)
        onNavigate('landing')
      }, 2000)
    } catch (err) {
      const msg = err?.message || ''
      if (msg.includes('401') || msg.includes('Invalid')) {
        setPasswordError('Obecne hasło jest nieprawidłowe')
      } else {
        setPasswordError('Błąd zmiany hasła')
      }
      setPasswordStatus('error')
    }
  }

  // ── Delete account ──
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'USUŃ') return
    setDeleteStatus('loading')

    try {
      await api.delete('/ggwp/auth/me')
      clearAccessToken()
      onAuthChange(null)
      onNavigate('landing')
    } catch {
      alert('Błąd usuwania konta')
      setDeleteStatus('error')
    }
  }

  if (!user) {
    return (
      <div className="gh-page">
        <Navbar onNavigate={onNavigate} currentView="account" user={user} onAuthChange={onAuthChange} />
        <main className="gh-main" style={{ marginTop: '73px', textAlign: 'center', padding: '4rem 1rem' }}>
          <span style={{ fontSize: '4rem' }}>🔒</span>
          <h1 className="gh-title" data-text="Brak dostępu">Brak dostępu</h1>
          <p style={{ color: 'var(--gh-muted)', marginTop: '1rem' }}>Zaloguj się, aby zarządzać kontem.</p>
        </main>
        <Footer />
      </div>
    )
  }

  const initials = (nickname || user.email?.split('@')[0] || '?').slice(0, 2).toUpperCase()

  return (
    <div className="gh-page">
      <Navbar
        onNavigate={onNavigate}
        currentView="account"
        user={user}
        onAuthChange={onAuthChange}
        initialTabData={initialTabData}
      />

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal account-delete-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal__close" onClick={() => setShowDeleteModal(false)}>✕</button>
            <h2 className="modal__title" style={{ color: '#f87171' }}>⚠️ Usuwanie konta</h2>
            <p style={{ color: 'var(--gh-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Ta operacja jest nieodwracalna. Wszystkie Twoje dane zostaną usunięte.
              Wpisz <strong style={{ color: '#f87171' }}>USUŃ</strong> aby potwierdzić.
            </p>
            <input
              className="modal__input"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder='Wpisz "USUŃ"'
            />
            <button
              className="account-danger__btn"
              disabled={deleteConfirm !== 'USUŃ' || deleteStatus === 'loading'}
              onClick={handleDeleteAccount}
              style={{ marginTop: '1rem', width: '100%' }}
            >
              {deleteStatus === 'loading' ? 'Usuwanie…' : '🗑️ Potwierdź usunięcie konta'}
            </button>
          </div>
        </div>
      )}

      <main className="gh-main" style={{ marginTop: '73px' }}>
        <div className="account-header-row">
          <h1 className="gh-title" data-text={activeTab === 'teams' ? 'Moje Drużyny' : 'Moje Konto'}>
            {activeTab === 'teams' ? 'Moje Drużyny' : 'Moje Konto'}
          </h1>
        </div>

        {activeTab === 'profile' ? (
          <>
            {/* ── Avatar Section ── */}
            <section className="account-section">
              <div className="account-avatar-section">
                <div className="account-avatar" onClick={() => fileInputRef.current?.click()}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" />
                  ) : (
                    <span className="account-avatar__initials">{initials}</span>
                  )}
                  <div className="account-avatar__overlay">
                    {avatarUploading ? '⏳' : '📷'}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleAvatarUpload}
                />
                <div className="account-avatar-info">
                  <h2 className="account-avatar-info__name">{nickname || user.email?.split('@')[0]}</h2>
                  <p className="account-avatar-info__email">{user.email}</p>
                  <button
                    className="account-avatar-info__btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                  >
                    {avatarUploading ? 'Przesyłanie…' : '📷 Zmień zdjęcie'}
                  </button>
                </div>
              </div>
            </section>

            {/* ── Profile Info ── */}
            <section className="account-section">
              <h2 className="account-section__title">👤 Dane profilu</h2>

              <label className="account-label">Nickname</label>
              <input
                className="account-input"
                value={nickname}
                onChange={(e) => { setNickname(e.target.value); setProfileError('') }}
                placeholder="Twój nick"
              />

              <label className="account-label">Numer telefonu</label>
              <div className="account-phone-row">
                <select
                  className="account-dial-select"
                  value={dialCode}
                  onChange={(e) => setDialCode(e.target.value)}
                >
                  {DIAL_CODES.map((d) => (
                    <option key={d.code} value={d.code}>{d.label}</option>
                  ))}
                </select>
                <input
                  className="account-input account-phone-input"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setProfileError('') }}
                  placeholder="123 456 789"
                  type="tel"
                />
              </div>

              <label className="account-label">Wiadomość / bio</label>
              <textarea
                className="account-input account-textarea"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Coś o sobie..."
                rows={3}
              />

              {profileError && <p className="account-error">⚠ {profileError}</p>}
              {profileStatus === 'success' && <p className="account-success">✅ Profil zaktualizowany!</p>}

              <button
                className="gh-btn"
                onClick={handleProfileSave}
                disabled={profileStatus === 'loading'}
              >
                {profileStatus === 'loading' ? 'Zapisywanie…' : '💾 Zapisz zmiany'}
              </button>
            </section>

            {/* ── Email Change ── */}
            <section className="account-section">
              <h2 className="account-section__title">📧 Zmiana e-maila</h2>

              <label className="account-label">Obecny e-mail</label>
              <input className="account-input" value={user.email} disabled />

              <label className="account-label">Nowy e-mail</label>
              <input
                className="account-input"
                type="email"
                value={newEmail}
                onChange={(e) => { setNewEmail(e.target.value); setEmailError(''); setEmailStatus('idle') }}
                placeholder="nowy@email.pl"
              />

              <label className="account-label">Hasło (potwierdzenie)</label>
              <input
                className="account-input"
                type="password"
                value={emailPassword}
                onChange={(e) => { setEmailPassword(e.target.value); setEmailError(''); setEmailStatus('idle') }}
                placeholder="Twoje obecne hasło"
                autoComplete="current-password"
              />

              {emailError && <p className="account-error">⚠ {emailError}</p>}
              {emailStatus === 'success' && (
                <p className="account-success">
                  ✅ E-mail zmieniony. Za chwilę zostaniesz wylogowany…
                </p>
              )}

              <button
                className="gh-btn"
                onClick={handleEmailChange}
                disabled={emailStatus === 'loading' || emailStatus === 'success'}
              >
                {emailStatus === 'loading' ? 'Zapisywanie…' : '📧 Zmień e-mail'}
              </button>
            </section>

            {/* ── Password Change ── */}
            <section className="account-section">
              <h2 className="account-section__title">🔑 Zmiana hasła</h2>

              <label className="account-label">Obecne hasło</label>
              <input
                className="account-input"
                type="password"
                value={currentPassword}
                onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError('') }}
                placeholder="Obecne hasło"
                autoComplete="current-password"
              />

              <label className="account-label">Nowe hasło</label>
              <input
                className="account-input"
                type="password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setPasswordError('') }}
                placeholder="Nowe hasło"
                autoComplete="new-password"
              />

              <label className="account-label">Potwierdź nowe hasło</label>
              <input
                className="account-input"
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError('') }}
                placeholder="Powtórz nowe hasło"
                autoComplete="new-password"
              />

              {passwordError && <p className="account-error">⚠ {passwordError}</p>}
              {passwordStatus === 'success' && (
                <p className="account-success">✅ Hasło zmienione. Za chwilę zostaniesz wylogowany…</p>
              )}

              <button
                className="gh-btn"
                onClick={handlePasswordChange}
                disabled={passwordStatus === 'loading' || passwordStatus === 'success'}
              >
                {passwordStatus === 'loading' ? 'Zmienianie…' : '🔑 Zmień hasło'}
              </button>
            </section>

            {/* ── Danger Zone ── */}
            <section className="account-section account-danger">
              <h2 className="account-section__title" style={{ color: '#f87171' }}>⚠️ Strefa niebezpieczna</h2>
              <p style={{ color: 'var(--gh-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Usunięcie konta jest nieodwracalne. Wszystkie Twoje dane zostaną permanentnie usunięte.
              </p>
              <button
                className="account-danger__btn"
                onClick={() => { setShowDeleteModal(true); setDeleteConfirm(''); setDeleteStatus('idle') }}
              >
                🗑️ Usuń konto
              </button>
            </section>
          </>
        ) : (
          <div className="teams-view">
            {/* ── Invitations ── */}
            {invites.length > 0 && (
              <section className="account-section teams-invites-section">
                <h2 className="account-section__title">📬 Otrzymane zaproszenia</h2>
                <div className="invites-grid">
                  {invites.map(inv => (
                    <div key={inv.id} className="invite-card">
                      <div className="invite-info">
                        <strong>{inv.team_name} [{inv.tag}]</strong>
                        <p>Zaprasza Cię do dołączenia</p>
                      </div>
                      <div className="invite-actions">
                        <button className="gh-btn gh-btn--success btn-sm" onClick={() => handleRespondInvite(inv, 'accept')}>Akceptuj</button>
                        <button className="gh-btn gh-btn--outline btn-sm" style={{ borderColor: '#f87171', color: '#f87171' }} onClick={() => handleRespondInvite(inv, 'reject')}>Odrzuć</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── My Teams List ── */}
            <section className="account-section">
              <h2 className="account-section__title">🏆 Twoje składy</h2>
              {teamsLoading ? (
                <p>Ładowanie drużyn...</p>
              ) : myTeams.length === 0 ? (
                <p style={{ color: 'var(--gh-muted)' }}>Nie należysz jeszcze do żadnej drużyny.</p>
              ) : (
                <div className="teams-list">
                  {myTeams.map(t => (
                    <div key={t.id} className="team-item">
                      <div className="team-item__main">
                        <div className="team-item__avatar">
                          {t.avatar_url ? <img src={t.avatar_url} alt="" /> : <span>{t.tag}</span>}
                        </div>
                        <div className="team-item__info">
                          <h3>{t.team_name} <span className="team-tag">[{t.tag}]</span></h3>
                          <span className="team-role-badge">
                            {t.leader_id === user.id ? '👑 Lider' : '🎯 Członek'}
                          </span>
                        </div>
                      </div>

                      <div className="team-item__members">
                        <div className="members-list-mini">
                          {(t.members || []).map(m => (
                            <div key={m.id} className={`member-chip ${m.status === 'pending' ? 'pending' : ''}`}>
                              <img
                                src={m.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${m.nickname || 'user'}`}
                                alt=""
                              />
                              <span>{m.nickname}</span>
                              {t.leader_id === user.id && m.user_id !== user.id && (
                                <button className="kick-small" onClick={() => handleKickMember(m.id)}>×</button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="team-item__actions">
                        {t.leader_id === user.id && (
                          <div className="user-search-box">
                            <input
                              placeholder="➕ Zaproś gracza..."
                              className="account-input search-input"
                              value={searchQuery}
                              onChange={(e) => {
                                setSearchQuery(e.target.value)
                                handleSearchUsers(e.target.value)
                              }}
                            />
                            {searchQuery.length > 1 && (
                              <div className="search-dropdown">
                                {searching ? (
                                  <p className="p-2 text-xs">Szukanie...</p>
                                ) : searchResults.length === 0 ? (
                                  <p className="p-2 text-xs">Brak wyników</p>
                                ) : (
                                  searchResults.map(res => (
                                    <div key={res.id} className="search-res-item" onClick={() => handleInvitePlayer(t.id, res.id)}>
                                      <span>{res.nickname}</span>
                                      <button className="btn-invite">Zaproś</button>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        <button
                          className={`gh-btn btn-sm ${openChatTeamId === t.id ? '' : 'gh-btn--outline'}`}
                          onClick={() => setOpenChatTeamId(prev => prev === t.id ? null : t.id)}
                        >
                          💬 Czat party
                        </button>
                        <button className="gh-btn gh-btn--outline btn-sm" onClick={() => handleLeaveTeam(t.id)}>Opuść</button>
                      </div>

                      {openChatTeamId === t.id && (
                        <PartyChat team={t} user={user} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── Create Team ── */}
            <section className="account-section">
              <h2 className="account-section__title">➕ Załóż nową drużynę</h2>
              <div className="create-team-form">
                <div className="form-group">
                  <label className="account-label">Nazwa Drużyny</label>
                  <input
                    className="account-input"
                    placeholder="np. Polish Power"
                    value={newTeamName}
                    onChange={e => setNewTeamName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="account-label">Tag (2-5 znaków)</label>
                  <input
                    className="account-input"
                    placeholder="PPW"
                    maxLength={5}
                    value={newTeamTag}
                    onChange={e => setNewTeamTag(e.target.value.toUpperCase())}
                  />
                </div>
                <button className="gh-btn" style={{ marginTop: '1rem' }} onClick={handleCreateTeam}>
                  🚀 Stwórz Drużynę
                </button>
              </div>
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
