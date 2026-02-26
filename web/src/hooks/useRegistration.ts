import { useState } from 'react';
import { registerUser } from '../services/userService';
import type { RegistrationFormData, ValidationResult } from '../types/userTypes';

export const useRegistration = () => {
  const [formData, setFormData] = useState<RegistrationFormData>({
    fullName: '',
    studentId: '',
    universityEmail: '',
    password: ''
  });
  
  const [errors, setErrors] = useState<Partial<RegistrationFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const validateForm = (): ValidationResult => {
    const newErrors: Partial<RegistrationFormData> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().split(' ').length < 2) {
      newErrors.fullName = 'Please enter your full name (first and last name)';
    }
    
    if (!formData.studentId.trim()) {
      newErrors.studentId = 'Student ID is required';
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.studentId)) {
      newErrors.studentId = 'Student ID can only contain letters and numbers';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.universityEmail.trim()) {
      newErrors.universityEmail = 'Email is required';
    } else if (!emailRegex.test(formData.universityEmail)) {
      newErrors.universityEmail = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }
    
    const isValid = Object.keys(newErrors).length === 0;
    return { isValid, errors: newErrors };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name as keyof RegistrationFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
    
    if (generalError) {
      setGeneralError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        fullName: formData.fullName,
        studentId: formData.studentId,
        universityEmail: formData.universityEmail,
        password: formData.password
      });
      
      setSuccess(true);
    } catch (error: any) {
      console.error('Registration error:', error);
      setGeneralError(error.message || 'An error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      studentId: '',
      universityEmail: '',
      password: ''
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