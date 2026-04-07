import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
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

export default function AccountPage({ onNavigate, user, onAuthChange }) {
  const meta = user?.user_metadata || {}
  const parsed = parsePhone(meta.phone)

  // Profile state
  const [nickname, setNickname] = useState(meta.nickname || meta.display_name || '')
  const [dialCode, setDialCode] = useState(parsed.dialCode)
  const [phone, setPhone] = useState(parsed.phone)
  const [message, setMessage] = useState(meta.message || '')
  const [profileStatus, setProfileStatus] = useState('idle')
  const [profileError, setProfileError] = useState('')

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
      <Navbar onNavigate={onNavigate} currentView="account" user={user} onAuthChange={onAuthChange} />

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
        <h1 className="gh-title" data-text="Moje konto" style={{ marginBottom: '2rem' }}>Moje konto</h1>

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
      </main>

      <Footer />
    </div>
  )
}
