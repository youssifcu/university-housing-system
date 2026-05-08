import React from 'react';

const formatDateTime = (value) => {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
};

const formatHousingStatus = (status) => {
  if (!status) {
    return 'N/A';
  }

  return String(status)
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const MemberProfileTab = ({
  editing,
  setEditing,
  housingData,
  previewImage,
  handleImageChange,
  editData,
  setEditData,
  handleSaveProfile,
  backendProfile,
  assignedRoomName,
  assignedRoomLoading,
  userData,
  user,
}) => {
  const handleCancelEdit = () => {
    setEditData({
      name: backendProfile?.name || '',
      email: backendProfile?.email || user?.email || '',
      phoneNumber: backendProfile?.phoneNumber || '',
      studentId: backendProfile?.studentId || '',
      nationalId: backendProfile?.nationalId || '',
      faculty: backendProfile?.faculty || '',
      universityYear: backendProfile?.universityYear ?? '',
      grade: backendProfile?.grade ?? '',
    });
    setEditing(false);
  };

  const assignedRoomId =
    backendProfile?.assignedRoomId?._id ||
    backendProfile?.assignedRoomId?.id ||
    backendProfile?.assignedRoomId ||
    'N/A';

  const leaveStatus = backendProfile?.leaveStatus;
  const leavePeriod =
    leaveStatus?.leaveStartDate || leaveStatus?.leaveEndDate
      ? `${formatDateTime(leaveStatus?.leaveStartDate)} - ${formatDateTime(leaveStatus?.leaveEndDate)}`
      : 'N/A';

  return (
    <div className="profile-section-modern">
      <div className="section-header-modern">
        <h3 className="section-title-modern">
          <span className="info-icon">Info</span> Resident Digital ID
        </h3>
        {!editing && (
          <button className="edit-btn-modern" onClick={() => setEditing(true)}>
            Edit Profile
          </button>
        )}
      </div>

      <div className="profile-card-modern">
        <div className="digital-id-card">
          <div className="qr-box">
            {housingData && housingData.qrCode ? (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${housingData.qrCode}`}
                alt="Entry QR"
              />
            ) : (
              <div className="qr-placeholder">
                {housingData?.housingStatus === 'pending' ? 'Pending Approval' : 'No Housing'}
              </div>
            )}
            <p className="qr-label">Entry Token</p>
          </div>

          <div className="housing-info-brief">
            <div className="info-tag">
              Status
              <span className={housingData?.housingStatus === 'active' ? 'status-active' : 'status-pending'}>
                {housingData?.housingStatus || 'Not Applied'}
              </span>
            </div>
            <div className="info-tag">
              Room
              <span>{housingData?.roomId || assignedRoomName || 'N/A'}</span>
            </div>
            <div className="info-tag">
              Bed
              <span>#{housingData?.bedNumber || backendProfile?.bedNumber || '--'}</span>
            </div>
          </div>
        </div>

        <div className="profile-image-section-modern">
          {previewImage ? (
            <img src={previewImage} alt="Profile" className="profile-preview-img" />
          ) : (
            <div className="avatar-placeholder-large">User</div>
          )}

          {editing && (
            <div className="image-upload-wrapper">
              <label htmlFor="profile-upload" className="file-input-label">
                Choose New Image
              </label>
              <input
                id="profile-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="file-input-modern"
              />
              <p className="image-upload-text">Max 5MB</p>
            </div>
          )}
        </div>

        <div className="profile-details-modern">
          {editing ? (
            <>
              <div className="profile-form-panel">
                <div className="form-panel-header">
                  <h4>Personal Information</h4>
                  <p>Keep your main student account details current.</p>
                </div>

                <div className="profile-form-grid">
                  <div className="input-group-modern">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={editData.name || ''}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="input-modern"
                    />
                  </div>
                  <div className="input-group-modern">
                    <label>Email</label>
                    <input
                      type="email"
                      value={editData.email || ''}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="input-modern"
                    />
                  </div>
                  <div className="input-group-modern">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={editData.phoneNumber || ''}
                      onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })}
                      className="input-modern"
                    />
                  </div>
                  <div className="input-group-modern">
                    <label>National ID</label>
                    <input
                      type="text"
                      value={editData.nationalId || ''}
                      onChange={(e) => setEditData({ ...editData, nationalId: e.target.value })}
                      className="input-modern"
                    />
                  </div>
                </div>
              </div>

              <div className="profile-form-panel">
                <div className="form-panel-header">
                  <h4>Academic Information</h4>
                  <p>These values are reflected in your housing profile.</p>
                </div>

                <div className="profile-form-grid">
                  <div className="input-group-modern">
                    <label>Student ID</label>
                    <input
                      type="text"
                      value={editData.studentId || ''}
                      onChange={(e) => setEditData({ ...editData, studentId: e.target.value })}
                      className="input-modern"
                    />
                  </div>
                  <div className="input-group-modern">
                    <label>Faculty</label>
                    <input
                      type="text"
                      value={editData.faculty || ''}
                      onChange={(e) => setEditData({ ...editData, faculty: e.target.value })}
                      className="input-modern"
                    />
                  </div>
                  <div className="input-group-modern">
                    <label>University Year</label>
                    <input
                      type="number"
                      min="1"
                      max="7"
                      value={editData.universityYear || ''}
                      onChange={(e) => setEditData({ ...editData, universityYear: e.target.value })}
                      className="input-modern"
                    />
                  </div>
                  <div className="input-group-modern">
                    <label>Grade</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={editData.grade || ''}
                      onChange={(e) => setEditData({ ...editData, grade: e.target.value })}
                      className="input-modern"
                    />
                  </div>
                </div>
              </div>

              <div className="action-buttons-modern">
                <button className="save-btn-modern" onClick={handleSaveProfile}>Save</button>
                <button className="cancel-btn-modern" onClick={handleCancelEdit}>Cancel</button>
              </div>
            </>
          ) : (
            <>
              <div className="detail-item-modern">
                <span className="detail-label">Full Name</span>
                <div className="detail-value">{backendProfile?.name || userData?.fullName || 'N/A'}</div>
              </div>
              <div className="detail-item-modern">
                <span className="detail-label">User ID</span>
                <div className="detail-value">{backendProfile?.id || backendProfile?._id || userData?.id || 'N/A'}</div>
              </div>
              <div className="detail-item-modern">
                <span className="detail-label">Student ID</span>
                <div className="detail-value">{backendProfile?.studentId || userData?.studentId || 'N/A'}</div>
              </div>
              <div className="detail-item-modern">
                <span className="detail-label">Email</span>
                <div className="detail-value">{backendProfile?.email || userData?.universityEmail || user?.email || 'N/A'}</div>
              </div>
              <div className="detail-item-modern">
                <span className="detail-label">Phone Number</span>
                <div className="detail-value">{backendProfile?.phoneNumber || 'N/A'}</div>
              </div>
              <div className="detail-item-modern">
                <span className="detail-label">National ID</span>
                <div className="detail-value">{backendProfile?.nationalId || 'N/A'}</div>
              </div>
              <div className="detail-item-modern">
                <span className="detail-label">Faculty</span>
                <div className="detail-value">{backendProfile?.faculty || userData?.universityName || 'N/A'}</div>
              </div>
              <div className="detail-item-modern">
                <span className="detail-label">University Year</span>
                <div className="detail-value">{backendProfile?.universityYear || 'N/A'}</div>
              </div>
              <div className="detail-item-modern">
                <span className="detail-label">Grade</span>
                <div className="detail-value">{backendProfile?.grade ?? 'N/A'}</div>
              </div>
              <div className="detail-item-modern">
                <span className="detail-label">Role</span>
                <div className="detail-value">{backendProfile?.role || userData?.role || 'N/A'}</div>
              </div>
              <div className="detail-item-modern">
                <span className="detail-label">Housing Status</span>
                <div className="detail-value">{formatHousingStatus(backendProfile?.housingStatus)}</div>
              </div>
              <div className="detail-item-modern">
                <span className="detail-label">Assigned Room</span>
                <div className="detail-value">{assignedRoomLoading ? 'Loading room...' : assignedRoomName}</div>
              </div>
              <div className="detail-item-modern">
                <span className="detail-label">Assigned Room ID</span>
                <div className="detail-value">{assignedRoomId}</div>
              </div>
              <div className="detail-item-modern">
                <span className="detail-label">Bed Number</span>
                <div className="detail-value">{backendProfile?.bedNumber || 'N/A'}</div>
              </div>
              <div className="detail-item-modern">
                <span className="detail-label">Application ID</span>
                <div className="detail-value">{backendProfile?.applicationId || 'N/A'}</div>
              </div>
              <div className="detail-item-modern">
                <span className="detail-label">Room Allocation Date</span>
                <div className="detail-value">{formatDateTime(backendProfile?.roomAllocationDate)}</div>
              </div>
              <div className="detail-item-modern">
                <span className="detail-label">Leave Status</span>
                <div className="detail-value">{leaveStatus?.isOnLeave ? 'On Leave' : 'Active'}</div>
              </div>
              <div className="detail-item-modern">
                <span className="detail-label">Leave Period</span>
                <div className="detail-value">{leavePeriod}</div>
              </div>
              <div className="detail-item-modern">
                <span className="detail-label">Leave Reason</span>
                <div className="detail-value">{leaveStatus?.leaveReason || 'N/A'}</div>
              </div>
              <div className="detail-item-modern">
                <span className="detail-label">Created At</span>
                <div className="detail-value">{formatDateTime(backendProfile?.createdAt)}</div>
              </div>
              <div className="detail-item-modern">
                <span className="detail-label">Last Updated</span>
                <div className="detail-value">{formatDateTime(backendProfile?.updatedAt)}</div>
              </div>
              <div className="detail-item-modern">
                <span className="detail-label">Last Login</span>
                <div className="detail-value">{formatDateTime(backendProfile?.lastLogin)}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberProfileTab;
