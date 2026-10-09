import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PlanEquipmentNote from '../PlanEquipmentNote.jsx';
import { planMeta } from '../planFormat.js';
import { recommendPlans } from '../planEquipment.js';
import { fetchPlans } from '../plansApi.js';
import usePlanSelection from '../usePlanSelection.jsx';
import useUserSetup from '../useUserSetup.js';
import { OnboardingShell, StepHeader } from './parts.jsx';

const GOAL_LABELS = { strength: 'strength', fat_loss: 'fat loss', aerobic: 'aerobic fitness' };

// Route: #/recommended (registered in src/App.jsx). Onboarding step 3 of 3.
export default function RecommendedPlansPage() {
  return <OnboardingShell step={2}>{() => <RecommendedPlans />}</OnboardingShell>;
}

function RecommendedPlans() {
  const selection = usePlanSelection();
  const { setup, loaded } = useUserSetup();
  const [plans, setPlans] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlans()
      .then(setPlans)
      .catch((err) => setError(err.message));
  }, []);

  const ready = plans !== null && loaded;
  const recommended = ready && setup ? recommendPlans(plans, setup) : [];

  return (
    <section className="ob-step" aria-busy={!ready && !error}>
      <StepHeader
        title="Choose your workout plan"
        subtitle={
          setup?.goal
            ? `Plans for ${GOAL_LABELS[setup.goal]} at your experience level. Pick one to start.`
            : 'Plans that fit your experience and equipment. Pick one to start.'
        }
      />

      {selection.notice && <p className="ob-message ob-message--error" role="alert">{selection.notice}</p>}
      {error && <p className="ob-message ob-message--error" role="alert">Couldn't load plans: {error}</p>}
      {!error && !ready && <p className="ob-loading" role="status">Finding plans for you…</p>}
      {ready && !setup && (
        <p className="ob-message ob-message--error" role="alert">
          Finish <Link to="/setup">your experience and equipment</Link> to see recommended plans.
        </p>
      )}
      {ready && setup && recommended.length === 0 && (
        <p className="ob-message ob-message--error" role="status">
          No plans match your goal and level yet. <Link to="/plans">Browse all plans</Link>.
        </p>
      )}

      {recommended.length > 0 && (
        <ul className="ob-plans">
          {recommended.map((plan) => (
            <li key={plan.id} className="ob-plan">
              <div className="ob-plan-body">
                <Link className="ob-plan-name" to={`/plans/${plan.id}`}>{plan.name}</Link>
                <p className="ob-plan-meta">{planMeta(plan)} · {plan.days_per_week} days/wk</p>
                <PlanEquipmentNote missing={plan.missing_equipment} />
              </div>
              <button
                type="button"
                className="ob-button ob-button--primary"
                onClick={() => selection.requestSelect(plan)}
                disabled={!selection.canSelect}
              >
                Choose plan
              </button>
            </li>
          ))}
        </ul>
      )}

      {ready && setup && (
        <p className="ob-plans-footer">
          <Link to="/plans">Browse all plans</Link>
        </p>
      )}
      {selection.switchModal}
    </section>
  );
}
