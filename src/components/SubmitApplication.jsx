import React, { useState } from 'react';
import '../styles/SubmitApplication.css';

const SubmitApplication = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  
  const [formData, setFormData] = useState({
    studentType: 'New Student', 
    nationality: '', 
    nationalId: '', 
    fullName: '',
    dateOfBirth: '', 
    placeOfBirth: '', 
    gender: 'male', 
    religion: 'Muslim',
    residenceAddress: '', 
    mobile: '',
    fatherName: '', 
    fatherNationalId: '', 
    fatherPhone: '',
    college: '', 
    academicYear: '', 
    lastYearGrade: '',
    housingType: 'Normal',
    medicalReport: '' 
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStepNext = () => setStep(prev => prev + 1);
  const handleStepBack = () => setStep(prev => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      console.log("Mock Data Submitted to logic:", formData);
      if(file) console.log("File attached:", file.name);
      
      alert("Application submitted successfully (Mock Mode)!");
      setLoading(false);
      setStep(1); 
    }, 1500);
  };

  return (
    <div className="app-form-wrapper">
      <div className="form-card">
        <div className="stepper">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="form-section">
              <h3>Personal Information</h3>
              <input name="fullName" placeholder="Full Name" onChange={handleChange} required />
              <input name="nationalId" placeholder="National ID" onChange={handleChange} required />
              <input type="date" name="dateOfBirth" onChange={handleChange} required />
              <input name="residenceAddress" placeholder="Full Home Address" onChange={handleChange} required />
              <input name="mobile" placeholder="Mobile Number" onChange={handleChange} required />
              <button type="button" onClick={handleStepNext}>Next Step</button>
            </div>
          )}

          {step === 2 && (
            <div className="form-section">
              <h3>Guardian Details</h3>
              <input name="fatherName" placeholder="Father's Full Name" onChange={handleChange} required />
              <input name="fatherNationalId" placeholder="Father's National ID" onChange={handleChange} required />
              <input name="fatherPhone" placeholder="Father's Phone Number" onChange={handleChange} required />
              <div className="btn-group">
                <button type="button" className="back" onClick={handleStepBack}>Back</button>
                <button type="button" onClick={handleStepNext}>Next Step</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="form-section">
              <h3>Academic & Documents</h3>
              <input name="college" placeholder="College / Faculty" onChange={handleChange} required />
              <input name="academicYear" placeholder="Academic Year" onChange={handleChange} required />
              
              <div className="file-upload">
                <label>Upload Documents (PDF: ID + University Card + Grades)</label>
                <input type="file" accept=".pdf,image/*" onChange={(e) => setFile(e.target.files[0])} required />
              </div>

              <div className="btn-group">
                <button type="button" className="back" onClick={handleStepBack}>Back</button>
                <button type="submit" disabled={loading}>
                  {loading ? "Processing..." : "Submit Application"}
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