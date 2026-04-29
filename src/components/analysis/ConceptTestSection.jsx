const TEST_INFO = {
  date: '2026-04-22',
  participantCount: 0,
  method: 'Do uzupełnienia po testach',
  material: 'Prototyp lo-fi Figma + działająca aplikacja GGWP',
  duration: '~15–20 minut / osoba',
}

const TASKS = [
  {
    id: 1,
    scenario: 'Rejestracja konta',
    description: 'Znajdź sposób na założenie konta i przejdź przez cały proces rejestracji.',
    successCriteria: 'Dotarcie do strony potwierdzenia email',
  },
  {
    id: 2,
    scenario: 'Zapis do turnieju',
    description: 'Zapisz się do dowolnego otwartego turnieju jako gracz solo lub jako drużyna.',
    successCriteria: 'Ukończenie WizardRegistrationModal (4 kroki)',
  },
  {
    id: 3,
    scenario: 'Stworzenie drużyny',
    description: 'Wejdź w ustawienia konta i utwórz nową drużynę z wybraną nazwą.',
    successCriteria: 'Drużyna widoczna w zakładce Drużyny',
  },
  {
    id: 4,
    scenario: 'Znalezienie informacji',
    description: 'Sprawdź kiedy startuje najbliższy turniej i ile drużyn już się zapisało.',
    successCriteria: 'Podanie poprawnej daty i liczby drużyn',
  },
]

const QUESTIONS = [
  'Jak oceniasz przejrzystość nawigacji po platformie? (1–5)',
  'Czy łatwo było znaleźć jak zapisać się do turnieju?',
  'Co Cię zaskoczyło (pozytywnie lub negatywnie)?',
  'Czego brakuje w porównaniu do innych platform gamingowych które znasz?',
  'Czy poleciłbyś/poleciłabyś GGWP znajomym? Dlaczego?',
]

const RESULTS = []

export default function ConceptTestSection() {
  return (
    <section className="analysis-section">
      <div className="analysis-section__header">
        <h2 className="analysis-section__title">Testy Koncepcji — Raport</h2>
        <p className="analysis-section__subtitle">Badanie z potencjalną grupą docelową · wyniki i wnioski</p>
      </div>

      {/* Metadata */}
      <div className="analysis-grid analysis-grid--2">
        <div className="analysis-card">
          <div className="analysis-card__header">
            <span className="analysis-card__icon">📋</span>
            <span className="analysis-card__title">Informacje o badaniu</span>
          </div>
          <ul className="analysis-list">
            <li><strong>Data:</strong> {TEST_INFO.date}</li>
            <li><strong>Liczba uczestników:</strong> {TEST_INFO.participantCount > 0 ? TEST_INFO.participantCount : 'Do uzupełnienia'}</li>
            <li><strong>Metoda:</strong> {TEST_INFO.method}</li>
            <li><strong>Materiał:</strong> {TEST_INFO.material}</li>
            <li><strong>Czas trwania:</strong> {TEST_INFO.duration}</li>
          </ul>
        </div>

        <div className="analysis-card">
          <div className="analysis-card__header">
            <span className="analysis-card__icon">❓</span>
            <span className="analysis-card__title">Pytania do uczestników</span>
          </div>
          <ul className="analysis-list">
            {QUESTIONS.map((q, i) => <li key={i}>{q}</li>)}
          </ul>
        </div>
      </div>

      {/* Tasks */}
      <div className="analysis-card">
        <div className="analysis-card__header">
          <span className="analysis-card__icon">🎮</span>
          <span className="analysis-card__title">Scenariusze zadań</span>
        </div>
        <div className="concept-tasks">
          {TASKS.map((task) => (
            <div key={task.id} className="concept-task">
              <div className="concept-task__num-col">
                <span className="concept-task__num">{task.id}</span>
              </div>
              <div className="concept-task__body">
                <strong className="concept-task__scenario">{task.scenario}</strong>
                <p className="concept-task__desc">{task.description}</p>
                <span className="concept-task__criteria">Kryterium sukcesu: {task.successCriteria}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Results placeholder */}
      <div className="analysis-card concept-results-placeholder">
        <div className="analysis-card__header">
          <span className="analysis-card__icon">📊</span>
          <span className="analysis-card__title">Wyniki i komentarze uczestników</span>
        </div>
        <p className="concept-results-placeholder__text">
          Sekcja do uzupełnienia po przeprowadzeniu testów.<br />
          Każdy uczestnik · zadanie · wynik (sukces/porażka) · komentarz.
        </p>
        <div className="concept-results-table">
          <div className="concept-results-table__row concept-results-table__row--header">
            <span>Uczestnik</span>
            <span>Zadanie</span>
            <span>Wynik</span>
            <span>Komentarz</span>
          </div>
          {[1, 2, 3].map((n) => (
            <div key={n} className="concept-results-table__row concept-results-table__row--empty">
              <span>—</span><span>—</span><span>—</span><span>—</span>
            </div>
          ))}
        </div>
      </div>

      {/* Conclusions placeholder */}
      <div className="analysis-card">
        <div className="analysis-card__header">
          <span className="analysis-card__icon">💡</span>
          <span className="analysis-card__title">Wnioski i rekomendacje</span>
        </div>
        <ul className="analysis-list">
          <li>Do uzupełnienia po testach — co zmienić w interfejsie</li>
          <li>Do uzupełnienia — które zadania sprawiały największe problemy</li>
          <li>Do uzupełnienia — ogólna ocena satysfakcji uczestników</li>
        </ul>
      </div>
    </section>
  )
}
