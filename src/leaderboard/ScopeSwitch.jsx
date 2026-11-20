import { SCOPES } from './rankingScope.js'
import './leaderboard.css'

// Everyone | Buddies, at the top of the board card on both Rankings boards (story #131, card 139). The pressed button
// is the audience shown; choosing the other one changes the address, so the page loads the new board.
export default function ScopeSwitch({ scope, onChange }) {
  return (
    <div className="leaderboard-scope" role="group" aria-label="Compare with">
      {SCOPES.map((item) => (
        <button key={item.key} type="button" aria-pressed={scope === item.key}
          onClick={() => { if (scope !== item.key) onChange(item.key) }}>
          {item.label}
        </button>
      ))}
    </div>
  )
}
