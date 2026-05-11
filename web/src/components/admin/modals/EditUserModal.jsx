import React from 'react';

const EditUserModal = ({ show, onClose, editData, setEditData, availableRoles, onSave }) => {
  if (!show) return null;

  return (
    <div className="enterprise-modal-overlay">
      <div className="enterprise-modal">
        <div className="modal-header">
          <h3>Edit User Profile</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-form">
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" value={editData.name || ''} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="form-input" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={editData.email || ''} onChange={(e) => setEditData({ ...editData, email: e.target.value })} className="form-input" />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input type="text" value={editData.phoneNumber || ''} onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })} className="form-input" />
          </div>
          <div className="form-group">
            <label>Student ID</label>
            <input type="text" value={editData.studentId || ''} onChange={(e) => setEditData({ ...editData, studentId: e.target.value })} className="form-input" />
          </div>
          <div className="form-group">
            <label>National ID</label>
            <input type="text" value={editData.nationalId || ''} onChange={(e) => setEditData({ ...editData, nationalId: e.target.value })} className="form-input" />
          </div>
          <div className="form-group">
            <label>Faculty</label>
            <input type="text" value={editData.faculty || ''} onChange={(e) => setEditData({ ...editData, faculty: e.target.value })} className="form-input" />
          </div>
          <div className="form-group">
            <label>University Year</label>
            <input type="number" value={editData.universityYear || ''} onChange={(e) => setEditData({ ...editData, universityYear: e.target.value })} className="form-input" />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select value={editData.role} onChange={(e) => setEditData({ ...editData, role: e.target.value })} className="form-input">
              {availableRoles?.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn-primary" onClick={onSave}>Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;
