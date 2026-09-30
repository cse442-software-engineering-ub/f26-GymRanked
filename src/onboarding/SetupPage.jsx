import { OnboardingShell } from './parts.jsx';
import SetupStep from './SetupStep.jsx';

// Route: #/setup (registered in src/App.jsx). Onboarding step 2 of 3.
export default function SetupPage() {
  return <OnboardingShell step={1}>{() => <SetupStep />}</OnboardingShell>;
}
