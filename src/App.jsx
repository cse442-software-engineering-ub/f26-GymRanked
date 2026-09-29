import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './auth/LoginPage.jsx'
import RegistrationPage from './auth/RegistrationPage.jsx'

function App() {
  return (
    <HashRouter><Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegistrationPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes></HashRouter>
  )
}

export default App
