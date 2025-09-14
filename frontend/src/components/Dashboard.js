import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Target, 
  DollarSign, 
  TrendingUp,
  Eye
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [recentLeads, setRecentLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const statsResponse = await axios.get(`${API}/dashboard/stats`);
      setStats(statsResponse.data);

      // Fetch recent customers
      const customersResponse = await axios.get(`${API}/customers?limit=5`);
      setRecentCustomers(customersResponse.data);

      // Fetch recent leads
      const leadsResponse = await axios.get(`${API}/leads`);
      setRecentLeads(leadsResponse.data.slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
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

  // Chart data for leads by status
  const chartData = {
    labels: Object.keys(stats?.leads_by_status || {}),
    datasets: [
      {
        label: 'Leads by Status',
        data: Object.values(stats?.leads_by_status || {}),
        backgroundColor: [
          '#3b82f6', // New - Blue
          '#f59e0b', // Contacted - Amber  
          '#10b981', // Converted - Green
          '#ef4444', // Lost - Red
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
        }
      },
      title: {
        display: true,
        text: 'Lead Status Distribution',
        font: {
          size: 16,
          weight: '600'
        }
      },
    },
  };

  const barChartData = {
    labels: Object.keys(stats?.leads_by_status || {}),
    datasets: [
      {
        label: 'Number of Leads',
        data: Object.values(stats?.leads_by_status || {}),
        backgroundColor: '#3b82f6',
        borderRadius: 6,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Leads by Status',
        font: {
          size: 16,
          weight: '600'
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  return (
    <div>
      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-value">{stats?.total_customers || 0}</div>
              <div className="stat-label">Total Customers</div>
            </div>
            <div style={{ padding: '0.75rem', background: '#dbeafe', borderRadius: '12px' }}>
              <Users style={{ width: '1.5rem', height: '1.5rem', color: '#3b82f6' }} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-value">{stats?.total_leads || 0}</div>
              <div className="stat-label">Total Leads</div>
            </div>
            <div style={{ padding: '0.75rem', background: '#fef3c7', borderRadius: '12px' }}>
              <Target style={{ width: '1.5rem', height: '1.5rem', color: '#d97706' }} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-value">{formatCurrency(stats?.total_value || 0)}</div>
              <div className="stat-label">Total Pipeline Value</div>
            </div>
            <div style={{ padding: '0.75rem', background: '#dcfce7', borderRadius: '12px' }}>
              <DollarSign style={{ width: '1.5rem', height: '1.5rem', color: '#16a34a' }} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-value">{stats?.leads_by_status?.Converted || 0}</div>
              <div className="stat-label">Converted Leads</div>
            </div>
            <div style={{ padding: '0.75rem', background: '#f0fdf4', borderRadius: '12px' }}>
              <TrendingUp style={{ width: '1.5rem', height: '1.5rem', color: '#16a34a' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Pie Chart */}
        <div className="chart-container">
          <div style={{ height: '300px' }}>
            <Pie data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Bar Chart */}
        <div className="chart-container">
          <div style={{ height: '300px' }}>
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Customers */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Customers</h3>
          </div>
          <div className="card-content">
            {recentCustomers.length > 0 ? (
              <div style={{ space: '1rem' }}>
                {recentCustomers.map((customer, index) => (
                  <div key={customer.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '0.75rem 0',
                    borderBottom: index < recentCustomers.length - 1 ? '1px solid #f1f5f9' : 'none'
                  }}>
                    <div>
                      <div style={{ fontWeight: '500', color: '#1e293b' }}>{customer.name}</div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{customer.company}</div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      {new Date(customer.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                No customers yet
              </div>
            )}
          </div>
        </div>

        {/* Recent Leads */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Leads</h3>
          </div>
          <div className="card-content">
            {recentLeads.length > 0 ? (
              <div style={{ space: '1rem' }}>
                {recentLeads.map((lead, index) => (
                  <div key={lead.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '0.75rem 0',
                    borderBottom: index < recentLeads.length - 1 ? '1px solid #f1f5f9' : 'none'
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '500', color: '#1e293b' }}>{lead.title}</div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        {formatCurrency(lead.value)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`status-badge ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                No leads yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;