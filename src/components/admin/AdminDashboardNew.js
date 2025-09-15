import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  FiPlus, 
  FiUsers, 
  FiBriefcase, 
  FiSettings, 
  FiLogOut, 
  FiEdit2, 
  FiTrash2, 
  FiEye, 
  FiMapPin, 
  FiClock, 
  FiDollarSign,
  FiCalendar,
  FiMenu,
  FiX,
  FiSearch,
  FiFilter
} from 'react-icons/fi';
import { FiCheckCircle } from 'react-icons/fi';

const AdminDashboardNew = () => {
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const fetchData = useCallback(async (isMountedRef = { current: true }) => {
    if (!isMountedRef.current) return;
    
    setLoading(true);
    try {
      // Fetch internships
      const internshipsQuery = query(
        collection(db, 'internships'),
        where('createdBy', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const internshipsSnapshot = await getDocs(internshipsQuery);
      
      if (!isMountedRef.current) return;
      
      const internshipsData = internshipsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInternships(internshipsData);

      // Fetch applications for these internships
      const internshipIds = internshipsData.map(internship => internship.id);
      if (internshipIds.length > 0 && isMountedRef.current) {
        const applicationsQuery = query(
          collection(db, 'applications'),
          orderBy('appliedAt', 'desc')
        );
        const applicationsSnapshot = await getDocs(applicationsQuery);
        
        if (!isMountedRef.current) return;
        
        const applicationsData = applicationsSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(app => internshipIds.includes(app.internshipId));
        setApplications(applicationsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [currentUser.uid]);

  useEffect(() => {
    const isMountedRef = { current: true };
    
    if (!currentUser) {
      navigate('/admin/login');
      return;
    }
    
    const loadData = async () => {
      if (isMountedRef.current) {
        await fetchData(isMountedRef);
      }
    };
    
    loadData();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [currentUser, navigate, fetchData]);

  const handleDeleteInternship = async (internshipId) => {
    try {
      await deleteDoc(doc(db, 'internships', internshipId));
      setInternships(prev => prev.filter(internship => internship.id !== internshipId));
      setShowDeleteModal(false);
      alert('Internship deleted successfully!');
    } catch (error) {
      console.error('Error deleting internship:', error);
      alert('Failed to delete internship. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      // Immediately navigate to prevent state updates
      navigate('/admin/login', { replace: true });
      // Then logout to clear auth state
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
      // Ensure navigation happens even if logout fails
      navigate('/admin/login', { replace: true });
    }
  };

  const getInternshipStats = () => {
    const total = internships.length;
    const active = internships.filter(i => i.status === 'active').length;
    const closed = internships.filter(i => i.status === 'closed').length;
    const draft = internships.filter(i => i.status === 'draft').length;
    return { total, active, closed, draft };
  };

  const getApplicationStats = () => {
    const total = applications.length;
  const submitted = applications.filter(a => a.status === 'submitted').length;
  const viewed = applications.filter(a => a.status === 'viewed').length;
  const approved = applications.filter(a => a.status === 'approved').length;
  const rejected = applications.filter(a => a.status === 'rejected').length;
  return { total, submitted, viewed, approved, rejected };
  };

  const filteredInternships = internships.filter(internship => {
    const matchesSearch = internship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         internship.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         internship.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || internship.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const internshipStats = getInternshipStats();
  const applicationStats = getApplicationStats();

  const sidebarItems = [
    { name: 'Dashboard', icon: FiBriefcase, path: '/admin/dashboard', active: true },
    { name: 'Manage Internships', icon: FiBriefcase, path: '/admin/internships' },
    { name: 'Applications', icon: FiUsers, path: '/admin/applications' },
  { name: 'Task Reviews', icon: FiCheckCircle, path: '/admin/task-reviews' },
  { name: 'Attendance Reviews', icon: FiCheckCircle, path: '/admin/attendance-reviews' },
    { name: 'Settings', icon: FiSettings, path: '/admin/settings' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary-600">Admin Portal</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="mt-8">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => item.path !== '/admin/dashboard' && navigate(item.path)}
                className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 transition-colors ${
                  item.active ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600' : 'text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-semibold">
                {currentUser?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Admin</p>
              <p className="text-xs text-gray-500">{currentUser?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <FiLogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-gray-500 hover:text-gray-700 mr-4"
                >
                  <FiMenu className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate('/admin/attendance-reviews')}
                  className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Attendance Reviews
                </button>
                <button
                  onClick={() => navigate('/admin/task-reviews')}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FiCheckCircle className="w-4 h-4 mr-2" />
                  Review Tasks
                </button>
                <button
                  onClick={() => navigate('/admin/create-internship')}
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <FiPlus className="w-4 h-4 mr-2" />
                  Create Internship
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiBriefcase className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Internships</p>
                  <p className="text-2xl font-semibold text-gray-900">{internshipStats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FiUsers className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-2xl font-semibold text-gray-900">{applicationStats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <FiClock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Submitted</p>
                  <p className="text-2xl font-semibold text-gray-900">{applicationStats.submitted}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FiUsers className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-semibold text-gray-900">{applicationStats.approved}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
              </div>
              <div className="p-6">
                {applications.slice(0, 5).length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No applications yet</p>
                ) : (
                  <div className="space-y-4">
                    {applications.slice(0, 5).map(application => (
                      <div key={application.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{application.applicantName}</p>
                          <p className="text-sm text-gray-500">{application.internshipTitle}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            application.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                            application.status === 'viewed' ? 'bg-blue-100 text-blue-800' :
                            application.status === 'approved' ? 'bg-green-100 text-green-800' :
                            application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {application.status}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(application.appliedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Internship Status</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Active</span>
                    <span className="font-semibold text-green-600">{internshipStats.active}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Draft</span>
                    <span className="font-semibold text-yellow-600">{internshipStats.draft}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Closed</span>
                    <span className="font-semibold text-red-600">{internshipStats.closed}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Internships List */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Your Internships</h3>
                <button
                  onClick={() => navigate('/admin/applications')}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  View All Applications →
                </button>
              </div>
              
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 space-y-3 sm:space-y-0">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search internships..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  <p className="mt-4 text-gray-600">Loading internships...</p>
                </div>
              ) : filteredInternships.length === 0 ? (
                <div className="text-center py-8">
                  <FiBriefcase className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No internships found</h3>
                  <p className="mt-2 text-gray-600">
                    {internships.length === 0 
                      ? 'Get started by creating your first internship.' 
                      : 'Try adjusting your search criteria.'}
                  </p>
                  {internships.length === 0 && (
                    <button
                      onClick={() => navigate('/admin/create-internship')}
                      className="mt-4 flex items-center mx-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <FiPlus className="w-4 h-4 mr-2" />
                      Create First Internship
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredInternships.map(internship => {
                    const internshipApplications = applications.filter(
                      app => app.internshipId === internship.id
                    );
                    
                    return (
                      <div key={internship.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">{internship.title}</h4>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                internship.status === 'active' ? 'bg-green-100 text-green-800' :
                                internship.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {internship.status}
                              </span>
                            </div>
                            
                            <p className="text-gray-600 mb-3">{internship.company}</p>
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                              <div className="flex items-center">
                                <FiMapPin className="w-4 h-4 mr-1" />
                                {internship.location}
                              </div>
                              <div className="flex items-center">
                                <FiClock className="w-4 h-4 mr-1" />
                                {internship.duration}
                              </div>
                              {internship.salary && (
                                <div className="flex items-center">
                                  <FiDollarSign className="w-4 h-4 mr-1" />
                                  {internship.salary}
                                </div>
                              )}
                              <div className="flex items-center">
                                <FiCalendar className="w-4 h-4 mr-1" />
                                Created {new Date(internship.createdAt).toLocaleDateString()}
                              </div>
                            </div>

                            <div className="flex items-center text-sm text-gray-600">
                              <FiUsers className="w-4 h-4 mr-1" />
                              {internshipApplications.length} applications
                {internshipApplications.filter(app => app.status === 'submitted').length > 0 && (
                                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  {internshipApplications.filter(app => app.status === 'submitted').length} submitted
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => navigate(`/admin/internship/${internship.id}`)}
                              className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/admin/edit-internship/${internship.id}`)}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedInternship(internship);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedInternship && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Internship</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{selectedInternship.title}"? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedInternship(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteInternship(selectedInternship.id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboardNew;
