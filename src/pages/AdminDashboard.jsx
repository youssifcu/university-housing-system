import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminDashboardLogic } from '../hooks/useAdminDashboardLogic';
import AddUserModal from '../components/admin/modals/AddUserModal';
import EditUserModal from '../components/admin/modals/EditUserModal';
import ApplicationReviewModal from '../components/admin/modals/ApplicationReviewModal';
import { AdminRoomChangeModal, RoomChangeReviewModal } from '../components/admin/modals/RoomChangeModals';
import MealModal from '../components/admin/modals/MealModal';
import { useAIChatContext } from '../context/AIChatContext';
import '../styles/AdminDashboard.css';

const ReportsTab = lazy(() => import('../components/admin/ReportsTab'));
const ManageUsersTab = lazy(() => import('../components/admin/ManageUsersTab'));
const ApplicationsTab = lazy(() => import('../components/admin/ApplicationsTab'));
const RoomChangesTab = lazy(() => import('../components/admin/RoomChangesTab'));
const MealsTab = lazy(() => import('../components/admin/MealsTab'));
const ManageBuildings = lazy(() => import('../components/ManageBuildings'));
const ManageRooms = lazy(() => import('../components/ManageRooms'));

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { setScreenContext } = useAIChatContext();
  const [activeTab, setActiveTab] = useState('applications');

  const dashboard = useAdminDashboardLogic(navigate);

  useEffect(() => {
    setScreenContext({
      screen: 'admin-dashboard',
      activeTab,
      loading: dashboard.loading,
      adminName: dashboard.userName,
      counts: {
        users: dashboard.users?.length || 0,
        applications: dashboard.applications?.length || 0,
        roomChangeRequests: dashboard.roomChangeRequests?.length || 0,
        meals: dashboard.meals?.length || 0,
        buildings: dashboard.buildings?.length || 0,
        rooms: dashboard.rooms?.length || 0,
        attendanceRecords: dashboard.attendanceRecords?.length || 0,
      },
      users: dashboard.users,
      applications: dashboard.applications,
      roomChangeRequests: dashboard.roomChangeRequests,
      meals: dashboard.meals,
      buildings: dashboard.buildings,
      rooms: dashboard.rooms,
      attendanceRecords: dashboard.attendanceRecords,
      filters: {
        userRoleFilter: dashboard.userRoleFilter,
        appStatusFilter: dashboard.appStatusFilter,
        mealFilters: dashboard.mealFilters,
        attendanceSelectedBuildingId: dashboard.attendanceSelectedBuildingId,
      },
      guidance:
        'This is the admin dashboard. Use the loaded administrative data to answer questions about users, applications, rooms, meals, and attendance.',
    });
  }, [
    activeTab,
    dashboard.appStatusFilter,
    dashboard.applications,
    dashboard.attendanceRecords,
    dashboard.attendanceSelectedBuildingId,
    dashboard.buildings,
    dashboard.loading,
    dashboard.mealFilters,
    dashboard.meals,
    dashboard.roomChangeRequests,
    dashboard.rooms,
    dashboard.userName,
    dashboard.userRoleFilter,
    dashboard.users,
    setScreenContext,
  ]);

  if (dashboard.loading) {
    return (
      <div className="admin-dashboard-wrapper">
        <div className="admin-loading">Loading Admin Dashboard...</div>
      </div>
    );
  }

  const tabLoadingFallback = (
    <div className="admin-section">
      <div className="admin-table-panel">
        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading section...</div>
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard-wrapper">
      <div className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-logo-icon">🛡️</div>
          <h2>Dorm Admin</h2>
        </div>

        <nav className="admin-nav-menu">
          <button className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Manage Users</button>
          <button className={`admin-nav-item ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>Housing Applications</button>
          <button className={`admin-nav-item ${activeTab === 'roomChanges' ? 'active' : ''}`} onClick={() => setActiveTab('roomChanges')}>Room Change Requests</button>
          <button className={`admin-nav-item ${activeTab === 'buildings' ? 'active' : ''}`} onClick={() => setActiveTab('buildings')}>Manage Buildings</button>
          <button className={`admin-nav-item ${activeTab === 'rooms' ? 'active' : ''}`} onClick={() => setActiveTab('rooms')}>Manage Rooms</button>
          <button className={`admin-nav-item ${activeTab === 'meals' ? 'active' : ''}`} onClick={() => setActiveTab('meals')}>Manage Meals</button>
          <button className={`admin-nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>Attendance</button>
        </nav>

        <div className="admin-logout-container">
          <button className="admin-logout-btn" onClick={dashboard.handleLogout}>Logout</button>
        </div>
      </div>

      <div className="admin-main-view">
        <header className="admin-top-header">
          <div className="header-welcome">
            <h1>Welcome, {dashboard.userName}</h1>
            <p>System Administrator Control Panel</p>
          </div>
          <div className="admin-role-tag">Admin</div>
        </header>

        <div className="admin-content-scroll">
          {activeTab === 'users' && (
            <Suspense fallback={tabLoadingFallback}>
              <ManageUsersTab
                users={dashboard.users}
                userRoleFilter={dashboard.userRoleFilter}
                setUserRoleFilter={dashboard.setUserRoleFilter}
                userPage={dashboard.userPage}
                setUserPage={dashboard.setUserPage}
                userLimit={dashboard.userLimit}
                setUserLimit={dashboard.setUserLimit}
                loadUsers={dashboard.loadUsers}
                handleEditUser={dashboard.handleEditUser}
                handleRoleChange={dashboard.handleRoleChange}
                handleDeleteUser={dashboard.handleDeleteUser}
                openAdminRoomChangeModal={dashboard.openAdminRoomChangeModal}
                availableRoles={dashboard.availableRoles}
                setShowAddModal={dashboard.setShowAddModal}
                updatingRoleUserId={dashboard.updatingRoleUserId}
              />
            </Suspense>
          )}

          {activeTab === 'applications' && (
            <Suspense fallback={tabLoadingFallback}>
              <ApplicationsTab
                applications={dashboard.applications}
                appPage={dashboard.appPage}
                appTotalPages={dashboard.appTotalPages}
                appLimit={dashboard.appLimit}
                setAppLimit={dashboard.setAppLimit}
                appStatusFilter={dashboard.appStatusFilter}
                setAppStatusFilter={dashboard.setAppStatusFilter}
                appLoading={dashboard.appLoading}
                loadApplications={dashboard.loadApplications}
                handleReviewApp={dashboard.handleReviewApp}
                handleApproveApp={dashboard.handleApproveApp}
                handleRejectApp={dashboard.handleRejectApp}
              />
            </Suspense>
          )}

          {activeTab === 'roomChanges' && (
            <Suspense fallback={tabLoadingFallback}>
              <RoomChangesTab
                roomChangeRequests={dashboard.roomChangeRequests}
                handleReviewRoomChangeRequest={dashboard.handleReviewRoomChangeRequest}
                handleApproveRoomChange={dashboard.handleApproveRoomChange}
                handleRejectRoomChange={dashboard.handleRejectRoomChange}
              />
            </Suspense>
          )}

          {activeTab === 'buildings' && (
            <Suspense fallback={tabLoadingFallback}>
              <ManageBuildings />
            </Suspense>
          )}

          {activeTab === 'rooms' && (
            <Suspense fallback={tabLoadingFallback}>
              <ManageRooms />
            </Suspense>
          )}

          {activeTab === 'meals' && (
            <Suspense fallback={tabLoadingFallback}>
              <MealsTab
                meals={dashboard.meals}
                mealPage={dashboard.mealPage}
                mealTotalPages={dashboard.mealTotalPages}
                mealLimit={dashboard.mealLimit}
                setMealLimit={dashboard.setMealLimit}
                mealFilters={dashboard.mealFilters}
                setMealFilters={dashboard.setMealFilters}
                mealLoading={dashboard.mealLoading}
                loadMeals={dashboard.loadMeals}
                handleCreateMeal={dashboard.handleCreateMeal}
                handleEditMeal={dashboard.handleEditMeal}
                handleDeleteMeal={dashboard.handleDeleteMeal}
              />
            </Suspense>
          )}

          {activeTab === 'reports' && (
            <Suspense fallback={tabLoadingFallback}>
              <ReportsTab
                buildings={dashboard.buildings}
                attendanceRecords={dashboard.attendanceRecords}
                attendanceSelectedBuildingId={dashboard.attendanceSelectedBuildingId}
                setAttendanceSelectedBuildingId={dashboard.setAttendanceSelectedBuildingId}
                attendanceLoading={dashboard.attendanceLoading}
                loadAttendanceByBuilding={dashboard.loadAttendanceByBuilding}
              />
            </Suspense>
          )}
        </div>
      </div>

      <AddUserModal
        show={dashboard.showAddModal}
        onClose={() => dashboard.setShowAddModal(false)}
        newUser={dashboard.newUser}
        setNewUser={dashboard.setNewUser}
        onSubmit={dashboard.handleAddUser}
      />

      {dashboard.showAddSuccess && (
        <div className="enterprise-modal-overlay">
          <div className="enterprise-modal admin-success-modal">
            <div className="admin-success-icon">OK</div>
            <h3>User Added Successfully</h3>
            <p>
              {dashboard.addedUserSummary?.name || 'The new user'} has been created and is now available in the
              admin dashboard.
            </p>
            <div className="admin-success-details">
              <div><strong>Email:</strong> {dashboard.addedUserSummary?.email}</div>
              <div><strong>Role:</strong> {dashboard.addedUserSummary?.role}</div>
            </div>
            <div className="modal-footer admin-success-actions">
              <button type="button" className="btn-primary" onClick={() => dashboard.setShowAddSuccess(false)}>
                Back to Users
              </button>
            </div>
          </div>
        </div>
      )}

      <EditUserModal
        show={dashboard.showEditModal}
        onClose={() => dashboard.setShowEditModal(false)}
        editData={dashboard.editData}
        setEditData={dashboard.setEditData}
        availableRoles={dashboard.availableRoles}
        onSave={dashboard.handleSaveEdit}
      />

      <ApplicationReviewModal
        show={dashboard.showReviewModal}
        selectedApp={dashboard.selectedApp}
        onClose={() => dashboard.setShowReviewModal(false)}
        onUnderReview={dashboard.handleUnderReviewApp}
        onReject={dashboard.handleRejectApp}
        onApprove={dashboard.handleApproveApp}
      />

      <RoomChangeReviewModal
        show={dashboard.showRoomChangeModal}
        selectedRequest={dashboard.selectedRequest}
        onClose={() => dashboard.setShowRoomChangeModal(false)}
        onReject={dashboard.handleRejectRoomChange}
        onApprove={dashboard.handleApproveRoomChange}
      />

      <AdminRoomChangeModal
        show={dashboard.showAdminRoomChangeModal}
        selectedUserForRoomChange={dashboard.selectedUserForRoomChange}
        onClose={() => dashboard.setShowAdminRoomChangeModal(false)}
        onSubmit={dashboard.handleAdminRoomChangeSubmit}
        adminRoomChangeData={dashboard.adminRoomChangeData}
        setAdminRoomChangeData={dashboard.setAdminRoomChangeData}
        buildings={dashboard.buildings}
        rooms={dashboard.rooms}
      />

      <MealModal
        show={dashboard.showMealModal}
        selectedMeal={dashboard.selectedMeal}
        mealFormData={dashboard.mealFormData}
        setMealFormData={dashboard.setMealFormData}
        onClose={() => dashboard.setShowMealModal(false)}
        onSubmit={dashboard.handleMealSubmit}
        mealSubmitting={dashboard.mealSubmitting}
      />
    </div>
  );
};

export default AdminDashboard;
