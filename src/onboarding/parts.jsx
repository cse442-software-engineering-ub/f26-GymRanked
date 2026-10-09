// Building blocks shared by the onboarding pages (#/goal and #/setup).
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authRequest } from '../auth/api.js';
import GymBackdrop from '../components/GymBackdrop.jsx';
import './onboarding.css';

// Onboarding steps from the Figma, in order. "Choose plan" is the recommended plans page.
const STEPS = [
  { label: 'Training goal', to: '/goal' },
  { label: 'Experience', to: '/setup' },
  { label: 'Choose plan', to: '/recommended' },
];

// Full-screen page frame shared by every onboarding step:
// checks the login (signed-out visitors go to #/login), shows the gym photo band with the logo and the
// step indicator, then renders children(user) with the logged-in user from api/session.php.
// backdrop: optional photo for the band, e.g. "backdrops/rack.webp".
export function OnboardingShell({ step, backdrop, children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;
    authRequest('session')
      .then((data) => {
        if (active) setUser(data.user);
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
      <GymBackdrop image={backdrop}>
        {/* Same logo as the shared NavBar (styles live in src/index.css). */}
        <Link className="nav-bar__brand ob-brand" to="/dashboard" aria-label="GymRank dashboard">
          <span className="nav-bar__logo" aria-hidden="true" />
          <span className="nav-bar__brand-name">GymRank</span>
        </Link>

        <nav aria-label="Setup progress">
          <ol className="ob-stepper">
            {STEPS.map((item, index) => {
              const state = index === step ? ' is-current' : index < step ? ' is-done' : '';
              return (
                <li key={item.label} className={`ob-stepper-item${state}`}>
                  {index === step ? (
                    <span aria-current="step">{item.label}</span>
                  ) : (
                    <Link to={item.to}>{item.label}</Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </GymBackdrop>

      <main className="onboarding">
        {user ? (
          children(user)
        ) : (
          <p className="ob-loading" role="status">
            Checking your session…
          </p>
        )}
      </main>
    </div>
  );
}

export function StepHeader({ title, subtitle, children }) {
  return (
    <header className="ob-header">
      <div>
        <h1 className="ob-title">{title}</h1>
        <p className="ob-subtitle">{subtitle}</p>
      </div>
      {children && <div className="ob-actions">{children}</div>}
    </header>
  );
}

// A large selectable card (one choice per group). icon: optional SVG shown in a tile.
// Selected shows a filled tick as well as the orange border, so the state isn't shown by colour alone.
export function ChoiceCard({ label, description, selected, onSelect, disabled, icon }) {
  return (
    <button
      type="button"
      className="ob-card"
      aria-pressed={selected}
      onClick={onSelect}
      disabled={disabled}
    >
      {icon && (
        <span className="ob-card-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="ob-card-body">
        <span className="ob-card-label">{label}</span>
        <span className="ob-card-description">{description}</span>
        <span className="ob-card-state" aria-hidden="true">
          {selected ? 'Selected' : 'Select'}
        </span>
      </span>
      <span className="ob-card-tick" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
    </button>
  );
}

// A small toggle chip (many can be on at once).
export function Chip({ label, selected, onToggle, disabled }) {
  return (
    <button
      type="button"
      className="ob-chip"
      aria-pressed={selected}
      onClick={onToggle}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

export function Message({ tone, children }) {
  if (!children || (Array.isArray(children) && children.every((child) => !child))) return null;
  return (
    <p className={`ob-message ob-message--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </p>
  );
}

// Round avatar with up to two initials, e.g. "Marcus Malone" -> "MM".
export function Avatar({ name }) {
  const initials = (name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
  return (
    <span className="ob-avatar" aria-hidden="true">
      {initials || '?'}
    </span>
  );
}
