import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './auth/LoginPage.jsx'
import RegistrationPage from './auth/RegistrationPage.jsx'
import Dashboard from './Dashboard.jsx'
import PlanDetails from './PlanDetails.jsx'
import WeeklyPlan from './WeeklyPlan.jsx'
import WorkoutPlanLibrary from './WorkoutPlanLibrary.jsx'

function App() {
  return (
    <HashRouter><Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegistrationPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/plans" element={<WorkoutPlanLibrary />} />
      <Route path="/plans/:id" element={<PlanDetails />} />
      <Route path="/weekly-plan" element={<WeeklyPlan />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes></HashRouter>
  )
}

export default App
