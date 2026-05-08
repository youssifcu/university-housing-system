import React from 'react';
import '../../styles/AdminDashboard.css';

const ApplicationsTab = ({
  applications,
  appPage,
  appTotalPages,
  appLimit,
  setAppLimit,
  appStatusFilter,
  setAppStatusFilter,
  appLoading,
  loadApplications,
  handleReviewApp,
  handleApproveApp,
  handleRejectApp
}) => {
  return (
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
                  <th>Student ID</th>
                  <th>Student Info</th>
                  <th>College</th>
                  <th>GPA</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications?.map((app) => {
                  const appId = app.id || app._id || '0';
                  const displayName = app.fullName || app.studentName || 'Unknown';
                  const studentId = app.userId?._id || 'N/A';
                  const nationalId = app.nationalId || 'N/A';
                  const college = app.college || app.faculty || 'N/A';
                  const gpa = app.gpa || 'N/A';
                  const status = app.status || 'pending';
                  console.log(app.userId?._id);

                  return (
                    <tr key={appId}>
                      <td className="fw-bold text-blue">
                        {studentId}
                      </td>
                      <td>
                        <div className="student-info-col">
                          <span className="fw-bold">{displayName}</span>
                          <span className="text-muted text-small">National ID: {nationalId}</span>
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
                  )
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
  );
};

export default ApplicationsTab;
