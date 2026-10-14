import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import crumbSeparator from './assets/crumb-separator.svg'

// Figma "Crumb": ancestors are links when they have a page (`to`); the last crumb is
// the current screen and never clickable.
function Breadcrumb({ crumbs }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {crumbs.map(({ label, to }, index) => {
        const isCurrent = index === crumbs.length - 1
        return (
          <Fragment key={label}>
            {index > 0 && (
              <img src={crumbSeparator} alt="" width="12" height="20" className="breadcrumb__separator" />
            )}
            {isCurrent ? (
              <span className="breadcrumb__crumb breadcrumb__crumb--current" aria-current="page">
                {label}
              </span>
            ) : to ? (
              <Link to={to} className="breadcrumb__crumb breadcrumb__crumb--link">
                {label}
              </Link>
            ) : (
              <span className="breadcrumb__crumb">{label}</span>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}

export default Breadcrumb
