import React from 'react';

const AddUserModal = ({ show, onClose, newUser, setNewUser, onSubmit }) => {
  if (!show) return null;

  return (
    <div className="enterprise-modal-overlay">
      <div className="enterprise-modal">
        <div className="modal-header">
          <h3>Add New User</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={onSubmit} className="modal-form">
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" value={newUser.name || ''} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required className="form-input" placeholder="Enter your full name" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={newUser.email || ''} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required className="form-input" placeholder="Enter your email" />
          </div>
          <div className="form-group">
            <label>Student ID</label>
            <input type="text" value={newUser.studentId || ''} onChange={(e) => setNewUser({ ...newUser, studentId: e.target.value })} required className="form-input" placeholder="Enter 8-10 digit student ID" maxLength="10" />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input type="tel" value={newUser.phoneNumber || ''} onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })} required className="form-input" placeholder="11 digits starting with 01 (e.g., 01012345678)" maxLength="11" pattern="01[0-9]{9}" />
          </div>
          <div className="form-group">
            <label>National ID</label>
            <input type="text" value={newUser.nationalId || ''} onChange={(e) => setNewUser({ ...newUser, nationalId: e.target.value })} required className="form-input" placeholder="14 digit national ID" maxLength="14" pattern="[0-9]{14}" />
          </div>
          <div className="form-group">
            <label>University Year</label>
            <select value={newUser.universityYear || ''} onChange={(e) => setNewUser({ ...newUser, universityYear: e.target.value })} required className="form-input">
              <option value="">Select Year</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
              <option value="5">Year 5</option>
            </select>
          </div>
          <div className="form-group">
            <label>Faculty</label>
            <select value={newUser.faculty || ''} onChange={(e) => setNewUser({ ...newUser, faculty: e.target.value })} required className="form-input">
              <option value="">Select faculty</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Engineering">Engineering</option>
              <option value="Medicine">Medicine</option>
              <option value="Business">Business</option>
              <option value="Law">Law</option>
            </select>
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select value={newUser.gender || 'male'} onChange={(e) => setNewUser({ ...newUser, gender: e.target.value })} className="form-input">
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required className="form-input" placeholder="Enter secure password" />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="form-input">
              <option value="student">Student</option>
              <option value="admin">Admin</option>
              <option value="supervisor">Supervisor</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save User</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
