import { useState } from 'react'
import { setAccessToken } from '../lib/api'
import './LoginModal.css'
import './button.css'

const BASE_URL = import.meta.env.VITE_API_URL

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_REGEX = /^[\d\s\-]{4,}$/
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/
const NICKNAME_REGEX = /^[a-zA-Z0-9_-]+$/

const DIAL_CODES = [
  { code: '+48', label: '🇵🇱 +48', placeholder: '123 456 789' },
  { code: '+1', label: '🇺🇸 +1', placeholder: '201 555 0123' },
  { code: '+44', label: '🇬🇧 +44', placeholder: '7911 123456' },
  { code: '+49', label: '🇩🇪 +49', placeholder: '170 1234567' },
  { code: '+33', label: '🇫🇷 +33', placeholder: '6 12 34 56 78' },
  { code: '+34', label: '🇪🇸 +34', placeholder: '612 345 678' },
  { code: '+39', label: '🇮🇹 +39', placeholder: '312 345 6789' },
  { code: '+380', label: '🇺🇦 +380', placeholder: '50 123 4567' },
  { code: '+420', label: '🇨🇿 +420', placeholder: '123 456 789' },
  { code: '+36', label: '🇭🇺 +36', placeholder: '20 123 4567' },
  { code: 'other', label: '🌍 Inny…', placeholder: 'Wpisz numer telefonu' },
]

function getPhoneValidationError(dialCode, phone) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  
  const rule = {
    '+48': { min: 9, max: 9, name: 'Polski (+48)' },
    '+1': { min: 10, max: 10, name: 'USA/Kanady (+1)' },
    '+44': { min: 10, max: 10, name: 'Wielkiej Brytanii (+44)' },
    '+49': { min: 10, max: 11, name: 'Niemiec (+49)' },
    '+33': { min: 9, max: 9, name: 'Francji (+33)' },
    '+34': { min: 9, max: 9, name: 'Hiszpanii (+34)' },
    '+39': { min: 10, max: 10, name: 'Włoch (+39)' },
    '+380': { min: 9, max: 9, name: 'Ukrainy (+380)' },
    '+420': { min: 9, max: 9, name: 'Czech (+420)' },
    '+36': { min: 9, max: 9, name: 'Węgier (+36)' },
  }[dialCode]

  if (rule) {
    if (digits.length < rule.min) {
      return `Numer telefonu dla kraju ${rule.name} musi mieć co najmniej ${rule.min} cyfr.`
    }
    if (digits.length > rule.max) {
      return `Numer telefonu dla kraju ${rule.name} może mieć maksymalnie ${rule.max} cyfr.`
    }
  } else {
    if (digits.length < 4) {
      return 'Numer telefonu musi mieć co najmniej 4 cyfry.'
    }
    if (digits.length > 15) {
      return 'Numer telefonu może mieć maksymalnie 15 cyfr.'
    }
  }
  return null
}

