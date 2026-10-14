import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PlanIcons from '../PlanIcons.jsx';
import PlanEquipmentDot from '../PlanEquipmentDot.jsx';
import PlanMeta from '../PlanMeta.jsx';
import { recommendPlans } from '../planEquipment.js';
import { fetchPlans } from '../plansApi.js';
import usePlanSelection from '../usePlanSelection.jsx';
import YourSetup from '../YourSetup.jsx';
import { OnboardingShell, StepHeader } from './parts.jsx';

const GOAL_LABELS = { strength: 'strength', fat_loss: 'fat loss', aerobic: 'aerobic fitness' };

// Route: #/recommended (registered in src/App.jsx). Onboarding step 4 of 4.
export default function RecommendedPlansPage() {
  return (
    <OnboardingShell step={3} backdrop="backdrops/rack.webp">
      {() => <RecommendedPlans />}
    </OnboardingShell>
  );
}

function RecommendedPlans() {
  const selection = usePlanSelection();
  const { setup, setupLoaded: loaded } = selection;
  const [plans, setPlans] = useState(null);
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  // The equipment page sends { setupSaved: true } when onboarding is finished. Show the confirmation for this
  // visit only: clear it from the history entry, which a reload would otherwise keep.
  const [justSaved] = useState(() => Boolean(location.state?.setupSaved));
  useEffect(() => {
    if (location.state?.setupSaved) navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate]);

  useEffect(() => {
    fetchPlans()
      .then(setPlans)
      .catch((err) => setError(err.message));
  }, []);

  const ready = plans !== null && loaded;
  const recommended = ready && setup ? recommendPlans(plans, setup) : [];

  return (
    <section className="ob-step" aria-busy={!ready && !error}>
      {justSaved && (
        <div className="ob-message ob-message--success ob-handoff" role="status">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          <p>
            <strong>Your setup is saved.</strong> Pick a plan to start your first week.
          </p>
        </div>
      )}

      <StepHeader
        title="Choose your workout plan"
        subtitle={
          setup?.goal
            ? `Plans for ${GOAL_LABELS[setup.goal]} at your experience level. Pick one to start.`
            : 'Plans that fit your experience and equipment. Pick one to start.'
        }
      />

      <YourSetup setup={setup} />

      {selection.loggedOut && (
        <p className="ob-message ob-message--error" role="alert">
          Your session ended. <Link to="/login">Log in</Link> to choose a plan.
        </p>
      )}
      {selection.notice && <p className="ob-message ob-message--error" role="alert">{selection.notice}</p>}
      {error && <p className="ob-message ob-message--error" role="alert">Couldn't load plans: {error}</p>}
      {!error && !ready && <p className="ob-loading" role="status">Finding plans for you…</p>}
      {ready && !setup && (
        <p className="ob-message ob-message--error" role="alert">
          Finish <Link to="/experience">your experience and equipment</Link> to see recommended plans.
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
                <p className="ob-plan-days">{plan.days_per_week} days/wk</p>
                <Link className="ob-plan-name" to={`/plans/${plan.id}`}>{plan.name}</Link>
                <p className="ob-plan-meta"><PlanMeta plan={plan} /></p>
                <PlanIcons plan={plan} />
              </div>
              <PlanEquipmentDot missing={plan.missing_equipment} />
              <button
                type="button"
                className="ob-button ob-button--primary"
                onClick={() => selection.requestSelect(plan)}
                disabled={!selection.canSelect}
              >
                {selection.busyPlanId === plan.id ? 'Choosing...' : 'Choose plan'}
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
