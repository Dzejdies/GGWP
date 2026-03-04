import './TeamMember.css'

const AVATAR_COLORS = [
  ['#4f46e5', '#818cf8'],
  ['#0891b2', '#67e8f9'],
]

export default function TeamMember({ name, role, description, index = 0 }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const [from, to] = AVATAR_COLORS[index % AVATAR_COLORS.length]

  return (
    <div className="team-member">
      <div
        className="team-member__avatar"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        {initials}
      </div>
      <div className="team-member__info">
        <h3 className="team-member__name">{name}</h3>
        <span className="team-member__role">{role}</span>
        {description && (
          <p className="team-member__desc">{description}</p>
        )}
      </div>
    </div>
  )
}
