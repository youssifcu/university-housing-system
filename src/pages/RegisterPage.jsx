import { useRegistration } from '../hooks/useRegistration';
import { useNavigate } from 'react-router-dom';
import InputField from '../components/InputField';
import Button from '../components/Button';
import FormContainer from '../components/FormContainer';
import '../styles/RegisterPage.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  
  const {
    formData,
    errors,
    isLoading,
    success,
    generalError,
    handleChange,
    handleImageChange,
    handleSubmit,
    resetForm
  } = useRegistration();

  return (
    <div className="register-page">
      <div className="logo-section">
        <div className="logo-placeholder">🎓</div>
        <h1 className="page-title">Student Accommodation</h1>
      </div>
      <FormContainer 
        title="Create Account" 
        subtitle="Please fill in your details to register"
      >
        {success ? (
          <div className="success-message">
            <h3>Registration Successful!</h3>
            <p>Your account has been created successfully.</p>
            <Button 
              variant="primary" 
              onClick={() => navigate('/')}
              className="mt-2"
            >
              Go to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="registration-form">
            {generalError && (
              <div className="general-error">
                {generalError}
              </div>
            )}

            <InputField
              label="Full Name"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              error={errors.fullName}
              placeholder="Enter your full name"
              required
            />

            <InputField
              label="Student ID"
              name="studentId"
              type="text"
              value={formData.studentId}
              onChange={handleChange}
              error={errors.studentId}
              placeholder="Enter your student ID"
              required
            />

            <InputField
              label="Email"
              name="universityEmail"
              type="email"
              value={formData.universityEmail}
              onChange={handleChange}
              error={errors.universityEmail}
              placeholder="Enter your email"
              required
            />

            <InputField
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Create a password"
              required
            />

            <InputField
              label="University Name"
              name="universityName"
              type="text"
              value={formData.universityName}
              onChange={handleChange}
              error={errors.universityName}
              placeholder="Enter your university name"
              required
            />

            <div className="input-field-container">
              <label className="input-label">
                Profile Image (Housing Report)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className={`input-field ${errors.profileImage ? 'input-error' : ''}`}
              />
              {errors.profileImage && (
                <span className="error-message">{errors.profileImage}</span>
              )}
              {formData.profileImage && (
                <p style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                  Selected: {formData.profileImage.name}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="large"
              loading={isLoading}
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Register'}
            </Button>

            <div className="form-footer">
              <p>
                Already have an account?{' '}
                <a href="/">Sign in here</a>
              </p>
            </div>
          </form>
        )}
      </FormContainer>
    </div>
  );
};

export default RegisterPage;
