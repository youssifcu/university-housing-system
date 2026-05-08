import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebaseConfig';
import { submitApplication } from '../services/applicationService';
import { getStoredAuthUser } from '../services/authService';
import { getCurrentUserWithDetails } from '../services/userService';
import '../styles/SubmitApplication.css';

const initialFormData = {
  userId: '',
  studentType: '',
  nationalId: '',
  fullName: '',
  gender: 'male',
  dateOfBirth: '',
  phoneNumber: '',
  email: '',
  address: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: 'Father',
  college: '',
  department: '',
  academicYear: '',
  gpa: '',
  housingType: 'normal',
  hasSpecialNeeds: false,
  specialNeedsDescription: '',
  preferredRoommate: '',
};

const initialFiles = {
  nationalIdCard: null,
  personalPhoto: null,
  medicalReport: null,
  universityIdCard: null,
};

const initialFilePreviews = {
  nationalIdCard: null,
  personalPhoto: null,
  medicalReport: null,
  universityIdCard: null,
};

const SubmitApplication = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [files, setFiles] = useState(initialFiles);
  const [filePreviews, setFilePreviews] = useState(initialFilePreviews);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        return;
      }

      setUser(currentUser);

      try {
        const backendUser = await getCurrentUserWithDetails();
        const mergedUserData = {
          ...backendUser,
        };

        setUserData(mergedUserData);
        setFormData((prev) => ({
          ...prev,
          userId: mergedUserData?.id || mergedUserData?._id || prev.userId,
          nationalId: mergedUserData?.nationalId || '',
          fullName: mergedUserData?.name || mergedUserData?.fullName || '',
          phoneNumber: mergedUserData?.phoneNumber || '',
          email: mergedUserData?.email || currentUser.email || '',
          address: mergedUserData?.address || '',
          college: mergedUserData?.faculty || '',
          academicYear: mergedUserData?.universityYear ? String(mergedUserData.universityYear) : '',
        }));
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    const file = selectedFiles[0];

    if (!file) {
      return;
    }

    const validTypes = {
      nationalIdCard: ['image/jpeg', 'image/png', 'image/jpg'],
      personalPhoto: ['image/jpeg', 'image/png', 'image/jpg'],
      medicalReport: ['application/pdf'],
      universityIdCard: ['image/jpeg', 'image/png', 'image/jpg'],
    };

    if (!validTypes[name].includes(file.type)) {
      alert(`Invalid file type for ${name}. Expected: ${validTypes[name].join(', ')}`);
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      e.target.value = '';
      return;
    }

    setFiles((prev) => ({ ...prev, [name]: file }));

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreviews((prev) => ({ ...prev, [name]: reader.result }));
      };
      reader.readAsDataURL(file);
      return;
    }

    setFilePreviews((prev) => ({ ...prev, [name]: file.name }));
  };

  const handleStepNext = () => {
    if (step === 1) {
      if (
        !formData.studentType ||
        !formData.fullName ||
        !formData.gender ||
        !formData.dateOfBirth ||
        !formData.phoneNumber ||
        !formData.email ||
        !formData.address ||
        !formData.nationalId
      ) {
        alert('Please fill in all required personal information fields.');
        return;
      }
    }

    if (step === 2) {
      if (
        !formData.emergencyContactName ||
        !formData.emergencyContactPhone ||
        !formData.emergencyContactRelation ||
        !formData.college ||
        !formData.department ||
        !formData.academicYear ||
        !formData.gpa
      ) {
        alert('Please complete the emergency and academic information.');
        return;
      }

      const gpaValue = parseFloat(formData.gpa);
      if (Number.isNaN(gpaValue) || gpaValue < 0 || gpaValue > 4) {
        alert('GPA must be a valid number between 0 and 4.');
        return;
      }
    }

    if (step === 3 && formData.hasSpecialNeeds && !formData.specialNeedsDescription.trim()) {
      alert('Please describe the special needs request.');
      return;
    }

    setStep((prev) => prev + 1);
  };

  const handleStepBack = () => setStep((prev) => prev - 1);

  const resetForm = () => {
    setStep(1);
    setFiles(initialFiles);
    setFilePreviews(initialFilePreviews);
    setFormData({
      ...initialFormData,
      userId: userData?.id || userData?._id || '',
      nationalId: userData?.nationalId || '',
      fullName: userData?.name || userData?.fullName || '',
      phoneNumber: userData?.phoneNumber || '',
      email: userData?.email || user?.email || '',
      address: userData?.address || '',
      college: userData?.faculty || '',
      academicYear: userData?.universityYear ? String(userData.universityYear) : '',
    });
    document.querySelectorAll('input[type="file"]').forEach((input) => {
      input.value = '';
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert('You must be logged in to submit an application');
      return;
    }

    if (!formData.userId) {
      alert('Unable to identify the current student account.');
      return;
    }

    setLoading(true);

    try {
      const applicationData = {
        userId: formData.userId,
        studentType: formData.studentType,
        nationalId: formData.nationalId,
        fullName: formData.fullName,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        address: formData.address,
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relation: formData.emergencyContactRelation,
        },
        college: formData.college,
        department: formData.department,
        academicYear: formData.academicYear,
        gpa: parseFloat(formData.gpa),
        housingType: formData.housingType,
        specialNeeds: {
          hasSpecialNeeds: Boolean(formData.hasSpecialNeeds),
          description: formData.hasSpecialNeeds ? formData.specialNeedsDescription : '',
        },
        preferredRoommate: formData.preferredRoommate.trim(),
      };

      await submitApplication(applicationData, files);
      alert('Application submitted successfully!');
      resetForm();
    } catch (error) {
      console.log("FULL ERROR:", error);
      console.log("RESPONSE DATA:", error.response?.data);
      console.log("VALIDATION ERRORS:", error.response?.data?.errors);
      console.error('Error submitting application:', error);
      alert('Error submitting application: ' + error.message);
    } finally {
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
                <option value="">Select student type</option>
                <option value="new">New</option>
                <option value="returning">Returning</option>
              </select>
              <input name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} required />
              <select name="gender" value={formData.gender} onChange={handleChange} required>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />
              <input name="phoneNumber" placeholder="Phone Number" value={formData.phoneNumber} onChange={handleChange} required />
              <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
              <input name="address" placeholder="Address" value={formData.address} onChange={handleChange} required />
              <input name="nationalId" placeholder="National ID" value={formData.nationalId} onChange={handleChange} required />
              <button type="button" onClick={handleStepNext}>Next Step</button>
            </div>
          )}

          {step === 2 && (
            <div className="form-section">
              <h3>Emergency And Academic Information</h3>
              <input
                name="emergencyContactName"
                placeholder="Emergency Contact Name"
                value={formData.emergencyContactName}
                onChange={handleChange}
                required
              />
              <input
                name="emergencyContactPhone"
                placeholder="Emergency Contact Phone"
                value={formData.emergencyContactPhone}
                onChange={handleChange}
                required
              />
              <select
                name="emergencyContactRelation"
                value={formData.emergencyContactRelation}
                onChange={handleChange}
                required
              >
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Brother">Brother</option>
              </select>
              <input name="college" placeholder="Faculty Name" value={formData.college} onChange={handleChange} required />
              <input name="department" placeholder="Department Name" value={formData.department} onChange={handleChange} required />
              <select name="academicYear" value={formData.academicYear} onChange={handleChange} required>
                <option value="">Select academic year</option>
                <option value="preparatory">Preparatory</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
              </select>
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
              <h3>Housing Preferences</h3>
              <select name="housingType" value={formData.housingType} onChange={handleChange} required>
                <option value="normal">Normal</option>
                <option value="distinguished">Distinguished</option>
              </select>
              <input
                name="preferredRoommate"
                placeholder="Preferred Roommate User ID (optional)"
                value={formData.preferredRoommate}
                onChange={handleChange}
              />
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  name="hasSpecialNeeds"
                  checked={formData.hasSpecialNeeds}
                  onChange={handleChange}
                />
                <span>Student has special needs</span>
              </label>
              {formData.hasSpecialNeeds && (
                <textarea
                  name="specialNeedsDescription"
                  placeholder="Describe the special needs"
                  value={formData.specialNeedsDescription}
                  onChange={handleChange}
                  rows="4"
                  required
                />
              )}
              <div className="btn-group">
                <button type="button" className="back" onClick={handleStepBack}>Back</button>
                <button type="button" onClick={handleStepNext}>Next Step</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="form-section">
              <h3>Documents And Review</h3>

              <div className="file-upload-group">
                <div className="file-upload">
                  <label>National ID Card (JPG, PNG)</label>
                  <input type="file" name="nationalIdCard" accept="image/jpeg,image/png,image/jpg" onChange={handleFileChange} />
                  {filePreviews.nationalIdCard && (
                    <div className="file-preview">
                      <img src={filePreviews.nationalIdCard} alt="National ID Preview" />
                    </div>
                  )}
                </div>

                <div className="file-upload">
                  <label>Personal Photo (JPG, PNG)</label>
                  <input type="file" name="personalPhoto" accept="image/jpeg,image/png,image/jpg" onChange={handleFileChange} />
                  {filePreviews.personalPhoto && (
                    <div className="file-preview">
                      <img src={filePreviews.personalPhoto} alt="Personal Photo Preview" />
                    </div>
                  )}
                </div>

                <div className="file-upload">
                  <label>Medical Report (PDF only)</label>
                  <input type="file" name="medicalReport" accept="application/pdf" onChange={handleFileChange} />
                  {filePreviews.medicalReport && (
                    <div className="file-preview">
                      <span className="pdf-icon">PDF</span>
                      <span>{filePreviews.medicalReport}</span>
                    </div>
                  )}
                </div>

                <div className="file-upload">
                  <label>University ID Card (JPG, PNG)</label>
                  <input type="file" name="universityIdCard" accept="image/jpeg,image/png,image/jpg" onChange={handleFileChange} />
                  {filePreviews.universityIdCard && (
                    <div className="file-preview">
                      <img src={filePreviews.universityIdCard} alt="University ID Preview" />
                    </div>
                  )}
                </div>
              </div>

              <div className="review-summary">
                <div className="review-item"><strong>User ID:</strong> {formData.userId || 'N/A'}</div>
                <div className="review-item"><strong>Student Type:</strong> {formData.studentType}</div>
                <div className="review-item"><strong>Full Name:</strong> {formData.fullName}</div>
                <div className="review-item"><strong>Email:</strong> {formData.email}</div>
                <div className="review-item"><strong>Emergency Contact:</strong> {formData.emergencyContactName} - {formData.emergencyContactPhone}</div>
                <div className="review-item"><strong>College:</strong> {formData.college}</div>
                <div className="review-item"><strong>Department:</strong> {formData.department}</div>
                <div className="review-item"><strong>Academic Year:</strong> {formData.academicYear}</div>
                <div className="review-item"><strong>GPA:</strong> {formData.gpa}</div>
                <div className="review-item"><strong>Housing Type:</strong> {formData.housingType}</div>
                <div className="review-item"><strong>Special Needs:</strong> {formData.hasSpecialNeeds ? formData.specialNeedsDescription : 'No'}</div>
                <div className="review-item"><strong>Preferred Roommate:</strong> {formData.preferredRoommate || 'N/A'}</div>
              </div>

              <div className="btn-group">
                <button type="button" className="back" onClick={handleStepBack}>Back</button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Application'}
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
