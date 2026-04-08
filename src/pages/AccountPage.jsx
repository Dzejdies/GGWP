import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useToast } from '../components/Toast'
import './AccountPage.css'

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
  const meta = user?.user_metadata || {}
  const parsed = parsePhone(meta.phone)

  // Profile state
  const [nickname, setNickname] = useState(meta.nickname || meta.display_name || '')
  const [dialCode, setDialCode] = useState(parsed.dialCode)
  const [phone, setPhone] = useState(parsed.phone)
  const [message, setMessage] = useState(meta.message || '')
  const [profileStatus, setProfileStatus] = useState('idle')
  const [profileError, setProfileError] = useState('')
  const { showToast } = useToast()


  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState(meta.avatar_url || '')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileInputRef = useRef(null)

  // Email state
  const [newEmail, setNewEmail] = useState('')
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

  // ── INT-21: Teams State ──
  const activeTab = initialTabData?.tab || 'profile'
  const [myTeams, setMyTeams] = useState([])
  const [invites, setInvites] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [teamsLoading, setTeamsLoading] = useState(false)
  
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
      // 1. Fetch teams where I am a member (accepted)
      const { data: teamsWithMembers, error: memberError } = await supabase
        .from('teams')
        .select(`
          id, team_name, tag, avatar_url, leader_id,
          team_members!inner (user_id, status),
          members:team_members (
            id, status, user_id,
            profile:profiles (nickname, avatar_url)
          )
        `)
        .eq('team_members.user_id', user.id)
        .eq('team_members.status', 'accepted')

      if (memberError) throw memberError
      
      setMyTeams(teamsWithMembers || [])

      // 2. Fetch pending invitations for me
      const { data: inviteData, error: inviteError } = await supabase
        .from('team_members')
        .select(`
          id,
          team:teams (
            id, team_name, tag, avatar_url
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')

      if (inviteError) throw inviteError
      setInvites(inviteData || [])
    } catch (err) {
      console.error('Błąd pobierania drużyn:', err)
    } finally {
      setTeamsLoading(false)
    }
  }

  const handleSearchUsers = async () => {
    if (searchQuery.length < 2) return
    setSearching(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nickname, avatar_url')
      .ilike('nickname', `%${searchQuery}%`)
      .limit(5)
    
    if (!error) setSearchResults(data)
    setSearching(false)
  }

  const handleInvitePlayer = async (teamId, targetUserId) => {
    const { error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: targetUserId,
        status: 'pending'
      })
    
    if (error) {
      showToast('Ten gracz jest już zaproszony lub należy do drużyny.', 'error')
    } else {
      const targetTeam = myTeams.find(t => t.id === teamId)
      // Notification for target user
      await supabase.from('notifications').insert({
        user_id: targetUserId,
        title: '📩 Nowe Zaproszenie',
        message: `Zostałeś zaproszony do drużyny ${targetTeam?.team_name || 'Nowej Drużyny'}.`,
        type: 'team'
      })

      showToast('Zaproszenie wysłane!')
      setSearchResults([])
      setSearchQuery('')
    }
  }

  const handleRespondInvite = async (inviteId, status) => {
    // Need to find the team info before updating
    const invite = pendingInvites.find(i => i.id === inviteId)
    
    const { error } = await supabase
      .from('team_members')
      .update({ status })
      .eq('id', inviteId)
    
    if (!error) {
      if (invite) {
        // Notification for the team leader
        await supabase.from('notifications').insert({
          user_id: invite.teams.leader_id,
          title: status === 'accepted' ? '✅ Zaproszenie Zaakceptowane' : '❌ Zaproszenie Odrzucone',
          message: `Gracz ${nickname} ${status === 'accepted' ? 'dołączył do' : 'odrzucił zaproszenie do'} drużyny ${invite.teams.team_name}.`,
          type: 'team'
        })
      }
      showToast(status === 'accepted' ? 'Dołączyłeś do drużyny!' : 'Zaproszenie odrzucone.')
      fetchTeamsData()
    }
  }


  const handleKickMember = async (teamId, targetUserId) => {
    if (!confirm('Czy na pewno chcesz usunąć tego członka?')) return
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', targetUserId)
    
    if (!error) fetchTeamsData()
  }

  const handleLeaveTeam = async (teamId) => {
    const targetTeam = myTeams.find(t => t.id === teamId)
    if (!targetTeam) return

    const isLeader = targetTeam.leader_id === user.id
    const promptMsg = isLeader 
      ? 'Jesteś liderem tej drużyny. Jeśli ją opuścisz, dowodzenie zostanie przekazane losowemu członkowi. Kontynuować?'
      : 'Czy na pewno chcesz opuścić drużynę?'

    if (!confirm(promptMsg)) return

    try {
      if (isLeader) {
        const others = targetTeam.members.filter(m => m.user_id !== user.id && m.status === 'accepted')
        
        if (others.length > 0) {
          const newBoss = others[Math.floor(Math.random() * others.length)]
          
          await supabase
            .from('teams')
            .update({ leader_id: newBoss.user_id })
            .eq('id', teamId)

          // Persistent Notification for new leader
          await supabase.from('notifications').insert({
            user_id: newBoss.user_id,
            title: '👑 Zostałeś Liderem!',
            message: `Gracz ${nickname} opuścił drużynę ${targetTeam.team_name}. Dowodzenie przekazano Tobie.`,
            type: 'team'
          })
          
          showToast(`Przekazałeś dowodzenie graczowi ${newBoss.profile?.nickname}`)
        } else {
          // No one left - delete team
          await supabase.from('teams').delete().eq('id', teamId)
          showToast('Wszyscy opuścili drużunę. Zespół został rozwiązany.')
        }
      }

      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', user.id)
      
      if (!error) {
        showToast('Opuściłeś drużynę.')
        fetchTeamsData()
      }
    } catch (err) {
      showToast('Wystąpił błąd przy opuszczaniu drużyny.', 'error')
    }
  }


  const handleCreateTeam = async () => {
    if (!newTeamName || !newTeamTag) return
    const { data: team, error: tErr } = await supabase
      .from('teams')
      .insert({
        team_name: newTeamName,
        tag: newTeamTag.toUpperCase(),
        leader_id: user.id
      })
      .select()
      .single()
    
    if (tErr) {
      showToast('Błąd tworzenia drużyny: ' + tErr.message, 'error')
      return
    }

    // Auto-add leader as accepted member
    await supabase.from('team_members').insert({
      team_id: team.id,
      user_id: user.id,
      status: 'accepted'
    })

    setNewTeamName('')
    setNewTeamTag('')
    fetchTeamsData()
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

  // ── Avatar upload ──
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Wybierz plik graficzny (JPG, PNG, GIF, WebP)')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Plik jest zbyt duży. Maksymalny rozmiar to 2 MB.')
      return
    }

    setAvatarUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { cacheControl: '3600', upsert: true })

    if (uploadError) {
      console.error(uploadError)
      alert('Błąd przesyłania: ' + uploadError.message)
      setAvatarUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    const publicUrl = urlData.publicUrl + '?t=' + Date.now() // cache bust

    const { error: updateError } = await supabase.auth.updateUser({
      data: { ...meta, avatar_url: publicUrl }
    })

    if (updateError) {
      console.error(updateError)
      alert('Błąd aktualizacji profilu')
    } else {
      setAvatarUrl(publicUrl)
      // Refresh user
      const { data: { user: refreshed } } = await supabase.auth.getUser()
      if (refreshed) onAuthChange(refreshed)
    }
    setAvatarUploading(false)
  }

  // ── Profile update ──
  const handleProfileSave = async () => {
    if (!nickname.trim()) { setProfileError('Nick nie może być pusty'); return }
    if (phone && !PHONE_REGEX.test(phone)) { setProfileError('Nieprawidłowy numer telefonu'); return }

    setProfileStatus('loading')
    setProfileError('')

    const fullPhone = phone ? `${dialCode} ${phone.trim()}` : ''
    const { error } = await supabase.auth.updateUser({
      data: {
        ...meta,
        nickname: nickname.trim(),
        display_name: nickname.trim(),
        phone: fullPhone,
        message: message.trim(),
      }
    })

    if (error) {
      console.error(error)
      setProfileError('Błąd aktualizacji: ' + error.message)
      setProfileStatus('error')
    } else {
      setProfileStatus('success')
      const { data: { user: refreshed } } = await supabase.auth.getUser()
      if (refreshed) onAuthChange(refreshed)
      setTimeout(() => setProfileStatus('idle'), 3000)
    }
  }

  // ── Email change ──
  const handleEmailChange = async () => {
    if (!EMAIL_REGEX.test(newEmail)) { setEmailError('Podaj prawidłowy adres e-mail'); return }
    if (newEmail === user.email) { setEmailError('To jest Twój obecny e-mail'); return }

    setEmailStatus('loading')
    setEmailError('')

    const { error } = await supabase.auth.updateUser({ email: newEmail })

    if (error) {
      console.error(error)
      if (error.message.includes('already')) {
        setEmailError('Ten e-mail jest już zajęty')
      } else {
        setEmailError('Błąd: ' + error.message)
      }
      setEmailStatus('error')
    } else {
      setEmailStatus('success')
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

    // Verify current password by re-signing in
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (loginError) {
      setPasswordError('Obecne hasło jest nieprawidłowe')
      setPasswordStatus('error')
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      console.error(error)
      setPasswordError('Błąd: ' + error.message)
      setPasswordStatus('error')
    } else {
      setPasswordStatus('success')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordStatus('idle'), 3000)
    }
  }

  // ── Delete account (real) ──
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'USUŃ') return
    setDeleteStatus('loading')

    const { error } = await supabase.rpc('delete_own_account')

    if (!error) {
      await supabase.auth.signOut()
      onAuthChange(null)
      onNavigate('landing')
    } else {
      console.error(error)
      alert('Błąd usuwania konta: ' + error.message)
      setDeleteStatus('error')
    }
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
          <h1 className="gh-title" data-text={activeTab === 'teams' ? "Moje Drużyny" : "Moje Konto"}>
            {activeTab === 'teams' ? "Moje Drużyny" : "Moje Konto"}
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
              accept="image/*"
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

          {emailError && <p className="account-error">⚠ {emailError}</p>}
          {emailStatus === 'success' && (
            <p className="account-success">
              ✅ Link potwierdzający został wysłany na oba adresy e-mail.
            </p>
          )}

          <button
            className="gh-btn"
            onClick={handleEmailChange}
            disabled={emailStatus === 'loading' || emailStatus === 'success'}
          >
            {emailStatus === 'loading' ? 'Wysyłanie…' : '📧 Zmień e-mail'}
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
          {passwordStatus === 'success' && <p className="account-success">✅ Hasło zmienione!</p>}

          <button
            className="gh-btn"
            onClick={handlePasswordChange}
            disabled={passwordStatus === 'loading'}
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
                        <strong>{inv.team.team_name} [{inv.team.tag}]</strong>
                        <p>Zaprasza Cię do dołączenia</p>
                      </div>
                      <div className="invite-actions">
                        <button className="gh-btn gh-btn--success btn-sm" onClick={() => handleRespondInvite(inv.id, 'accepted')}>Akceptuj</button>
                        <button className="gh-btn gh-btn--outline btn-sm" style={{borderColor: '#f87171', color: '#f87171'}} onClick={() => handleRespondInvite(inv.id, 'rejected')}>Odrzuć</button>
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
                <p style={{color: 'var(--gh-muted)'}}>Nie należysz jeszcze do żadnej drużyny.</p>
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
                          {t.members.map(m => (
                            <div key={m.user_id} className={`member-chip ${m.status === 'pending' ? 'pending' : ''}`}>
                              <img src={m.profile?.avatar_url || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=' + (m.profile?.nickname || 'user')} alt="" />
                              <span>{m.profile?.nickname}</span>
                              {t.leader_id === user.id && m.user_id !== user.id && (
                                <button className="kick-small" onClick={() => handleKickMember(t.id, m.user_id)}>×</button>
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
                              onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (e.target.value.length > 1) handleSearchUsers();
                              }}
                            />
                            {searchQuery.length > 1 && (
                              <div className="search-dropdown">
                                {searching ? <p className="p-2 text-xs">Szukanie...</p> : 
                                 searchResults.length === 0 ? <p className="p-2 text-xs">Brak</p> :
                                 searchResults.map(res => (
                                   <div key={res.id} className="search-res-item" onClick={() => handleInvitePlayer(t.id, res.id)}>
                                     <span>{res.nickname}</span>
                                     <button className="btn-invite">Zaproś</button>
                                   </div>
                                 ))
                                }
                              </div>
                            )}
                          </div>
                        )}
                        <button className="gh-btn gh-btn--outline btn-sm" onClick={() => handleLeaveTeam(t.id)}>Opuść</button>
                      </div>
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
                <button className="gh-btn" style={{marginTop: '1rem'}} onClick={handleCreateTeam}>
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
