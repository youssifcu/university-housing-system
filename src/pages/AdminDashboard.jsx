import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebaseConfig';
import { getAllUsers, updateUserRole, updateUserProfile } from '../services/user_Service';
import Button from '../components/Button';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [users, setUsers] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editData, setEditData] = useState({});

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
      } else {
        navigate('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
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

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditData({
      fullName: user.fullName,
      studentId: user.studentId,
      universityName: user.universityName,
      role: user.role
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

  if (loading) {
    return (
      <div className="register-page">
        <div className="loading-message">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="member-container">
        <div className="admin-header">
          <div className="admin-header-content">
            <div className="admin-avatar">👤</div>
            <div className="admin-welcome">
              <h1>Welcome, {userName}!</h1>
              <p>Administrator Control Panel</p>
            </div>
          </div>
          <span className="admin-badge">Admin</span>
        </div>
        
        <div className="admin-stats">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>{users.length}</h3>
              <p>Total Users</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎓</div>
            <div className="stat-info">
              <h3>{users.filter(u => u.role === 'member').length}</h3>
              <p>Members</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👑</div>
            <div className="stat-info">
              <h3>{users.filter(u => u.role === 'admin').length}</h3>
              <p>Admins</p>
            </div>
          </div>
        </div>
        
        <div className="admin-content">
          <div className="section-header">
            <h3 className="section-title">User Management</h3>
          </div>
          
          <div className="users-table-container">
            <table className="users-table-modern">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Student ID</th>
                  <th>University</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-avatar-cell">
                        {u.profileImageUrl ? (
                          <img src={u.profileImageUrl} alt={u.fullName} className="user-avatar-small" />
                        ) : (
                          <span style={{ fontSize: '24px' }}>👤</span>
                        )}
                        <span className="user-name-cell">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="user-email-cell">{u.universityEmail}</td>
                    <td>{u.studentId}</td>
                    <td>{u.universityName}</td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.universityEmail, e.target.value)}
                        className="role-select"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <button 
                        className="action-btn edit"
                        onClick={() => handleEditUser(u)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="logout-section-modern">
            <button 
              className="logout-btn-modern"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="modal-overlay-modern">
          <div className="modal-content-modern">
            <div className="modal-header">
              <h3>Edit User Profile</h3>
            </div>
            <div className="form-group-modern">
              <label>Full Name:</label>
              <input
                type="text"
                value={editData.fullName}
                onChange={(e) => setEditData({...editData, fullName: e.target.value})}
                className="form-input-modern"
              />
            </div>
            <div className="form-group-modern">
              <label>Student ID:</label>
              <input
                type="text"
                value={editData.studentId}
                onChange={(e) => setEditData({...editData, studentId: e.target.value})}
                className="form-input-modern"
              />
            </div>
            <div className="form-group-modern">
              <label>University Name:</label>
              <input
                type="text"
                value={editData.universityName}
                onChange={(e) => setEditData({...editData, universityName: e.target.value})}
                className="form-input-modern"
              />
            </div>
            <div className="form-group-modern">
              <label>Role:</label>
              <select
                value={editData.role}
                onChange={(e) => setEditData({...editData, role: e.target.value})}
                className="form-input-modern"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn-modern btn-primary-modern" onClick={handleSaveEdit}>Save Changes</button>
              <button className="btn-modern btn-secondary-modern" onClick={() => setShowEditModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



export default AdminDashboard;
