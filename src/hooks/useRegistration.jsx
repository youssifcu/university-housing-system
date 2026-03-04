import { useState } from 'react';
import { registerUser } from '../services/user_Service';

export const useRegistration = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    studentId: '',
    universityEmail: '',
    password: '',
    universityName: '',
    profileImage: null
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const validateForm = () => {
    const newErrors = {};
    
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
    
    if (!formData.universityName.trim()) {
      newErrors.universityName = 'University name is required';
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          profileImage: 'Please select a valid image file'
        }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          profileImage: 'Image size must be less than 5MB'
        }));
        return;
      }
      setFormData(prev => ({
        ...prev,
        profileImage: file
      }));
      setErrors(prev => ({
        ...prev,
        profileImage: undefined
      }));
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
        fullName: formData.fullName,
        studentId: formData.studentId,
        universityEmail: formData.universityEmail,
        password: formData.password,
        universityName: formData.universityName,
        profileImage: formData.profileImage || null
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
      fullName: '',
      studentId: '',
      universityEmail: '',
      password: '',
      universityName: '',
      profileImage: null
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
    handleImageChange,
    handleSubmit,
    validateForm,
    resetForm
  };
};
