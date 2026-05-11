import React from 'react';
import '../styles/AdminDashboard.css';

const AdminSidebar = ({ activeTab, setActiveTab, userName, onLogout }) => {
  return (
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
      </nav>

      <div className="admin-logout-container">
        <button className="admin-logout-btn" onClick={onLogout}>
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
