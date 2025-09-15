import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { FiUserPlus, FiArrowLeft } from 'react-icons/fi';

const QuickAdminSetup = () => {
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const { signup } = useAuth();

  const createTestAdmin = async () => {
    setLoading(true);
    try {
      const testEmail = 'admin@test.com';
      const testPassword = 'admin123';
      
      const userData = {
        firstName: 'Test',
        lastName: 'Admin',
        company: 'Test Company',
        jobTitle: 'HR Manager',
        phoneNumber: '+1234567890',
        role: 'admin',
        isApproved: true
      };

      await signup(testEmail, testPassword, userData);
      setCredentials({ email: testEmail, password: testPassword });
      setCreated(true);
    } catch (error) {
      console.error('Error creating test admin:', error);
      if (error.code === 'auth/email-already-in-use') {
        setCredentials({ email: 'admin@test.com', password: 'admin123' });
        setCreated(true);
      } else {
        alert('Error creating admin: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (created && credentials) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-left mb-6">
            <Link 
              to="/" 
              className="inline-flex items-center text-green-600 hover:text-green-700 transition-colors"
            >
              <FiArrowLeft className="mr-2" />
              Back to Home
            </Link>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiUserPlus className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Account Ready!</h2>
            <p className="text-gray-600 mb-8">Your test admin account has been created. Use these credentials to log in:</p>
            
            <div className="bg-gray-50 p-6 rounded-lg mb-6 text-left">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email:</label>
                <div className="flex items-center justify-between bg-white p-3 rounded border">
                  <span className="font-mono text-sm">{credentials.email}</span>
                  <button 
                    onClick={() => navigator.clipboard.writeText(credentials.email)}
                    className="text-blue-500 hover:text-blue-600 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password:</label>
                <div className="flex items-center justify-between bg-white p-3 rounded border">
                  <span className="font-mono text-sm">{credentials.password}</span>
                  <button 
                    onClick={() => navigator.clipboard.writeText(credentials.password)}
                    className="text-blue-500 hover:text-blue-600 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <Link 
                to="/admin/login"
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors block"
              >
                Go to Admin Login
              </Link>
              
              <Link 
                to="/admin/register"
                className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 py-3 px-4 rounded-lg font-semibold transition-colors block"
              >
                Create Another Admin
              </Link>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This is a development utility. In production, use the regular admin registration process.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-left mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Back to Home
          </Link>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiUserPlus className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Admin Setup</h2>
          <p className="text-gray-600 mb-8">
            Create a test admin account instantly to get started with the admin panel.
          </p>
          
          <button
            onClick={createTestAdmin}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {loading ? 'Creating Admin Account...' : 'Create Test Admin Account'}
          </button>
          
          <div className="text-sm text-gray-500 space-y-2">
            <p>This will create an admin account with:</p>
            <ul className="text-left list-disc list-inside space-y-1">
              <li>Email: admin@test.com</li>
              <li>Password: admin123</li>
              <li>Full admin privileges</li>
            </ul>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">
              Already have an admin account?
            </p>
            <div className="space-y-2">
              <Link 
                to="/admin/login"
                className="w-full border border-indigo-600 text-indigo-600 hover:bg-indigo-50 py-2 px-4 rounded-lg font-medium transition-colors block"
              >
                Admin Login
              </Link>
              <Link 
                to="/admin/register"
                className="w-full text-gray-600 hover:text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors block"
              >
                Create New Admin
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickAdminSetup;