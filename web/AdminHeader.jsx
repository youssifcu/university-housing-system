import React from 'react';
import '../styles/AdminDashboard.css';

const AdminHeader = ({ userName }) => {
  return (
    <header className="admin-top-header">
      <div className="header-welcome">
        <h1>Welcome, {userName}</h1>
        <p>System Administrator Control Panel</p>
      </div>
      <div className="admin-role-tag">Admin</div>
    </header>
  );
};

export default AdminHeader;
