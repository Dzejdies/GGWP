import { useState, useEffect } from 'react'
import './ProjectPage.css'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'
import Footer from '../components/Footer'

const GOALS = [
  {
    icon: '🎮',
    title: 'Turnieje gamingowe',
    text: 'Organizujemy turnieje e-sportowe, w których gracze mogą rywalizować, jednocześnie wspierając szczytne cele. Każdy turniej jest okazją do zabawy i pomocy potrzebującym.',
  },
  {
    icon: '💰',
    title: 'Zbiórki charytatywne',
    text: 'Zbieramy fundusze podczas wydarzeń na żywo i online. Środki trafiają do organizacji pomagających dzieciom, osobom w kryzysie i inicjatywom edukacyjnym.',
  },
  {
    icon: '🤝',
    title: 'Budowanie społeczności',
    text: 'Łączymy graczy, streamerów i twórców wokół wspólnej idei — że gamingowa społeczność może zmieniać świat na lepsze.',
  },
]

const STATS_FALLBACK = [
  { value: '50+', label: 'Turniejów' },
  { value: '12k+', label: 'Uczestników' },
  { value: '320k zł', label: 'Zebrane środki' },
  { value: '25+', label: 'Partnerów' },
]

const STEPS = [
  {
    number: '01',
    title: 'Zgłoś się do turnieju',
    text: 'Wybierz interesujący Cię turniej i zarejestruj się jako uczestnik lub drużyna. Rejestracja jest darmowa.',
  },
  {
    number: '02',
    title: 'Graj i zbieraj wsparcie',
    text: 'Podczas turnieju widzowie i sponsorzy wpłacają datki. Im dalej zajdziesz, tym więcej uwagi przyciągniesz na cel charytatywny.',
  },
  {
    number: '03',
    title: 'Środki trafiają do potrzebujących',
    text: 'Po każdym wydarzeniu zebrane fundusze przekazywane są transparentnie do wybranych organizacji charytatywnych.',
  },
  {
    number: '04',
    title: 'Raport i podziękowania',
    text: 'Publikujemy pełny raport z zebranych środków i ich przeznaczenia. Każdy uczestnik otrzymuje podziękowanie i certyfikat.',
  },
]

const VALUES = [
  {
    icon: '🌍',
    title: 'Transparentność',
    text: 'Każda złotówka jest rozliczana. Publikujemy raporty finansowe po każdym wydarzeniu.',
  },
  {
    icon: '🎯',
    title: 'Zaangażowanie',
    text: 'Wierzymy, że gaming to nie tylko rozrywka — to platforma do realnej zmiany społecznej.',
  },
  {
    icon: '🛡️',
    title: 'Fair play',
    text: 'Promujemy sportową rywalizację, szacunek i inkluzywność w całej społeczności.',
  },
  {
    icon: '💡',
    title: 'Innowacyjność',
    text: 'Wykorzystujemy nowoczesne technologie, streaming i social media, by dotrzeć do jak najszerszej grupy.',
  },
  {
    icon: '❤️',
    title: 'Empatia',
    text: 'U podstaw naszych działań leży chęć pomocy innym i wrażliwość na potrzeby osób w trudnej sytuacji.',
  },
  {
    icon: '🏆',
    title: 'Pasja',
    text: 'Gaming jest naszą pasją. Łączymy to, co kochamy, z tym, co naprawdę ważne.',
  },
]

// Regex: wymaga formatu xxx@xxx.xxx (min 1 znak przed @, domena z kropką i min 2 znaki TLD)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
// Regex: tylko cyfry, spacje i myślniki, min 4 cyfry (najkrótsze numery na świecie mają 4 cyfry)
const PHONE_REGEX = /^[\d\s\-]{4,}$/

//Regex hasło
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/

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
  { code: 'other', label: '🌍 Inny…' },
]

