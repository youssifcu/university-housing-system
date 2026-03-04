import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebaseConfig';
import { getUserByEmail } from '../services/user_Service';
import InputField from '../components/InputField';
import Button from '../components/Button';
import FormContainer from '../components/FormContainer';
import '../styles/ForgotPassword.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Check if email exists in database
      const user = await getUserByEmail(email);
      
      if (!user) {
        setError('No account found with this email address');
        setIsLoading(false);
        return;
      }

      // Send password reset email via Firebase
      await sendPasswordResetEmail(auth, email);
      
      setSuccess(true);
      setIsLoading(false);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send reset email. Please try again.');
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="forgot-password-page">
        <div className="logo-section">
          <div className="logo-placeholder">🎓</div>
          <h1 className="page-title">Student Accommodation</h1>
        </div>
        <FormContainer 
          title="Check Your Email" 
          subtitle="Password reset instructions sent"
        >
          <div className="success-message">
            <div className="success-icon">✉️</div>
            <h3>Email Sent!</h3>
            <p>
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p style={{ marginTop: '1rem', color: '#666' }}>
              Didn't receive the email? Check your spam folder or try again.
            </p>
            <div className="success-actions">
              <Button 
                variant="primary" 
                onClick={() => navigate('/')}
                className="mt-2"
              >
                Back to Login
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                }}
                className="mt-2"
              >
                Try Another Email
              </Button>
            </div>
          </div>
        </FormContainer>
      </div>
    );
  }

  return (
    <div className="forgot-password-page">
      <div className="logo-section">
        <div className="logo-placeholder">🎓</div>
        <h1 className="page-title">Student Accommodation</h1>
      </div>
      <FormContainer 
        title="Forgot Password" 
        subtitle="Enter your email to reset your password"
      >
        <form onSubmit={handleSubmit} className="forgot-password-form">
          {error && (
            <div className="general-error">
              {error}
            </div>
          )}

          <InputField
            label="University Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error=""
            placeholder="Enter your registered email"
            required
          />

          <div className="info-box">
            <span className="info-icon">ℹ️</span>
            <p>
              We'll send a password reset link to your registered email address
            </p>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="large"
            loading={isLoading}
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>

          <div className="form-footer">
            <p>
              Remember your password?{' '}
              <a href="/">Sign in here</a>
            </p>
          </div>
        </form>
      </FormContainer>
    </div>
  );
};

export default ForgotPassword;
