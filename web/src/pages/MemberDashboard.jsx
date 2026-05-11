import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebaseConfig';
import { getStoredAuthUser, logoutUser } from '../services/authService';
import { getBuildingById } from '../services/buildingService';
import { getRoomById } from '../services/roomService';
import { getCurrentUserWithDetails, getUserProfilePictureUrl, updateUserProfile } from '../services/userService';
import { getApplicationsByUser } from '../services/user_Service';
import { useAIChatContext } from '../context/AIChatContext';
import '../styles/MemberDashboard.css';
import MemberLoadingPage from './MemberLoadingPage';

const SubmitApplication = lazy(() => import('../components/SubmitApplication'));
const MyApplications = lazy(() => import('../components/MyApplications'));
const RoomChangeRequest = lazy(() => import('../components/RoomChangeRequest'));
const MemberProfileTab = lazy(() => import('../components/member/MemberProfileTab'));
const MemberBookMealsTab = lazy(() => import('../components/member/MemberBookMealsTab'));
const AUTH_USER_STORAGE_KEY = 'authUser';

const normalizeOptionalNumber = (value) => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  const parsedValue = Number(value);
  return Number.isNaN(parsedValue) ? undefined : parsedValue;
};

const createProfileDraft = (profile, currentUser) => ({
  name: profile?.name || '',
  email: profile?.email || currentUser?.email || '',
  phoneNumber: profile?.phoneNumber || '',
  studentId: profile?.studentId || '',
  nationalId: profile?.nationalId || '',
  faculty: profile?.faculty || '',
  universityYear: profile?.universityYear ?? '',
  grade: profile?.grade ?? '',
});

const storeProfileSnapshot = (profile) => {
  if (!profile) {
    return;
  }

  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(profile));
};

