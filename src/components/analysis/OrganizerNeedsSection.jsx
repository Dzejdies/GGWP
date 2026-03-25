const NEEDS = [
  {
    id: 'operational',
    icon: '⚙️',
    title: 'Potrzeby operacyjne',
    items: [
      'Sprawne zbieranie danych uczestników',
      'Podział na kategorie: gracze solo / drużyny / widzowie',
      'Automatyczna walidacja danych',
      'Eksport listy zgłoszeń',
    ],
  },
  {
    id: 'communication',
    icon: '📢',
    title: 'Potrzeby komunikacyjne',
    items: [
      'Jasna prezentacja celu charytatywnego',
      'Sekcja FAQ zmniejszająca liczbę pytań',
      'Potwierdzenia e-mail po rejestracji',
    ],
  },
  {
    id: 'financial',
    icon: '💰',
    title: 'Potrzeby finansowe',
    items: [
      'Zbieranie darowizn online',
      'Przejrzystość — ile zebrano i na co pójdą środki',
    ],
  },
  {
    id: 'image',
    icon: '🏆',
    title: 'Potrzeby wizerunkowe',
    items: [
      'Profesjonalny, atrakcyjny wizualnie interfejs',
      'Zgodność z WCAG i responsywność',
      'Budowanie zaufania użytkowników',
    ],
  },
]

export default function OrganizerNeedsSection() {
  return (
    <section className="analysis-section">
      <div className="analysis-section__header">
        <h2 className="analysis-section__title">Analiza potrzeb organizatorów</h2>
        <p className="analysis-section__subtitle">Czego potrzebuje strona od strony organizacyjnej</p>
      </div>
      <div className="analysis-grid analysis-grid--2">
        {NEEDS.map((need) => (
          <div key={need.id} className="analysis-card">
            <div className="analysis-card__header">
              <span className="analysis-card__icon">{need.icon}</span>
              <h3 className="analysis-card__title">{need.title}</h3>
            </div>
            <ul className="analysis-list">
              {need.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
