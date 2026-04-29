const HEART = [
  {
    letter: 'H',
    category: 'Happiness',
    color: 'var(--gh-purple)',
    icon: '😊',
    goal: 'Gracze czują satysfakcję z platformy i chętnie polecają ją innym.',
    signal: 'Oceny po turnieju, dobrowolne powroty, pozytywne komentarze w czacie drużynowym.',
    metric: '% pozytywnych odpowiedzi w ankiecie post-event (cel: >70%)',
  },
  {
    letter: 'E',
    category: 'Engagement',
    color: 'var(--gh-cyan)',
    icon: '⚡',
    goal: 'Użytkownicy aktywnie korzystają z funkcji platformy między turniejami.',
    signal: 'Wejścia na dashboard, kliknięcia powiadomień, aktywność w PartyChat drużyny.',
    metric: 'Średnia liczba sesji / tydzień na aktywnego gracza (cel: ≥3)',
  },
  {
    letter: 'A',
    category: 'Adoption',
    color: '#ec4899',
    icon: '🚀',
    goal: 'Nowi użytkownicy kończą pełny onboarding i zapisują się na pierwszy turniej.',
    signal: 'Rejestracja + weryfikacja email + zapisanie się do turnieju w ciągu 7 dni.',
    metric: '% ukończenia pełnego onboardingu (cel: >50%)',
  },
  {
    letter: 'R',
    category: 'Retention',
    color: '#f59e0b',
    icon: '🔄',
    goal: 'Gracze wracają na kolejne turnieje i pozostają w drużynach.',
    signal: 'Drugi i trzeci zapis do turnieju, aktywność drużyny po miesiącu.',
    metric: '% graczy zapisanych do ≥2 turniejów w ciągu 30 dni (cel: >30%)',
  },
  {
    letter: 'T',
    category: 'Task Success',
    color: '#10b981',
    icon: '✅',
    goal: 'Kluczowe akcje użytkownika są wykonywane sprawnie i bez frustracji.',
    signal: 'Ukończenie WizardRegistrationModal (4 kroki), aktualizacja profilu, invite do drużyny.',
    metric: '% prób zapisu do turnieju zakończonych sukcesem (cel: >80%)',
  },
]

export default function HEARTSection() {
  return (
    <section className="analysis-section">
      <div className="analysis-section__header">
        <h2 className="analysis-section__title">Metryki HEART</h2>
        <p className="analysis-section__subtitle">Framework Google — cele, sygnały i metryki dla platformy GGWP</p>
      </div>
      <div className="heart-grid">
        {HEART.map((item) => (
          <div key={item.letter} className="heart-row">
            <div className="heart-row__letter" style={{ color: item.color, borderColor: item.color }}>
              {item.letter}
            </div>
            <div className="heart-row__content">
              <div className="heart-row__header">
                <span className="heart-row__icon">{item.icon}</span>
                <span className="heart-row__category">{item.category}</span>
              </div>
              <div className="heart-row__fields">
                <div className="heart-row__field">
                  <span className="heart-row__field-label">Cel</span>
                  <p className="heart-row__field-text">{item.goal}</p>
                </div>
                <div className="heart-row__field">
                  <span className="heart-row__field-label">Sygnał</span>
                  <p className="heart-row__field-text">{item.signal}</p>
                </div>
                <div className="heart-row__field heart-row__field--metric">
                  <span className="heart-row__field-label">Metryka</span>
                  <p className="heart-row__field-text">{item.metric}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
