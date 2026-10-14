import { Link } from 'react-router-dom'

// Login prompt and error notices from usePlanSelection, shown above a page's plan content.
function PlanSelectionStatus({ loggedOut, notice }) {
  return (
    <>
      {loggedOut && (
        <p className="status" role="status">
          <Link to="/login">Log in</Link> to choose a plan.
        </p>
      )}
      {notice && (
        <p className="status" role="alert">
          {notice}
        </p>
      )}
    </>
  )
}

export default PlanSelectionStatus
