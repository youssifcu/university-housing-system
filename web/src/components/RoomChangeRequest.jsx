import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebaseConfig';
import { submitRoomChangeRequest, getRoomChangeRequestsByUser, getAllBuildings, getAllRooms } from '../services/user_Service';
import '../styles/SubmitApplication.css';

const RoomChangeRequest = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    buildingId: '',
    roomId: '',
    reason: ''
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadData(currentUser.email);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadData = async (email) => {
    try {
      const [buildingsData, roomsData, requestsData] = await Promise.all([
        getAllBuildings(),
        getAllRooms(),
        getRoomChangeRequestsByUser(email)
      ]);
      
      setBuildings(buildingsData);
      const availableRooms = roomsData.filter(room => room.status === 'available');
      setRooms(availableRooms);
      setRequests(requestsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('You must be logged in to submit a request');
      return;
    }

    if (!formData.buildingId || !formData.roomId || !formData.reason) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const selectedBuilding = buildings.find(b => b.id === formData.buildingId);
      const selectedRoom = rooms.find(r => r.id === formData.roomId);

      const requestData = {
        userEmail: user.email,
        studentName: userData?.fullName || user.email,
        currentRoomId: userData?.currentRoomId || null,
        requestedBuildingId: formData.buildingId,
        requestedBuildingName: selectedBuilding?.name || 'Unknown',
        requestedRoomId: formData.roomId,
        requestedRoomNumber: selectedRoom?.roomNumber || 'Unknown',
        reason: formData.reason
      };

      await submitRoomChangeRequest(requestData);
      
      alert('Room change request submitted successfully!');
      setFormData({
        buildingId: '',
        roomId: '',
        reason: ''
      });
      await loadData(user.email);
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Error submitting request: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-form-wrapper">
      <div className="form-card">
        <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>Room Change Request</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Select New Room</h3>
            
            <div className="form-group">
              <label>Select Building</label>
              <select name="buildingId" value={formData.buildingId} onChange={handleChange} required>
                <option value="">Choose a building...</option>
                {buildings.map(building => (
                  <option key={building.id} value={building.id}>
                    {building.name} ({building.gender})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Select Room</label>
              <select name="roomId" value={formData.roomId} onChange={handleChange} required disabled={!formData.buildingId}>
                <option value="">Choose a room...</option>
                {rooms
                  .filter(room => room.buildingId === formData.buildingId)
                  .map(room => (
                    <option key={room.id} value={room.id}>
                      Room {room.roomNumber} - Floor {room.floorNumber} 
                      ({room.currentOccupancy}/{room.capacity} occupied)
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label>Reason for Room Change</label>
              <textarea 
                name="reason" 
                value={formData.reason} 
                onChange={handleChange} 
                rows="4" 
                placeholder="Please explain why you want to change your room..."
                required
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px', resize: 'vertical' }}
              />
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>

        {requests.length > 0 && (
          <div style={{ marginTop: '3rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Your Requests</h3>
            <div className="apps-cards-grid">
              {requests.map((request) => (
                <div key={request.id} className="app-card-modern">
                  <div className="app-card-header">
                    <span className="app-id-badge">{request.id.substring(0, 8).toUpperCase()}</span>
                    <span className={`status-tag status-${request.status.toLowerCase()}`}>
                      {request.status}
                    </span>
                  </div>
                  
                  <div className="app-card-body">
                    <div className="app-info-row">
                      <span className="app-info-label">Requested Building</span>
                      <span className="app-info-value">{request.requestedBuildingName}</span>
                    </div>
                    <div className="app-info-row">
                      <span className="app-info-label">Requested Room</span>
                      <span className="app-info-value">{request.requestedRoomNumber}</span>
                    </div>
                    <div className="app-info-row">
                      <span className="app-info-label">Date Requested</span>
                      <span className="app-info-value">
                        {request.requestedAt?.toDate ? 
                          new Date(request.requestedAt.toDate()).toLocaleDateString() : 
                          new Date(request.requestedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="app-info-row app-notes-box">
                      <span className="app-info-label">Reason</span>
                      <span className="app-info-value">{request.reason}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomChangeRequest;
