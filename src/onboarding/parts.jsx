// Building blocks shared by the onboarding steps.

export function StepHeader({ title, subtitle, children }) {
  return (
    <header className="ob-header">
      <div>
        <h2 className="ob-title">{title}</h2>
        <p className="ob-subtitle">{subtitle}</p>
      </div>
      <div className="ob-actions">{children}</div>
    </header>
  );
}

// A large selectable card (one choice per group).
export function ChoiceCard({ label, description, selected, onSelect, disabled, showIcon = false }) {
  return (
    <button
      type="button"
      className="ob-card"
      aria-pressed={selected}
      onClick={onSelect}
      disabled={disabled}
    >
      {showIcon && <span className="ob-card-icon" aria-hidden="true" />}
      <span className="ob-card-label">{label}</span>
      <span className="ob-card-description">{description}</span>
      <span className="ob-card-state" aria-hidden="true">
        {selected ? 'Selected' : 'Select'}
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

