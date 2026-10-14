import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './auth/LoginPage.jsx'
import RegistrationPage from './auth/RegistrationPage.jsx'
import Dashboard from './Dashboard.jsx'
import PlanDetails from './PlanDetails.jsx'
import WeeklyPlan from './WeeklyPlan.jsx'
import WorkoutPlanLibrary from './WorkoutPlanLibrary.jsx'
import RecommendedPlansPage from './onboarding/RecommendedPlansPage.jsx'
import ExperiencePage from './onboarding/ExperiencePage.jsx'
import EquipmentPage from './onboarding/EquipmentPage.jsx'
import TrainingGoalPage from './onboarding/TrainingGoalPage.jsx'
import OnboardingGate from './onboarding/OnboardingGate.jsx'
import WorkoutLogPreview from './workoutLog/WorkoutLogPreview.jsx'

// Today's workout page for story #7 (set logging), used by that task's task tests until the real active
// workout screen exists. Its route only exists on the aptitude test server and on your own computer, for
// signed-in users like the other pages below; on cattle (production) the address falls through to the login page.
const TEST_PAGE_HOSTS = ['aptitude.cse.buffalo.edu', 'localhost', '127.0.0.1']
const testPagesAllowed = import.meta.env.DEV || TEST_PAGE_HOSTS.includes(window.location.hostname)

function App() {
  return (
    <HashRouter><Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegistrationPage />} />
      <Route element={<OnboardingGate />}>
        {testPagesAllowed && <Route path="/dev/workout-log" element={<WorkoutLogPreview />} />}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/plans" element={<WorkoutPlanLibrary />} />
        <Route path="/plans/:id" element={<PlanDetails />} />
        <Route path="/weekly-plan" element={<WeeklyPlan />} />
        <Route path="/experience" element={<ExperiencePage />} />
        <Route path="/equipment" element={<EquipmentPage />} />
        {/* The old single setup page is now the experience and equipment pages. */}
        <Route path="/setup" element={<Navigate to="/experience" replace />} />
        <Route path="/recommended" element={<RecommendedPlansPage />} />
        <Route path="/goal" element={<TrainingGoalPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes></HashRouter>
  )
}

export default App
