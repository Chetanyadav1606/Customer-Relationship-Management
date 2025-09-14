import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CustomerForm = ({ customer, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        company: customer.company || ''
      });
    }
  }, [customer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (customer) {
        // Update existing customer
        await axios.put(`${API}/customers/${customer.id}`, formData);
      } else {
        // Create new customer
        await axios.post(`${API}/customers`, formData);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving customer:', error);
      setError(error.response?.data?.detail || 'Failed to save customer');
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
            {customer ? 'Edit Customer' : 'Add New Customer'}
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
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                name="name"
                className="form-input"
                placeholder="Enter customer name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Company *</label>
              <input
                type="text"
                name="company"
                className="form-input"
                placeholder="Enter company name"
                value={formData.company}
                onChange={handleChange}
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
                  customer ? 'Update Customer' : 'Create Customer'
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

export default CustomerForm;