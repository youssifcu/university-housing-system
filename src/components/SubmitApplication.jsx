import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../lib/firebaseConfig';
import { submitApplication } from '../services/applicationService';
import { doc, getDoc } from 'firebase/firestore';
import '../styles/SubmitApplication.css';

const SubmitApplication = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  
  const [formData, setFormData] = useState({
    studentType: '',
    fullName: '',
    gender: 'male',
    dateOfBirth: '',
    phoneNumber: '',
    address: '',
    college: '',
    academicYear: '',
    gpa: '',
    nationalId: ''
  });

  const [files, setFiles] = useState({
    nationalIdCard: null,
    personalPhoto: null,
    medicalReport: null,
    universityIdCard: null
  });

  const [filePreviews, setFilePreviews] = useState({
    nationalIdCard: null,
    personalPhoto: null,
    medicalReport: null,
    universityIdCard: null
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.email));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            setFormData(prev => ({
              ...prev,
              fullName: data.fullName || '',
              nationalId: data.studentId || '',
              phoneNumber: data.phoneNumber || '',
              address: data.address || ''
            }));
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    
    if (!file) return;
    
    // Validate file types
    const validTypes = {
      nationalIdCard: ['image/jpeg', 'image/png', 'image/jpg'],
      personalPhoto: ['image/jpeg', 'image/png', 'image/jpg'],
      medicalReport: ['application/pdf'],
      universityIdCard: ['image/jpeg', 'image/png', 'image/jpg']
    };
    
    if (!validTypes[name].includes(file.type)) {
      alert(`Invalid file type for ${name}. Expected: ${validTypes[name].join(', ')}`);
      e.target.value = '';
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      e.target.value = '';
      return;
    }
    
    setFiles(prev => ({ ...prev, [name]: file }));
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreviews(prev => ({ ...prev, [name]: reader.result }));
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreviews(prev => ({ ...prev, [name]: file.name }));
    }
  };

  const handleStepNext = () => {
    // Validate current step before proceeding
    if (step === 1) {
      if (!formData.studentType || !formData.fullName || !formData.gender || 
          !formData.dateOfBirth || !formData.phoneNumber || !formData.address || 
          !formData.nationalId) {
        alert('Please fill in all required fields');
        return;
      }
    }
    if (step === 2) {
      if (!formData.college || !formData.academicYear || !formData.gpa) {
        alert('Please fill in all required fields');
        return;
      }
      
      // Validate GPA
      const gpaValue = parseFloat(formData.gpa);
      if (isNaN(gpaValue) || gpaValue < 0 || gpaValue > 4) {
        alert('GPA must be a valid number between 0 and 4');
        return;
      }
    }
    setStep(prev => prev + 1);
  };
  
  const handleStepBack = () => setStep(prev => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('You must be logged in to submit an application');
      return;
    }

    setLoading(true);

    try {
      const applicationData = {
        studentType: formData.studentType,
        fullName: formData.fullName,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        college: formData.college,
        academicYear: formData.academicYear,
        gpa: parseFloat(formData.gpa),
        nationalId: formData.nationalId
      };

      await submitApplication(applicationData, files);
      
      alert('Application submitted successfully!');
      setLoading(false);
      setStep(1);
      
      // Reset form
      setFormData({
        studentType: '',
        fullName: userData?.fullName || '',
        gender: 'male',
        dateOfBirth: '',
        phoneNumber: userData?.phoneNumber || '',
        address: userData?.address || '',
        college: '',
        academicYear: '',
        gpa: '',
        nationalId: userData?.studentId || ''
      });
      
      setFiles({
        nationalIdCard: null,
        personalPhoto: null,
        medicalReport: null,
        universityIdCard: null
      });
      
      setFilePreviews({
        nationalIdCard: null,
        personalPhoto: null,
        medicalReport: null,
        universityIdCard: null
      });
      
      // Reset file inputs
      document.querySelectorAll('input[type="file"]').forEach(input => input.value = '');
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Error submitting application: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="app-form-wrapper">
      <div className="form-card">
        <div className="stepper">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
          <div className={`step ${step >= 4 ? 'active' : ''}`}>4</div>
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="form-section">
              <h3>Personal Information</h3>
              <select name="studentType" value={formData.studentType} onChange={handleChange} required>
                <option value="">Select Student Type</option>
                <option value="New Student">New Student</option>
                <option value="Continuing Student">Continuing Student</option>
                <option value="Transfer Student">Transfer Student</option>
              </select>
              <input name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} required />
              <select name="gender" value={formData.gender} onChange={handleChange} required>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />
              <input name="phoneNumber" placeholder="Phone Number" value={formData.phoneNumber} onChange={handleChange} required />
              <input name="address" placeholder="Address" value={formData.address} onChange={handleChange} required />
              <input name="nationalId" placeholder="National ID" value={formData.nationalId} onChange={handleChange} required />
              <button type="button" onClick={handleStepNext}>Next Step</button>
            </div>
          )}

          {step === 2 && (
            <div className="form-section">
              <h3>Academic Information</h3>
              <input name="college" placeholder="College / Faculty" value={formData.college} onChange={handleChange} required />
              <input name="academicYear" placeholder="Academic Year (e.g., 1, 2, 3, 4)" value={formData.academicYear} onChange={handleChange} required />
              <input 
                type="number" 
                name="gpa" 
                placeholder="GPA (0.0 - 4.0)" 
                value={formData.gpa} 
                onChange={handleChange} 
                step="0.01" 
                min="0" 
                max="4" 
                required 
              />
              <div className="btn-group">
                <button type="button" className="back" onClick={handleStepBack}>Back</button>
                <button type="button" onClick={handleStepNext}>Next Step</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="form-section">
              <h3>Document Uploads</h3>
              
              <div className="file-upload-group">
                <div className="file-upload">
                  <label>National ID Card (JPG, PNG)</label>
                  <input 
                    type="file" 
                    name="nationalIdCard" 
                    accept="image/jpeg,image/png,image/jpg" 
                    onChange={handleFileChange} 
                  />
                  {filePreviews.nationalIdCard && (
                    <div className="file-preview">
                      <img src={filePreviews.nationalIdCard} alt="National ID Preview" />
                    </div>
                  )}
                </div>

                <div className="file-upload">
                  <label>Personal Photo (JPG, PNG)</label>
                  <input 
                    type="file" 
                    name="personalPhoto" 
                    accept="image/jpeg,image/png,image/jpg" 
                    onChange={handleFileChange} 
                  />
                  {filePreviews.personalPhoto && (
                    <div className="file-preview">
                      <img src={filePreviews.personalPhoto} alt="Personal Photo Preview" />
                    </div>
                  )}
                </div>

                <div className="file-upload">
                  <label>Medical Report (PDF only)</label>
                  <input 
                    type="file" 
                    name="medicalReport" 
                    accept="application/pdf" 
                    onChange={handleFileChange} 
                  />
                  {filePreviews.medicalReport && (
                    <div className="file-preview">
                      <span className="pdf-icon">📄</span>
                      <span>{filePreviews.medicalReport}</span>
                    </div>
                  )}
                </div>

                <div className="file-upload">
                  <label>University ID Card (JPG, PNG)</label>
                  <input 
                    type="file" 
                    name="universityIdCard" 
                    accept="image/jpeg,image/png,image/jpg" 
                    onChange={handleFileChange} 
                  />
                  {filePreviews.universityIdCard && (
                    <div className="file-preview">
                      <img src={filePreviews.universityIdCard} alt="University ID Preview" />
                    </div>
                  )}
                </div>
              </div>

              <div className="btn-group">
                <button type="button" className="back" onClick={handleStepBack}>Back</button>
                <button type="button" onClick={handleStepNext}>Next Step</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="form-section">
              <h3>Review & Submit</h3>
              <div className="review-summary">
                <div className="review-item">
                  <strong>Student Type:</strong> {formData.studentType}
                </div>
                <div className="review-item">
                  <strong>Full Name:</strong> {formData.fullName}
                </div>
                <div className="review-item">
                  <strong>Gender:</strong> {formData.gender}
                </div>
                <div className="review-item">
                  <strong>Date of Birth:</strong> {formData.dateOfBirth}
                </div>
                <div className="review-item">
                  <strong>Phone:</strong> {formData.phoneNumber}
                </div>
                <div className="review-item">
                  <strong>Address:</strong> {formData.address}
                </div>
                <div className="review-item">
                  <strong>College:</strong> {formData.college}
                </div>
                <div className="review-item">
                  <strong>Academic Year:</strong> {formData.academicYear}
                </div>
                <div className="review-item">
                  <strong>GPA:</strong> {formData.gpa}
                </div>
                <div className="review-item">
                  <strong>National ID:</strong> {formData.nationalId}
                </div>
                <div className="review-item">
                  <strong>Documents:</strong> Optional (upload any needed files)
                </div>
              </div>
              <div className="btn-group">
                <button type="button" className="back" onClick={handleStepBack}>Back</button>
                <button type="submit" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default SubmitApplication;