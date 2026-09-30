import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest, errorMessage } from './api.js';
import { Avatar, ChoiceCard, Message, OnboardingShell, StepHeader } from './parts.jsx';

// Same values as api/preferences.php and database/migrations/003_user_preferences.sql.
const GOALS = [
  { value: 'strength', label: 'Strength', description: 'Heavier sets, longer rests, focus on the big lifts.' },
  { value: 'fat_loss', label: 'Fat loss', description: 'Shorter rests, more volume, calorie burn per session.' },
  { value: 'aerobic', label: 'Aerobic fitness', description: 'Higher reps, shorter rests, steady cardio blocks.' },
];

// Route: #/goal (registered in src/App.jsx). Onboarding step 1 of 3.
export default function TrainingGoalPage() {
  return <OnboardingShell step={0}>{(user) => <TrainingGoalStep user={user} />}</OnboardingShell>;
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
    <section className="ob-step" aria-busy={status === 'loading'}>
      <StepHeader
        title="Choose your training goal"
        subtitle="This appears on your profile and shapes your training plan."
      >
        <button
          type="button"
          className="ob-button ob-button--primary"
          onClick={handleSave}
          disabled={busy || !goal}
        >
          {status === 'saving' ? 'Saving…' : 'Save goal'}
        </button>
      </StepHeader>

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
              showIcon
            />
          ))}
        </div>
      </div>

      <div className="ob-panels" aria-live="polite">
        <div className="ob-panel">
          <h3 className="ob-panel-label">Profile preview</h3>
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
          <h3 className="ob-panel-label">Plan impact</h3>
          <p className="ob-panel-text">
            {selected ? selected.description : 'Pick a goal to see how it shapes your plan.'}
          </p>
        </div>
      </div>
    </section>
  );
}
