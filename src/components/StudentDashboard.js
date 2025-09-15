import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { FiSearch, FiMapPin, FiDollarSign, FiBriefcase, FiUser, FiLogOut, FiPlus, FiClock } from 'react-icons/fi';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [internships, setInternships] = useState([]);
  const [filteredInternships, setFilteredInternships] = useState([]);
  
  const { currentUser, userProfile, logout } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    fetchInternships();
  }, [currentUser, navigate]);

  useEffect(() => {
    setFilteredInternships(internships);
  }, [internships]);

  const fetchInternships = async () => {
    try {
      const q = query(
        collection(db, 'internships'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const internshipsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInternships(internshipsData);
    } catch (error) {
      console.error('Error fetching internships:', error);
    }
  };

  const handleLogout = async () => {
    try {
      // Immediately navigate to prevent state updates
      navigate('/login', { replace: true });
      // Then logout to clear auth state
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
      // Ensure navigation happens even if logout fails
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-primary-600">InternshipHub</h1>
              <p className="text-sm text-gray-600">Welcome back, {userProfile?.firstName || 'Student'}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2">
                <FiUser className="text-gray-400" />
                <span className="text-sm text-gray-700">{currentUser?.email}</span>
              </div>
              <Link
                to="/profile"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <FiUser className="mr-2" />
                My Profile
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                <FiLogOut className="mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  {/* Quick Action Cards */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
               onClick={() => navigate('/internships')}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiSearch className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Quick Action</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Browse Internships</h3>
            <p className="text-gray-600 text-sm mb-4">Explore available internship opportunities and apply</p>
            <div className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-center hover:bg-blue-700 transition-colors">
              Start Browsing
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
               onClick={() => navigate('/my-applications')}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <FiBriefcase className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">My Activity</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">My Applications</h3>
            <p className="text-gray-600 text-sm mb-4">Track your application status and manage submissions</p>
            <div className="w-full bg-green-600 text-white py-2 px-4 rounded-lg text-center hover:bg-green-700 transition-colors">
              View Applications
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
               onClick={() => navigate('/profile')}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiUser className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">Account</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Settings</h3>
            <p className="text-gray-600 text-sm mb-4">Update your profile, upload resume and photo</p>
            <div className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg text-center hover:bg-purple-700 transition-colors">
              Manage Profile
            </div>
          </div>
        </div>

        {/* Task Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
               onClick={() => navigate('/submit-task')}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <FiPlus className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="text-sm text-gray-500">Tasks</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Submit Task Update</h3>
            <p className="text-gray-600 text-sm mb-4">Send detailed task updates for your approved internship</p>
            <div className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg text-center hover:bg-indigo-700 transition-colors">
              Submit Now
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
               onClick={() => navigate('/my-tasks')}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-teal-100 rounded-lg">
                <FiBriefcase className="w-6 h-6 text-teal-600" />
              </div>
              <span className="text-sm text-gray-500">My Activity</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">My Task Updates</h3>
            <p className="text-gray-600 text-sm mb-4">Track your task review status, timestamps, and feedback</p>
            <div className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg text-center hover:bg-teal-700 transition-colors">
              View Tasks
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
               onClick={() => navigate('/my-attendance')}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-teal-100 rounded-lg">
                <FiClock className="w-6 h-6 text-teal-600" />
              </div>
              <span className="text-sm text-gray-500">Attendance</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">My Attendance</h3>
            <p className="text-gray-600 text-sm mb-4">Punch in/out and track approvals for your sessions</p>
            <div className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg text-center hover:bg-teal-700 transition-colors">
              Open Attendance
            </div>
          </div>
        </div>

        {/* Dashboard Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome to Your Dashboard</h2>
          <p className="text-gray-600 mb-6">Use the cards above to navigate to different sections of your internship portal.</p>
          
          {/* Recent Internships Preview */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Internship Opportunities</h3>
            {filteredInternships.slice(0, 3).length > 0 ? (
              <div className="space-y-4">
                {filteredInternships.slice(0, 3).map((internship) => (
                  <div key={internship.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{internship.title}</h4>
                        <div className="flex items-center space-x-4 mb-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <FiBriefcase className="w-4 h-4 mr-1" />
                            {internship.company}
                          </div>
                          <div className="flex items-center">
                            <FiMapPin className="w-4 h-4 mr-1" />
                            {internship.location}
                          </div>
                          {internship.salary && (
                            <div className="flex items-center">
                              <FiDollarSign className="w-4 h-4 mr-1" />
                              {internship.salary}
                            </div>
                          )}
                        </div>
                        <p className="text-gray-700 text-sm">
                          {internship.description.length > 150 
                            ? `${internship.description.substring(0, 150)}...` 
                            : internship.description}
                        </p>
                      </div>
                      <div className="ml-4">
                        <button 
                          onClick={() => navigate('/internships')}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                        >
                          View All
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <FiBriefcase className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No internships available</h3>
                <p className="mt-1 text-sm text-gray-500">Check back later for new opportunities.</p>
                <button 
                  onClick={() => navigate('/internships')}
                  className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                >
                  Browse All Internships
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
