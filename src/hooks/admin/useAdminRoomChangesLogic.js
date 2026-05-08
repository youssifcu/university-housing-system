import { useState } from 'react';
import {
  getAllRoomChangeRequests,
  updateRoomChangeRequestStatus,
  assignUserToNewRoom,
  getRoomById,
  getBuildingById,
  adminChangeUserRoom,
} from '../../services/user_Service';

const initialAdminRoomChangeData = {
  buildingId: '',
  roomId: '',
  reason: '',
};

export const useAdminRoomChangesLogic = ({ buildings, rooms, loadUsers }) => {
  const [roomChangeRequests, setRoomChangeRequests] = useState([]);
  const [showRoomChangeModal, setShowRoomChangeModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showAdminRoomChangeModal, setShowAdminRoomChangeModal] = useState(false);
  const [selectedUserForRoomChange, setSelectedUserForRoomChange] = useState(null);
  const [adminRoomChangeData, setAdminRoomChangeData] = useState(initialAdminRoomChangeData);

  const loadRoomChangeRequests = async () => {
    try {
      const requestsData = await getAllRoomChangeRequests();
      setRoomChangeRequests(requestsData);
    } catch (error) {
      alert('Error loading room change requests: ' + error.message);
    }
  };

  const handleReviewRoomChangeRequest = (request) => {
    setSelectedRequest(request);
    setShowRoomChangeModal(true);
  };

  const handleApproveRoomChange = async (request) => {
    if (window.confirm('Approve this room change request?')) {
      try {
        const newRoom = await getRoomById(request.requestedRoomId);
        const newBuilding = await getBuildingById(request.requestedBuildingId);
        const roomDetails = {
          buildingId: request.requestedBuildingId,
          buildingName: newBuilding?.name || request.requestedBuildingName,
          roomNumber: newRoom?.roomNumber || request.requestedRoomNumber,
        };

        await assignUserToNewRoom(
          request.userEmail,
          request.currentRoomId,
          request.requestedRoomId,
          roomDetails
        );

        await updateRoomChangeRequestStatus(request.id, 'Approved');
        await loadRoomChangeRequests();
        setShowRoomChangeModal(false);
        alert('Room change approved! User has been assigned to the new room.');
      } catch (error) {
        alert('Error approving room change: ' + error.message);
      }
    }
  };

  const handleRejectRoomChange = async (id) => {
    if (window.confirm('Reject this room change request?')) {
      try {
        await updateRoomChangeRequestStatus(id, 'Rejected');
        await loadRoomChangeRequests();
        setShowRoomChangeModal(false);
      } catch (error) {
        alert('Error rejecting room change: ' + error.message);
      }
    }
  };

  const openAdminRoomChangeModal = (user) => {
    setSelectedUserForRoomChange(user);
    setAdminRoomChangeData(initialAdminRoomChangeData);
    setShowAdminRoomChangeModal(true);
  };

  const handleAdminRoomChangeSubmit = async (e) => {
    e.preventDefault();
    if (!adminRoomChangeData.buildingId || !adminRoomChangeData.roomId || !adminRoomChangeData.reason) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const newRoom = rooms.find((r) => r.id === adminRoomChangeData.roomId);
      const newBuilding = buildings.find((b) => b.id === adminRoomChangeData.buildingId);
      const roomDetails = {
        buildingId: adminRoomChangeData.buildingId,
        buildingName: newBuilding?.name || 'Unknown',
        roomNumber: newRoom?.roomNumber || 'Unknown',
      };

      await adminChangeUserRoom(
        selectedUserForRoomChange.universityEmail,
        selectedUserForRoomChange.currentRoomId,
        adminRoomChangeData.roomId,
        roomDetails,
        adminRoomChangeData.reason
      );

      alert('User room changed successfully!');
      setShowAdminRoomChangeModal(false);
      await loadUsers();
    } catch (error) {
      alert('Error changing user room: ' + error.message);
    }
  };

  return {
    roomChangeRequests,
    showRoomChangeModal,
    selectedRequest,
    showAdminRoomChangeModal,
    selectedUserForRoomChange,
    adminRoomChangeData,
    setShowRoomChangeModal,
    setShowAdminRoomChangeModal,
    setAdminRoomChangeData,
    loadRoomChangeRequests,
    handleReviewRoomChangeRequest,
    handleApproveRoomChange,
    handleRejectRoomChange,
    openAdminRoomChangeModal,
    handleAdminRoomChangeSubmit,
  };
};
