import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebaseConfig';
import { updateUserProfile } from '../services/user_Service';
import Button from '../components/Button';
import InputField from '../components/InputField';
import '../styles/MemberDashboard.css';

const MemberDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState('');

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
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        navigate('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

      // Temporarily disabled image upload due to CORS - uncomment when CORS is configured
      /*
      if (profileImage) {
        const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
        const { storage } = await import('../../lib/firebaseConfig');
        const imageRef = ref(storage, `profiles/${user.uid}/housing-report`);
        await uploadBytes(imageRef, profileImage);
        const imageUrl = await getDownloadURL(imageRef);
        updateData.profileImageUrl = imageUrl;
      }
      */

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
        <div className="member-header">
          <div className="member-welcome">
            {previewImage ? (
              <img src={previewImage} alt="Profile" className="member-avatar-large" />
            ) : (
              <div className="member-avatar-large">👤</div>
            )}
            <h1>Hello, {userData?.fullName || 'User'}!</h1>
            <p>Welcome to your personal dashboard</p>
            <span className="member-role-badge">
              {userData?.role || 'member'}
            </span>
          </div>
        </div>
        
        <div className="member-content">
          <div className="profile-section-modern">
            <div className="section-header-modern">
              <h3 className="section-title-modern">
                <span className="info-icon">ℹ️</span> Your Profile
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
              <div className="profile-image-section-modern">
                {previewImage ? (
                  <img src={previewImage} alt="Profile" className="profile-preview-img" />
                ) : (
                  <div style={{ 
                    width: '180px', 
                    height: '180px', 
                    borderRadius: '50%', 
                    backgroundColor: '#e9ecef',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '72px',
                    margin: '0 auto 1.5rem'
                  }}>
                    👤
                  </div>
                )}
                
                {editing && (
                  <div>
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
                    <p className="image-upload-label">
                      Housing Report Image (Max 5MB)
                    </p>
                    {profileImage && (
                      <p style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                        Selected: {profileImage.name}
                      </p>
                    )}
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
                    <div className="input-group-modern">
                      <label>Email Address</label>
                      <input
                        type="email"
                        value={userData.universityEmail}
                        disabled
                        className="input-modern"
                        style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                      />
                    </div>
                    <div className="action-buttons-modern">
                      <button className="save-btn-modern" onClick={handleSaveProfile}>
                        ✓ Save Changes
                      </button>
                      <button 
                        className="cancel-btn-modern" 
                        onClick={() => {
                          setEditing(false);
                          setEditData({
                            fullName: userData.fullName,
                            studentId: userData.studentId,
                            universityName: userData.universityName
                          });
                          setProfileImage(null);
                          setPreviewImage(userData.profileImageUrl || '');
                        }}
                      >
                        Cancel
                      </button>
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
                      <span className="detail-label">Email Address</span>
                      <div className="detail-value">{userData.universityEmail}</div>
                    </div>
                    <div className="detail-item-modern">
                      <span className="detail-label">University</span>
                      <div className="detail-value">{userData.universityName}</div>
                    </div>
                    <div className="detail-item-modern">
                      <span className="detail-label">Role</span>
                      <div className="detail-value">
                        <span className="role-badge member">{userData.role || 'member'}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="logout-section-modern">
            <button 
              className="logout-btn-member"
              onClick={handleLogout}
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;
