import React, { useState, useEffect } from 'react';
import '../styles/ManageBuildings.css';     

const ManageBuildings = () => {
  const [buildings, setBuildings] = useState([]);
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [isEditingBuilding, setIsEditingBuilding] = useState(false);
  const [buildingForm, setBuildingForm] = useState({ id: '', name: '', gender: 'male', floors: 1, description: '' });

  useEffect(() => {
    loadMockBuildings();
  }, []);

  const loadMockBuildings = () => {
    setBuildings([
      { id: 'bld-1', name: 'Block A (Engineering)', gender: 'male', floors: 5, description: 'Main building for senior engineering students.' },
      { id: 'bld-2', name: 'Block B (Medical)', gender: 'female', floors: 4, description: 'Close to the medical campus.' }
    ]);
  };

  const handleBuildingChange = (e) => {
    const { name, value } = e.target;
    setBuildingForm(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenAddBuilding = () => {
    setIsEditingBuilding(false);
    setBuildingForm({ id: '', name: '', gender: 'male', floors: 1, description: '' });
    setShowBuildingModal(true);
  };

  const handleOpenEditBuilding = (bld) => {
    setIsEditingBuilding(true);
    setBuildingForm({ ...bld });
    setShowBuildingModal(true);
  };

  const handleSaveBuilding = (e) => {
    e.preventDefault();
    if (isEditingBuilding) {
      setBuildings(buildings.map(b => b.id === buildingForm.id ? buildingForm : b));
      alert('Building updated successfully!');
    } else {
      const newBld = { ...buildingForm, id: `bld-${Date.now()}` };
      setBuildings([...buildings, newBld]);
      alert('Building added successfully!');
    }
    setShowBuildingModal(false);
  };

  const handleDeleteBuilding = (id) => {
    if (window.confirm('Are you sure you want to delete this building?')) {
      setBuildings(buildings.filter(b => b.id !== id));
      alert('Building deleted!');
    }
  };

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
            <div key={bld.id} className="building-card">
              <div className="building-header">
                <h3>{bld.name}</h3>
                <span className={`gender-badge ${bld.gender}`}>{bld.gender}</span>
              </div>
              <div className="building-body">
                <p><strong>Floors:</strong> {bld.floors}</p>
                <p className="building-desc">{bld.description || 'No description provided.'}</p>
              </div>
              <div className="building-footer">
                <button className="btn-icon edit" onClick={() => handleOpenEditBuilding(bld)}>Edit</button>
                <button className="btn-icon delete" onClick={() => handleDeleteBuilding(bld.id)}>Delete</button>
              </div>
            </div>
          ))}
          {buildings.length === 0 && <div style={{padding: '2rem', textAlign: 'center'}}>No buildings found.</div>}
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