import React from 'react';
import '../styles/FormContainer.css';

interface FormContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

const FormContainer: React.FC<FormContainerProps> = ({
  children,
  title,
  subtitle,
  className = ''
}) => {
  return (
    <div className={`form-container ${className}`}>
      {(title || subtitle) && (
        <div className="form-header">
          {title && <h2 className="form-title">{title}</h2>}
          {subtitle && <p className="form-subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="form-body">
        {children}
      </div>
    </div>
  );
};

export default FormContainer;