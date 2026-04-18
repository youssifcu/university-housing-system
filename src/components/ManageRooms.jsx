import React, { useState, useEffect } from 'react';
import { getAllBuildings } from '../services/buildingService';
import { createRoom, getAllRooms, getRoomById, updateRoom, deleteRoom, assignStudentToRoom, removeStudentFromRoom, updateRoomStatus } from '../services/roomService';
import '../styles/ManageRooms.css';

const ManageRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [roomForm, setRoomForm] = useState({
    id: '',
    buildingId: '',
    floorNumber: 1,
    roomNumber: '',
    capacity: 2,
    amenities: [{ name: '', isWorking: true }]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [roomsData, buildingsData] = await Promise.all([
        getAllRooms(),
        getAllBuildings()
      ]);
      
      // Enrich rooms with building names
      const enrichedRooms = roomsData.map(room => {
        const building = buildingsData.find(b => (b.id || b._id) === room.buildingId);
        return {
          ...room,
          id: room.id || room._id,
          buildingName: building ? building.name : 'Unknown'
        };
      });
      
      setRooms(enrichedRooms);
      setBuildings(buildingsData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error loading data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setRoomForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAmenityChange = (index, field, value) => {
    setRoomForm((prev) => ({
      ...prev,
      amenities: prev.amenities.map((amenity, amenityIndex) =>
        amenityIndex === index ? { ...amenity, [field]: value } : amenity
      ),
    }));
  };

  const handleAddAmenity = () => {
    setRoomForm((prev) => ({
      ...prev,
      amenities: [...prev.amenities, { name: '', isWorking: true }],
    }));
  };

  const handleRemoveAmenity = (index) => {
    setRoomForm((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((_, amenityIndex) => amenityIndex !== index),
    }));
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setRoomForm({
      id: '',
      buildingId: buildings[0]?.id || buildings[0]?._id || '',
      floorNumber: 1,
      roomNumber: '',
      capacity: 2,
      amenities: [{ name: '', isWorking: true }]
    });
    setShowRoomModal(true);
  };

  const handleOpenEdit = async (room) => {
    try {
      const roomId = room.id || room._id;
      const fullRoom = await getRoomById(roomId);

      setIsEditing(true);
      setRoomForm({
        id: fullRoom?._id || roomId || '',
        buildingId: fullRoom?.buildingId?._id || fullRoom?.buildingId || room.buildingId || '',
        floorNumber: fullRoom?.floorNumber || 1,
        roomNumber: fullRoom?.roomNumber || '',
        capacity: fullRoom?.capacity || 2,
        amenities: fullRoom?.amenities?.length ? fullRoom.amenities : [{ name: '', isWorking: true }],
        status: fullRoom?.status || 'available'
      });
      setShowRoomModal(true);
    } catch (error) {
      console.error('Error loading room details:', error);
      alert('Error loading room details: ' + error.message);
    }
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    try {
      const roomData = {
        roomNumber: roomForm.roomNumber,
        floorNumber: parseInt(roomForm.floorNumber),
        capacity: parseInt(roomForm.capacity),
        amenities: roomForm.amenities.filter((amenity) => amenity.name.trim())
      };

      if (isEditing) {
        await updateRoom(roomForm.id, roomData);
        alert('Room updated successfully!');
      } else {
        roomData.buildingId = roomForm.buildingId;
        await createRoom(roomData);
        alert('Room added successfully!');
      }
      setShowRoomModal(false);
      await loadData();
    } catch (error) {
      console.error('Error saving room:', error);
      alert('Error saving room: ' + error.message);
    }
  };

  const handleAssignStudent = async (roomId, roomNumber) => {
    try {
      const studentIdInput = window.prompt(
        `Enter the Student ID to assign to Room ${roomNumber || 'selected room'}:`
      );

      if (studentIdInput === null) {
        return;
      }

      const studentId = studentIdInput.trim();
      if (!studentId) {
        alert('Student ID is required to assign a student to a room.');
        return;
      }

      await assignStudentToRoom(roomId, studentId);
      await loadData();
      alert('Student assigned successfully!');
    } catch (error) {
      console.error('Error assigning student:', error);
      alert(error.message);
    }
  };

  const handleRemoveStudent = async (roomId) => {
    try {
      await removeStudentFromRoom(roomId);
      await loadData();
    } catch (error) {
      console.error('Error removing student:', error);
      alert(error.message);
    }
  };

  const getOccupancyPercentage = (current, capacity) => {
    return (current / capacity) * 100;
  };

  if (loading) {
    return <div className="admin-section"><div className="loading-state">Loading rooms...</div></div>;
  }

  return (
    <div className="admin-section">
      <div className="admin-table-panel">
        <div className="panel-header">
          <h2>Rooms Management</h2>
          <button className="btn-primary" onClick={handleOpenAdd}>
            + Add New Room
          </button>
        </div>
        
        <div className="rooms-grid">
          {rooms.map(room => (
            <div key={room.id} className={`room-card status-${room.status}`}>
              <div className="room-header">
                <div>
                  <h3>Room {room.roomNumber}</h3>
                  <span className="room-building-label">{room.buildingName} - Floor {room.floorNumber}</span>
                </div>
                <span className={`room-status-badge ${room.status}`}>{room.status}</span>
              </div>
              
              <div className="room-body">
                <div className="occupancy-info">
                  <span>Occupancy</span>
                  <span className="occupancy-numbers">{room.currentOccupancy || 0} / {room.capacity}</span>
                </div>
                <div className="progress-bar-bg">
                  <div 
                    className={`progress-bar-fill ${(room.currentOccupancy || 0) >= room.capacity ? 'full' : ''}`} 
                    style={{ width: `${getOccupancyPercentage(room.currentOccupancy || 0, room.capacity)}%` }}
                  ></div>
                </div>
              </div>

              <div className="room-actions-grid">
                <button 
                  className="btn-icon add-student" 
                  onClick={() => handleAssignStudent(room.id || room._id, room.roomNumber)}
                  disabled={(room.currentOccupancy || 0) >= room.capacity || room.status === 'maintenance'}
                >
                  + Assign
                </button>
                <button 
                  className="btn-icon remove-student" 
                  onClick={() => handleRemoveStudent(room.id)}
                  disabled={(room.currentOccupancy || 0) <= 0}
                >
                  - Remove
                </button>
                <button className="btn-icon edit full-width" onClick={() => handleOpenEdit(room)}>
                  Edit Details
                </button>
              </div>
            </div>
          ))}
          {rooms.length === 0 && <div style={{padding: '2rem', textAlign: 'center', gridColumn: '1/-1'}}>No rooms found.</div>}
        </div>
      </div>

      {showRoomModal && (
        <div className="enterprise-modal-overlay">
          <div className="enterprise-modal">
            <div className="modal-header">
              <h3>{isEditing ? 'Edit Room Details' : 'Add New Room'}</h3>
              <button className="close-btn" onClick={() => setShowRoomModal(false)}>×</button>
            </div>
            <form onSubmit={handleSaveRoom} className="modal-form">
              <div className="form-group">
                <label>Building</label>
                <select name="buildingId" value={roomForm.buildingId} onChange={handleFormChange} required className="form-input">
                  <option value="" disabled>Select Building</option>
                  {buildings.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group-row">
                <div className="form-group">
                  <label>Room Number</label>
                  <input type="text" name="roomNumber" value={roomForm.roomNumber} onChange={handleFormChange} required className="form-input" placeholder="e.g. 101A" />
                </div>
                <div className="form-group">
                  <label>Floor Number</label>
                  <input type="number" name="floorNumber" value={roomForm.floorNumber} onChange={handleFormChange} required className="form-input" />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label>Capacity (Beds)</label>
                  <input type="number" name="capacity" value={roomForm.capacity} onChange={handleFormChange} required min="1" className="form-input" />
                </div>
              </div>

              <div className="form-group">
                <label>Amenities</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {roomForm.amenities.map((amenity, index) => (
                    <div key={index} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={amenity.name}
                        onChange={(e) => handleAmenityChange(index, 'name', e.target.value)}
                        className="form-input"
                        placeholder="Amenity name"
                      />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
                        <input
                          type="checkbox"
                          checked={amenity.isWorking}
                          onChange={(e) => handleAmenityChange(index, 'isWorking', e.target.checked)}
                        />
                        Working
                      </label>
                      {roomForm.amenities.length > 1 && (
                        <button type="button" className="btn-icon delete" onClick={() => handleRemoveAmenity(index)}>
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="btn-secondary" onClick={handleAddAmenity}>
                    + Add Amenity
                  </button>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowRoomModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Room</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageRooms;
