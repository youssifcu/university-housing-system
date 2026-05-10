import { useState } from 'react';
import { getAllApplications, updateApplicationStatus } from '../../services/applicationService';

export const useAdminApplicationsLogic = () => {
  const [applications, setApplications] = useState([]);
  const [appPage, setAppPage] = useState(1);
  const [appLimit, setAppLimit] = useState(10);
  const [appTotalPages, setAppTotalPages] = useState(1);
  const [appStatusFilter, setAppStatusFilter] = useState('');
  const [appLoading, setAppLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

  const loadApplications = async (overrides = {}) => {
    try {
      setAppLoading(true);
      const currentPage = overrides.page ?? appPage;
      const currentLimit = overrides.limit ?? appLimit;
      const currentStatus = overrides.status ?? appStatusFilter;
      const result = await getAllApplications(currentPage, currentLimit, currentStatus);

      if (Array.isArray(result)) {
        setApplications(result);
      } else if (result.applications) {
        setApplications(result.applications);
        if (result.pagination) {
          setAppTotalPages(result.pagination.totalPages);
          setAppPage(result.pagination.currentPage);
        }
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      alert('Error loading applications: ' + error.message);
    } finally {
      setAppLoading(false);
    }
  };

  const handleReviewApp = (app) => {
    setSelectedApp(app);
    setShowReviewModal(true);
  };

  const handleApproveApp = async (id) => {
    if (window.confirm('Approve this application?')) {
      try {
        await updateApplicationStatus(id, 'approve');
        await loadApplications();
        setShowReviewModal(false);
        alert('Application approved successfully!');
      } catch (error) {
        alert('Error approving application: ' + error.message);
      }
    }
  };

  const handleRejectApp = async (id) => {
    const reason = window.prompt('Rejection reason (required):', '');
    if (reason === null) {
      return;
    }

    const trimmedReason = String(reason || '').trim();
    if (!trimmedReason) {
      alert('Rejection reason is required.');
      return;
    }

    if (window.confirm('Reject this application?')) {
      try {
        await updateApplicationStatus(id, 'reject', { reason: trimmedReason });
        await loadApplications();
        setShowReviewModal(false);
        alert('Application rejected successfully!');
      } catch (error) {
        alert('Error rejecting application: ' + error.message);
      }
    }
  };

  const handleUnderReviewApp = async (id) => {
    try {
      await updateApplicationStatus(id, 'under_review');
      await loadApplications();
      setShowReviewModal(false);
      alert('Application marked as under review!');
    } catch (error) {
      alert('Error updating status: ' + error.message);
    }
  };

  return {
    applications,
    appPage,
    appLimit,
    appTotalPages,
    appStatusFilter,
    appLoading,
    showReviewModal,
    selectedApp,
    setAppLimit,
    setAppStatusFilter,
    setShowReviewModal,
    loadApplications,
    handleReviewApp,
    handleApproveApp,
    handleRejectApp,
    handleUnderReviewApp,
  };
};
