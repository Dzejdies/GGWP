const LEVELS = [
  {
    number: 1,
    name: 'Strategia',
    subtitle: 'Strategy',
    icon: '🎯',
    goals: 'Rejestracja na turniej, zbieranie darowizn, informowanie o misji fundacji.',
    userNeeds: 'Szybka rejestracja, jasna informacja, zaufanie do organizatora.',
  },
  {
    number: 2,
    name: 'Zakres',
    subtitle: 'Scope',
    icon: '📐',
    goals: 'Formularz multi-step, sekcja informacyjna, FAQ, licznik odliczający do turnieju, opcja darowizny.',
    userNeeds: 'Treści: regulamin, opis fundacji, harmonogram turnieju.',
  },
  {
    number: 3,
    name: 'Struktura',
    subtitle: 'Structure',
    icon: '🗺️',
    goals: 'Architektura informacji i przepływ użytkownika.',
    userNeeds: 'Landing → O wydarzeniu → Rejestracja (krok 1 → 2 → 3) → Potwierdzenie',
  },
  {
    number: 4,
    name: 'Szkielet',
    subtitle: 'Skeleton',
    icon: '🖼️',
    goals: 'Wireframe\'y interfejsu — rozmieszczenie elementów, nawigacja, CTA.',
    userNeeds: 'Formularz krokowy z progress barem, komunikaty walidacji w czasie rzeczywistym.',
  },
  {
    number: 5,
    name: 'Powierzchnia',
    subtitle: 'Surface',
    icon: '✨',
    goals: 'Finalne mockupy — ciemne tło, neonowe akcenty (klimat gamingowy), typografia, ikony, animacje.',
    userNeeds: 'Spójny design system budujący atmosferę e-sportu i zaufanie do celu charytatywnego.',
  },
]

export default function GarrettLevelsSection() {
  return (
    <section className="analysis-section">
      <div className="analysis-section__header">
        <h2 className="analysis-section__title">5 poziomów Garretta</h2>
        <p className="analysis-section__subtitle">Projektowanie doświadczenia użytkownika wg Jesse James Garretta</p>
      </div>
      <div className="garrett-levels">
        {LEVELS.map((level) => (
          <div key={level.number} className="garrett-level">
            <div className="garrett-level__number">{level.number}</div>
            <div className="garrett-level__content">
              <div className="garrett-level__heading">
                <span className="garrett-level__icon">{level.icon}</span>
                <div>
                  <h3 className="garrett-level__name">{level.name}</h3>
                  <span className="garrett-level__subtitle">{level.subtitle}</span>
                </div>
              </div>
              <div className="garrett-level__body">
                <div className="garrett-level__field">
                  <span className="garrett-level__field-label">Cele strony</span>
                  <p className="garrett-level__field-text">{level.goals}</p>
                </div>
                <div className="garrett-level__field">
                  <span className="garrett-level__field-label">Potrzeby użytkownika</span>
                  <p className="garrett-level__field-text">{level.userNeeds}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
