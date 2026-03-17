import './TeamCanvas.css'

const SECTIONS = [
  {
    id: 'purpose',
    title: 'Cel zespołu',
    icon: '🎯',
    content: 'Jeszcze nie mamy pomyslu :welp:',
    wide: false,
  },
  {
    id: 'values',
    title: 'Wartości',
    icon: '💡',
    content: ['Kreatywność', 'Szczerość', 'Jakość ponad ilość', 'Wzajemny szacunek', 'Nienawiść do Analizy'],
    wide: false,
  },
  {
    id: 'strengths',
    title: 'Mocne strony',
    icon: '💪',
    content: ['Frontend development', 'Projektowanie UI/UX', 'Szybkie prototypowanie', 'Praca zespołowa'],
    wide: false,
  },
  {
    id: 'roles',
    title: 'Role',
    icon: '👤',
    content: ['Brajan — Backend lub Frontend', 'Mateusz — Frontend lub backend'],
    wide: false,
  },
  {
    id: 'rules',
    title: 'Zasady',
    icon: '📋',
    content: ['Branch Main jest święty, nie pushuj', 'Code review przed mergem', 'Ja merguje (no chyba ze nie)'],
    wide: false,
  },
  {
    id: 'goals',
    title: 'Cele wspólne',
    icon: '🏆',
    content: 'Zaliczyć projekt.',
    wide: true,
  },
]

function SectionContent({ content }) {
  if (Array.isArray(content)) {
    return (
      <ul className="canvas-section__list">
        {content.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    )
  }
  return <p className="canvas-section__text">{content}</p>
}

export default function TeamCanvas() {
  return (
    <section className="canvas">
      <div className="canvas__header">
        <h2 className="canvas__title">Team Canvas</h2>
        <p className="canvas__subtitle">Jak pracujemy i co nas łączy</p>
      </div>
      <div className="canvas__grid">
        {SECTIONS.map((s) => (
          <div
            key={s.id}
            className={`canvas-section${s.wide ? ' canvas-section--wide' : ''}`}
          >
            <div className="canvas-section__header">
              <span className="canvas-section__icon">{s.icon}</span>
              <h3 className="canvas-section__title">{s.title}</h3>
            </div>
            <SectionContent content={s.content} />
          </div>
        ))}
      </div>
    </section>
  )
}
