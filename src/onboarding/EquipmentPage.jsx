import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest, errorMessage } from './api.js';
import { BackLink, Message, OnboardingShell, SaveBar, StepHeader, Tick } from './parts.jsx';
import { EQUIPMENT, planImpact, toggleEquipment } from './setupOptions.js';

// Route: #/equipment (registered in src/App.jsx). Onboarding step 3 of 4.
export default function EquipmentPage() {
  return (
    <OnboardingShell step={2} backdrop="backdrops/dumbbells.webp">
      {() => <EquipmentStep />}
    </OnboardingShell>
  );
}

// Equipment icons: 24x24 stroke drawings (DESIGN.md, "Icons"). Every tile also shows its name.
const ICONS = {
  bodyweight: ['M12 7.5v6.5M8.5 21l3.5-7 3.5 7M6.5 10.5h11'],
  dumbbells: ['M3 10v4M6 7v10M18 7v10M21 10v4M6 12h12'],
  barbell: ['M2 12h20M5 8.5v7M8 6.5v11M16 6.5v11M19 8.5v7'],
  kettlebells: [
    'M9.5 8.2V6.8a2.5 2.5 0 0 1 5 0v1.4',
    'M7.6 20h8.8a1.6 1.6 0 0 0 1.5-2.1A6.4 6.4 0 0 0 12 8.5a6.4 6.4 0 0 0-5.9 9.4 1.6 1.6 0 0 0 1.5 2.1z',
  ],
  resistance_bands: ['M3 4a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM18 4a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1z', 'M4.5 8c0 7 3.2 12 7.5 12s7.5-5 7.5-12'],
  cable_machine: ['M4 21V3h16v18', 'M8 3l4 5 4-5M12 8v7', 'M11 15h2a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1z'],
  pullup_bar: ['M3 6h18M6 6v15M18 6v15M10 6v3.5M14 6v3.5'],
  full_gym: ['M3 20.5h18M5 20.5V9.5L12 4l7 5.5v11', 'M9 15h6M9 13v4M15 13v4'],
};

function EquipmentIcon({ value }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {value === 'bodyweight' && <circle cx="12" cy="5" r="2" />}
      {ICONS[value].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

function EquipmentStep() {
  const navigate = useNavigate();
  const [experience, setExperience] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | saving
  const [error, setError] = useState('');
  const [sessionEnded, setSessionEnded] = useState(false);

  // Pre-select the equipment this account saved before; the saved experience feeds Plan impact.
  useEffect(() => {
    let active = true;
    apiRequest('setup.php').then((result) => {
      if (!active) return;
      if (result.ok) {
        setExperience(result.data.experience ?? null);
        setEquipment(Array.isArray(result.data.equipment) ? result.data.equipment : []);
      } else {
        setSessionEnded(result.status === 401);
        setError(errorMessage(result, "Couldn't load your saved equipment. Reload the page to try again."));
      }
      setStatus('ready');
    });
    return () => {
      active = false;
    };
  }, []);

  function toggle(value) {
    setEquipment((current) => toggleEquipment(current, value));
  }

  // Saves only the equipment; the saved experience stays as it is (api/setup.php, card #96).
  async function handleSave() {
    setStatus('saving');
    setError('');
    setSessionEnded(false);
    const result = await apiRequest('setup.php', {
      method: 'POST',
      body: JSON.stringify({ equipment }),
    });
    if (result.ok) {
      navigate('/recommended', { state: { setupSaved: true } }); // Last onboarding step: pick a plan.
      return;
    }
    setStatus('ready');
    setSessionEnded(result.status === 401);
    setError(errorMessage(result, "Couldn't save your equipment. Try again."));
  }

  const busy = status !== 'ready';
  const bodyweight = equipment.includes('bodyweight');

  return (
    <section className="ob-step ob-form" aria-busy={status === 'loading'}>
      <BackLink to="/experience">Back to experience</BackLink>

      <StepHeader
        title="What equipment can you use?"
        subtitle="Pick everything you can get to. You can change this any time."
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

      <div className="ob-group" role="group" aria-label="Available equipment">
        <button
          type="button"
          className="ob-option"
          aria-pressed={bodyweight}
          onClick={() => toggle('bodyweight')}
          disabled={busy}
        >
          <span className="ob-card-icon" aria-hidden="true">
            <EquipmentIcon value="bodyweight" />
          </span>
          <span className="ob-option-text">
            <span className="ob-option-label">Bodyweight only</span>
            <span className="ob-option-description">No equipment. Picking this turns the others off.</span>
          </span>
          <Tick />
        </button>

        <p className="ob-divider">or pick what you have</p>

        <div className="ob-tiles">
          {EQUIPMENT.filter((option) => option.value !== 'bodyweight').map((option) => (
            <button
              key={option.value}
              type="button"
              className="ob-tile"
              aria-pressed={equipment.includes(option.value)}
              onClick={() => toggle(option.value)}
              disabled={busy}
            >
              <EquipmentIcon value={option.value} />
              <span className="ob-tile-label">{option.label}</span>
              <Tick />
            </button>
          ))}
        </div>
      </div>

      <div className="ob-panel" aria-live="polite">
        <h2 className="ob-panel-label">Plan impact</h2>
        <p className="ob-panel-text">{planImpact(experience, equipment)}</p>
      </div>

      <SaveBar
        label="Save and continue"
        saving={status === 'saving'}
        disabled={busy || equipment.length === 0}
        help={equipment.length === 0 && status !== 'loading' ? 'Pick at least one option, or Bodyweight only.' : ''}
        onSave={handleSave}
      />
    </section>
  );
}
