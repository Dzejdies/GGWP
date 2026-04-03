import './PlanPage.css'
import ThemeToggle from '../themeToggle'

const METHODOLOGY = [
  {
    icon: '🔄',
    title: 'Iteracyjne podejście',
    text: 'Pracujemy w krótkich iteracjach. Każda dostarcza działającą wersję produktu, którą testujemy i ulepszamy.',
    tag: 'Agile',
  },
  {
    icon: '📋',
    title: 'Zarządzanie zadaniami',
    text: 'Korzystamy z tablicy Kanban do śledzenia postępów. Każde zadanie ma jasny opis, priorytet i osobę odpowiedzialną.',
    tag: 'Kanban',
  },
  {
    icon: '🔀',
    title: 'Kontrola wersji',
    text: 'Git z gałęziami feature — każda funkcjonalność rozwijana oddzielnie. Merge dopiero po code review.',
    tag: 'Git Flow',
  },
]

const TIMELINE = [
  {
    icon: '📐',
    phase: 'Faza 1',
    title: 'Planowanie i analiza UX',
    text: 'Definiowanie grupy docelowej, person, potrzeb użytkowników i organizatorów. Przygotowanie modelu Garretta.',
    tasks: ['Analiza UX', 'Persony', 'Model Garretta', 'Mapa strony'],
  },
  {
    icon: '🎨',
    phase: 'Faza 2',
    title: 'Projektowanie interfejsu',
    text: 'Tworzenie wireframe\'ów, prototypów high-fidelity i systemu designu. Ustalenie palety kolorów, typografii i komponentów.',
    tasks: ['Wireframes', 'Prototyp Figma', 'Design System', 'Responsywność'],
  },
  {
    icon: '⚙️',
    phase: 'Faza 3',
    title: 'Implementacja frontendu',
    text: 'Kodowanie aplikacji w React + Vite. Budowa komponentów, stron, nawigacji i interaktywnych elementów zgodnie z projektem.',
    tasks: ['Komponenty React', 'Routing', 'Animacje', 'Dark mode'],
  },
  {
    icon: '🔌',
    phase: 'Faza 4',
    title: 'Backend i integracja',
    text: 'Przygotowanie endpointów API, bazy danych i logiki biznesowej. Połączenie frontendu z backendem.',
    tasks: ['REST API', 'Baza danych', 'Autentykacja', 'Walidacja'],
  },
  {
    icon: '🧪',
    phase: 'Faza 5',
    title: 'Testy i optymalizacja',
    text: 'Testy jednostkowe, integracyjne i manualne. Optymalizacja wydajności, dostępności i SEO.',
    tasks: ['Testy', 'Audyt a11y', 'Lighthouse', 'Bug fixes'],
  },
  {
    icon: '🚀',
    phase: 'Faza 6',
    title: 'Wdrożenie i prezentacja',
    text: 'Deploy aplikacji, przygotowanie dokumentacji końcowej i prezentacja projektu.',
    tasks: ['Deploy', 'Dokumentacja', 'Prezentacja', 'Demo'],
  },
]

const TECH_STACK = [
  { icon: '⚛️', name: 'React 18', role: 'UI Framework' },
  { icon: '⚡', name: 'Vite', role: 'Bundler' },
  { icon: '🎨', name: 'Tailwind CSS 4', role: 'Style' },
  { icon: '☕', name: 'Java / Spring', role: 'Backend' },
  { icon: '🗃️', name: 'PostgreSQL', role: 'Baza danych' },
  { icon: '🔧', name: 'Git + GitHub', role: 'Wersjonowanie' },
  { icon: '📦', name: 'npm', role: 'Pakiety' },
  { icon: '🖼️', name: 'Figma', role: 'Projektowanie' },
]

const ROLES = [
  {
    name: 'Brajan Szczepańczyk',
    initials: 'BS',
    gradient: 'var(--gh-avatar-g1)',
    tasks: [
      'Projektowanie i implementacja backendu (Java / Spring)',
      'Modelowanie bazy danych (PostgreSQL)',
      'REST API i logika biznesowa',
      'Integracja frontend–backend',
      'Code review i merge do main',
    ],
  },
  {
    name: 'Mateusz Kołodziejczyk',
    initials: 'MK',
    gradient: 'var(--gh-avatar-g2)',
    tasks: [
      'Implementacja frontendu (React + Vite)',
      'Budowa komponentów i stron',
      'Stylowanie (Tailwind CSS) i responsywność',
      'Animacje i interakcje UI',
      'Testy frontendowe i audyt UX',
    ],
  },
]

const PRINCIPLES = [
  {
    icon: '✅',
    title: 'Definition of Done',
    text: 'Zadanie jest ukończone, gdy kod przeszedł review, działa na wszystkich rozdzielczościach i jest zgodny z designem.',
  },
  {
    icon: '🔒',
    title: 'Main jest święty',
    text: 'Żaden push bezpośrednio na main. Każda zmiana przez pull request z code review.',
  },
  {
    icon: '📝',
    title: 'Dokumentacja na bieżąco',
    text: 'README, komentarze w kodzie i notatki z decyzji projektowych aktualizowane na bieżąco.',
  },
  {
    icon: '🤝',
    title: 'Regularna komunikacja',
    text: 'Krótkie stand-upy i wspólne sesje planowania, by utrzymać synchronizację.',
  },
]

