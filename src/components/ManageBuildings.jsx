import React, { useState, useEffect } from 'react';
import { getAllBuildings, getBuildingById, createBuilding, updateBuilding, deleteBuilding } from '../services/buildingService';
import '../styles/ManageBuildings.css';

const ManageBuildings = () => {
  const [buildings, setBuildings] = useState([]);
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [isEditingBuilding, setIsEditingBuilding] = useState(false);
  const [buildingForm, setBuildingForm] = useState({
    id: '',
    name: '',
    gender: 'male',
    floors: 1,
    grade: 0,
    description: '',
    supervisorId: '',
    location: {
      type: 'Point',
      coordinates: [31.2357, 30.0444]
    }
  });
  const [loading, setLoading] = useState(true);

  const normalizeBuilding = (building) => ({
    ...building,
    id: building?.id || building?._id || '',
  });

  useEffect(() => {
    loadBuildings();
  }, []);

  const loadBuildings = async () => {
    try {
      setLoading(true);
      const buildingsData = await getAllBuildings();
      setBuildings((Array.isArray(buildingsData) ? buildingsData : []).map(normalizeBuilding));
    } catch (error) {
      console.error('Error loading buildings:', error);
      alert('Error loading buildings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBuildingChange = (e) => {
    const { name, value } = e.target;
    setBuildingForm(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenAddBuilding = () => {
    setIsEditingBuilding(false);
    setBuildingForm({
      id: '',
      name: '',
      gender: 'male',
      floors: 1,
      grade: 0,
      description: '',
      supervisorId: '',
      location: {
        type: 'Point',
        coordinates: [31.2357, 30.0444]
      }
    });
    setShowBuildingModal(true);
  };

  const handleOpenEditBuilding = async (bld) => {
    try {
      const buildingId = bld.id || bld._id;
      const fullBuilding = await getBuildingById(buildingId);

      setIsEditingBuilding(true);
      setBuildingForm({
        id: buildingId || '',
        name: fullBuilding?.name || bld.name || '',
        gender: fullBuilding?.gender || bld.gender || 'male',
        floors: fullBuilding?.floors || bld.floors || 1,
        grade: fullBuilding?.grade || 0,
        description: fullBuilding?.description || '',
        supervisorId: fullBuilding?.supervisorId || '',
        location: {
          type: 'Point',
          coordinates: [31.2357, 30.0444]
        }
      });
      setShowBuildingModal(true);
    } catch (error) {
      console.error('Error loading building details:', error);
      alert('Error loading building details: ' + error.message);
    }
  };

  const handleSaveBuilding = async (e) => {
    e.preventDefault();
    try {
      if (isEditingBuilding) {
        const updatedBuilding = await updateBuilding(buildingForm.id, {
          name: buildingForm.name,
          gender: buildingForm.gender,
          floors: parseInt(buildingForm.floors),
          grade: buildingForm.grade,
          description: buildingForm.description,
          supervisorId: buildingForm.supervisorId
        });
        setBuildings((prev) =>
          prev.map((building) =>
            building.id === buildingForm.id
              ? normalizeBuilding({ ...building, ...updatedBuilding })
              : building
          )
        );
        alert('Building updated successfully!');
      } else {
        const createdBuilding = await createBuilding({
          name: buildingForm.name,
          gender: buildingForm.gender,
          floors: parseInt(buildingForm.floors),
          grade: parseInt(buildingForm.grade),
          description: buildingForm.description,
          supervisorId: buildingForm.supervisorId,
          location: {
            type: 'Point',
            coordinates: [
              Number(buildingForm.location.coordinates[0]),
              Number(buildingForm.location.coordinates[1]),
            ]
          }
        });
        setBuildings((prev) => [...prev, normalizeBuilding(createdBuilding)]);
        alert('Building added successfully!');
      }
      setShowBuildingModal(false);
    } catch (error) {
      console.error('Error saving building:', error);
      alert('Error saving building: ' + error.message);
    }
  };

  const handleDeleteBuilding = async (id) => {
    if (window.confirm('Are you sure you want to delete this building?')) {
      try {
        await deleteBuilding(id);
        setBuildings((prev) => prev.filter((building) => building.id !== id));
        alert('Building deleted!');
      } catch (error) {
        console.error('Error deleting building:', error);
        alert('Error deleting building: ' + error.message);
      }
    }
  };

  if (loading) {
    return <div className="admin-section"><div className="loading-state">Loading buildings...</div></div>;
  }

  return (
    <div className="admin-section">
      <div className="admin-table-panel">
        <div className="panel-header">
          <h2>Buildings Management</h2>
          <button className="btn-primary" onClick={handleOpenAddBuilding}>
            + Add New Building
          </button>
        </div>
        <div className="buildings-grid">
          {buildings.map(bld => (
            <div key={bld.id || bld._id} className="building-card">
              <div className="building-header">
                <h3>{bld.name}</h3>
                <span className={`gender-badge ${bld.gender}`}>{bld.gender}</span>
              </div>
              <div className="building-body">
                <p><strong>ID:</strong> {bld.id || bld._id || 'N/A'}</p>
                <p><strong>Floors:</strong> {bld.floors}</p>
                <p><strong>Supervisor:</strong> {bld.supervisor || 'Not Assigned'}</p>
              </div>
              <div className="building-footer">
                <button className="btn-icon edit" onClick={() => handleOpenEditBuilding(bld)}>Edit</button>
                <button className="btn-icon delete" onClick={() => handleDeleteBuilding(bld.id || bld._id)}>Delete</button>
              </div>
            </div>
          ))}
          {buildings.length === 0 && <div style={{ padding: '2rem', textAlign: 'center' }}>No buildings found.</div>}
        </div>
      </div>

      {showBuildingModal && (
        <div className="enterprise-modal-overlay">
          <div className="enterprise-modal">
            <div className="modal-header">
              <h3>{isEditingBuilding ? 'Edit Building' : 'Add New Building'}</h3>
              <button className="close-btn" onClick={() => setShowBuildingModal(false)}>×</button>
            </div>
            <form onSubmit={handleSaveBuilding} className="modal-form">
              <div className="form-group">
                <label>Building Name</label>
                <input type="text" name="name" value={buildingForm.name} onChange={handleBuildingChange} required className="form-input" placeholder="e.g. Block A" />
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label>Gender</label>
                  <select name="gender" value={buildingForm.gender} onChange={handleBuildingChange} required className="form-input">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Total Floors</label>
                  <input type="number" name="floors" value={buildingForm.floors} onChange={handleBuildingChange} required min="1" className="form-input" />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label>Grade</label>
                  <input type="number" name="grade" value={buildingForm.grade} onChange={handleBuildingChange} min="0" className="form-input" />
                </div>
                <div className="form-group">
                  <label>Supervisor ID</label>
                  <input type="text" name="supervisorId" value={buildingForm.supervisorId} onChange={handleBuildingChange} className="form-input" placeholder="Supervisor user id" />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={buildingForm.description} onChange={handleBuildingChange} rows="3" className="form-input" placeholder="Optional details..."></textarea>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowBuildingModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Building</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBuildings;
