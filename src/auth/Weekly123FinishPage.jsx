import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authRequest } from './api.js'
import { finishWeekly123Run, getWeekly123Run } from './weekly123Run.js'

export default function Weekly123FinishPage() {
  const [run, setRun] = useState(() => getWeekly123Run())
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  async function finish() {
    setBusy(true)
    try {
      await authRequest('weekly123_test_end', { client_id: run.client_id, run_id: run.run_id })
      finishWeekly123Run()
      setRun(null)
      setMessage('Test finished. You can start another card #123 test from its login link.')
    } catch (error) { setMessage(error.message) }
    finally { setBusy(false) }
  }
  return <main className="status">
    <h1>Finish card #123 test</h1>
    {run ? <button type="button" onClick={finish} disabled={busy}>{busy ? 'Finishing…' : `Finish Test ${run.test}`}</button> : <p>No card #123 test is active in this browser tab.</p>}
    {message && <p role="status">{message}</p>}
    <Link to="/dashboard">Return to Home</Link>
  </main>
}
