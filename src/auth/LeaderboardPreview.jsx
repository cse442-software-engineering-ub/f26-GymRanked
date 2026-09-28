const rows = [['Derek Kwan', '@dkwanlifts', '51,400 lb'], ['Marcus Malone', '@marcusm · you', '42,180 lb'], ['Dana Reyes', '@dlift_dana', '39,760 lb']]
export default function LeaderboardPreview() {
  return <section className="leaderboard" aria-label="Example leaderboard">
    <div className="leaderboard-heading"><span>GOLD DIVISION · THIS WEEK</span><span className="accent">Preview</span></div>
    {rows.map(([name, handle, weight], index) => <div className="leaderboard-row" key={name}>
      <strong className="accent">{index + 1}</strong><span className="avatar" aria-hidden="true">MM</span>
      <div className="leaderboard-person"><span>{name}</span><small>{handle}</small></div><span>{weight}</span>
    </div>)}
  </section>
}
