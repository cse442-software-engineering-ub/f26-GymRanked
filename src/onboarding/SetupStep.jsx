import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest, errorMessage } from './api.js';
import { ChoiceCard, Chip, Message, StepHeader } from './parts.jsx';

const LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'New to structured training, or under 6 months in.' },
  { value: 'intermediate', label: 'Intermediate', description: 'Consistent training for 6 months to 3 years.' },
  { value: 'advanced', label: 'Advanced', description: '3+ years training, comfortable pushing intensity.' },
];

// Same values and order as api/setup.php and database/migrations/002_user_setup.sql.
const EQUIPMENT = [
  { value: 'bodyweight', label: 'Bodyweight only' },
  { value: 'dumbbells', label: 'Dumbbells' },
  { value: 'barbell', label: 'Barbell' },
  { value: 'kettlebells', label: 'Kettlebells' },
  { value: 'resistance_bands', label: 'Resistance bands' },
  { value: 'cable_machine', label: 'Cable machine' },
  { value: 'pullup_bar', label: 'Pull-up bar' },
  { value: 'full_gym', label: 'Full gym access' },
];

// "Bodyweight only" can't be combined with equipment, so picking one clears the other.
function toggleEquipment(current, value) {
  if (current.includes(value)) return current.filter((item) => item !== value);
  if (value === 'bodyweight') return ['bodyweight'];
  return [...current.filter((item) => item !== 'bodyweight'), value];
}

function joinWithAnd(items) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function planImpact(experience, equipment) {
  if (!experience || equipment.length === 0) {
    return 'Pick your experience and at least one equipment option to see how your plan will be built.';
  }
  const level = LEVELS.find((option) => option.value === experience).label;
  const items = EQUIPMENT.filter((option) => equipment.includes(option.value)).map((option) =>
    option.label.toLowerCase(),
  );
  return `${level} programming using ${joinWithAnd(items)}.`;
}

export default function SetupStep() {
  const navigate = useNavigate();
  const [experience, setExperience] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | saving
  const [error, setError] = useState('');
  const [sessionEnded, setSessionEnded] = useState(false);

  // Pre-select what this account saved before, if anything.
  useEffect(() => {
    let active = true;
    apiRequest('setup.php').then((result) => {
      if (!active) return;
      if (result.ok) {
        setExperience(result.data.experience ?? null);
        setEquipment(Array.isArray(result.data.equipment) ? result.data.equipment : []);
      } else {
        setSessionEnded(result.status === 401);
        setError(errorMessage(result, "Couldn't load your saved setup. Reload the page to try again."));
      }
      setStatus('ready');
    });
    return () => {
      active = false;
    };
  }, []);

  function chooseExperience(value) {
    setExperience(value);
  }

  function toggle(value) {
    setEquipment((current) => toggleEquipment(current, value));
  }

  async function handleSave() {
    setStatus('saving');
    setError('');
    setSessionEnded(false);
    const result = await apiRequest('setup.php', {
      method: 'POST',
      body: JSON.stringify({ experience, equipment }),
    });
    setStatus('ready');
    if (result.ok) {
      // Next onboarding step (Figma: Choose plan) is the existing plan library.
      navigate('/plans');
    } else {
      setSessionEnded(result.status === 401);
      setError(errorMessage(result, "Couldn't save your setup. Try again."));
    }
  }

  const busy = status !== 'ready';

  return (
    <section className="ob-step" aria-busy={status === 'loading'}>
      <StepHeader
        title="Tell us about your training setup"
        subtitle="This helps tailor your workout plan to your experience and available equipment."
      >
        <button
          type="button"
          className="ob-button ob-button--primary"
          onClick={handleSave}
          disabled={busy || !experience || equipment.length === 0}
        >
          {status === 'saving' ? 'Saving…' : 'Save setup'}
        </button>
      </StepHeader>

      <Message tone="error">
        {error}
        {sessionEnded && (
          <>
            {' '}
            <Link to="/login">Log in</Link>
          </>
        )}
      </Message>

      <div className="ob-group" role="group" aria-labelledby="ob-experience-label">
        <h3 id="ob-experience-label" className="ob-group-label">Training experience</h3>
        <div className="ob-card-grid">
          {LEVELS.map((option) => (
            <ChoiceCard
              key={option.value}
              label={option.label}
              description={option.description}
              selected={experience === option.value}
              onSelect={() => chooseExperience(option.value)}
              disabled={busy}
            />
          ))}
        </div>
      </div>

      <div className="ob-group" role="group" aria-labelledby="ob-equipment-label">
        <h3 id="ob-equipment-label" className="ob-group-label">Available equipment</h3>
        <div className="ob-chips">
          {EQUIPMENT.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={equipment.includes(option.value)}
              onToggle={() => toggle(option.value)}
              disabled={busy}
            />
          ))}
        </div>
      </div>

      <div className="ob-impact" aria-live="polite">
        <h3 className="ob-impact-label">Plan impact</h3>
        <p className="ob-impact-text">{planImpact(experience, equipment)}</p>
      </div>
    </section>
  );
}