export default function PlanPage({ onBack }) {
  return (
    <div className="gh-page">
      <header className="gh-header">
        <div className="gh-header__inner">
          <div>
            <p className="gh-header__label">Projektowanie Interfejsów WWW</p>
            <h1 className="gh-title" data-text="Plan realizacji">Plan realizacji</h1>
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
        {/* Intro */}
        <div className="plan-intro">
          <span className="plan-intro__icon">🗺️</span>
          <h2 className="plan-intro__title">Jak zamierzamy to zbudować?</h2>
          <p className="plan-intro__text">
            Nasz plan opiera się na iteracyjnym podejściu, podziale odpowiedzialności
            i&nbsp;sprawdzonych narzędziach. Poniżej przedstawiamy metodologię pracy,
            harmonogram, stos technologiczny i podział ról w&nbsp;zespole.
          </p>
        </div>

        {/* Metodologia */}
        <section className="plan-section">
          <div className="plan-section__header">
            <h2 className="plan-section__title">Metodologia pracy</h2>
            <p className="plan-section__subtitle">
              Jak organizujemy pracę nad projektem
            </p>
          </div>
          <div className="plan-grid plan-grid--3">
            {METHODOLOGY.map((m) => (
              <div key={m.title} className="plan-card">
                <span className="plan-card__icon">{m.icon}</span>
                <span className="plan-card__tag">{m.tag}</span>
                <h3 className="plan-card__title">{m.title}</h3>
                <p className="plan-card__text">{m.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Harmonogram */}
        <section className="plan-section">
          <div className="plan-section__header">
            <h2 className="plan-section__title">Harmonogram projektu</h2>
            <p className="plan-section__subtitle">
              Sześć faz prowadzących od pomysłu do gotowej aplikacji
            </p>
          </div>
          <div className="timeline">
            {TIMELINE.map((item) => (
              <div key={item.phase} className="timeline-item">
                <div className="timeline-item__dot">{item.icon}</div>
                <div className="timeline-item__body">
                  <span className="timeline-item__phase">{item.phase}</span>
                  <h3 className="timeline-item__title">{item.title}</h3>
                  <p className="timeline-item__text">{item.text}</p>
                  <div className="timeline-item__tasks">
                    {item.tasks.map((t) => (
                      <span key={t} className="timeline-item__task-tag">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Stos technologiczny */}
        <section className="plan-section">
          <div className="plan-section__header">
            <h2 className="plan-section__title">Stos technologiczny</h2>
            <p className="plan-section__subtitle">
              Narzędzia i technologie, na których opieramy projekt
            </p>
          </div>
          <div className="tech-grid">
            {TECH_STACK.map((tech) => (
              <div key={tech.name} className="tech-badge">
                <span className="tech-badge__icon">{tech.icon}</span>
                <div className="tech-badge__info">
                  <span className="tech-badge__name">{tech.name}</span>
                  <span className="tech-badge__role">{tech.role}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Podział ról */}
        <section className="plan-section">
          <div className="plan-section__header">
            <h2 className="plan-section__title">Podział ról</h2>
            <p className="plan-section__subtitle">
              Kto za co odpowiada w zespole
            </p>
          </div>
          <div className="roles-row">
            {ROLES.map((role) => (
              <div key={role.name} className="role-card">
                <div
                  className="role-card__avatar"
                  style={{ background: role.gradient }}
                >
                  {role.initials}
                </div>
                <h3 className="role-card__name">{role.name}</h3>
                <ul className="role-card__tasks">
                  {role.tasks.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Zasady pracy */}
        <section className="plan-section">
          <div className="plan-section__header">
            <h2 className="plan-section__title">Zasady pracy</h2>
            <p className="plan-section__subtitle">
              Reguły, które pozwalają nam pracować efektywnie
            </p>
          </div>
          <div className="plan-grid plan-grid--2">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="plan-card">
                <span className="plan-card__icon">{p.icon}</span>
                <h3 className="plan-card__title">{p.title}</h3>
                <p className="plan-card__text">{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Podsumowanie */}
        <div className="summary-banner">
          <h2 className="summary-banner__title">📌 Cel końcowy</h2>
          <p className="summary-banner__text">
            Dostarczyć w pełni funkcjonalną aplikację webową dla fundacji GG&nbsp;WP for Good,
            która umożliwi organizację turniejów charytatywnych, zbieranie funduszy
            i&nbsp;budowanie społeczności graczy wspierających dobre cele.
          </p>
        </div>
      </main>

      <footer className="gh-footer">
        <div className="gh-footer__inner">
          <p>Projekt &mdash; {new Date().getFullYear()}</p>
          <p>Plan realizacji</p>
        </div>
      </footer>
    </div>
  )
}
