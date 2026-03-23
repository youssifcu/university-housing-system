import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebaseConfig';
import { 
  getAllUsers, 
  updateUserRole, 
  updateUserProfile,
  deleteUser,
  adminRegisterUser 
} from '../services/user_Service';
import ManageBuildings from '../components/ManageBuildings'; 
import ManageRooms from '../components/ManageRooms';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('applications');

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  //  Users State 
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
    role: 'member' 
  });

  //  Applications State 
  const [applications, setApplications] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.email));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserName(userData.fullName || 'User');
            
            if (userData.role !== 'admin') {
              alert('Access denied. Admin only.');
              navigate('/member/dashboard');
              return;
            }
          } else {
            setUserName('User');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserName('User');
        }
        
        await loadUsers();
        loadMockApplications();
      } else {
        navigate('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  //  Users Logic 
  const loadUsers = async () => {
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleEditUser = (u) => {
    setSelectedUser(u);
    setEditData({
      fullName: u.fullName,
      studentId: u.studentId,
      universityName: u.universityName,
      role: u.role
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      await updateUserProfile(selectedUser.universityEmail, editData);
      await loadUsers();
      setShowEditModal(false);
      setSelectedUser(null);
      alert('User updated successfully!');
    } catch (error) {
      alert('Error updating user: ' + error.message);
    }
  };

  const handleRoleChange = async (email, newRole) => {
    try {
      await updateUserRole(email, newRole);
      await loadUsers();
      alert(`User role updated to ${newRole}`);
    } catch (error) {
      alert('Error updating role: ' + error.message);
    }
  };

  const handleDeleteUser = async (email) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(email); 
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
      setNewUser({ fullName: '', universityEmail: '', studentId: '', universityName: '', password: '', role: 'member' });
      await loadUsers(); 
    } catch (error) {
      alert('Error in addition: ' + error.message);
    }
  };

  //  Applications Logic 
  const loadMockApplications = () => {
    setApplications([
      { 
        id: 'APP-101', 
        studentName: 'Islam Moawad', 
        studentId: '11111', 
        building: 'Building A', 
        roomType: 'Single', 
        status: 'Pending', 
        date: '2026-03-15',
        notes: 'Prefer ground floor due to recent knee surgery.',
        documents: {
          idFront: 'https://via.placeholder.com/300x200?text=ID+Front',
          idBack: 'https://via.placeholder.com/300x200?text=ID+Back',
          uniId: 'https://via.placeholder.com/300x200?text=University+ID',
          grades: 'https://via.placeholder.com/300x400?text=Grades+Report'
        }
      },
      { 
        id: 'APP-102', 
        studentName: 'Ahmed Ali', 
        studentId: '22222', 
        building: 'Building C', 
        roomType: 'Double', 
        status: 'Approved', 
        date: '2026-03-14',
        notes: '',
        documents: null
      },
      { 
        id: 'APP-103', 
        studentName: 'Mahmoud Hassan', 
        studentId: '33333', 
        building: 'Building A', 
        roomType: 'Triple', 
        status: 'Rejected', 
        date: '2026-03-12',
        notes: '',
        documents: null
      }
    ]);
  };

  const handleReviewApp = (app) => {
    setSelectedApp(app);
    setShowReviewModal(true);
  };

  const handleApproveApp = (id) => {
    if(window.confirm(`Approve application ${id}?`)) {
      setApplications(prev => prev.map(app => app.id === id ? { ...app, status: 'Approved' } : app));
      setShowReviewModal(false);
    }
  };

  const handleRejectApp = (id) => {
    if(window.confirm(`Reject application ${id}?`)) {
      setApplications(prev => prev.map(app => app.id === id ? { ...app, status: 'Rejected' } : app));
      setShowReviewModal(false);
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
                    <h3>{users.length}</h3>
                    <p>Total Users</p>
                  </div>
                </div>
                <div className="stat-box">
                  <div className="stat-box-icon">🎓</div>
                  <div className="stat-box-data">
                    <h3>{users.filter(u => u.role === 'member').length}</h3>
                    <p>Members</p>
                  </div>
                </div>
                <div className="stat-box">
                  <div className="stat-box-icon">🛡️</div>
                  <div className="stat-box-data">
                    <h3>{users.filter(u => u.role === 'admin').length}</h3>
                    <p>Admins</p>
                  </div>
                </div>
              </div>

              <div className="admin-table-panel">
                <div className="panel-header">
                  <h2>Registered Users</h2>
                  <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                    + Add New User
                  </button>
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
                      {users.map((u) => (
                        <tr key={u.universityEmail}>
                          <td>
                            <div className="user-cell">
                              {u.profileImageUrl ? (
                                <img src={u.profileImageUrl} alt={u.fullName} className="avatar-small" />
                              ) : (
                                <div className="avatar-small placeholder">👤</div>
                              )}
                              <span className="fw-bold">{u.fullName}</span>
                            </div>
                          </td>
                          <td className="text-muted">{u.universityEmail}</td>
                          <td>{u.studentId}</td>
                          <td>
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.universityEmail, e.target.value)}
                              className="role-dropdown"
                            >
                              <option value="member">Member</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td>
                            <div className="action-cell">
                              <button className="btn-icon edit" onClick={() => handleEditUser(u)}>Edit</button>
                              <button className="btn-icon delete" onClick={() => handleDeleteUser(u.universityEmail)}>Delete</button>
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
              <div className="admin-table-panel">
                <div className="panel-header">
                  <h2>Housing Applications Overview</h2>
                </div>
                <div className="table-responsive">
                  <table className="enterprise-table">
                    <thead>
                      <tr>
                        <th>App ID</th>
                        <th>Student Info</th>
                        <th>Building</th>
                        <th>Room</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((app) => (
                        <tr key={app.id}>
                          <td className="fw-bold text-blue">{app.id}</td>
                          <td>
                            <div className="student-info-col">
                              <span className="fw-bold">{app.studentName}</span>
                              <span className="text-muted text-small">ID: {app.studentId}</span>
                            </div>
                          </td>
                          <td>{app.building}</td>
                          <td>{app.roomType}</td>
                          <td>
                            <span className={`status-pill status-${app.status.toLowerCase()}`}>
                              {app.status}
                            </span>
                          </td>
                          <td>
                            <div className="action-cell">
                              <button className="btn-icon review" onClick={() => handleReviewApp(app)}>👁️ Review</button>
                              {app.status === 'Pending' && (
                                <>
                                  <button className="btn-icon approve" onClick={() => handleApproveApp(app.id)}>✓</button>
                                  <button className="btn-icon reject" onClick={() => handleRejectApp(app.id)}>✕</button>
                                </>
                              )}
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

          {activeTab === 'buildings' && (
            <ManageBuildings />
          )}

          {activeTab === 'rooms' && (
            <ManageRooms />
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
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
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
                <input type="text" value={editData.fullName} onChange={(e) => setEditData({...editData, fullName: e.target.value})} className="form-input" />
              </div>
              <div className="form-group">
                <label>Student ID</label>
                <input type="text" value={editData.studentId} onChange={(e) => setEditData({...editData, studentId: e.target.value})} className="form-input" />
              </div>
              <div className="form-group">
                <label>University Name</label>
                <input type="text" value={editData.universityName} onChange={(e) => setEditData({...editData, universityName: e.target.value})} className="form-input" />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={editData.role} onChange={(e) => setEditData({...editData, role: e.target.value})} className="form-input">
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
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
                <h3 style={{ margin: 0 }}>Review Application: {selectedApp.id}</h3>
                <span className={`status-pill status-${selectedApp.status.toLowerCase()}`} style={{ marginTop: '0.5rem' }}>
                  {selectedApp.status}
                </span>
              </div>
              <button className="close-btn" onClick={() => setShowReviewModal(false)}>×</button>
            </div>
            
            <div className="review-modal-body">
              <div className="review-section">
                <h4>Applicant Details</h4>
                <div className="review-grid">
                  <div className="review-item">
                    <span className="review-label">Name:</span>
                    <span className="review-value">{selectedApp.studentName}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Student ID:</span>
                    <span className="review-value">{selectedApp.studentId}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Building:</span>
                    <span className="review-value">{selectedApp.building}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Room Type:</span>
                    <span className="review-value">{selectedApp.roomType}</span>
                  </div>
                  <div className="review-item full-width">
                    <span className="review-label">Notes:</span>
                    <span className="review-value">{selectedApp.notes || 'None'}</span>
                  </div>
                </div>
              </div>

              <div className="review-section">
                <h4>Uploaded Documents</h4>
                {selectedApp.documents ? (
                  <div className="documents-preview-grid">
                    <div className="doc-preview-item">
                      <p>ID (Front)</p>
                      <img src={selectedApp.documents.idFront} alt="ID Front" />
                    </div>
                    <div className="doc-preview-item">
                      <p>ID (Back)</p>
                      <img src={selectedApp.documents.idBack} alt="ID Back" />
                    </div>
                    <div className="doc-preview-item">
                      <p>University ID</p>
                      <img src={selectedApp.documents.uniId} alt="University ID" />
                    </div>
                    <div className="doc-preview-item">
                      <p>Grades Report</p>
                      <img src={selectedApp.documents.grades} alt="Grades Report" />
                    </div>
                  </div>
                ) : (
                  <p className="text-muted">No documents attached for this application.</p>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '1.5rem', background: '#f8fafc' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowReviewModal(false)}>Close</button>
              {selectedApp.status === 'Pending' && (
                <>
                  <button type="button" className="btn-icon reject" onClick={() => handleRejectApp(selectedApp.id)} style={{ padding: '0.75rem 1.5rem' }}>✕ Reject</button>
                  <button type="button" className="btn-icon approve" onClick={() => handleApproveApp(selectedApp.id)} style={{ padding: '0.75rem 1.5rem' }}>✓ Approve</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;