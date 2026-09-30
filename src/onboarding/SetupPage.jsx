import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authRequest } from '../auth/api.js';
import SetupStep from './SetupStep.jsx';
import './onboarding.css';

// Onboarding steps from the Figma. Only "Experience" (story #14) is built here.
const STEPS = ['Training goal', 'Experience', 'Choose plan'];
const CURRENT_STEP = 1;

// Route: #/setup (registered in src/App.jsx).
// Signed-out visitors are sent to #/login, the same way the rest of the app does it.
export default function SetupPage() {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let active = true;
    authRequest('session')
      .then(() => {
        if (active) setSignedIn(true);
      })
      .catch(() => {
        if (active) navigate('/login', { replace: true });
      });
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div className="ob-page">
      {/* Same brand bar as the shared NavBar (styles live in src/index.css). */}
      <header className="nav-bar">
        <Link className="nav-bar__brand" to="/dashboard" aria-label="GymRank dashboard">
          <span className="nav-bar__logo" aria-hidden="true" />
          <span className="nav-bar__brand-name">GymRank</span>
        </Link>
      </header>

      <main className="onboarding">
        <nav aria-label="Setup progress">
          <ol className="ob-stepper">
            {STEPS.map((name, index) => (
              <li
                key={name}
                className={
                  index === CURRENT_STEP
                    ? 'ob-stepper-item is-current'
                    : index < CURRENT_STEP
                      ? 'ob-stepper-item is-done'
                      : 'ob-stepper-item'
                }
                aria-current={index === CURRENT_STEP ? 'step' : undefined}
              >
                {name}
              </li>
            ))}
          </ol>
        </nav>

        {signedIn ? (
          <SetupStep />
        ) : (
          <p className="ob-loading" role="status">
            Checking your session…
          </p>
        )}
      </main>
    </div>
  );
}
