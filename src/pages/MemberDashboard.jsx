import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebaseConfig';
import { getCurrentUser, getStoredAuthUser, logoutUser, updateCurrentUser } from '../services/authService';
import { getApplicationsByUser } from '../services/user_Service';
import Button from '../components/Button';
import InputField from '../components/InputField';
import SubmitApplication from '../components/SubmitApplication';
import MyApplications from '../components/MyApplications';
import RoomChangeRequest from '../components/RoomChangeRequest';
import '../styles/MemberDashboard.css';

const MemberDashboard = () => {
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [backendProfile, setBackendProfile] = useState(getStoredAuthUser());
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
        setBackendProfile(getStoredAuthUser());
        try {
          const profile = await getCurrentUser();
          setBackendProfile(profile);
          setEditData({
            name: profile?.name || '',
            email: profile?.email || currentUser.email || '',
            phoneNumber: profile?.phoneNumber || '',
            studentId: profile?.studentId || '',
            nationalId: profile?.nationalId || '',
            faculty: profile?.faculty || '',
            universityYear: profile?.universityYear || '',
          });

          const userDoc = await getDoc(doc(db, 'users', currentUser.email));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            if (data.profileImageUrl) {
              setPreviewImage(data.profileImageUrl);
            }
          }

          await loadHousingData(currentUser.email);

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

  const loadHousingData = async (email) => {
    try {
      const applications = await getApplicationsByUser(email);
      const approvedApp = applications.find(app => {
        const normalizedStatus = String(app.status || '').toLowerCase();
        return normalizedStatus === 'approved' || normalizedStatus === 'accepted';
      });
      
      if (userData?.currentRoomId) {
        setHousingData({
          roomId: `${userData.currentBuildingName || 'Unknown'} - Room ${userData.currentRoomNumber || 'Unknown'}`,
          bedNumber: 1,
          housingStatus: "active",
          qrCode: `VALID-${userData.currentRoomId.substring(0, 8).toUpperCase()}` 
        });
      } else if (approvedApp) {
        setHousingData({
          roomId: `${approvedApp.buildingName} - Room ${approvedApp.roomNumber}`,
          bedNumber: 1,
          housingStatus: "active",
          qrCode: `VALID-${String(approvedApp.id || approvedApp._id).substring(0, 8).toUpperCase()}` 
        });
      } else {
        const pendingApp = applications.find(
          app => String(app.status || '').toLowerCase() === 'pending'
        );
        if (pendingApp) {
          setHousingData({
            roomId: "Pending Approval",
            bedNumber: null,
            housingStatus: "pending",
            qrCode: null 
          });
        } else {
          setHousingData(null);
        }
      }
    } catch (error) {
      console.error('Error loading housing data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logoutUser();
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
      const updatedProfile = await updateCurrentUser({
        name: editData.name,
        email: editData.email,
        phoneNumber: editData.phoneNumber,
        studentId: editData.studentId,
        nationalId: editData.nationalId,
        faculty: editData.faculty,
        universityYear: Number(editData.universityYear),
      });

      setBackendProfile(updatedProfile);
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
            <h1>Hello, {backendProfile?.name || userData?.fullName || 'User'}!</h1>
            <p>Welcome to your personal dashboard</p>
            <span className="member-role-badge">
              {backendProfile?.role || userData?.role || 'member'}
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

          <button 
            onClick={() => setActiveTab('roomChange')}
            className={`tab-btn ${activeTab === 'roomChange' ? 'active' : ''}`}
          >
            🔄 Room Change Request
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
                    {housingData && housingData.qrCode ? (
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${housingData.qrCode}`} 
                        alt="Entry QR" 
                      />
                    ) : (
                      <div className="qr-placeholder">
                        {housingData?.housingStatus === 'pending' ? 'Pending Approval' : 'No Housing'}
                      </div>
                    )}
                    <p className="qr-label">Entry Token</p>
                  </div>
                  
                  <div className="housing-info-brief">
                    <div className="info-tag">Status: <span className={housingData?.housingStatus === 'active' ? 'status-active' : 'status-pending'}>{housingData?.housingStatus || 'Not Applied'}</span></div>
                    <div className="info-tag">Room: <span>{housingData?.roomId || 'N/A'}</span></div>
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
                          value={editData.name || ''}
                          onChange={(e) => setEditData({...editData, name: e.target.value})}
                          className="input-modern"
                        />
                      </div>
                      <div className="input-group-modern">
                        <label>Email</label>
                        <input
                          type="email"
                          value={editData.email || ''}
                          onChange={(e) => setEditData({...editData, email: e.target.value})}
                          className="input-modern"
                        />
                      </div>
                      <div className="input-group-modern">
                        <label>Phone Number</label>
                        <input
                          type="tel"
                          value={editData.phoneNumber || ''}
                          onChange={(e) => setEditData({...editData, phoneNumber: e.target.value})}
                          className="input-modern"
                        />
                      </div>
                      <div className="input-group-modern">
                        <label>Student ID</label>
                        <input
                          type="text"
                          value={editData.studentId || ''}
                          onChange={(e) => setEditData({...editData, studentId: e.target.value})}
                          className="input-modern"
                        />
                      </div>
                      <div className="input-group-modern">
                        <label>National ID</label>
                        <input
                          type="text"
                          value={editData.nationalId || ''}
                          onChange={(e) => setEditData({...editData, nationalId: e.target.value})}
                          className="input-modern"
                        />
                      </div>
                      <div className="input-group-modern">
                        <label>Faculty</label>
                        <input
                          type="text"
                          value={editData.faculty || ''}
                          onChange={(e) => setEditData({...editData, faculty: e.target.value})}
                          className="input-modern"
                        />
                      </div>
                      <div className="input-group-modern">
                        <label>University Year</label>
                        <input
                          type="number"
                          min="1"
                          max="7"
                          value={editData.universityYear || ''}
                          onChange={(e) => setEditData({...editData, universityYear: e.target.value})}
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
                        <div className="detail-value">{backendProfile?.name || userData?.fullName || 'N/A'}</div>
                      </div>
                      <div className="detail-item-modern">
                        <span className="detail-label">User ID</span>
                        <div className="detail-value">{backendProfile?.id || userData?.id || 'N/A'}</div>
                      </div>
                      <div className="detail-item-modern">
                        <span className="detail-label">Student ID</span>
                        <div className="detail-value">{backendProfile?.studentId || userData?.studentId || 'N/A'}</div>
                      </div>
                      <div className="detail-item-modern">
                        <span className="detail-label">Email</span>
                        <div className="detail-value">{backendProfile?.email || userData?.universityEmail || user?.email || 'N/A'}</div>
                      </div>
                      <div className="detail-item-modern">
                        <span className="detail-label">Phone Number</span>
                        <div className="detail-value">{backendProfile?.phoneNumber || 'N/A'}</div>
                      </div>
                      <div className="detail-item-modern">
                        <span className="detail-label">National ID</span>
                        <div className="detail-value">{backendProfile?.nationalId || 'N/A'}</div>
                      </div>
                      <div className="detail-item-modern">
                        <span className="detail-label">Faculty</span>
                        <div className="detail-value">{backendProfile?.faculty || userData?.universityName || 'N/A'}</div>
                      </div>
                      <div className="detail-item-modern">
                        <span className="detail-label">University Year</span>
                        <div className="detail-value">{backendProfile?.universityYear || 'N/A'}</div>
                      </div>
                      <div className="detail-item-modern">
                        <span className="detail-label">Role</span>
                        <div className="detail-value">{backendProfile?.role || userData?.role || 'N/A'}</div>
                      </div>
                      <div className="detail-item-modern">
                        <span className="detail-label">Housing Status</span>
                        <div className="detail-value">{backendProfile?.housingStatus || 'N/A'}</div>
                      </div>
                      <div className="detail-item-modern">
                        <span className="detail-label">Assigned Room ID</span>
                        <div className="detail-value">{backendProfile?.assignedRoomId || 'N/A'}</div>
                      </div>
                      <div className="detail-item-modern">
                        <span className="detail-label">Application ID</span>
                        <div className="detail-value">{backendProfile?.applicationId || 'N/A'}</div>
                      </div>
                      <div className="detail-item-modern">
                        <span className="detail-label">Created At</span>
                        <div className="detail-value">
                          {backendProfile?.createdAt ? new Date(backendProfile.createdAt).toLocaleString() : 'N/A'}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'submitApp' && <SubmitApplication />}
          {activeTab === 'myApps' && <MyApplications />}
          {activeTab === 'roomChange' && <RoomChangeRequest />}
          
          <div className="logout-section-modern">
            <button className="logout-btn-member" onClick={handleLogout}>🚪 Logout</button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;
