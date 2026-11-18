import { GroupHeader, NoGroup, UnrankedList } from '../leaderboard/BuddiesParts.jsx'
import { emptyGroupWeekText, goalLabel, orderGoals, weeklyGroupLine } from '../leaderboard/rankingScope.js'
import StandingsList from './StandingsList.jsx'

// This week's standings for your buddies group (story #131, card 139): one table per weekly goal, since people are
// only ranked against others with the same goal. Your own goal comes first. Members who aren't ranked this week
// (not joined, in their practice week) are listed by name only.
export default function BuddiesStandings({ data }) {
  if (data.group === null) return <NoGroup />
  const goals = orderGoals(data.goals, data.target_days)

  return (
    <>
      <GroupHeader name={data.group.name} line={weeklyGroupLine(data.group.member_count)} />
      {goals.length === 0 && <p className="weekly-empty">{emptyGroupWeekText(data.group.name)}</p>}
      {goals.map((goal) => (
        <section key={goal.target_days} className="ranking-goal" aria-label={goalLabel(goal.target_days)}>
          <h3 className="ranking-goal__title">
            {goalLabel(goal.target_days)}
            {goal.target_days === data.target_days && <span className="ranking-goal__mine">Your goal</span>}
          </h3>
          <StandingsList rows={goal.rows} targetDays={goal.target_days} note={false} />
        </section>
      ))}
      <UnrankedList title="Unranked this week" names={data.unranked} />
      <p className="weekly-note">People are ranked with others who have the same weekly goal. Shared progress = shared rank.</p>
    </>
  )
}
