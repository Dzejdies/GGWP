import { useState } from 'react'
import { supabase } from '../lib/supabase'
import './LoginModal.css'

export default function LoginModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState('login') // 'login' | 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Uzupełnij wszystkie pola'); return }
    if (!supabase) { setError('Brak połączenia z bazą'); return }

    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      console.error(authError)
      if (authError.message.includes('Invalid login credentials')) {
        setError('Nieprawidłowy e-mail lub hasło')
      } else if (authError.message.includes('Email not confirmed')) {
        setError('Potwierdź swój e-mail przed zalogowaniem')
      } else {
        setError('Coś poszło nie tak. Spróbuj ponownie.')
      }
      setLoading(false)
    } else {
      onSuccess(data.session)
      onClose()
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!email) { setError('Podaj adres e-mail'); return }
    if (!supabase) { setError('Brak połączenia z bazą'); return }

    setLoading(true)
    setError('')

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/#reset-password',
    })

    if (resetError) {
      console.error(resetError)
      if (resetError.message.includes('rate limit')) {
        setError('Zbyt wiele prób. Spróbuj ponownie za chwilę.')
      } else {
        setError('Coś poszło nie tak. Spróbuj ponownie.')
      }
    } else {
      setResetSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal login-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose}>✕</button>

        {mode === 'login' ? (
          <>
            <h2 className="modal__title">🔐 Zaloguj się</h2>
            <form className="modal__form" onSubmit={handleSubmit}>
              <label className="modal__label">E-mail</label>
              <input
                className="modal__input"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                placeholder="twoj@email.pl"
                required
                autoComplete="email"
              />

              <label className="modal__label">Hasło</label>
              <input
                className="modal__input"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                placeholder="Hasło"
                required
                autoComplete="current-password"
              />

              <button
                type="button"
                className="login-modal__forgot"
                onClick={() => { setMode('reset'); setError(''); setResetSent(false) }}
              >
                Zapomniałeś hasła?
              </button>

              {error && <p className="modal__error">❌ {error}</p>}

              <button
                className="gh-btn login-modal__submit"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Logowanie…' : '🚀 Zaloguj się'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="modal__title">🔑 Resetuj hasło</h2>
            {resetSent ? (
              <div className="modal__success">
                <span className="modal__success-icon">📧</span>
                <p>Link do resetu hasła został wysłany na <strong>{email}</strong></p>
                <p style={{ fontSize: '0.8rem', color: 'var(--gh-muted)', marginTop: '0.5rem' }}>
                  Sprawdź skrzynkę (również spam). Link wygasa po godzinie.
                </p>
                <button className="gh-btn" onClick={onClose}>Zamknij</button>
              </div>
            ) : (
              <form className="modal__form" onSubmit={handleResetPassword}>
                <p style={{ fontSize: '0.875rem', color: 'var(--gh-muted)', marginBottom: '0.5rem' }}>
                  Podaj adres e-mail przypisany do konta. Wyślemy Ci link do zresetowania hasła.
                </p>
                <label className="modal__label">E-mail</label>
                <input
                  className="modal__input"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  placeholder="twoj@email.pl"
                  required
                  autoComplete="email"
                />

                {error && <p className="modal__error">❌ {error}</p>}

                <button
                  className="gh-btn login-modal__submit"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Wysyłanie…' : '📧 Wyślij link'}
                </button>

                <button
                  type="button"
                  className="login-modal__forgot"
                  onClick={() => { setMode('login'); setError('') }}
                >
                  ← Powrót do logowania
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}
