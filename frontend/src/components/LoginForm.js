import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  ArrowRight, 
  Shield, 
  Users, 
  BarChart3,
  Zap
} from 'lucide-react';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.email, formData.password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleDemoLogin = async (email, password) => {
    setError('');
    setLoading(true);
    
    setFormData({ email, password });
    
    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="modern-auth-container">
      {/* Background with animated elements */}
      <div className="auth-background">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
          <div className="shape shape-5"></div>
        </div>
      </div>

      {/* Left Side - Branding */}
      <div className="auth-left-panel">
        <div className="brand-content">
          <div className="brand-logo">
            <div className="logo-icon">
              <Users style={{ width: '2rem', height: '2rem', color: 'white' }} />
            </div>
            <h1 className="brand-title">Mini CRM</h1>
          </div>
          
          <h2 className="welcome-title">Welcome Back!</h2>
          <p className="welcome-subtitle">
            Manage your customers and leads with ease. Build stronger relationships and grow your business.
          </p>

          <div className="feature-highlights">
            <div className="feature-item">
              <Shield style={{ width: '1.25rem', height: '1.25rem' }} />
              <span>Secure & Role-based Access</span>
            </div>
            <div className="feature-item">
              <BarChart3 style={{ width: '1.25rem', height: '1.25rem' }} />
              <span>Advanced Analytics & Reports</span>
            </div>
            <div className="feature-item">
              <Zap style={{ width: '1.25rem', height: '1.25rem' }} />
              <span>Real-time Lead Management</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="auth-right-panel">
        <div className="modern-auth-card">
          <div className="auth-header">
            <h2 className="auth-title">Sign In</h2>
            <p className="auth-subtitle">Enter your credentials to access your account</p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" />
                <input
                  type="email"
                  name="email"
                  className="modern-input"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="modern-input"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="modern-btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="btn-icon" />
                </>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          {/* Demo Account Buttons */}
          <div className="demo-accounts">
            <h4 className="demo-title">Try Demo Accounts</h4>
            <div className="demo-buttons">
              <button
                type="button"
                className="demo-btn admin-demo"
                onClick={() => handleDemoLogin('admin@minicrm.com', 'admin123')}
                disabled={loading}
              >
                <Shield size={16} />
                Admin Demo
              </button>
              <button
                type="button"
                className="demo-btn user-demo"
                onClick={() => handleDemoLogin('john@minicrm.com', 'user123')}
                disabled={loading}
              >
                <Users size={16} />
                User Demo
              </button>
            </div>
          </div>

          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">
                Create one here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;