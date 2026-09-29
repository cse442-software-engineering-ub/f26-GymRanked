import { useState } from 'react'

export default function FormField({ name, label, value, onChange, error, type = 'text', reveal = false, ...props }) {
  const [visible, setVisible] = useState(false)
  return <div className="form-field">
    <label htmlFor={name}>{label}</label>
    <div className={`input-wrap ${error ? 'invalid' : ''}`}>
      <input {...props} id={name} name={name} type={visible ? 'text' : type} value={value} onChange={onChange} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} />
      {reveal && <button className="reveal" type="button" onClick={() => setVisible(!visible)} aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}>{visible ? 'Hide' : 'Show'}</button>}
    </div>
    {error && <span className="field-error" id={`${name}-error`}>{error}</span>}
  </div>
}
