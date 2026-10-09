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

function App() {
  return (
    <HashRouter><Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegistrationPage />} />
      <Route element={<OnboardingGate />}>
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
