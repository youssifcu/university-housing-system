import React, { useMemo, useState } from 'react';
import '../../styles/AdminDashboard.css';

const ManageUsersTab = ({
  users,
  userRoleFilter,
  setUserRoleFilter,
  userPage,
  setUserPage,
  userLimit,
  setUserLimit,
  loadUsers,
  handleEditUser,
  handleRoleChange,
  handleDeleteUser,
  openAdminRoomChangeModal,
  availableRoles,
  setShowAddModal,
  updatingRoleUserId
}) => {
  const [userNameQuery, setUserNameQuery] = useState('');

  const filteredUsers = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    const q = String(userNameQuery || '').trim().toLowerCase();
    if (!q) return list;

    return list.filter((u) => {
      const name = String(u?.name || u?.fullName || '').toLowerCase();
      return name.includes(q);
    });
  }, [users, userNameQuery]);

  return (
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
            <h3>{users?.filter((u) => u.role === 'student')?.length}</h3>
            <p>Students</p>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-box-icon">🛡️</div>
          <div className="stat-box-data">
            <h3>{users?.filter((u) => u.role === 'admin')?.length}</h3>
            <p>Admins</p>
          </div>
        </div>
      </div>

      <div className="admin-table-panel">
        <div className="panel-header">
          <h2>Registered Users</h2>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div className="admin-search">
              <input
                className="admin-search-input"
                type="text"
                value={userNameQuery}
                onChange={(e) => setUserNameQuery(e.target.value)}
                placeholder="Search by name..."
              />
              {userNameQuery?.trim() ? (
                <button
                  type="button"
                  className="admin-search-clear"
                  onClick={() => setUserNameQuery('')}
                  aria-label="Clear search"
                  title="Clear"
                >
                  ×
                </button>
              ) : null}
            </div>
            <select
              value={userRoleFilter}
              onChange={async (e) => {
                const nextRole = e.target.value;
                setUserRoleFilter(nextRole);
                setUserPage(1);
                try {
                  await loadUsers({ page: 1, role: nextRole || undefined });
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

        <div style={{ padding: '0 1.5rem', marginTop: '-0.5rem', marginBottom: '0.75rem' }}>
          <div className="admin-hint-text">
            Showing <strong>{filteredUsers.length}</strong> of <strong>{users?.length || 0}</strong>
            {userNameQuery?.trim() ? ` for "${userNameQuery.trim()}"` : ''}
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
              {filteredUsers?.map((u) => (
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
                      disabled={updatingRoleUserId === (u.id || u._id)}
                    >
                      {availableRoles?.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    {updatingRoleUserId === (u.id || u._id) && (
                      <div className="inline-status-text">Updating...</div>
                    )}
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
  );
};

export default ManageUsersTab;
