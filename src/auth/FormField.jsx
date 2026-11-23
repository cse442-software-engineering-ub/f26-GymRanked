import { useState } from 'react'

// idPrefix keeps ids unique while two forms share the screen (the slide between log in and create account).
export default function FormField({ name, label, value, onChange, error, invalid = false, type = 'text', reveal = false, idPrefix = '', ...props }) {
  const [visible, setVisible] = useState(false)
  const id = idPrefix + name
  return <div className="form-field">
    <label htmlFor={id}>{label}</label>
    <div className={`input-wrap ${error || invalid ? 'invalid' : ''}`}>
      <input {...props} id={id} name={name} type={visible ? 'text' : type} value={value} onChange={onChange} aria-invalid={Boolean(error || invalid)} aria-describedby={error ? `${id}-error` : undefined} />
      {reveal && <button className="reveal" type="button" onClick={() => setVisible(!visible)} aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}>{visible ? 'Hide' : 'Show'}</button>}
    </div>
    {error && <span className="field-error" id={`${id}-error`}>{error}</span>}
  </div>
}
