import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LeadForm = ({ lead, customerId, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'New',
    value: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (lead) {
      setFormData({
        title: lead.title || '',
        description: lead.description || '',
        status: lead.status || 'New',
        value: lead.value ? lead.value.toString() : ''
      });
    }
  }, [lead]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        value: parseFloat(formData.value) || 0
      };

      if (lead) {
        // Update existing lead
        await axios.put(`${API}/leads/${lead.id}`, submitData);
      } else {
        // Create new lead
        await axios.post(`${API}/customers/${customerId}/leads`, submitData);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving lead:', error);
      setError(error.response?.data?.detail || 'Failed to save lead');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">
            {lead ? 'Edit Lead' : 'Add New Lead'}
          </h2>
          <button onClick={onCancel} className="modal-close">
            <X style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                type="text"
                name="title"
                className="form-input"
                placeholder="Enter lead title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea
                name="description"
                className="form-input"
                placeholder="Enter lead description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                required
                style={{ resize: 'vertical', minHeight: '80px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                name="status"
                className="form-select"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Converted">Converted</option>
                <option value="Lost">Lost</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Value ($) *</label>
              <input
                type="number"
                name="value"
                className="form-input"
                placeholder="Enter lead value"
                value={formData.value}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="flex gap-4 mt-4">
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner mr-2"></span>
                    Saving...
                  </>
                ) : (
                  lead ? 'Update Lead' : 'Create Lead'
                )}
              </button>
              
              <button
                type="button"
                onClick={onCancel}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LeadForm;