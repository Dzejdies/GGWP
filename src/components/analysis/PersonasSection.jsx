const PERSONAS = [
  {
    id: 'kapitan',
    icon: '🎮',
    name: 'Kapitan drużyny',
    tag: 'Persona A',
    level1: {
      label: 'Kim jest',
      text: '~19 lat, student, singiel, duże miasto, niskie dochody (stypendium/dorywcze zlecenia).',
    },
    level2: {
      label: 'Jak działa',
      text: 'Gra codziennie wieczorami, Discord to główne narzędzie, wydaje na battle passy i skiny, wakacje = granie z ekipą.',
    },
    level3: {
      label: 'Co go napędza i frustruje',
      text: 'Rywalizacyjny ekstrawertyk, ceni teamwork, cel — wygrać turniej i się pokazać. Frustracja: skomplikowane formularze zabierające czas.',
    },
  },
  {
    id: 'widzka',
    icon: '💜',
    name: 'Wspierająca widzka',
    tag: 'Persona B',
    level1: {
      label: 'Kim jest',
      text: '~25 lat, pracuje w marketingu, związek, duże miasto, średnie zarobki.',
    },
    level2: {
      label: 'Jak działa',
      text: 'Gra rekreacyjnie kilka razy w tygodniu, ogląda Twitcha, aktywna na Instagramie, kupuje świadomie.',
    },
    level3: {
      label: 'Co ją napędza i frustruje',
      text: 'Empatyczna, wartości prospołeczne, chce wesprzeć cel charytatywny. Frustracja: brak jasnej informacji na co idą pieniądze.',
    },
  },
  {
    id: 'mlody',
    icon: '🌱',
    name: 'Młody gracz',
    tag: 'Persona C',
    level1: {
      label: 'Kim jest',
      text: '17 lat, uczeń liceum, mieszka z rodzicami, brak własnych dochodów.',
    },
    level2: {
      label: 'Jak działa',
      text: 'Gra dużo po szkole, TikTok i YouTube to główne media, kieszonkowe wydaje na gry.',
    },
    level3: {
      label: 'Co go napędza i frustruje',
      text: 'Nieśmiały, chce spróbować sił w turnieju, cel — poczucie przynależności. Frustracja: potrzebuje zgody rodzica, boi się biurokracji.',
    },
  },
]

export default function PersonasSection() {
  return (
    <section className="analysis-section">
      <div className="analysis-section__header">
        <h2 className="analysis-section__title">Persony</h2>
        <p className="analysis-section__subtitle">3 persony × 3 poziomy — kim są nasi użytkownicy</p>
      </div>
      <div className="analysis-grid analysis-grid--3">
        {PERSONAS.map((persona) => (
          <div key={persona.id} className="analysis-card persona-card">
            <div className="analysis-card__header">
              <span className="analysis-card__icon">{persona.icon}</span>
              <div>
                <span className="persona-card__tag">{persona.tag}</span>
                <h3 className="analysis-card__title">{persona.name}</h3>
              </div>
            </div>
            <div className="persona-levels">
              {[persona.level1, persona.level2, persona.level3].map((level, i) => (
                <div key={i} className="persona-level">
                  <span className="persona-level__number">Poziom {i + 1}</span>
                  <p className="persona-level__label">{level.label}</p>
                  <p className="persona-level__text">{level.text}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
