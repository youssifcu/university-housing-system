import React, { useState, useEffect } from 'react';
import '../styles/ManageRooms.css';

const ManageRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]); // Needed for the dropdown
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [roomForm, setRoomForm] = useState({
    id: '',
    buildingId: '',
    floorNumber: 1,
    roomNumber: '',
    capacity: 2,
    currentOccupancy: 0,
    status: 'available'
  });

  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    // Mock buildings for the dropdown
    const mockBuildings = [
      { id: 'bld-1', name: 'Block A (Engineering)' },
      { id: 'bld-2', name: 'Block B (Medical)' }
    ];
    setBuildings(mockBuildings);

    // Mock rooms
    setRooms([
      { id: 'rm-1', buildingId: 'bld-1', buildingName: 'Block A', floorNumber: 1, roomNumber: '101A', capacity: 4, currentOccupancy: 2, status: 'available' },
      { id: 'rm-2', buildingId: 'bld-1', buildingName: 'Block A', floorNumber: 2, roomNumber: '205B', capacity: 2, currentOccupancy: 2, status: 'full' },
      { id: 'rm-3', buildingId: 'bld-2', buildingName: 'Block B', floorNumber: 1, roomNumber: '102', capacity: 3, currentOccupancy: 0, status: 'maintenance' }
    ]);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setRoomForm(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setRoomForm({ id: '', buildingId: buildings[0]?.id || '', floorNumber: 1, roomNumber: '', capacity: 2, currentOccupancy: 0, status: 'available' });
    setShowRoomModal(true);
  };

  const handleOpenEdit = (room) => {
    setIsEditing(true);
    setRoomForm({ ...room });
    setShowRoomModal(true);
  };

  const handleSaveRoom = (e) => {
    e.preventDefault();
    const selectedBuilding = buildings.find(b => b.id === roomForm.buildingId);
    
    if (isEditing) {
      setRooms(rooms.map(r => r.id === roomForm.id ? { ...roomForm, buildingName: selectedBuilding?.name || 'Unknown' } : r));
      alert('Room updated successfully (Mock)!');
    } else {
      const newRoom = { ...roomForm, id: `rm-${Date.now()}`, buildingName: selectedBuilding?.name || 'Unknown' };
      setRooms([...rooms, newRoom]);
      alert('Room added successfully (Mock)!');
    }
    setShowRoomModal(false);
  };

  // Maps to PATCH /api/rooms/:id/assign
  const handleAssignStudent = (roomId) => {
    setRooms(rooms.map(room => {
      if (room.id === roomId) {
        if (room.currentOccupancy >= room.capacity) {
          alert("Room is already full!");
          return room;
        }
        const newOccupancy = room.currentOccupancy + 1;
        return { 
          ...room, 
          currentOccupancy: newOccupancy,
          status: newOccupancy >= room.capacity ? 'full' : room.status
        };
      }
      return room;
    }));
  };

  // Maps to PATCH /api/rooms/:id/remove-student
  const handleRemoveStudent = (roomId) => {
    setRooms(rooms.map(room => {
      if (room.id === roomId) {
        if (room.currentOccupancy <= 0) return room;
        const newOccupancy = room.currentOccupancy - 1;
        return { 
          ...room, 
          currentOccupancy: newOccupancy,
          status: room.status === 'full' ? 'available' : room.status
        };
      }
      return room;
    }));
  };

  const getOccupancyPercentage = (current, capacity) => {
    return (current / capacity) * 100;
  };

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
                  <span className="occupancy-numbers">{room.currentOccupancy} / {room.capacity}</span>
                </div>
                <div className="progress-bar-bg">
                  <div 
                    className={`progress-bar-fill ${room.currentOccupancy >= room.capacity ? 'full' : ''}`} 
                    style={{ width: `${getOccupancyPercentage(room.currentOccupancy, room.capacity)}%` }}
                  ></div>
                </div>
              </div>

              <div className="room-actions-grid">
                <button 
                  className="btn-icon add-student" 
                  onClick={() => handleAssignStudent(room.id)}
                  disabled={room.currentOccupancy >= room.capacity || room.status === 'maintenance'}
                >
                  + Assign
                </button>
                <button 
                  className="btn-icon remove-student" 
                  onClick={() => handleRemoveStudent(room.id)}
                  disabled={room.currentOccupancy <= 0}
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
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={roomForm.status} onChange={handleFormChange} required className="form-input">
                    <option value="available">Available</option>
                    <option value="full">Full</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
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