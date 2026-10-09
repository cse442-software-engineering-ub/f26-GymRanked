import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest, errorMessage } from './api.js';
import { Avatar, ChoiceCard, Message, OnboardingShell, StepHeader } from './parts.jsx';

// Goal icons: 24x24 stroke drawings (DESIGN.md, "Icons"). Dumbbell, flame, heart with a pulse line.
const icon = (...paths) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    {paths.map((d) => (
      <path key={d} d={d} />
    ))}
  </svg>
);

// Same values as api/preferences.php and database/migrations/003_user_preferences.sql.
const GOALS = [
  {
    value: 'strength',
    label: 'Strength',
    description: 'Heavier sets, longer rests, focus on the big lifts.',
    icon: icon('M3 10v4M6 7v10M18 7v10M21 10v4M6 12h12'),
  },
  {
    value: 'fat_loss',
    label: 'Fat loss',
    description: 'Shorter rests, more volume, calorie burn per session.',
    icon: icon('M12 3c.8 3.2 5 5.2 5 9.5a5 5 0 0 1-10 0c0-2.4 1.3-4 2.4-5 .3 1.5 1 2.5 2 2.9C11.6 8.6 12 6 12 3z'),
  },
  {
    value: 'aerobic',
    label: 'Aerobic fitness',
    description: 'Higher reps, shorter rests, steady cardio blocks.',
    icon: icon(
      'M20.5 8.8c0 5-8.5 10.7-8.5 10.7S3.5 13.8 3.5 8.8A4.3 4.3 0 0 1 12 6.6a4.3 4.3 0 0 1 8.5 2.2z',
      'M7 12.5h2.5l1.5-2.5 2 4 1.4-1.5H17',
    ),
  },
];

// Route: #/goal (registered in src/App.jsx). Onboarding step 1 of 3.
export default function TrainingGoalPage() {
  return (
    <OnboardingShell step={0} backdrop="backdrops/rack.webp">
      {(user) => <TrainingGoalStep user={user} />}
    </OnboardingShell>
  );
}

function TrainingGoalStep({ user }) {
  const navigate = useNavigate();
  const [goal, setGoal] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | saving
  const [error, setError] = useState('');

  // Pre-select the goal this account saved before, if any.
  useEffect(() => {
    let active = true;
    apiRequest('preferences.php').then((result) => {
      if (!active) return;
      if (result.ok) {
        setGoal(result.data.training_goal ?? null);
      } else {
        setError(errorMessage(result, "Couldn't load your saved goal. Reload the page to try again."));
      }
      setStatus('ready');
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleSave() {
    setStatus('saving');
    setError('');
    const result = await apiRequest('preferences.php', {
      method: 'POST',
      body: JSON.stringify({ training_goal: goal }),
    });
    if (result.ok) {
      navigate('/setup'); // Next onboarding step: experience and equipment.
      return;
    }
    setStatus('ready');
    setError(errorMessage(result, "Couldn't save your goal. Try again."));
  }

  const busy = status !== 'ready';
  const selected = GOALS.find((option) => option.value === goal);

  return (
    <section className="ob-step ob-goal" aria-busy={status === 'loading'}>
      <StepHeader
        title="Choose your training goal"
        subtitle="This appears on your profile and shapes your training plan."
      />

      <Message tone="error">{error}</Message>

      <div className="ob-group" role="group" aria-label="Training goal">
        <div className="ob-card-grid">
          {GOALS.map((option) => (
            <ChoiceCard
              key={option.value}
              label={option.label}
              description={option.description}
              selected={goal === option.value}
              onSelect={() => setGoal(option.value)}
              disabled={busy}
              icon={option.icon}
            />
          ))}
        </div>
      </div>

      <div className="ob-panels" aria-live="polite">
        <div className="ob-panel">
          <h2 className="ob-panel-label">Profile preview</h2>
          <div className="ob-profile">
            <Avatar name={user.full_name} />
            <div className="ob-profile-text">
              <span className="ob-profile-name">{user.full_name}</span>
              {selected ? (
                <span className="ob-tag">{selected.label}</span>
              ) : (
                <span className="ob-tag ob-tag--empty">No goal yet</span>
              )}
            </div>
          </div>
        </div>

        <div className="ob-panel">
          <h2 className="ob-panel-label">Plan impact</h2>
          <p className="ob-panel-text">
            {selected ? selected.description : 'Pick a goal to see how it shapes your plan.'}
          </p>
        </div>
      </div>

      {/* Top right next to the heading on computers; a full-width bar at the bottom on phones (onboarding.css). */}
      <div className="ob-save">
        <button
          type="button"
          className="ob-button ob-button--primary"
          onClick={handleSave}
          disabled={busy || !goal}
        >
          {status === 'saving' ? 'Saving…' : 'Save goal'}
        </button>
        {!goal && status !== 'loading' && (
          <p className="ob-save-help">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5M12 8h.01" />
            </svg>
            Pick one goal to continue.
          </p>
        )}
      </div>
    </section>
  );
}
