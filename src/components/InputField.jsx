import React from 'react';
import '../styles/InputField.css';

const InputField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false
}) => {
  return (
    <div className="input-field-container">
      <label htmlFor={name} className="input-label">
        {label} {required && <span className="required">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`input-field ${error ? 'input-error' : ''}`}
        required={required}
      />
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default InputField;
