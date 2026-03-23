import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebaseConfig';
import { updateUserProfile } from '../services/user_Service';
import Button from '../components/Button';
import InputField from '../components/InputField';
import SubmitApplication from '../components/SubmitApplication';
import MyApplications from '../components/MyApplications';
import '../styles/MemberDashboard.css';

const MemberDashboard = () => {
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [housingData, setHousingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.email));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            setEditData({
              fullName: data.fullName,
              studentId: data.studentId,
              universityName: data.universityName
            });
            if (data.profileImageUrl) {
              setPreviewImage(data.profileImageUrl);
            }
          }

          setTimeout(() => {
            setHousingData({
              roomId: "Building B - Room 204",
              bedNumber: 1,
              housingStatus: "active",
              qrCode: "VALID-ENTRY-2024-X99" 
            });
          }, 800);

        } catch (error) {
          console.error('Error fetching data:', error);
        }
      } else {
        navigate('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const updateData = {
        ...editData,
        updatedAt: new Date()
      };
      await updateUserProfile(user.email, updateData);
      const updatedUserDoc = await getDoc(doc(db, 'users', user.email));
      if (updatedUserDoc.exists()) {
        setUserData(updatedUserDoc.data());
      }
      setEditing(false);
      setProfileImage(null);
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Error updating profile: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="member-dashboard">
        <div className="loading-spinner">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="member-dashboard">
      <div className="member-container">
        
        {/* Header Section */}
        <div className="member-header">
          <div className="member-welcome">
            {previewImage ? (
              <img src={previewImage} alt="Profile" className="member-avatar-large" />
            ) : (
              <div className="member-avatar-large avatar-placeholder">👤</div>
            )}
            <h1>Hello, {userData?.fullName || 'User'}!</h1>
            <p>Welcome to your personal dashboard</p>
            <span className="member-role-badge">
              {userData?.role || 'member'}
            </span>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="tabs-container">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          >
            👤 My Profile & ID
          </button>
          
          <button 
            onClick={() => setActiveTab('submitApp')}
            className={`tab-btn ${activeTab === 'submitApp' ? 'active' : ''}`}
          >
            📝 Submit Application
          </button>

          <button 
            onClick={() => setActiveTab('myApps')}
            className={`tab-btn ${activeTab === 'myApps' ? 'active' : ''}`}
          >
            📂 My Applications
          </button>
        </div>
        
        {/* Content Section */}
        <div className="member-content">
          
          {activeTab === 'profile' && (
            <div className="profile-section-modern">
              <div className="section-header-modern">
                <h3 className="section-title-modern">
                  <span className="info-icon">ℹ️</span> Resident Digital ID
                </h3>
                {!editing && (
                  <button 
                    className="edit-btn-modern"
                    onClick={() => setEditing(true)}
                  >
                    ✏️ Edit Profile
                  </button>
                )}
              </div>

              <div className="profile-card-modern">
                
                <div className="digital-id-card">
                  <div className="qr-box">
                    {housingData ? (
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${housingData.qrCode}`} 
                        alt="Entry QR" 
                      />
                    ) : (
                      <div className="qr-placeholder">Processing Housing...</div>
                    )}
                    <p className="qr-label">Entry Token</p>
                  </div>
                  
                  <div className="housing-info-brief">
                    <div className="info-tag">Status: <span className="status-active">{housingData?.housingStatus || 'Pending'}</span></div>
                    <div className="info-tag">Room: <span>{housingData?.roomId || 'TBD'}</span></div>
                    <div className="info-tag">Bed: <span>#{housingData?.bedNumber || '--'}</span></div>
                  </div>
                </div>

                <div className="profile-image-section-modern">
                  {previewImage ? (
                    <img src={previewImage} alt="Profile" className="profile-preview-img" />
                  ) : (
                    <div className="avatar-placeholder-large">👤</div>
                  )}
                  
                  {editing && (
                    <div className="image-upload-wrapper">
                      <label htmlFor="profile-upload" className="file-input-label">
                        📷 Choose New Image
                      </label>
                      <input
                        id="profile-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="file-input-modern"
                      />
                      <p className="image-upload-text">Max 5MB</p>
                    </div>
                  )}
                </div>

                <div className="profile-details-modern">
                  {editing ? (
                    <>
                      <div className="input-group-modern">
                        <label>Full Name</label>
                        <input
                          type="text"
                          value={editData.fullName}
                          onChange={(e) => setEditData({...editData, fullName: e.target.value})}
                          className="input-modern"
                        />
                      </div>
                      <div className="input-group-modern">
                        <label>Student ID</label>
                        <input
                          type="text"
                          value={editData.studentId}
                          onChange={(e) => setEditData({...editData, studentId: e.target.value})}
                          className="input-modern"
                        />
                      </div>
                      <div className="input-group-modern">
                        <label>University Name</label>
                        <input
                          type="text"
                          value={editData.universityName}
                          onChange={(e) => setEditData({...editData, universityName: e.target.value})}
                          className="input-modern"
                        />
                      </div>
                      <div className="action-buttons-modern">
                        <button className="save-btn-modern" onClick={handleSaveProfile}>✓ Save</button>
                        <button className="cancel-btn-modern" onClick={() => setEditing(false)}>Cancel</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="detail-item-modern">
                        <span className="detail-label">Full Name</span>
                        <div className="detail-value">{userData.fullName}</div>
                      </div>
                      <div className="detail-item-modern">
                        <span className="detail-label">Student ID</span>
                        <div className="detail-value">{userData.studentId}</div>
                      </div>
                      <div className="detail-item-modern">
                        <span className="detail-label">Email</span>
                        <div className="detail-value">{userData.universityEmail}</div>
                      </div>
                      <div className="detail-item-modern">
                        <span className="detail-label">University</span>
                        <div className="detail-value">{userData.universityName}</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'submitApp' && <SubmitApplication />}
          {activeTab === 'myApps' && <MyApplications />}
          
          <div className="logout-section-modern">
            <button className="logout-btn-member" onClick={handleLogout}>🚪 Logout</button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;