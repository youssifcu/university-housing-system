import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebaseConfig';
import InputField from '../components/InputField';
import Button from '../components/Button';
import FormContainer from '../components/FormContainer';
import '../styles/RegisterPage.css';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    universityEmail: '',
    password: ''
  });
  
  const [errors, setErrors] = useState({
    universityEmail: '',
    password: '',
    general: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    let isValid = true;
    const newErrors = { ...errors };
    
    if (!formData.universityEmail.trim()) {
      newErrors.universityEmail = 'Email is required';
      isValid = false;
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }
    
    if (!isValid) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    setErrors({ ...errors, general: '' });
    
    try {
      if (!auth) {
        throw new Error('Authentication service is not available. Please contact support.');
      }
      
      await signInWithEmailAndPassword(
        auth, 
        formData.universityEmail, 
        formData.password
      );
      
      console.log('Login successful!');
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.code === 'auth/network-request-failed') {
        setErrors({
          ...errors,
          general: 'Network error. Please check your connection and try again.'
        });
      } else if (error.code === 'auth/configuration-not-found') {
        setErrors({
          ...errors,
          general: 'Authentication configuration not found. Please contact support.'
        });
      } else if (error.code === 'auth/invalid-api-key') {
        setErrors({
          ...errors,
          general: 'Invalid API configuration. Please contact support.'
        });
      } else {
        setErrors({
          ...errors,
          general: error.message || 'An error occurred during login. Please try again.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="logo-section">
        <div className="logo-placeholder">🎓</div>
        <h1 className="page-title">Student Accommodation</h1>
      </div>
      <FormContainer 
        title="Sign In" 
        subtitle="Welcome back! Please sign in to your account"
      >
        <form onSubmit={handleSubmit} className="registration-form">
          {errors.general && (
            <div className="general-error">
              {errors.general}
            </div>
          )}

          <InputField
            label="University Email"
            name="universityEmail"
            type="email"
            value={formData.universityEmail}
            onChange={handleChange}
            error={errors.universityEmail}
            placeholder="Enter your university email"
            required
          />

          <InputField
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="Enter your password"
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="large"
            loading={isLoading}
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>

          <div className="form-footer">
            <p style={{color:"black"}}>
              Don't have an account?{' '}
              <a href="/register">Register here</a>
            </p>
          </div>
        </form>
      </FormContainer>
    </div>
  );
};

export default LoginPage;