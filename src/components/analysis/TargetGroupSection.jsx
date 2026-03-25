const LAYERS = [
  {
    id: 'demographic',
    icon: '👥',
    title: 'Warstwa demograficzna',
    items: [
      'Wiek: 16–30 lat',
      'Płeć: głównie mężczyźni, ale nie wyłącznie',
      'Lokalizacja: Polska, duże i średnie miasta',
      'Status: uczniowie, studenci, młodzi pracownicy',
      'Zarobki: od braku dochodów po poziom junior/mid',
      'Wykształcenie: w trakcie lub ukończone średnie/wyższe',
    ],
  },
  {
    id: 'behavioral',
    icon: '📱',
    title: 'Warstwa behawioralna',
    items: [
      'Internet: codziennie, wiele godzin',
      'Platformy: Discord, Twitch, YouTube, Instagram, TikTok, Reddit',
      'Komunikacja: głównie online (czaty głosowe, wiadomości tekstowe)',
      'Decyzje zakupowe: rekomendacje znajomych, streamerów, influencerów',
    ],
  },
  {
    id: 'psychographic',
    icon: '🧠',
    title: 'Warstwa psychograficzna',
    items: [
      'Osobowość: zorientowani na rywalizację lub społeczność',
      'Wartości: fairplay, wspólnota, przełamywanie stereotypów o graczach',
      'Cele: dobra zabawa, wygrana, wsparcie ważnej sprawy',
      'Stosunek do charytatywności: chętni, jeśli forma jest bliska ich światu',
    ],
  },
]

export default function TargetGroupSection() {
  return (
    <section className="analysis-section">
      <div className="analysis-section__header">
        <h2 className="analysis-section__title">Grupa docelowa</h2>
        <p className="analysis-section__subtitle">Charakterystyka uczestników turnieju GG WP for Good</p>
      </div>
      <div className="analysis-grid analysis-grid--3">
        {LAYERS.map((layer) => (
          <div key={layer.id} className="analysis-card">
            <div className="analysis-card__header">
              <span className="analysis-card__icon">{layer.icon}</span>
              <h3 className="analysis-card__title">{layer.title}</h3>
            </div>
            <ul className="analysis-list">
              {layer.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