const MemberDashboard = () => {
  const navigate = useNavigate();
  const { setScreenContext } = useAIChatContext();

  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [backendProfile, setBackendProfile] = useState(getStoredAuthUser());
  const [housingData, setHousingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const [assignedRoomName, setAssignedRoomName] = useState('N/A');
  const [assignedRoomLoading, setAssignedRoomLoading] = useState(false);
  const profileImageObjectUrlRef = useRef('');

  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setBackendProfile(getStoredAuthUser());
        try {
          const profile = await getCurrentUserWithDetails();
          storeProfileSnapshot(profile);
          setBackendProfile(profile);
          setEditData(createProfileDraft(profile, currentUser));

          const profileId = profile?.id || profile?._id;
          if (profileId) {
            const profilePictureUrl = await getUserProfilePictureUrl(profileId);
            if (profilePictureUrl) {
              if (profileImageObjectUrlRef.current) {
                URL.revokeObjectURL(profileImageObjectUrlRef.current);
              }
              profileImageObjectUrlRef.current = profilePictureUrl;
              setPreviewImage(profilePictureUrl);
            }
          }

          const userDoc = await getDoc(doc(db, 'users', currentUser.email));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            if (!profileImageObjectUrlRef.current && data.profileImageUrl) {
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

  useEffect(() => {
    return () => {
      if (profileImageObjectUrlRef.current) {
        URL.revokeObjectURL(profileImageObjectUrlRef.current);
        profileImageObjectUrlRef.current = '';
      }
    };
  }, []);

  useEffect(() => {
    const loadAssignedRoomName = async () => {
      const assignedRoomId =
        backendProfile?.assignedRoomId?._id ||
        backendProfile?.assignedRoomId?.id ||
        backendProfile?.assignedRoomId;

      if (!assignedRoomId) {
        setAssignedRoomName('N/A');
        setAssignedRoomLoading(false);
        return;
      }

      if (typeof backendProfile?.assignedRoomId === 'object' && backendProfile?.assignedRoomId?.roomNumber) {
        const directRoom = backendProfile.assignedRoomId;
        const buildingName =
          directRoom?.buildingId?.name ||
          directRoom?.building?.name ||
          '';

        setAssignedRoomName(
          buildingName
            ? `${buildingName} - Room ${directRoom.roomNumber}`
            : `Room ${directRoom.roomNumber}`
        );
        setAssignedRoomLoading(false);
        return;
      }

      setAssignedRoomLoading(true);

      try {
        const room = await getRoomById(assignedRoomId);
        let buildingName =
          room?.buildingId?.name ||
          room?.building?.name ||
          '';

        if (!buildingName && room?.buildingId && typeof room.buildingId === 'string') {
          try {
            const building = await getBuildingById(room.buildingId);
            buildingName = building?.name || '';
          } catch (buildingError) {
            console.error('Error loading building name:', buildingError);
          }
        }

        const roomLabel = room?.roomNumber
          ? buildingName
            ? `${buildingName} - Room ${room.roomNumber}`
            : `Room ${room.roomNumber}`
          : String(assignedRoomId);

        setAssignedRoomName(roomLabel);
      } catch (error) {
        console.error('Error loading assigned room:', error);
        setAssignedRoomName(String(assignedRoomId));
      } finally {
        setAssignedRoomLoading(false);
      }
    };

    loadAssignedRoomName();
  }, [backendProfile]);

  useEffect(() => {
    setScreenContext({
      screen: 'member-dashboard',
      activeTab,
      loading,
      currentUser: backendProfile || userData || null,
      firebaseUser: user
        ? {
          email: user.email || '',
          uid: user.uid || '',
        }
        : null,
      housingData,
      profileDraft: editData,
      profileEditing: editing,
      profileImageSelected: Boolean(profileImage),
      assignedRoomName,
      availableTabs: ['profile', 'submitApp', 'myApps', 'roomChange', 'bookMeals'],
      guidance:
        'This is the member dashboard. Use the provided member profile and housing data when answering.',
    });
  }, [
    activeTab,
    backendProfile,
    editData,
    editing,
    assignedRoomName,
    housingData,
    loading,
    profileImage,
    setScreenContext,
    user,
    userData,
  ]);

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
      const updatedProfile = await updateUserProfile({
        name: editData.name,
        email: editData.email,
        phoneNumber: editData.phoneNumber,
        studentId: editData.studentId,
        nationalId: editData.nationalId,
        faculty: editData.faculty,
        universityYear: normalizeOptionalNumber(editData.universityYear),
        grade: normalizeOptionalNumber(editData.grade),
      });

      storeProfileSnapshot(updatedProfile);
      setBackendProfile(updatedProfile);
      setEditData(createProfileDraft(updatedProfile, user));
      setEditing(false);
      setProfileImage(null);
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Error updating profile: ' + error.message);
    }
  };

  if (loading) {
    return (
      <MemberLoadingPage />
    );
  }

  const sectionLoadingFallback = (
    <div className="profile-section-modern">
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        Loading section...
      </div>
    </div>
  );

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

          <button
            onClick={() => setActiveTab('bookMeals')}
            className={`tab-btn ${activeTab === 'bookMeals' ? 'active' : ''}`}
          >
            🍽️ Book a meal
          </button>
        </div>

        {/* Content Section */}
        <div className="member-content">

          {activeTab === 'profile' && (
            <Suspense fallback={sectionLoadingFallback}>
              <MemberProfileTab
                editing={editing}
                setEditing={setEditing}
                housingData={housingData}
                previewImage={previewImage}
                handleImageChange={handleImageChange}
                editData={editData}
                setEditData={setEditData}
                handleSaveProfile={handleSaveProfile}
                backendProfile={backendProfile}
                assignedRoomName={assignedRoomName}
                assignedRoomLoading={assignedRoomLoading}
                userData={userData}
                user={user}
              />
            </Suspense>
          )}

          {activeTab === 'submitApp' && (
            <Suspense fallback={sectionLoadingFallback}>
              <SubmitApplication />
            </Suspense>
          )}
          {activeTab === 'myApps' && (
            <Suspense fallback={sectionLoadingFallback}>
              <MyApplications />
            </Suspense>
          )}
          {activeTab === 'roomChange' && (
            <Suspense fallback={sectionLoadingFallback}>
              <RoomChangeRequest />
            </Suspense>
          )}
          {activeTab === 'bookMeals' && (
            <Suspense fallback={sectionLoadingFallback}>
              <MemberBookMealsTab />
            </Suspense>
          )}

          <div className="logout-section-modern">
            <button className="logout-btn-member" onClick={handleLogout}>🚪 Logout</button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;
