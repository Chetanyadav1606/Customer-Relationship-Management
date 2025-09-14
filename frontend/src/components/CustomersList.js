import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Mail,
  Phone,
  Building2
} from 'lucide-react';
import CustomerForm from './CustomerForm';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CustomersList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, searchTerm]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/customers`, {
        params: {
          skip: currentPage * limit,
          limit,
          search: searchTerm
        }
      });
      setCustomers(response.data);
      
      // Calculate total pages (simplified - in real app you'd get total count from API)
      const isLastPage = response.data.length < limit;
      if (isLastPage) {
        setTotalPages(currentPage + 1);
      } else {
        setTotalPages(currentPage + 2); // At least one more page
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = () => {
    setEditingCustomer(null);
    setShowForm(true);
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer? This will also delete all associated leads.')) {
      return;
    }

    try {
      await axios.delete(`${API}/customers/${customerId}`);
      fetchCustomers(); // Refresh the list
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Failed to delete customer');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCustomer(null);
    fetchCustomers();
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(0); // Reset to first page when searching
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  if (loading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
        <div className="loading-spinner" style={{ width: '2rem', height: '2rem' }}></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="search-filters">
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{ 
              position: 'absolute', 
              left: '0.75rem', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              width: '1rem', 
              height: '1rem', 
              color: '#9ca3af' 
            }} />
            <input
              type="text"
              placeholder="Search customers..."
              className="search-input"
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
        
        <button
          onClick={handleCreateCustomer}
          className="btn-primary"
          style={{ whiteSpace: 'nowrap', marginLeft: '1rem' }}
        >
          <Plus style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
          Add Customer
        </button>
      </div>

      {error && (
        <div className="error-message mb-4">
          {error}
        </div>
      )}

      {/* Customers Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Company</th>
              <th>Contact</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>
                  <div>
                    <div style={{ fontWeight: '500' }}>{customer.name}</div>
                  </div>
                </td>
                <td>
                  <div className="flex items-center">
                    <Building2 style={{ width: '1rem', height: '1rem', color: '#64748b', marginRight: '0.5rem' }} />
                    {customer.company}
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: '0.875rem' }}>
                    <div className="flex items-center mb-1">
                      <Mail style={{ width: '0.875rem', height: '0.875rem', color: '#64748b', marginRight: '0.5rem' }} />
                      {customer.email}
                    </div>
                    <div className="flex items-center">
                      <Phone style={{ width: '0.875rem', height: '0.875rem', color: '#64748b', marginRight: '0.5rem' }} />
                      {customer.phone}
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  {new Date(customer.created_at).toLocaleDateString()}
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/customers/${customer.id}`}
                      className="btn-secondary btn-sm"
                      title="View Details"
                    >
                      <Eye style={{ width: '1rem', height: '1rem' }} />
                    </Link>
                    <button
                      onClick={() => handleEditCustomer(customer)}
                      className="btn-secondary btn-sm"
                      title="Edit Customer"
                    >
                      <Edit style={{ width: '1rem', height: '1rem' }} />
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(customer.id)}
                      className="btn-danger btn-sm"
                      title="Delete Customer"  
                    >
                      <Trash2 style={{ width: '1rem', height: '1rem' }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {customers.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            {searchTerm ? 'No customers found matching your search.' : 'No customers yet. Create your first customer!'}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
            className="pagination-btn"
          >
            Previous
          </button>
          
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => handlePageChange(index)}
              className={`pagination-btn ${currentPage === index ? 'active' : ''}`}
            >
              {index + 1}
            </button>
          ))}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}

      {/* Customer Form Modal */}
      {showForm && (
        <CustomerForm
          customer={editingCustomer}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingCustomer(null);
          }}
        />
      )}
    </div>
  );
};

export default CustomersList;