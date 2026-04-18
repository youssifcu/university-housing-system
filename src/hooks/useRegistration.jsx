import { useState } from 'react';
import { registerUser } from '../services/authService';

export const useRegistration = () => {
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    email: '',
    password: '',
    phoneNumber: '',
    nationalId: '',
    universityYear: '',
    faculty: '',
    gender: 'male'
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().split(' ').length < 2) {
      newErrors.name = 'Please enter your full name (first and last name)';
    }
    
    const studentIdRegex = /^\d{8,10}$/;
    if (!formData.studentId.trim()) {
      newErrors.studentId = 'Student ID is required';
    } else if (!studentIdRegex.test(formData.studentId)) {
      newErrors.studentId = 'Student ID must be 8-10 digits';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters, include uppercase, lowercase, number, and special character';
    }
    
    const phoneRegex = /^01[0-9]{9}$/;
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be 11 digits starting with 01';
    }
    
    const nationalIdRegex = /^\d{14}$/;
    if (!formData.nationalId.trim()) {
      newErrors.nationalId = 'National ID is required';
    } else if (!nationalIdRegex.test(formData.nationalId)) {
      newErrors.nationalId = 'National ID must be 14 digits';
    }
    
    const validFaculties = [
      'computer science', 'engineering', 'medicine', 'pharmacy', 'dentistry',
      'business', 'law', 'arts', 'science', 'education', 'agriculture',
      'nursing', 'physical therapy', 'architecture', 'mass communication',
      'economics', 'political science', 'languages', 'tourism', 'fine arts'
    ];
    if (!formData.faculty.trim()) {
      newErrors.faculty = 'Faculty is required';
    } else if (!validFaculties.includes(formData.faculty.trim().toLowerCase())) {
      newErrors.faculty = 'Please select a valid faculty (e.g., Computer Science, Engineering, Medicine)';
    }
    
    if (!formData.universityYear) {
      newErrors.universityYear = 'University year is required';
    } else {
      const year = parseInt(formData.universityYear);
      if (year < 1 || year > 5) {
        newErrors.universityYear = 'University year must be between 1 and 5';
      }
    }
    
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    } else if (formData.gender !== 'male' && formData.gender !== 'female') {
      newErrors.gender = 'Gender must be male or female';
    }
    
    const isValid = Object.keys(newErrors).length === 0;
    return { isValid, errors: newErrors };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
    
    if (generalError) {
      setGeneralError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateForm();
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    setIsLoading(true);
    setGeneralError('');
    
    try {
      await registerUser({
        name: formData.name,
        studentId: formData.studentId,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        nationalId: formData.nationalId,
        universityYear: parseInt(formData.universityYear),
        faculty: formData.faculty,
        gender: formData.gender
      });
      
      setSuccess(true);
    } catch (error) {
      console.error('Registration error:', error);
      setGeneralError(error.message || 'An error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      studentId: '',
      email: '',
      password: '',
      phoneNumber: '',
      nationalId: '',
      universityYear: '',
      faculty: '',
      gender: 'male'
    });
    setErrors({});
    setSuccess(false);
    setGeneralError('');
  };

  return {
    formData,
    errors,
    isLoading,
    success,
    generalError,
    handleChange,
    handleSubmit,
    validateForm,
    resetForm
  };
};
