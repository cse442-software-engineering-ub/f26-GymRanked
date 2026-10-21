import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './auth/LoginPage.jsx'
import RegistrationPage from './auth/RegistrationPage.jsx'
import ActiveWorkout from './ActiveWorkout.jsx'
import ExerciseSession from './ExerciseSession.jsx'
import Dashboard from './Dashboard.jsx'
import PlanDetails from './PlanDetails.jsx'
import WeeklyPlan from './WeeklyPlan.jsx'
import WorkoutHistoryPage from './history/WorkoutHistoryPage.jsx'
import ProgressPage from './progress/ProgressPage.jsx'
import WorkoutPlanLibrary from './WorkoutPlanLibrary.jsx'
import RecommendedPlansPage from './onboarding/RecommendedPlansPage.jsx'
import ExperiencePage from './onboarding/ExperiencePage.jsx'
import EquipmentPage from './onboarding/EquipmentPage.jsx'
import TrainingGoalPage from './onboarding/TrainingGoalPage.jsx'
import OnboardingGate from './onboarding/OnboardingGate.jsx'
import WorkoutLogPreview from './workoutLog/WorkoutLogPreview.jsx'
import WorkoutSummaryPage from './workoutLog/WorkoutSummaryPage.jsx'
import ActiveWorkoutPage from './workoutLog/ActiveWorkoutPage.jsx'
import ProfilePage, { EditTrainingPreferencesPage } from './profile/ProfilePage.jsx'

// The sample logging and summary pages are available only on the test server and locally.
// The real session and summary routes below use the PHP workout endpoints.
const TEST_PAGE_HOSTS = ['aptitude.cse.buffalo.edu', 'localhost', '127.0.0.1']
const testPagesAllowed = import.meta.env.DEV || TEST_PAGE_HOSTS.includes(window.location.hostname)

function App() {
  return (
    <HashRouter><Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegistrationPage />} />
      <Route element={<OnboardingGate />}>
        {testPagesAllowed && <Route path="/dev/workout-log" element={<WorkoutLogPreview />} />}
        {testPagesAllowed && <Route path="/dev/workout-summary" element={<WorkoutSummaryPage preview />} />}
        <Route path="/workouts/today" element={<ActiveWorkoutPage />} />
        <Route path="/workouts/:sessionId" element={<ActiveWorkoutPage />} />
        <Route path="/workouts/:sessionId/summary" element={<WorkoutSummaryPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/training-preferences" element={<EditTrainingPreferencesPage />} />
        <Route path="/plans" element={<WorkoutPlanLibrary />} />
        <Route path="/plans/:id" element={<PlanDetails />} />
        <Route path="/weekly-plan" element={<WeeklyPlan />} />
        {/* Progress (story #8) links to the workout history (story #9) below it. */}
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/progress/history" element={<WorkoutHistoryPage />} />
        <Route path="/workout/active" element={<ActiveWorkout />} />
        <Route path="/workout/active/:exerciseIndex" element={<ExerciseSession />} />
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
