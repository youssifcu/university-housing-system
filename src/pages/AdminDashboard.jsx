import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebaseConfig';
import { getCurrentUser, getStoredAuthUser } from '../services/authService';
import { getAllUsers, updateUser, updateUserRole, deleteUser } from '../services/userService';
import { 
  adminRegisterUser,
  getAllRoomChangeRequests,
  updateRoomChangeRequestStatus,
  assignUserToNewRoom,
  getRoomById,
  getBuildingById,
  adminChangeUserRoom
} from '../services/user_Service';
import { 
  getAllApplications,
  updateApplicationStatus,
  deleteApplication 
} from '../services/applicationService';
import { getMealsWithFilters, createMeal, updateMeal, deleteMeal } from '../services/mealService';
import { getReportsWithFilters, getReportById, deleteReport, updateReportStatus } from '../services/reportService';
import ReportsTab from '../components/admin/ReportsTab';
import ManageBuildings from '../components/ManageBuildings'; 
import ManageRooms from '../components/ManageRooms';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('applications');

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  const [users, setUsers] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ 
    fullName: '', 
    universityEmail: '', 
    studentId: '', 
    universityName: '', 
    password: '',
    role: 'student' 
  });

  const [applications, setApplications] = useState([]);
  const [appPage, setAppPage] = useState(1);
  const [appLimit, setAppLimit] = useState(10);
  const [appTotalPages, setAppTotalPages] = useState(1);
  const [appStatusFilter, setAppStatusFilter] = useState('');
  const [appLoading, setAppLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

  const [roomChangeRequests, setRoomChangeRequests] = useState([]);
  const [showRoomChangeModal, setShowRoomChangeModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [showAdminRoomChangeModal, setShowAdminRoomChangeModal] = useState(false);
  const [selectedUserForRoomChange, setSelectedUserForRoomChange] = useState(null);
  const [adminRoomChangeData, setAdminRoomChangeData] = useState({
    buildingId: '',
    roomId: '',
    reason: ''
  });
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userLimit, setUserLimit] = useState(10);
  
  // Meals state management
  const [meals, setMeals] = useState([]);
  const [mealPage, setMealPage] = useState(1);
  const [mealLimit, setMealLimit] = useState(10);
  const [mealTotalPages, setMealTotalPages] = useState(1);
  const [mealFilters, setMealFilters] = useState({ date: '', mealType: '' });
  const [showMealModal, setShowMealModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [mealFormData, setMealFormData] = useState({
    name: '',
    date: '',
    description: '',
    mealType: 'breakfast',
    nutritionInfo: {}
  });
  const [mealLoading, setMealLoading] = useState(false);
  const [mealSubmitting, setMealSubmitting] = useState(false);
  const [reports, setReports] = useState([]);
  const [reportPage, setReportPage] = useState(1);
  const [reportLimit, setReportLimit] = useState(20);
  const [reportTotalPages, setReportTotalPages] = useState(1);
  const [reportFilters, setReportFilters] = useState({ type: '', status: '', severity: '' });
  const [reportLoading, setReportLoading] = useState(false);
  const availableRoles = Array.from(
    new Set(['student', 'admin', 'supervisor', ...users.map((u) => u.role).filter(Boolean)])
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        try {
          const idToken = await currentUser.getIdToken();
          localStorage.setItem('authToken', idToken);
        } catch (tokenError) {
          console.error('Error refreshing token:', tokenError);
        }
        
        try {
          const userData = await getCurrentUser();
          setUserName(userData?.name || userData?.fullName || 'User');
          
          if (userData?.role !== 'admin') {
            alert('Access denied. Admin only.');
            navigate('/member/dashboard');
            return;
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          console.warn('Using fallback role check from localStorage');
          
          const storedUser = JSON.parse(localStorage.getItem('authUser') || '{}');
          if (storedUser.role !== 'admin') {
            alert('Access denied. Admin only.');
            navigate('/member/dashboard');
            return;
          }
          
          // Use Firebase user data as fallback for name
          setUserName(currentUser.displayName || currentUser.email || 'User');
        }
        
        await loadUsers();
        await loadApplications();
        await loadRoomChangeRequests();
        await loadMeals();
        await loadReports();
        await loadBuildingsAndRooms();
      } else {
        navigate('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const loadBuildingsAndRooms = async () => {
    try {
      const [buildingsData, roomsData] = await Promise.all([
        // getAllBuildings(),
        // getAllRooms()
      ]);
      setBuildings(buildingsData);
      setRooms(roomsData);
    } catch (error) {
      console.error('Error loading buildings and rooms:', error);
    }
  };

  //  Users Logic 
  const loadUsers = async (overrides = {}) => {
    try {
      const allUsers = await getAllUsers({
        page: overrides.page ?? userPage,
        limit: overrides.limit ?? userLimit,
        role: overrides.role ?? (userRoleFilter || undefined),
      });
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleEditUser = (u) => {
    setSelectedUser(u);
    setEditData({
      name: u.name || u.fullName,
      email: u.email || u.universityEmail,
      phoneNumber: u.phoneNumber || '',
      studentId: u.studentId,
      nationalId: u.nationalId || '',
      faculty: u.faculty || '',
      universityYear: u.universityYear || '',
      role: u.role
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      await updateUser(selectedUser.id || selectedUser._id, {
        name: editData.name,
        email: editData.email,
        phoneNumber: editData.phoneNumber,
        studentId: editData.studentId,
        nationalId: editData.nationalId,
        faculty: editData.faculty,
        universityYear: Number(editData.universityYear),
        role: editData.role
      });
      await loadUsers();
      setShowEditModal(false);
      setSelectedUser(null);
      alert('User updated successfully!');
    } catch (error) {
      alert('Error updating user: ' + error.message);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const currentUser = users.find((u) => (u.id || u._id) === userId);

      if (!currentUser) {
        throw new Error('User not found');
      }

      await updateUser(userId, {
        name: currentUser.name || currentUser.fullName,
        email: currentUser.email || currentUser.universityEmail,
        phoneNumber: currentUser.phoneNumber || '',
        studentId: currentUser.studentId || '',
        nationalId: currentUser.nationalId || '',
        faculty: currentUser.faculty || '',
        universityYear: currentUser.universityYear ? Number(currentUser.universityYear) : undefined,
        role: newRole,
      });

      await loadUsers();
      alert(`User role updated to ${newRole}`);
    } catch (error) {
      alert('Error updating role: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId); 
        await loadUsers(); 
        alert('Deleted successfully');
      } catch (error) {
        alert('Deletion error: ' + error.message);
      }
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await adminRegisterUser(newUser); 
      alert('The user was added successfully!');
      setShowAddModal(false);  
      setNewUser({ fullName: '', universityEmail: '', studentId: '', universityName: '', password: '', role: 'student' });
      await loadUsers(); 
    } catch (error) {
      alert('Error in addition: ' + error.message);
    }
  };

  //  Applications Logic 
  const loadApplications = async (overrides = {}) => {
    try {
      setAppLoading(true);
      const currentPage = overrides.page ?? appPage;
      const currentLimit = overrides.limit ?? appLimit;
      const currentStatus = overrides.status ?? appStatusFilter;
      
      const result = await getAllApplications(currentPage, currentLimit, currentStatus);
      console.log('Applications API Response:', result);
      
      // Handle both array and object responses
      if (Array.isArray(result)) {
        setApplications(result);
      } else if (result.applications) {
        setApplications(result.applications);
        if (result.pagination) {
          setAppTotalPages(result.pagination.totalPages);
          setAppPage(result.pagination.currentPage);
        }
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      alert('Error loading applications: ' + error.message);
    } finally {
      setAppLoading(false);
    }
  };

  const handleReviewApp = (app) => {
    setSelectedApp(app);
    setShowReviewModal(true);
  };

  const handleApproveApp = async (id) => {
    if(window.confirm(`Approve this application?`)) {
      try {
        await updateApplicationStatus(id, 'approve');
        await loadApplications();
        setShowReviewModal(false);
        alert('Application approved successfully!');
      } catch (error) {
        console.error('Error approving application:', error);
        alert('Error approving application: ' + error.message);
      }
    }
  };

  const handleRejectApp = async (id) => {
    if(window.confirm(`Reject this application?`)) {
      try {
        await updateApplicationStatus(id, 'reject');
        await loadApplications();
        setShowReviewModal(false);
        alert('Application rejected successfully!');
      } catch (error) {
        console.error('Error rejecting application:', error);
        alert('Error rejecting application: ' + error.message);
      }
    }
  };

  const handleUnderReviewApp = async (id) => {
    try {
      await updateApplicationStatus(id, 'under_review');
      await loadApplications();
      setShowReviewModal(false);
      alert('Application marked as under review!');
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('Error updating status: ' + error.message);
    }
  };

  const loadRoomChangeRequests = async () => {
    try {
      const requestsData = await getAllRoomChangeRequests();
      setRoomChangeRequests(requestsData);
    } catch (error) {
      console.error('Error loading room change requests:', error);
      alert('Error loading room change requests: ' + error.message);
    }
  };

  const handleReviewRoomChangeRequest = (request) => {
    setSelectedRequest(request);
    setShowRoomChangeModal(true);
  };

  const handleApproveRoomChange = async (request) => {
    if(window.confirm('Approve this room change request?')) {
      try {
        const newRoom = await getRoomById(request.requestedRoomId);
        const newBuilding = await getBuildingById(request.requestedBuildingId);
        
        const roomDetails = {
          buildingId: request.requestedBuildingId,
          buildingName: newBuilding?.name || request.requestedBuildingName,
          roomNumber: newRoom?.roomNumber || request.requestedRoomNumber
        };
        
        await assignUserToNewRoom(
          request.userEmail,
          request.currentRoomId,
          request.requestedRoomId,
          roomDetails
        );
        
        await updateRoomChangeRequestStatus(request.id, 'Approved');
        await loadRoomChangeRequests();
        setShowRoomChangeModal(false);
        alert('Room change approved! User has been assigned to the new room.');
      } catch (error) {
        console.error('Error approving room change:', error);
        alert('Error approving room change: ' + error.message);
      }
    }
  };

  const handleRejectRoomChange = async (id) => {
    if(window.confirm('Reject this room change request?')) {
      try {
        await updateRoomChangeRequestStatus(id, 'Rejected');
        await loadRoomChangeRequests();
        setShowRoomChangeModal(false);
      } catch (error) {
        console.error('Error rejecting room change:', error);
        alert('Error rejecting room change: ' + error.message);
      }
    }
  };

  const openAdminRoomChangeModal = (user) => {
    setSelectedUserForRoomChange(user);
    setAdminRoomChangeData({
      buildingId: '',
      roomId: '',
      reason: ''
    });
    setShowAdminRoomChangeModal(true);
  };

  const handleAdminRoomChangeSubmit = async (e) => {
    e.preventDefault();
    
    if (!adminRoomChangeData.buildingId || !adminRoomChangeData.roomId || !adminRoomChangeData.reason) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const newRoom = rooms.find(r => r.id === adminRoomChangeData.roomId);
      const newBuilding = buildings.find(b => b.id === adminRoomChangeData.buildingId);
      
      const roomDetails = {
        buildingId: adminRoomChangeData.buildingId,
        buildingName: newBuilding?.name || 'Unknown',
        roomNumber: newRoom?.roomNumber || 'Unknown'
      };

      await adminChangeUserRoom(
        selectedUserForRoomChange.universityEmail,
        selectedUserForRoomChange.currentRoomId,
        adminRoomChangeData.roomId,
        roomDetails,
        adminRoomChangeData.reason
      );

      alert('User room changed successfully!');
      setShowAdminRoomChangeModal(false);
      await loadUsers();
    } catch (error) {
      console.error('Error changing user room:', error);
      alert('Error changing user room: ' + error.message);
    }
  };

  // Meals Logic
  const loadMeals = async (overrides = {}) => {
    try {
      setMealLoading(true);
      const currentPage = overrides.page ?? mealPage;
      const currentLimit = overrides.limit ?? mealLimit;
      const currentFilters = overrides.filters ?? mealFilters;
      
      const result = await getMealsWithFilters(currentPage, currentLimit, currentFilters);
      setMeals(result.meals);
      setMealTotalPages(result.totalPages);
      setMealPage(result.page);
    } catch (error) {
      console.error('Error loading meals:', error);
      alert('Error loading meals: ' + error.message);
    } finally {
      setMealLoading(false);
    }
  };

  const handleCreateMeal = () => {
    setSelectedMeal(null);
    setMealFormData({
      name: '',
      date: '',
      description: '',
      mealType: 'breakfast',
      nutritionInfo: {}
    });
    setShowMealModal(true);
  };

  const handleEditMeal = (meal) => {
    setSelectedMeal(meal);
    setMealFormData({
      name: meal.name,
      date: meal.date,
      description: meal.description || '',
      mealType: meal.mealType || meal.type || 'breakfast',
      nutritionInfo: meal.nutritionInfo || {}
    });
    setShowMealModal(true);
  };

  const handleMealSubmit = async (e) => {
    e.preventDefault();
    
    if (!mealFormData.name || !mealFormData.date || !mealFormData.mealType) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setMealSubmitting(true);
      const selectedMealId = selectedMeal?.id || selectedMeal?._id;
      
      if (selectedMeal) {
        if (!selectedMealId) {
          throw new Error('Invalid meal ID');
        }
        await updateMeal(selectedMealId, {
          ...mealFormData,
          type: mealFormData.mealType
        });
        alert('Meal updated successfully!');
      } else {
        await createMeal({
          ...mealFormData,
          type: mealFormData.mealType
        });
        alert('Meal created successfully!');
      }
      
      setShowMealModal(false);
      await loadMeals();
    } catch (error) {
      console.error('Error saving meal:', error);
      alert('Error saving meal: ' + error.message);
    } finally {
      setMealSubmitting(false);
    }
  };

  const handleDeleteMeal = async (mealId) => {
    if (!mealId) {
      alert('Invalid meal ID');
      return;
    }
    if (window.confirm('Are you sure you want to delete this meal?')) {
      try {
        await deleteMeal(mealId);
        alert('Meal deleted successfully!');
        await loadMeals();
      } catch (error) {
        console.error('Error deleting meal:', error);
        alert('Error deleting meal: ' + error.message);
      }
    }
  };

  const loadReports = async (overrides = {}) => {
    try {
      setReportLoading(true);
      const currentPage = overrides.page ?? reportPage;
      const currentLimit = overrides.limit ?? reportLimit;
      const currentFilters = overrides.filters ?? reportFilters;

      const result = await getReportsWithFilters(currentPage, currentLimit, currentFilters);
      setReports(result.reports || []);
      setReportPage(result.page || currentPage);
      setReportTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error('Error loading reports:', error);
      alert('Error loading reports: ' + error.message);
    } finally {
      setReportLoading(false);
    }
  };

  const handleViewReportDetails = async (reportId) => {
    try {
      const details = await getReportById(reportId);
      alert(
        `Report Details:\n\n` +
        `ID: ${details?.id || details?._id || reportId}\n` +
        `Type: ${details?.type || 'N/A'}\n` +
        `Status: ${details?.status || 'N/A'}\n` +
        `Severity: ${details?.severity || 'N/A'}\n` +
        `Title: ${details?.title || details?.subject || 'N/A'}\n` +
        `Description: ${details?.description || 'N/A'}`
      );
    } catch (error) {
      alert('Error loading report details: ' + error.message);
    }
  };

  const handleUpdateReportStatus = async (reportId) => {
    const nextStatus = window.prompt(
      'Enter new report status (open, in_progress, resolved, closed):',
      'in_progress'
    );

    if (!nextStatus) return;

    try {
      await updateReportStatus(reportId, nextStatus.trim());
      await loadReports();
      alert('Report status updated successfully!');
    } catch (error) {
      alert('Error updating report status: ' + error.message);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      await deleteReport(reportId);
      await loadReports();
      alert('Report deleted successfully!');
    } catch (error) {
      alert('Error deleting report: ' + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard-wrapper">
        <div className="admin-loading">Loading Admin Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-wrapper">
      
      <div className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-logo-icon">🛡️</div>
          <h2>Dorm Admin</h2>
        </div>
        
        <nav className="admin-nav-menu">
          <button 
            className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Manage Users
          </button>
          <button 
            className={`admin-nav-item ${activeTab === 'applications' ? 'active' : ''}`}
            onClick={() => setActiveTab('applications')}
          >
            📋 Housing Applications
          </button>
          <button 
            className={`admin-nav-item ${activeTab === 'roomChanges' ? 'active' : ''}`}
            onClick={() => setActiveTab('roomChanges')}
          >
            🔄 Room Change Requests
          </button>
          <button 
            className={`admin-nav-item ${activeTab === 'buildings' ? 'active' : ''}`}
            onClick={() => setActiveTab('buildings')}
          >
            🏢 Manage Buildings
          </button>
          <button 
            className={`admin-nav-item ${activeTab === 'rooms' ? 'active' : ''}`}
            onClick={() => setActiveTab('rooms')}
          >
            🛏️ Manage Rooms
          </button>
          <button 
            className={`admin-nav-item ${activeTab === 'meals' ? 'active' : ''}`}
            onClick={() => setActiveTab('meals')}
          >
            🍽️ Manage Meals
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            📊 Reports
          </button>
        </nav>

        <div className="admin-logout-container">
          <button className="admin-logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      <div className="admin-main-view">
        <header className="admin-top-header">
          <div className="header-welcome">
            <h1>Welcome, {userName}</h1>
            <p>System Administrator Control Panel</p>
          </div>
          <div className="admin-role-tag">Admin</div>
        </header>

        <div className="admin-content-scroll">
          
          {activeTab === 'users' && (
            <div className="admin-section">
              <div className="admin-stats-row">
                <div className="stat-box">
                  <div className="stat-box-icon">👥</div>
                  <div className="stat-box-data">
                    <h3>{users?.length}</h3>
                    <p>Total Users</p>
                  </div>
                </div>
                <div className="stat-box">
                  <div className="stat-box-icon">🎓</div>
                  <div className="stat-box-data">
                    <h3>{users?.filter(u => u.role === 'student')?.length}</h3>
                    <p>Students</p>
                  </div>
                </div>
                <div className="stat-box">
                  <div className="stat-box-icon">🛡️</div>
                  <div className="stat-box-data">
                    <h3>{users?.filter(u => u.role === 'admin')?.length}</h3>
                    <p>Admins</p>
                  </div>
                </div>
              </div>

              <div className="admin-table-panel">
                <div className="panel-header">
                  <h2>Registered Users</h2>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <select
                      value={userRoleFilter}
                      onChange={async (e) => {
                        const nextRole = e.target.value;
                        setUserRoleFilter(nextRole);
                        setUserPage(1);
                        try {
                          const filteredUsers = await getAllUsers({
                            page: 1,
                            limit: userLimit,
                            role: nextRole || undefined,
                          });
                          setUsers(filteredUsers);
                        } catch (error) {
                          console.error('Error filtering users:', error);
                        }
                      }}
                      className="role-dropdown"
                    >
                      <option value="">All Roles</option>
                      <option value="student">student</option>
                      <option value="admin">admin</option>
                      <option value="supervisor">supervisor</option>
                    </select>
                    <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                      + Add New User
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
                  <label style={{ color: '#cbd5e1' }}>Page</label>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={async () => {
                      const nextPage = Math.max(1, userPage - 1);
                      setUserPage(nextPage);
                      await loadUsers({ page: nextPage });
                    }}
                    disabled={userPage === 1}
                  >
                    Previous
                  </button>
                  <span style={{ color: '#fff', minWidth: '3rem', textAlign: 'center' }}>{userPage}</span>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={async () => {
                      const nextPage = userPage + 1;
                      setUserPage(nextPage);
                      await loadUsers({ page: nextPage });
                    }}
                    disabled={users?.length < userLimit}
                  >
                    Next
                  </button>
                  <label style={{ color: '#cbd5e1', marginLeft: '0.5rem' }}>Rows</label>
                  <select
                    value={userLimit}
                    onChange={async (e) => {
                      const nextLimit = Number(e.target.value);
                      setUserLimit(nextLimit);
                      setUserPage(1);
                      await loadUsers({ page: 1, limit: nextLimit });
                    }}
                    className="role-dropdown"
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                </div>
                
                <div className="table-responsive">
                  <table className="enterprise-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Student ID</th>
                        <th>Role</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users?.map((u) => (
                        <tr key={u.id || u._id}>
                          <td>
                            <div className="user-cell">
                              {u.profileImageUrl ? (
                                <img src={u.profileImageUrl} alt={u.name || u.fullName} className="avatar-small" />
                              ) : (
                                <div className="avatar-small placeholder">👤</div>
                              )}
                              <span className="fw-bold">{u.name || u.fullName}</span>
                            </div>
                          </td>
                          <td className="text-muted">{u.email || u.universityEmail}</td>
                          <td>{u.studentId}</td>
                          <td>
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id || u._id, e.target.value)}
                              className="role-dropdown"
                            >
                              {availableRoles?.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <div className="action-cell">
                              <button className="btn-icon edit" onClick={() => handleEditUser(u)}>Edit</button>
                              <button className="btn-icon review" onClick={() => openAdminRoomChangeModal(u)}>🏠 Change Room</button>
                              <button className="btn-icon delete" onClick={() => handleDeleteUser(u.id || u._id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="admin-section">
              <div className="admin-stats-row">
                <div className="stat-box">
                  <div className="stat-box-icon">📋</div>
                  <div className="stat-box-data">
                    <h3>{applications?.length}</h3>
                    <p>Showing Applications</p>
                  </div>
                </div>
                <div className="stat-box">
                  <div className="stat-box-icon">⏳</div>
                  <div className="stat-box-data">
                    <h3>{applications?.filter(a => a.status === 'pending')?.length}</h3>
                    <p>Pending</p>
                  </div>
                </div>
                <div className="stat-box">
                  <div className="stat-box-icon">🔍</div>
                  <div className="stat-box-data">
                    <h3>{applications?.filter(a => a.status === 'under_review')?.length}</h3>
                    <p>Under Review</p>
                  </div>
                </div>
              </div>

              <div className="admin-table-panel">
                <div className="panel-header">
                  <h2>Housing Applications Overview</h2>
                </div>

                {/* Filters */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Filter by Status</label>
                      <select
                        value={appStatusFilter}
                        onChange={(e) => setAppStatusFilter(e.target.value)}
                        className="form-input"
                      >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="under_review">Under Review</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    <button
                      className="btn-primary"
                      onClick={() => loadApplications({ page: 1 })}
                      disabled={appLoading}
                    >
                      {appLoading ? 'Loading...' : 'Apply Filter'}
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setAppStatusFilter('');
                        loadApplications({ page: 1, status: '' });
                      }}
                    >
                      Clear Filter
                    </button>
                  </div>
                </div>

                {/* Pagination Controls */}
                <div style={{ padding: '1rem 1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                  <label style={{ color: '#64748b' }}>Page</label>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => loadApplications({ page: Math.max(1, appPage - 1) })}
                    disabled={appPage === 1 || appLoading}
                  >
                    Previous
                  </button>
                  <span style={{ color: '#0f172a', minWidth: '3rem', textAlign: 'center', fontWeight: 600 }}>
                    {appPage} / {appTotalPages}
                  </span>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => loadApplications({ page: Math.min(appTotalPages, appPage + 1) })}
                    disabled={appPage >= appTotalPages || appLoading}
                  >
                    Next
                  </button>
                  <label style={{ color: '#64748b', marginLeft: '0.5rem' }}>Rows</label>
                  <select
                    value={appLimit}
                    onChange={(e) => {
                      const newLimit = Number(e.target.value);
                      setAppLimit(newLimit);
                      loadApplications({ page: 1, limit: newLimit });
                    }}
                    className="form-input"
                    style={{ width: 'auto' }}
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                </div>

                <div className="table-responsive">
                  {appLoading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                      Loading applications...
                    </div>
                  ) : (
                    <table className="enterprise-table">
                      <thead>
                        <tr>
                          <th>App ID</th>
                          <th>Student Info</th>
                          <th>College</th>
                          <th>GPA</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applications?.map((app) => {
                          const appId = app.id || app._id || 'N/A';
                          const displayName = app.fullName || app.studentName || 'Unknown';
                          const nationalId = app.nationalId || app.studentId || 'N/A';
                          const college = app.college || app.faculty || 'N/A';
                          const gpa = app.gpa || 'N/A';
                          const status = app.status || 'pending';
                          
                          return (
                            <tr key={appId}>
                              <td className="fw-bold text-blue">
                                {typeof appId === 'string' && appId !== 'N/A' 
                                  ? appId.substring(0, 8).toUpperCase() 
                                  : appId}
                              </td>
                              <td>
                                <div className="student-info-col">
                                  <span className="fw-bold">{displayName}</span>
                                  <span className="text-muted text-small">ID: {nationalId}</span>
                                </div>
                              </td>
                              <td>{college}</td>
                              <td>{gpa}</td>
                              <td>
                                <span className={`status-pill status-${status.toLowerCase()}`}>
                                  {status.replace('_', ' ').toUpperCase()}
                                </span>
                              </td>
                              <td>
                                <div className="action-cell">
                                  <button className="btn-icon review" onClick={() => handleReviewApp(app)}>👁️ Review</button>
                                  {status === 'pending' && appId !== 'N/A' && (
                                    <>
                                      <button className="btn-icon approve" onClick={() => handleApproveApp(appId)}>✓</button>
                                      <button className="btn-icon reject" onClick={() => handleRejectApp(appId)}>✕</button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {applications?.length === 0 && (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                              No applications found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'roomChanges' && (
            <div className="admin-section">
              <div className="admin-table-panel">
                <div className="panel-header">
                  <h2>Room Change Requests</h2>
                </div>
                <div className="table-responsive">
                  <table className="enterprise-table">
                    <thead>
                      <tr>
                        <th>Request ID</th>
                        <th>Student</th>
                        <th>Current Room</th>
                        <th>Requested Room</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roomChangeRequests?.map((request) => (
                        <tr key={request.id}>
                          <td className="fw-bold text-blue">{request.id.substring(0, 8).toUpperCase()}</td>
                          <td>
                            <div className="student-info-col">
                              <span className="fw-bold">{request.studentName}</span>
                            </div>
                          </td>
                          <td>{request.currentRoomId ? 'Assigned' : 'Not Assigned'}</td>
                          <td>{request.requestedBuildingName} - {request.requestedRoomNumber}</td>
                          <td>
                            <span className="text-muted text-small" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {request.reason}
                            </span>
                          </td>
                          <td>
                            <span className={`status-pill status-${request.status.toLowerCase()}`}>
                              {request.status}
                            </span>
                          </td>
                          <td>
                            <div className="action-cell">
                              <button className="btn-icon review" onClick={() => handleReviewRoomChangeRequest(request)}>👁️ Review</button>
                              {request.status === 'Pending' && (
                                <>
                                  <button className="btn-icon approve" onClick={() => handleApproveRoomChange(request)}>✓</button>
                                  <button className="btn-icon reject" onClick={() => handleRejectRoomChange(request.id)}>✕</button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {roomChangeRequests?.length === 0 && (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                            No room change requests found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'buildings' && (
            <ManageBuildings />
          )}

          {activeTab === 'rooms' && (
            <ManageRooms />
          )}

          {activeTab === 'meals' && (
            <div className="admin-section">
              <div className="admin-stats-row">
                <div className="stat-box">
                  <div className="stat-box-icon">🍽️</div>
                  <div className="stat-box-data">
                    <h3>{meals?.length}</h3>
                    <p>Total Meals</p>
                  </div>
                </div>
                <div className="stat-box">
                  <div className="stat-box-icon">🌅</div>
                  <div className="stat-box-data">
                    <h3>{meals?.filter(m => (m.mealType || m.type) === 'breakfast')?.length}</h3>
                    <p>Breakfast</p>
                  </div>
                </div>
                <div className="stat-box">
                  <div className="stat-box-icon">☀️</div>
                  <div className="stat-box-data">
                    <h3>{meals?.filter(m => (m.mealType || m.type) === 'lunch')?.length}</h3>
                    <p>Lunch</p>
                  </div>
                </div>
              </div>

              <div className="admin-table-panel">
                <div className="panel-header">
                  <h2>Meals Management</h2>
                  <button className="btn-primary" onClick={handleCreateMeal}>
                    + Add New Meal
                  </button>
                </div>

                {/* Filters */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Filter by Date</label>
                      <input
                        type="date"
                        value={mealFilters.date}
                        onChange={(e) => setMealFilters({ ...mealFilters, date: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Filter by Meal Type</label>
                      <select
                        value={mealFilters.mealType}
                        onChange={(e) => setMealFilters({ ...mealFilters, mealType: e.target.value })}
                        className="form-input"
                      >
                        <option value="">All Types</option>
                        <option value="breakfast">Breakfast</option>
                        <option value="lunch">Lunch</option>
                        <option value="dinner">Dinner</option>
                      </select>
                    </div>
                    <button
                      className="btn-primary"
                      onClick={() => loadMeals({ page: 1 })}
                      disabled={mealLoading}
                    >
                      {mealLoading ? 'Loading...' : 'Apply Filters'}
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setMealFilters({ date: '', mealType: '' });
                        loadMeals({ page: 1, filters: { date: '', mealType: '' } });
                      }}
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>

                {/* Pagination Controls */}
                <div style={{ padding: '1rem 1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                  <label style={{ color: '#64748b' }}>Page</label>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => loadMeals({ page: Math.max(1, mealPage - 1) })}
                    disabled={mealPage === 1 || mealLoading}
                  >
                    Previous
                  </button>
                  <span style={{ color: '#0f172a', minWidth: '3rem', textAlign: 'center', fontWeight: 600 }}>
                    {mealPage} / {mealTotalPages}
                  </span>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => loadMeals({ page: Math.min(mealTotalPages, mealPage + 1) })}
                    disabled={mealPage >= mealTotalPages || mealLoading}
                  >
                    Next
                  </button>
                  <label style={{ color: '#64748b', marginLeft: '0.5rem' }}>Rows</label>
                  <select
                    value={mealLimit}
                    onChange={(e) => {
                      const newLimit = Number(e.target.value);
                      setMealLimit(newLimit);
                      loadMeals({ page: 1, limit: newLimit });
                    }}
                    className="form-input"
                    style={{ width: 'auto' }}
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                </div>

                {/* Meals Table */}
                <div className="table-responsive">
                  {mealLoading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                      Loading meals...
                    </div>
                  ) : (
                    <table className="enterprise-table">
                      <thead>
                        <tr>
                          <th>Meal Name</th>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Description</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {meals?.map((meal) => (
                          <tr key={meal.id || meal._id}>
                            <td className="fw-bold">{meal.name}</td>
                            <td>{new Date(meal.date).toLocaleDateString()}</td>
                            <td>
                              <span className={`status-pill status-${(meal.mealType || meal.type).toLowerCase()}`}>
                                {(meal.mealType || meal.type).charAt(0).toUpperCase() + (meal.mealType || meal.type).slice(1)}
                              </span>
                            </td>
                            <td className="text-muted" style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {meal.description || '—'}
                            </td>
                            <td>
                              <div className="action-cell">
                                <button className="btn-icon edit" onClick={() => handleEditMeal(meal)}>Edit</button>
                                <button className="btn-icon delete" onClick={() => handleDeleteMeal(meal.id || meal._id)}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {meals?.length === 0 && (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                              No meals found. Click "Add New Meal" to create one.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <ReportsTab
              reports={reports}
              reportPage={reportPage}
              reportTotalPages={reportTotalPages}
              reportLimit={reportLimit}
              setReportLimit={setReportLimit}
              reportFilters={reportFilters}
              setReportFilters={setReportFilters}
              reportLoading={reportLoading}
              loadReports={loadReports}
              handleViewReportDetails={handleViewReportDetails}
              handleUpdateReportStatus={handleUpdateReportStatus}
              handleDeleteReport={handleDeleteReport}
            />
          )}

        </div>
      </div>

      {showAddModal && (
        <div className="enterprise-modal-overlay">
          <div className="enterprise-modal">
            <div className="modal-header">
              <h3>Add New User</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddUser} className="modal-form">
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} required className="form-input" placeholder="e.g. Ahmed Ali" />
              </div>
              <div className="form-group">
                <label>University Email</label>
                <input type="email" value={newUser.universityEmail} onChange={e => setNewUser({...newUser, universityEmail: e.target.value})} required className="form-input" placeholder="e.g. student@uni.edu.eg" />
              </div>
              <div className="form-group">
                <label>Student ID</label>
                <input type="text" value={newUser.studentId} onChange={e => setNewUser({...newUser, studentId: e.target.value})} required className="form-input" placeholder="e.g. 20210001" />
              </div>
              <div className="form-group">
                <label>University Name</label>
                <input type="text" value={newUser.universityName} onChange={e => setNewUser({...newUser, universityName: e.target.value})} required className="form-input" placeholder="e.g. Cairo University" />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required className="form-input" placeholder="Enter secure password" />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="form-input">
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="enterprise-modal-overlay">
          <div className="enterprise-modal">
            <div className="modal-header">
              <h3>Edit User Profile</h3>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-form">
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={editData.name || ''} onChange={(e) => setEditData({...editData, name: e.target.value})} className="form-input" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={editData.email || ''} onChange={(e) => setEditData({...editData, email: e.target.value})} className="form-input" />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="text" value={editData.phoneNumber || ''} onChange={(e) => setEditData({...editData, phoneNumber: e.target.value})} className="form-input" />
              </div>
              <div className="form-group">
                <label>Student ID</label>
                <input type="text" value={editData.studentId || ''} onChange={(e) => setEditData({...editData, studentId: e.target.value})} className="form-input" />
              </div>
              <div className="form-group">
                <label>National ID</label>
                <input type="text" value={editData.nationalId || ''} onChange={(e) => setEditData({...editData, nationalId: e.target.value})} className="form-input" />
              </div>
              <div className="form-group">
                <label>Faculty</label>
                <input type="text" value={editData.faculty || ''} onChange={(e) => setEditData({...editData, faculty: e.target.value})} className="form-input" />
              </div>
              <div className="form-group">
                <label>University Year</label>
                <input type="number" value={editData.universityYear || ''} onChange={(e) => setEditData({...editData, universityYear: e.target.value})} className="form-input" />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={editData.role} onChange={(e) => setEditData({...editData, role: e.target.value})} className="form-input">
                  {availableRoles?.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="button" className="btn-primary" onClick={handleSaveEdit}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && selectedApp && (
        <div className="enterprise-modal-overlay">
          <div className="enterprise-modal modal-large">
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Review Application</h3>
                <span className={`status-pill status-${selectedApp.status.toLowerCase()}`} style={{ marginTop: '0.5rem' }}>
                  {selectedApp.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <button className="close-btn" onClick={() => setShowReviewModal(false)}>×</button>
            </div>
            
            <div className="review-modal-body">
              <div className="review-section">
                <h4>Personal Information</h4>
                <div className="review-grid">
                  <div className="review-item">
                    <span className="review-label">Full Name:</span>
                    <span className="review-value">{selectedApp.fullName}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">National ID:</span>
                    <span className="review-value">{selectedApp.nationalId}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Gender:</span>
                    <span className="review-value">{selectedApp.gender}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Date of Birth:</span>
                    <span className="review-value">{new Date(selectedApp.dateOfBirth).toLocaleDateString()}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Phone:</span>
                    <span className="review-value">{selectedApp.phoneNumber}</span>
                  </div>
                  <div className="review-item full-width">
                    <span className="review-label">Address:</span>
                    <span className="review-value">{selectedApp.address}</span>
                  </div>
                </div>
              </div>

              <div className="review-section">
                <h4>Academic Information</h4>
                <div className="review-grid">
                  <div className="review-item">
                    <span className="review-label">Student Type:</span>
                    <span className="review-value">{selectedApp.studentType}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">College:</span>
                    <span className="review-value">{selectedApp.college}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Academic Year:</span>
                    <span className="review-value">{selectedApp.academicYear}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">GPA:</span>
                    <span className="review-value">{selectedApp.gpa}</span>
                  </div>
                </div>
              </div>

              <div className="review-section">
                <h4>Uploaded Documents</h4>
                <div className="documents-preview-grid">
                  {selectedApp.nationalIdCardUrl && (
                    <div className="doc-preview-item">
                      <p>National ID Card</p>
                      <img src={selectedApp.nationalIdCardUrl} alt="National ID" />
                    </div>
                  )}
                  {selectedApp.personalPhotoUrl && (
                    <div className="doc-preview-item">
                      <p>Personal Photo</p>
                      <img src={selectedApp.personalPhotoUrl} alt="Personal Photo" />
                    </div>
                  )}
                  {selectedApp.medicalReportUrl && (
                    <div className="doc-preview-item">
                      <p>Medical Report</p>
                      <span className="pdf-icon">📄 PDF Document</span>
                    </div>
                  )}
                  {selectedApp.universityIdCardUrl && (
                    <div className="doc-preview-item">
                      <p>University ID Card</p>
                      <img src={selectedApp.universityIdCardUrl} alt="University ID" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '1.5rem', background: '#f8fafc' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowReviewModal(false)}>Close</button>
              {(String(selectedApp.status || '').toLowerCase() === 'pending') && (
                <>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => handleUnderReviewApp(selectedApp.id || selectedApp._id)} 
                    style={{ padding: '0.75rem 1.5rem' }}
                  >
                    🔍 Mark Under Review
                  </button>
                  <button type="button" className="btn-icon reject" onClick={() => handleRejectApp(selectedApp.id || selectedApp._id)} style={{ padding: '0.75rem 1.5rem' }}>✕ Reject</button>
                  <button type="button" className="btn-icon approve" onClick={() => handleApproveApp(selectedApp.id || selectedApp._id)} style={{ padding: '0.75rem 1.5rem' }}>✓ Accept</button>
                </>
              )}
              {(String(selectedApp.status || '').toLowerCase() === 'under_review') && (
                <>
                  <button type="button" className="btn-icon reject" onClick={() => handleRejectApp(selectedApp.id || selectedApp._id)} style={{ padding: '0.75rem 1.5rem' }}>✕ Reject</button>
                  <button type="button" className="btn-icon approve" onClick={() => handleApproveApp(selectedApp.id || selectedApp._id)} style={{ padding: '0.75rem 1.5rem' }}>✓ Accept</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showRoomChangeModal && selectedRequest && (
        <div className="enterprise-modal-overlay">
          <div className="enterprise-modal modal-large">
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Review Room Change Request</h3>
                <span className={`status-pill status-${selectedRequest.status.toLowerCase()}`} style={{ marginTop: '0.5rem' }}>
                  {selectedRequest.status}
                </span>
              </div>
              <button className="close-btn" onClick={() => setShowRoomChangeModal(false)}>×</button>
            </div>
            
            <div className="review-modal-body">
              <div className="review-section">
                <h4>Student Information</h4>
                <div className="review-grid">
                  <div className="review-item">
                    <span className="review-label">Name:</span>
                    <span className="review-value">{selectedRequest.studentName}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Email:</span>
                    <span className="review-value">{selectedRequest.userEmail}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Current Room:</span>
                    <span className="review-value">{selectedRequest.currentRoomId ? 'Assigned' : 'Not Assigned'}</span>
                  </div>
                </div>
              </div>

              <div className="review-section">
                <h4>Requested Room</h4>
                <div className="review-grid">
                  <div className="review-item">
                    <span className="review-label">Building:</span>
                    <span className="review-value">{selectedRequest.requestedBuildingName}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Room Number:</span>
                    <span className="review-value">{selectedRequest.requestedRoomNumber}</span>
                  </div>
                </div>
              </div>

              <div className="review-section">
                <h4>Reason for Change</h4>
                <div className="review-grid">
                  <div className="review-item full-width">
                    <span className="review-value" style={{ whiteSpace: 'pre-wrap' }}>{selectedRequest.reason}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '1.5rem', background: '#f8fafc' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowRoomChangeModal(false)}>Close</button>
              {selectedRequest.status === 'Pending' && (
                <>
                  <button type="button" className="btn-icon reject" onClick={() => handleRejectRoomChange(selectedRequest.id)} style={{ padding: '0.75rem 1.5rem' }}>✕ Reject</button>
                  <button type="button" className="btn-icon approve" onClick={() => handleApproveRoomChange(selectedRequest)} style={{ padding: '0.75rem 1.5rem' }}>✓ Approve & Assign</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showAdminRoomChangeModal && selectedUserForRoomChange && (
        <div className="enterprise-modal-overlay">
          <div className="enterprise-modal">
            <div className="modal-header">
              <h3>Change User Room - {selectedUserForRoomChange.fullName}</h3>
              <button className="close-btn" onClick={() => setShowAdminRoomChangeModal(false)}>×</button>
            </div>
            <form onSubmit={handleAdminRoomChangeSubmit} className="modal-form">
              <div className="form-group">
                <label>Current Room</label>
                <input 
                  type="text" 
                  value={selectedUserForRoomChange.currentRoomNumber ? `${selectedUserForRoomChange.currentBuildingName} - Room ${selectedUserForRoomChange.currentRoomNumber}` : 'Not Assigned'} 
                  disabled 
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Select New Building</label>
                <select 
                  name="buildingId" 
                  value={adminRoomChangeData.buildingId} 
                  onChange={(e) => setAdminRoomChangeData({...adminRoomChangeData, buildingId: e.target.value, roomId: ''})} 
                  required 
                  className="form-input"
                >
                  <option value="">Choose a building...</option>
                  {buildings?.map(building => (
                    <option key={building.id} value={building.id}>
                      {building.name} ({building.gender})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Select New Room</label>
                <select 
                  name="roomId" 
                  value={adminRoomChangeData.roomId} 
                  onChange={(e) => setAdminRoomChangeData({...adminRoomChangeData, roomId: e.target.value})} 
                  required 
                  disabled={!adminRoomChangeData.buildingId}
                  className="form-input"
                >
                  <option value="">Choose a room...</option>
                  {rooms?.filter(room => room.buildingId === adminRoomChangeData.buildingId)
                    .map(room => (
                      <option key={room.id} value={room.id}>
                        Room {room.roomNumber} - Floor {room.floorNumber} 
                        ({room.currentOccupancy}/{room.capacity} occupied)
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label>Reason for Room Change</label>
                <textarea 
                  name="reason" 
                  value={adminRoomChangeData.reason} 
                  onChange={(e) => setAdminRoomChangeData({...adminRoomChangeData, reason: e.target.value})} 
                  rows="3" 
                  placeholder="Enter reason for changing user's room..."
                  required
                  className="form-input"
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAdminRoomChangeModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Change Room</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMealModal && (
        <div className="enterprise-modal-overlay">
          <div className="enterprise-modal">
            <div className="modal-header">
              <h3>{selectedMeal ? 'Edit Meal' : 'Add New Meal'}</h3>
              <button className="close-btn" onClick={() => setShowMealModal(false)}>×</button>
            </div>
            <form onSubmit={handleMealSubmit} className="modal-form">
              <div className="form-group">
                <label>Meal Name *</label>
                <input
                  type="text"
                  value={mealFormData.name}
                  onChange={(e) => setMealFormData({ ...mealFormData, name: e.target.value })}
                  required
                  className="form-input"
                  placeholder="e.g. Grilled Chicken with Rice"
                />
              </div>
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={mealFormData.date}
                  onChange={(e) => setMealFormData({ ...mealFormData, date: e.target.value })}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Meal Type *</label>
                <select
                  value={mealFormData.mealType}
                  onChange={(e) => setMealFormData({ ...mealFormData, mealType: e.target.value })}
                  required
                  className="form-input"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={mealFormData.description}
                  onChange={(e) => setMealFormData({ ...mealFormData, description: e.target.value })}
                  rows="3"
                  className="form-input"
                  placeholder="Brief description of the meal..."
                />
              </div>
              <div className="form-group">
                <label>Nutritional Info (JSON)</label>
                <textarea
                  value={JSON.stringify(mealFormData.nutritionInfo, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setMealFormData({ ...mealFormData, nutritionInfo: parsed });
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  rows="4"
                  className="form-input"
                  placeholder='{"calories": 500, "protein": "30g"}'
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowMealModal(false)}
                  disabled={mealSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={mealSubmitting}
                >
                  {mealSubmitting ? 'Saving...' : (selectedMeal ? 'Update Meal' : 'Create Meal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;

