import React from 'react';
import '../../styles/AdminDashboard.css';

const AttendanceTab = ({
  buildings,
  attendanceRecords,
  attendanceStats,
  attendancePagination,
  attendanceDate,
  attendanceSelectedBuildingId,
  setAttendanceSelectedBuildingId,
  attendanceLoading,
  loadAttendanceByBuilding,
}) => {
  const toText = (value, fallback = 'N/A') => {
    if (value === null || value === undefined || value === '') return fallback;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (typeof value === 'object') {
      return value.name || value.title || value.studentId || value._id || value.id || fallback;
    }
    return fallback;
  };

  const getStudentName = (record) =>
    toText(record.studentName, '') ||
    record.userName ||
    record.name ||
    record.student?.name ||
    record.user?.name ||
    toText(record.student, '') ||
    toText(record.user, 'N/A');

  const getStudentId = (record) =>
    toText(record.studentId, '') ||
    record.student?.studentId ||
    record.user?.studentId ||
    record.userId ||
    record.student?._id ||
    record.user?._id ||
    'N/A';

  const getAttendanceStatus = (record) =>
    toText(record.status, '') ||
    record.attendanceStatus ||
    record.state ||
    'N/A';

  const formatDateTime = (value) => {
    if (!value) return 'N/A';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return toText(value);
    }

    return date.toLocaleString();
  };

  const selectedBuildingName =
    buildings?.find((b) => (b.id || b._id) === attendanceSelectedBuildingId)?.name || '';

  return (
    <div className="admin-section">
      <div className="admin-stats-row">
        <div className="stat-box">
          <div className="stat-box-icon">📋</div>
          <div className="stat-box-data">
            <h3>{attendanceStats?.totalRecords ?? (attendanceRecords?.length || 0)}</h3>
            <p>Total Records</p>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-box-icon">✅</div>
          <div className="stat-box-data">
            <h3>{attendanceStats?.presentCount ?? 0}</h3>
            <p>Present</p>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-box-icon">⛔</div>
          <div className="stat-box-data">
            <h3>{attendanceStats?.absentCount ?? 0}</h3>
            <p>Absent</p>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-box-icon">⏰</div>
          <div className="stat-box-data">
            <h3>{attendanceStats?.lateCount ?? 0}</h3>
            <p>Late</p>
          </div>
        </div>
      </div>

      <div className="admin-table-panel">
        <div className="panel-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <h2>Attendance</h2>
            <div className="admin-hint-text">
              {selectedBuildingName ? (
                <>
                  Building: <strong>{selectedBuildingName}</strong>
                </>
              ) : (
                'Select a building to view attendance.'
              )}
              {attendanceDate ? (
                <>
                  {' '}
                  · Date: <strong>{formatDateTime(attendanceDate)}</strong>
                </>
              ) : null}
              {attendancePagination?.total ? (
                <>
                  {' '}
                  · Total: <strong>{attendancePagination.total}</strong>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <div className="admin-attendance-controls">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label className="admin-control-label">Building</label>
              <select
                value={attendanceSelectedBuildingId}
                onChange={(e) => setAttendanceSelectedBuildingId(e.target.value)}
                className="role-dropdown"
              >
                <option value="">Select Building</option>
                {buildings?.map((building) => (
                  <option key={building.id || building._id} value={building.id || building._id}>
                    {building.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="btn-primary"
              onClick={() => loadAttendanceByBuilding(attendanceSelectedBuildingId)}
              disabled={attendanceLoading || !attendanceSelectedBuildingId}
            >
              {attendanceLoading ? 'Loading...' : 'Show Attendance'}
            </button>

            <button
              className="btn-secondary"
              onClick={() => {
                setAttendanceSelectedBuildingId('');
                loadAttendanceByBuilding('');
              }}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="table-responsive">
          {attendanceLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              Loading attendance...
            </div>
          ) : (
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Student ID</th>
                  <th>Building</th>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords?.map((record, index) => {
                  const recordKey =
                    record.id || record._id || `${getStudentId(record)}-${record.date || record.createdAt || index}`;
                  const statusValue = getAttendanceStatus(record);
                  const statusClass = `status-pill ${
                    statusValue && typeof statusValue === 'string'
                      ? `status-${statusValue.toLowerCase().replace(/\s+/g, '_')}`
                      : ''
                  }`;

                  return (
                    <tr key={recordKey}>
                      <td>{getStudentName(record)}</td>
                      <td>{getStudentId(record)}</td>
                      <td>{toText(record.buildingName, '') || record.building?.name || toText(record.building)}</td>
                      <td>{formatDateTime(record.date || record.attendanceDate || record.createdAt)}</td>
                      <td>{formatDateTime(record.checkInTime || record.checkIn || record.entryTime)}</td>
                      <td>{formatDateTime(record.checkOutTime || record.checkOut || record.exitTime)}</td>
                      <td>
                        <span className={statusClass}>{statusValue}</span>
                      </td>
                    </tr>
                  );
                })}

                {attendanceRecords?.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      {attendanceSelectedBuildingId
                        ? 'No attendance found for this building.'
                        : 'Select a building to view attendance.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceTab;

