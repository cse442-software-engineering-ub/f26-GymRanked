import { Link } from 'react-router-dom'
export default function Brand() {
  return <Link className="brand" to="/login" aria-label="GymRank login"><span aria-hidden="true" />GymRank</Link>
}