export default function LoginModal({ onClose, onSuccess, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode) // 'login' | 'reset' | 'register'

  // --- Stan logowania ---
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // --- Stan rejestracji ---
  const [regForm, setRegForm] = useState({
    nickname: '',
    email: '',
    dialCode: '+48',
    phone: '',
    password: '',
    password_confirm: '',
  })
  const [customDialCode, setCustomDialCode] = useState('')
  const [customDialError, setCustomDialError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordConfirmError, setPasswordConfirmError] = useState('')
  const [nicknameError, setNicknameError] = useState('')
  const [regStatus, setRegStatus] = useState('idle') // idle | loading | success | error
  const [regError, setRegError] = useState('')

  // ───── Logowanie ─────

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!loginEmail || !loginPassword) { setLoginError('Uzupełnij wszystkie pola'); return }

    setLoginLoading(true)
    setLoginError('')

    try {
      const res = await fetch(`${BASE_URL}/ggwp/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 429) {
          setLoginError('Zbyt wiele prób. Spróbuj ponownie za 15 minut.')
        } else if (res.status === 423) {
          setLoginError(data?.error || 'Konto tymczasowo zablokowane.')
        } else {
          setLoginError('Nieprawidłowy e-mail lub hasło')
        }
        return
      }
      setAccessToken(data.accessToken)
      onSuccess(data.user)
      onClose()
    } catch {
      setLoginError('Błąd połączenia. Spróbuj ponownie.')
    } finally {
      setLoginLoading(false)
    }
  }

  // ───── Rejestracja ─────

  const isCustomDial = regForm.dialCode === 'other'
  const effectiveDialCode = isCustomDial ? customDialCode : regForm.dialCode

  const handleRegChange = (e) => {
    const { name, value } = e.target
    setRegForm(prev => ({ ...prev, [name]: value }))
    if (name === 'nickname') setNicknameError('')
    if (name === 'email') setEmailError('')
    if (name === 'phone') setPhoneError('')
    if (name === 'password') setPasswordError('')
    if (name === 'password_confirm') setPasswordConfirmError('')
    setRegError('')
  }

  const handleEmailBlur = () => {
    if (regForm.email && !EMAIL_REGEX.test(regForm.email)) {
      setEmailError('Podaj prawidłowy adres e-mail (np. jan@domena.pl)')
    } else {
      setEmailError('')
    }
  }

  const handlePhoneBlur = () => {
    if (regForm.phone) {
      if (!PHONE_REGEX.test(regForm.phone)) {
        setPhoneError('Podaj prawidłowy numer (dozwolone tylko cyfry, spacje i myślniki)')
      } else {
        const err = getPhoneValidationError(regForm.dialCode === 'other' ? customDialCode : regForm.dialCode, regForm.phone)
        setPhoneError(err || '')
      }
    } else {
      setPhoneError('')
    }
  }

  const handleCustomDialBlur = () => {
    if (customDialCode && !/^\+\d{1,4}$/.test(customDialCode.trim())) {
      setCustomDialError('Format: +XX lub +XXX (np. +351)')
    } else {
      setCustomDialError('')
    }
  }

  const handlePasswordBlur = () => {
    if (regForm.password && !PASSWORD_REGEX.test(regForm.password)) {
      setPasswordError('Hasło musi zawierać co najmniej 8 znaków, w tym jedną małą i dużą literę oraz cyfrę')
    } else {
      setPasswordError('')
    }
  }

  const handlePasswordConfirmBlur = () => {
    if (regForm.password_confirm && regForm.password_confirm !== regForm.password) {
      setPasswordConfirmError('Hasła się nie zgadzają')
    } else {
      setPasswordConfirmError('')
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()

    // Validate all fields at once so user sees every issue
    let hasError = false

    if (!regForm.nickname.trim() || regForm.nickname.trim().length < 3) {
      setNicknameError('Nick musi mieć co najmniej 3 znaki.')
      hasError = true
    } else if (regForm.nickname.trim().length > 50) {
      setNicknameError('Nick może mieć maksymalnie 50 znaków.')
      hasError = true
    } else if (!NICKNAME_REGEX.test(regForm.nickname.trim())) {
      setNicknameError('Nick może zawierać tylko litery, cyfry, podkreślnik (_) i myślnik (-).')
      hasError = true
    }

    if (!EMAIL_REGEX.test(regForm.email)) {
      setEmailError('Podaj prawidłowy adres e-mail')
      hasError = true
    }

    if (!regForm.phone.trim()) {
      setPhoneError('Numer telefonu jest wymagany.')
      hasError = true
    } else if (!PHONE_REGEX.test(regForm.phone)) {
      setPhoneError('Podaj prawidłowy numer (dozwolone tylko cyfry, spacje i myślniki)')
      hasError = true
    } else {
      const phoneErr = getPhoneValidationError(regForm.dialCode === 'other' ? customDialCode : regForm.dialCode, regForm.phone)
      if (phoneErr) {
        setPhoneError(phoneErr)
        hasError = true
      }
    }

    if (isCustomDial && !/^\+\d{1,4}$/.test(customDialCode.trim())) {
      setCustomDialError('Format: +XX lub +XXX (np. +351)')
      hasError = true
    }

    if (!regForm.password) {
      setPasswordError('Hasło jest wymagane.')
      hasError = true
    } else if (!PASSWORD_REGEX.test(regForm.password)) {
      setPasswordError('Hasło musi zawierać co najmniej 8 znaków, w tym jedną małą i dużą literę oraz cyfrę')
      hasError = true
    }

    if (regForm.password !== regForm.password_confirm) {
      setPasswordConfirmError('Hasła się nie zgadzają')
      hasError = true
    }

    if (hasError) return

    setRegStatus('loading')
    const fullPhone = `${effectiveDialCode} ${regForm.phone.trim()}`

    try {
      const res = await fetch(`${BASE_URL}/ggwp/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regForm.email,
          password: regForm.password,
          nickname: regForm.nickname.trim(),
          phone: fullPhone,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        if (res.status === 429) {
          setRegError('Zbyt wiele prób rejestracji. Spróbuj ponownie za godzinę.')
        } else if (res.status === 422 || res.status === 400) {
          // Show specific validation issues from the server if available
          if (data?.issues && Array.isArray(data.issues)) {
            const msgs = data.issues.map(i => {
              const field = i.path?.[0]
              if (field === 'nickname') return 'Nick: ' + i.message
              if (field === 'email') return 'E-mail: ' + i.message
              if (field === 'password') return 'Hasło: ' + i.message
              return i.message
            })
            setRegError(msgs.join(' | '))
          } else {
            setRegError(data?.error || 'Nieprawidłowe dane. Sprawdź formularz.')
          }
        } else if (res.status === 409) {
          setRegError('Konto z tym adresem e-mail lub nickiem już istnieje.')
        } else {
          setRegError(data?.error || 'Coś poszło nie tak. Spróbuj ponownie.')
        }
        setRegStatus('error')
        return
      }
      const regData = await res.json().catch(() => ({}))
      if (regData?.accessToken) {
        setAccessToken(regData.accessToken)
        onSuccess(regData.user)
        onClose()
        return
      }

      const loginRes = await fetch(`${BASE_URL}/ggwp/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: regForm.email, password: regForm.password }),
      })
      const loginData = await loginRes.json()
      if (loginRes.ok) {
        setAccessToken(loginData.accessToken)
        onSuccess(loginData.user)
        onClose()
      } else {
        setRegError('Konto z tym adresem e-mail lub nickiem już istnieje.')
        setRegStatus('error')
      }
    } catch {
      setRegError('Błąd połączenia. Spróbuj ponownie.')
      setRegStatus('error')
    }
  }

  // ───── Render ─────

  const showTabs = mode === 'login' || mode === 'register'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal login-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose}>✕</button>

        {showTabs && (
          <div className="login-modal__tabs">
            <button
              type="button"
              className={`login-modal__tab${mode === 'login' ? ' login-modal__tab--active' : ''}`}
              onClick={() => setMode('login')}
            >
              Zaloguj się
            </button>
            <button
              type="button"
              className={`login-modal__tab${mode === 'register' ? ' login-modal__tab--active' : ''}`}
              onClick={() => setMode('register')}
            >
              Zarejestruj się
            </button>
          </div>
        )}

        {/* ── Logowanie ── */}
        {mode === 'login' && (
          <form className="modal__form" onSubmit={handleLogin}>
            <label className="modal__label">E-mail</label>
            <input
              className="modal__input"
              type="email"
              value={loginEmail}
              onChange={(e) => { setLoginEmail(e.target.value); setLoginError('') }}
              placeholder="twoj@email.pl"
              required
              autoComplete="email"
            />

            <label className="modal__label">Hasło</label>
            <input
              className="modal__input"
              type="password"
              value={loginPassword}
              onChange={(e) => { setLoginPassword(e.target.value); setLoginError('') }}
              placeholder="Hasło"
              required
              autoComplete="current-password"
            />

            {loginError && <p className="modal__error">❌ {loginError}</p>}

            <button className="gh-btn login-modal__submit" type="submit" disabled={loginLoading}>
              {loginLoading ? 'Logowanie…' : '🚀 Zaloguj się'}
            </button>
          </form>
        )}

        {/* ── Rejestracja ── */}
        {mode === 'register' && (
          regStatus === 'success' ? (
            <div className="modal__success">
              <span className="modal__success-icon">✅</span>
              <p>Konto zostało utworzone! Możesz się teraz zalogować.</p>
              <button className="gh-btn" onClick={onClose}>Zamknij</button>
            </div>
          ) : (
            <form className="modal__form" onSubmit={handleRegister}>
              <label className="modal__label">Nick / imię</label>
              <input
                className={`modal__input${nicknameError ? ' modal__input--error' : regForm.nickname.trim().length >= 3 ? ' modal__input--valid' : ''}`}
                name="nickname"
                value={regForm.nickname}
                onChange={handleRegChange}
                onBlur={() => {
                  const n = regForm.nickname.trim()
                  if (n.length > 0 && n.length < 3) {
                    setNicknameError('Nick musi mieć co najmniej 3 znaki.')
                  } else if (n.length > 50) {
                    setNicknameError('Nick może mieć maksymalnie 50 znaków.')
                  } else if (n.length > 0 && !NICKNAME_REGEX.test(n)) {
                    setNicknameError('Nick może zawierać tylko litery, cyfry, podkreślnik (_) i myślnik (-).')
                  } else {
                    setNicknameError('')
                  }
                }}
                placeholder="np. xShadowHunter"
                maxLength={50}
                required
              />
              {nicknameError && <p className="modal__field-error">⚠ {nicknameError}</p>}

              <label className="modal__label">E-mail</label>
              <input
                className={`modal__input${emailError ? ' modal__input--error' : regForm.email && EMAIL_REGEX.test(regForm.email) ? ' modal__input--valid' : ''}`}
                name="email"
                type="text"
                value={regForm.email}
                onChange={handleRegChange}
                onBlur={handleEmailBlur}
                placeholder="twoj@email.pl"
                required
              />
              {emailError && <p className="modal__field-error">⚠ {emailError}</p>}

              <label className="modal__label">Numer telefonu</label>
              <div className="modal__phone-row">
                <select
                  className="modal__dial-select"
                  name="dialCode"
                  value={regForm.dialCode}
                  onChange={handleRegChange}
                >
                  {DIAL_CODES.map((d) => (
                    <option key={d.code} value={d.code}>{d.label}</option>
                  ))}
                </select>
                <input
                  className={`modal__input modal__phone-input${phoneError ? ' modal__input--error' : regForm.phone && PHONE_REGEX.test(regForm.phone) ? ' modal__input--valid' : ''}`}
                  name="phone"
                  type="tel"
                  value={regForm.phone}
                  onChange={handleRegChange}
                  onBlur={handlePhoneBlur}
                  placeholder={DIAL_CODES.find(d => d.code === regForm.dialCode)?.placeholder || '123 456 789'}
                  required
                />
              </div>
              {isCustomDial && (
                <input
                  className={`modal__input modal__custom-dial${customDialError ? ' modal__input--error' : customDialCode && /^\+\d{1,4}$/.test(customDialCode.trim()) ? ' modal__input--valid' : ''}`}
                  value={customDialCode}
                  onChange={(e) => { setCustomDialCode(e.target.value); setCustomDialError('') }}
                  onBlur={handleCustomDialBlur}
                  placeholder="Wpisz kod kraju, np. +351"
                />
              )}
              {customDialError && <p className="modal__field-error">⚠ {customDialError}</p>}
              {phoneError && <p className="modal__field-error">⚠ {phoneError}</p>}

              <label className="modal__label">Hasło</label>
              <input
                className="modal__input"
                name="password"
                type="password"
                value={regForm.password}
                onChange={handleRegChange}
                onBlur={handlePasswordBlur}
                placeholder="Min. 8 znaków, wielka litera, cyfra"
                required
              />
              {passwordError && <p className="modal__field-error">⚠ {passwordError}</p>}

              <label className="modal__label">Potwierdź hasło</label>
              <input
                className="modal__input"
                name="password_confirm"
                type="password"
                value={regForm.password_confirm}
                onChange={handleRegChange}
                onBlur={handlePasswordConfirmBlur}
                placeholder="Powtórz hasło"
                required
              />
              {passwordConfirmError && <p className="modal__field-error">⚠ {passwordConfirmError}</p>}

              {regError && <p className="modal__error">❌ {regError}</p>}

              <button
                className="gh-btn login-modal__submit"
                type="submit"
                disabled={
                  regStatus === 'loading' ||
                  !regForm.nickname.trim() ||
                  !regForm.email.trim() ||
                  !regForm.phone.trim() ||
                  !regForm.password ||
                  !regForm.password_confirm ||
                  (isCustomDial && !customDialCode.trim())
                }
              >
                {regStatus === 'loading' ? 'Tworzenie konta…' : '🎮 Utwórz konto'}
              </button>
            </form>
          )
        )}
      </div>
    </div>
  )
}