function RegistrationModal({ onClose }) {
  const [form, setForm] = useState({ nickname: '', email: '', dialCode: '+48', phone: '', password: '', password_confirm: '', message: '' })
  const [customDialCode, setCustomDialCode] = useState('')
  const [customDialError, setCustomDialError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordConfirmError, setPasswordConfirmError] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error

  const isCustomDial = form.dialCode === 'other'
  const effectiveDialCode = isCustomDial ? customDialCode : form.dialCode

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (name === 'email') setEmailError('')
    if (name === 'phone') setPhoneError('')
  }

  const handleEmailBlur = () => {
    if (form.email && !EMAIL_REGEX.test(form.email)) {
      setEmailError('Podaj prawidłowy adres e-mail (np. jan@domena.pl)')
    } else {
      setEmailError('')
    }
  }

  const handlePhoneBlur = () => {
    if (form.phone && !PHONE_REGEX.test(form.phone)) {
      setPhoneError('Podaj prawidłowy numer (min. 4 cyfry)')
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
    if (form.password && !PASSWORD_REGEX.test(form.password)) {
      setPasswordError('Hasło musi zawierać co najmniej 8 znaków, w tym jedną małą literę, jedną dużą literę i jedną cyfrę')
    } else {
      setPasswordError('')
    }
  }
  const handlePasswordConfirmBlur = () => {
    if (form.password_confirm && (form.password_confirm !== form.password)) {
      setPasswordConfirmError('Hasła się nie zgadzają')
    } else {
      setPasswordConfirmError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Walidacja przed wysłaniem
    if (!EMAIL_REGEX.test(form.email)) {
      setEmailError('Podaj prawidłowy adres e-mail (np. jan@domena.pl)')
      return
    }
    if (!PHONE_REGEX.test(form.phone)) {
      setPhoneError('Podaj prawidłowy numer (min. 4 cyfry)')
      return
    }
    if (isCustomDial && !/^\+\d{1,4}$/.test(customDialCode.trim())) {
      setCustomDialError('Format: +XX lub +XXX (np. +351)')
      return
    }
    if (!PASSWORD_REGEX.test(form.password)) {
      setPasswordError("Hasło musi zawierać co najmniej 8 znaków, w tym jedną małą literę, jedną dużą literę i jedną cyfrę")
      return
    }
    if (form.password !== form.password_confirm) {
      setPasswordConfirmError("Hasła się nie zgadzają")
      return
    }
    if (!supabase) {
      setStatus('error')
      return
    }
    setStatus('loading')
    const fullPhone = `${effectiveDialCode} ${form.phone.trim()}`
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          //Metadata
          display_name: form.nickname,
          nickname: form.nickname,
          phone: fullPhone,
          message: form.message,
        },
        emailRedirectTo: window.location.origin + '/#confirmed'
      }
    })
    if (error) {
      console.error(error)
      // Obsługa konkretnych błędów Supabase Auth
      if (error.message.includes('already registered')) {
        setEmailError('Ten e-mail jest już zarejestrowany')
      }
      setStatus('error')
    } else {
      setStatus('success')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose}>✕</button>
        <h2 className="modal__title">🎮 Dołącz do GG WP for Good</h2>

        {status === 'success' ? (
          <div className="modal__success">
            <span className="modal__success-icon">✅</span>
            <p>Zarejestrowano! Sprawdź skrzynkę pocztową aby potwierdzić maila i dokończyć rejstracje.</p>
            <button className="gh-btn" onClick={onClose}>Zamknij</button>
          </div>
        ) : (
          <form className="modal__form" onSubmit={handleSubmit}>
            <label className="modal__label">Nick / imię</label>
            <input
              className="modal__input"
              name="nickname"
              value={form.nickname}
              onChange={handleChange}
              placeholder="np. xShadowHunter"
              required
            />
            <label className="modal__label">E-mail</label>
            <input
              className={`modal__input${emailError ? ' modal__input--error' : form.email && EMAIL_REGEX.test(form.email) ? ' modal__input--valid' : ''}`}
              name="email"
              type="text"
              value={form.email}
              onChange={handleChange}
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
                value={form.dialCode}
                onChange={handleChange}
              >
                {DIAL_CODES.map((d) => (
                  <option key={d.code} value={d.code}>{d.label}</option>
                ))}
              </select>
              <input
                className={`modal__input modal__phone-input${phoneError ? ' modal__input--error' : form.phone && PHONE_REGEX.test(form.phone) ? ' modal__input--valid' : ''}`}
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                onBlur={handlePhoneBlur}
                placeholder="123 456 789"
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
              value={form.password}
              onChange={handleChange}
              onBlur={handlePasswordBlur}
              placeholder="Hasło"
              required
            />
            {passwordError && <p className="modal__field-error">⚠ {passwordError}</p>}
            {/* confirm password */}
            <label className="modal__label">Potwierdź hasło</label>
            <input
              className="modal__input"
              name="password_confirm"
              type="password"
              value={form.password_confirm}
              onChange={handleChange}
              onBlur={handlePasswordConfirmBlur}
              placeholder="Potwierdź hasło"
              required
            />
            {passwordConfirmError && <p className="modal__field-error">⚠ {passwordConfirmError}</p>}
            <label className="modal__label">Wiadomość (opcjonalnie)</label>
            <textarea
              className="modal__input modal__textarea"
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Chcę wesprzeć fundację bo..."
              rows={3}
            />
            {status === 'error' && (
              <p className="modal__error">❌ Coś poszło nie tak. Spróbuj ponownie.</p>
            )}
            <button
              className="gh-btn"
              type="submit"
              disabled={status === 'loading'}
              style={{ marginTop: '0.5rem' }}
            >
              {status === 'loading' ? 'Wysyłanie…' : '🚀 Zapisz się'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ProjectPage({ onNavigate, user, onAuthChange }) {
  const [stats, setStats] = useState(STATS_FALLBACK)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!supabase) return
    supabase
      .from('stats')
      .select('value, label, sort_order')
      .order('sort_order')
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) setStats(data)
      })
  }, [])


  return (
    <div className="gh-page">
      {showModal && <RegistrationModal onClose={() => setShowModal(false)} />}
      <Navbar onNavigate={onNavigate} currentView="project" user={user} onAuthChange={onAuthChange} />

      <main className="gh-main" style={{ marginTop: '73px' }}>
        <h1 className="gh-title" data-text="O projekcie" style={{ marginBottom: '2rem' }}>O projekcie</h1>
        {/* Hero */}
        <section className="project-hero">
          <span className="project-hero__icon">🎮</span>
          <h2 className="project-hero__title">GG WP for Good</h2>
          <p className="project-hero__subtitle">
            Fundacja łącząca świat gamingu z działalnością charytatywną.
            Organizujemy turnieje e-sportowe, z&nbsp;których dochód trafia na cele
            społeczne — bo granie może zmieniać świat.
          </p>
        </section>

        {/* Mission */}
        <div className="mission-banner">
          <p className="mission-banner__label">Nasza misja</p>
          <p className="mission-banner__text">
            Wierzymy, że społeczność graczy ma ogromny potencjał do czynienia dobra.
            GG WP for Good łączy pasję do gier z&nbsp;realnym wpływem społecznym —
            każdy turniej, każdy stream i każda złotówka przybliża nas do lepszego
            świata.
          </p>
        </div>

        {/* Co robimy */}
        <section className="project-section">
          <div className="project-section__header">
            <h2 className="project-section__title">Co robimy?</h2>
            <p className="project-section__subtitle">
              Trzy filary działalności fundacji GG WP for Good
            </p>
          </div>
          <div className="project-grid project-grid--3">
            {GOALS.map((goal) => (
              <div key={goal.title} className="project-card">
                <span className="project-card__icon">{goal.icon}</span>
                <h3 className="project-card__title">{goal.title}</h3>
                <p className="project-card__text">{goal.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Statystyki */}
        <section className="project-section">
          <div className="project-section__header">
            <h2 className="project-section__title">Nasze liczby mówią za siebie</h2>
            <p className="project-section__subtitle">
              Dotychczasowe osiągnięcia fundacji
            </p>
          </div>
          <div className="stats-row">
            {stats.map((stat) => (
              <div key={stat.label} className="stat-card">
                <span className="stat-card__value">{stat.value}</span>
                <span className="stat-card__label">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Wartości */}
        <section className="project-section">
          <div className="project-section__header">
            <h2 className="project-section__title">Nasze wartości</h2>
            <p className="project-section__subtitle">
              Zasady, którymi kierujemy się na co dzień
            </p>
          </div>
          <div className="project-grid project-grid--3">
            {VALUES.map((val) => (
              <div key={val.title} className="project-card">
                <span className="project-card__icon">{val.icon}</span>
                <h3 className="project-card__title">{val.title}</h3>
                <p className="project-card__text">{val.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Jak to działa */}
        <section className="project-section">
          <div className="project-section__header">
            <h2 className="project-section__title">Jak to działa?</h2>
            <p className="project-section__subtitle">
              Od rejestracji do realnej pomocy — cztery proste kroki
            </p>
          </div>
          <div className="steps-list">
            {STEPS.map((step) => (
              <div key={step.number} className="step-item">
                <span className="step-item__number">{step.number}</span>
                <div className="step-item__content">
                  <h3 className="step-item__title">{step.title}</h3>
                  <p className="step-item__text">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <p className="cta-section__text">
            Chcesz dołączyć do kolejnego turnieju lub wesprzeć naszą fundację?
          </p>
          <button className="btn-cta" onClick={() => setShowModal(true)}>
            🎮 Dołącz do GG WP for Good
          </button>
        </section>
      </main>

      <Footer />
    </div>
  )
}
