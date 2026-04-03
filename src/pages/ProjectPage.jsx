import './ProjectPage.css'
import ThemeToggle from '../themeToggle'

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

const STATS = [
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

export default function ProjectPage({ onBack }) {
  return (
    <div className="gh-page">
      <header className="gh-header">
        <div className="gh-header__inner">
          <div>
            <p className="gh-header__label">Projektowanie Interfejsów WWW</p>
            <h1 className="gh-title" data-text="O projekcie">O projekcie</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="gh-btn" style={{ marginTop: 0, marginBottom: 0 }} onClick={onBack}>
              ← Wróć
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="gh-main">
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
            {STATS.map((stat) => (
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
          <button className="btn-cta">
            🎮 Dołącz do GG WP for Good
          </button>
        </section>
      </main>

      <footer className="gh-footer">
        <div className="gh-footer__inner">
          <p>Projekt &mdash; {new Date().getFullYear()}</p>
          <p>O projekcie</p>
        </div>
      </footer>
    </div>
  )
}
