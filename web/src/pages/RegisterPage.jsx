import { useEffect } from 'react';
import { useRegistration } from '../hooks/useRegistration';
import { useNavigate } from 'react-router-dom';
import InputField from '../components/InputField';
import Button from '../components/Button';
import FormContainer from '../components/FormContainer';
import { useAIChatContext } from '../context/AIChatContext';
import '../styles/RegisterPage.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { setScreenContext } = useAIChatContext();
  
  const {
    formData,
    errors,
    isLoading,
    success,
    generalError,
    handleChange,
    handleSubmit,
    resetForm
  } = useRegistration();

  useEffect(() => {
    setScreenContext({
      screen: 'register',
      pageTitle: 'Create Account',
      registrationFields: [
        'name',
        'studentId',
        'email',
        'password',
        'phoneNumber',
        'nationalId',
        'faculty',
        'universityYear',
        'gender',
      ],
      registrationSuccess: success,
      guidance:
        'This screen is for creating a new student housing system account.',
    });
  }, [setScreenContext, success]);

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
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
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
              placeholder="Enter 8-10 digit student ID"
              maxLength="10"
              required
            />

            <InputField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
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
              placeholder="Min 8 chars, uppercase, lowercase, number, special char"
              required
            />

            <InputField
              label="Phone Number"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleChange}
              error={errors.phoneNumber}
              placeholder="11 digits starting with 01 (e.g., 01012345678)"
              maxLength="11"
              pattern="01[0-9]{9}"
              required
            />

            <InputField
              label="National ID"
              name="nationalId"
              type="text"
              value={formData.nationalId}
              onChange={handleChange}
              error={errors.nationalId}
              placeholder="14 digit national ID"
              maxLength="14"
              pattern="[0-9]{14}"
              required
            />

           <div className="input-field-container">
  <label className="input-label">Faculty</label>

  <select
    name="faculty"
    value={formData.faculty}
    onChange={handleChange}
    className={`input-field ${errors.faculty ? 'input-error' : ''}`}
    required
  >
    <option value="">Select faculty</option>
    <option value="Computer Science">Computer Science</option>
    <option value="Engineering">Engineering</option>
    <option value="Medicine">Medicine</option>
    <option value="Business">Business</option>
    <option value="Law">Law</option>
  </select>

  {errors.faculty && (
    <span className="error-message">{errors.faculty}</span>
  )}
</div>

            <div className="input-field-container">
              <label className="input-label">University Year</label>
              <select
                name="universityYear"
                value={formData.universityYear}
                onChange={handleChange}
                className={`input-field ${errors.universityYear ? 'input-error' : ''}`}
                required
              >
                <option value="">Select Year</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
                <option value="5">Year 5</option>
              </select>
              {errors.universityYear && (
                <span className="error-message">{errors.universityYear}</span>
              )}
            </div>

            <div className="input-field-container">
              <label className="input-label">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="input-field"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
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
