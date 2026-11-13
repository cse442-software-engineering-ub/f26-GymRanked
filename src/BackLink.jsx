import { Link } from 'react-router-dom'

// "‹ Back to ..." link above a page title. The one way back where a page needs one (DESIGN.md "Page layout");
// className lets onboarding add its own placement class.
function BackLink({ to, children, className = '' }) {
  return (
    <Link className={`back-link ${className}`.trim()} to={to}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 5l-7 7 7 7" />
      </svg>
      {children}
    </Link>
  )
}

export default BackLink
