import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest, errorMessage } from './api.js';
import { BackLink, ChoiceCard, Message, OnboardingShell, SaveBar, StepHeader } from './parts.jsx';
import { LEVELS } from './setupOptions.js';

// Route: #/experience (registered in src/App.jsx). Onboarding step 2 of 4.
export default function ExperiencePage() {
  return (
    <OnboardingShell step={1} backdrop="backdrops/gym-floor.webp">
      {() => <ExperienceStep />}
    </OnboardingShell>
  );
}

// Three rising bars, lit up to the level: one for Beginner, two for Intermediate, three for Advanced.
function LevelBars({ level }) {
  return (
    <svg className="ob-level-bars" viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round">
      {['M6 18v-3', 'M12 18v-7', 'M18 18V6'].map((d, index) => (
        <path key={d} d={d} className={index <= level ? 'is-lit' : undefined} />
      ))}
    </svg>
  );
}

function ExperienceStep() {
  const navigate = useNavigate();
  const [experience, setExperience] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | saving
  const [error, setError] = useState('');
  const [sessionEnded, setSessionEnded] = useState(false);

  // Pre-select the experience this account saved before, if any.
  useEffect(() => {
    let active = true;
    apiRequest('setup.php').then((result) => {
      if (!active) return;
      if (result.ok) {
        setExperience(result.data.experience ?? null);
      } else {
        setSessionEnded(result.status === 401);
        setError(errorMessage(result, "Couldn't load your saved experience. Reload the page to try again."));
      }
      setStatus('ready');
    });
    return () => {
      active = false;
    };
  }, []);

  // Saves only the experience; the saved equipment stays as it is (api/setup.php, card #96).
  async function handleSave() {
    setStatus('saving');
    setError('');
    setSessionEnded(false);
    const result = await apiRequest('setup.php', {
      method: 'POST',
      body: JSON.stringify({ experience }),
    });
    if (result.ok) {
      navigate('/equipment'); // Next onboarding step.
      return;
    }
    setStatus('ready');
    setSessionEnded(result.status === 401);
    setError(errorMessage(result, "Couldn't save your experience. Try again."));
  }

  const busy = status !== 'ready';

  return (
    <section className="ob-step ob-form" aria-busy={status === 'loading'}>
      <BackLink to="/goal">Back to training goal</BackLink>

      <StepHeader
        title="How experienced are you?"
        subtitle="We use this to set your starting weights and weekly volume."
      />

      <Message tone="error">
        {error}
        {sessionEnded && (
          <>
            {' '}
            <Link to="/login">Log in</Link>
          </>
        )}
      </Message>

      <div className="ob-group" role="group" aria-label="Training experience">
        <div className="ob-card-grid">
          {LEVELS.map((option, index) => (
            <ChoiceCard
              key={option.value}
              label={option.label}
              description={option.description}
              selected={experience === option.value}
              onSelect={() => setExperience(option.value)}
              disabled={busy}
              icon={<LevelBars level={index} />}
            />
          ))}
        </div>
      </div>

      <SaveBar
        label="Save and continue"
        saving={status === 'saving'}
        disabled={busy || !experience}
        help={!experience && status !== 'loading' ? 'Pick your experience level to continue.' : ''}
        onSave={handleSave}
      />
    </section>
  );
}
