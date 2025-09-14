import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Building2, 
  Calendar,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Target
} from 'lucide-react';
import LeadForm from './LeadForm';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CustomerDetail = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (id) {
      fetchCustomerData();
    }
  }, [id]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      
      // Fetch customer details
      const customerResponse = await axios.get(`${API}/customers/${id}`);
      setCustomer(customerResponse.data);

      // Fetch customer leads
      const leadsResponse = await axios.get(`${API}/customers/${id}/leads`);
      setLeads(leadsResponse.data);

    } catch (error) {
      console.error('Error fetching customer data:', error);
      setError('Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = () => {
    setEditingLead(null);
    setShowLeadForm(true);
  };

  const handleEditLead = (lead) => {
    setEditingLead(lead);
    setShowLeadForm(true);
  };

  const handleDeleteLead = async (leadId) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) {
      return;
    }

    try {
      await axios.delete(`${API}/leads/${leadId}`);
      fetchCustomerData(); // Refresh data
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Failed to delete lead');
    }
  };

  const handleLeadFormSuccess = () => {
    setShowLeadForm(false);
    setEditingLead(null);
    fetchCustomerData();
  };

  const getStatusColor = (status) => {
    const colors = {
      'New': 'status-new',
      'Contacted': 'status-contacted', 
      'Converted': 'status-converted',
      'Lost': 'status-lost'
    };
    return colors[status] || 'status-new';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredLeads = statusFilter 
    ? leads.filter(lead => lead.status === statusFilter)
    : leads;

  const totalLeadValue = leads.reduce((sum, lead) => sum + (lead.value || 0), 0);
  const convertedLeads = leads.filter(lead => lead.status === 'Converted');
  const convertedValue = convertedLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
        <div className="loading-spinner" style={{ width: '2rem', height: '2rem' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        {error}
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center" style={{ padding: '3rem', color: '#64748b' }}>
        Customer not found
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/customers" className="btn-secondary">
          <ArrowLeft style={{ width: '1rem', height: '1rem' }} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.25rem' }}>
            {customer.name}
          </h1>
          <p style={{ color: '#64748b' }}>{customer.company}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Customer Info */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Customer Information</h3>
          </div>
          <div className="card-content">
            <div style={{ space: '1rem' }}>
              <div className="flex items-center gap-3" style={{ marginBottom: '1rem' }}>
                <Mail style={{ width: '1.25rem', height: '1.25rem', color: '#64748b' }} />
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Email</div>
                  <div style={{ fontWeight: '500' }}>{customer.email}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3" style={{ marginBottom: '1rem' }}>
                <Phone style={{ width: '1.25rem', height: '1.25rem', color: '#64748b' }} />
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Phone</div>
                  <div style={{ fontWeight: '500' }}>{customer.phone}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3" style={{ marginBottom: '1rem' }}>
                <Building2 style={{ width: '1.25rem', height: '1.25rem', color: '#64748b' }} />
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Company</div>
                  <div style={{ fontWeight: '500' }}>{customer.company}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar style={{ width: '1.25rem', height: '1.25rem', color: '#64748b' }} />
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Customer Since</div>
                  <div style={{ fontWeight: '500' }}>
                    {new Date(customer.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lead Stats */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Lead Statistics</h3>
          </div>
          <div className="card-content">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>
                  {leads.length}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Total Leads</div>
              </div>
              
              <div style={{ textAlign: 'center', padding: '1rem', background: '#f0fdf4', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16a34a' }}>
                  {convertedLeads.length}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Converted</div>
              </div>
              
              <div style={{ textAlign: 'center', padding: '1rem', background: '#fef3c7', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#d97706' }}>
                  {formatCurrency(totalLeadValue)}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Total Value</div>
              </div>
              
              <div style={{ textAlign: 'center', padding: '1rem', background: '#dcfce7', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#16a34a' }}>
                  {formatCurrency(convertedValue)}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Converted Value</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leads Section */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="card-title">Leads & Opportunities</h3>
            <button onClick={handleCreateLead} className="btn-primary">
              <Plus style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
              Add Lead
            </button>
          </div>
        </div>
        
        <div className="card-content">
          {/* Status Filter */}
          <div className="mb-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
              style={{ width: 'auto' }}
            >
              <option value="">All Status</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Converted">Converted</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          {/* Leads Table */}
          {filteredLeads.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Value</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id}>
                      <td>
                        <div style={{ fontWeight: '500' }}>{lead.title}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.875rem', color: '#64748b', maxWidth: '200px' }}>
                          {lead.description}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td style={{ fontWeight: '500' }}>
                        {formatCurrency(lead.value)}
                      </td>
                      <td style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditLead(lead)}
                            className="btn-secondary btn-sm"
                            title="Edit Lead"
                          >
                            <Edit style={{ width: '1rem', height: '1rem' }} />
                          </button>
                          <button
                            onClick={() => handleDeleteLead(lead.id)}
                            className="btn-danger btn-sm"
                            title="Delete Lead"
                          >
                            <Trash2 style={{ width: '1rem', height: '1rem' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>
              {statusFilter ? `No leads with status "${statusFilter}"` : 'No leads yet. Create the first lead!'}
            </div>
          )}
        </div>
      </div>

      {/* Lead Form Modal */}
      {showLeadForm && (
        <LeadForm
          lead={editingLead}
          customerId={id}
          onSuccess={handleLeadFormSuccess}
          onCancel={() => {
            setShowLeadForm(false);
            setEditingLead(null);
          }}
        />
      )}
    </div>
  );
};

export default CustomerDetail;