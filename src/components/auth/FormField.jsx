// src/components/auth/FormField.jsx
export default function FormField({
  id, label, type = 'text', value, onChange,
  placeholder, error, required = false,
  rightElement, autoComplete, ...rest
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold theme-muted uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`theme-input w-full px-3.5 py-2.5 text-sm ${rightElement ? 'pr-10' : ''} ${
            error ? 'border-red-500/60' : ''
          }`}
          {...rest}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-400 mt-1.5">{error}</p>
      )}
    </div>
  )
}
