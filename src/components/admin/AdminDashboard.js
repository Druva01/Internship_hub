import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { FiPlus, FiEdit3, FiTrash2, FiEye, FiUsers, FiBriefcase, FiTrendingUp, FiLogOut, FiMapPin, FiClock, FiDollarSign, FiHome, FiSettings, FiHelpCircle, FiMenu, FiX, FiSearch, FiFilter, FiMoreVertical } from 'react-icons/fi';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInternship, setEditingInternship] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [newInternship, setNewInternship] = useState({
    title: '',
    company: '',
    location: '',
    type: 'Full-time',
    duration: '',
    salary: '',
    description: '',
    requirements: '',
    benefits: '',
    applicationDeadline: '',
    startDate: '',
    category: 'Technology'
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/admin/login');
      return;
    }
    fetchInternships();
    fetchApplications();
  }, [currentUser, navigate]);

  const fetchInternships = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'internships'),
        where('createdBy', '==', currentUser.uid),
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
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const q = query(collection(db, 'applications'));
      const querySnapshot = await getDocs(q);
      const applicationsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setApplications(applicationsData);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleAddInternship = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const internshipData = {
        ...newInternship,
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        status: 'active',
        applicationsCount: 0,
        companyInfo: {
          name: userProfile?.company || newInternship.company,
          email: currentUser.email
        }
      };

      await addDoc(collection(db, 'internships'), internshipData);
      
      // Reset form
      setNewInternship({
        title: '',
        company: '',
        location: '',
        type: 'Full-time',
        duration: '',
        salary: '',
        description: '',
        requirements: '',
        benefits: '',
        applicationDeadline: '',
        startDate: '',
        category: 'Technology'
      });
      
      setShowAddModal(false);
      fetchInternships();
    } catch (error) {
      console.error('Error adding internship:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditInternship = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const internshipRef = doc(db, 'internships', editingInternship.id);
      await updateDoc(internshipRef, {
        ...newInternship,
        updatedAt: new Date().toISOString(),
      });
      
      setShowEditModal(false);
      setEditingInternship(null);
      setNewInternship({
        title: '',
        company: '',
        location: '',
        type: 'Full-time',
        duration: '',
        salary: '',
        description: '',
        requirements: '',
        benefits: '',
        applicationDeadline: '',
        startDate: '',
        category: 'Technology'
      });
      fetchInternships();
    } catch (error) {
      console.error('Error updating internship:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInternship = async (id) => {
    if (window.confirm('Are you sure you want to delete this internship?')) {
      try {
        await deleteDoc(doc(db, 'internships', id));
        fetchInternships();
      } catch (error) {
        console.error('Error deleting internship:', error);
      }
    }
  };

  const openEditModal = (internship) => {
    setEditingInternship(internship);
    setNewInternship({
      title: internship.title,
      company: internship.company,
      location: internship.location,
      type: internship.type,
      duration: internship.duration || '',
      salary: internship.salary || '',
      description: internship.description,
      requirements: internship.requirements || '',
      benefits: internship.benefits || '',
      applicationDeadline: internship.applicationDeadline || '',
      startDate: internship.startDate || '',
      category: internship.category || 'Technology'
    });
    setShowEditModal(true);
  };

  const filteredInternships = internships.filter(internship => {
    const matchesSearch = internship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         internship.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || internship.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const stats = [
    {
      title: 'Total Internships',
      value: internships.length,
      icon: FiBriefcase,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Applications',
      value: applications.filter(app => 
        internships.some(intern => intern.id === app.internshipId)
      ).length,
      icon: FiUsers,
      color: 'bg-green-500'
    },
    {
      title: 'Active Positions',
      value: internships.filter(intern => intern.status === 'active').length,
      icon: FiTrendingUp,
      color: 'bg-purple-500'
    },
    {
      title: 'This Month',
      value: internships.filter(intern => {
        const created = new Date(intern.createdAt);
        const now = new Date();
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      }).length,
      icon: FiClock,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0 transition-transform duration-300 ease-in-out`}>
        <div className="flex items-center justify-between h-16 px-6 bg-gray-800">
          <div className="flex items-center">
            <FiBriefcase className="w-8 h-8 text-blue-400" />
            <span className="ml-2 text-xl font-bold text-white">InternHub</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-300 hover:text-white"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="mt-8">
          <div className="px-4 space-y-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'overview' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              <FiHome className="mr-3 w-5 h-5" />
              Overview
            </button>
            
            <button
              onClick={() => setActiveTab('internships')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'internships' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              <FiBriefcase className="mr-3 w-5 h-5" />
              Manage Internships
            </button>
            
            <button
              onClick={() => setActiveTab('applications')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'applications' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              <FiUsers className="mr-3 w-5 h-5" />
              Applications
            </button>
            
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'settings' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              <FiSettings className="mr-3 w-5 h-5" />
              Settings
            </button>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-700">
            <div className="px-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {userProfile?.firstName?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">
                    {userProfile?.firstName} {userProfile?.lastName}
                  </p>
                  <p className="text-xs text-gray-400">{userProfile?.company}</p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="mt-4 w-full flex items-center px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FiLogOut className="mr-3 w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-0">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-gray-500 hover:text-gray-900"
                >
                  <FiMenu className="w-6 h-6" />
                </button>
                <div className="ml-4 lg:ml-0">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {activeTab === 'overview' && 'Dashboard Overview'}
                    {activeTab === 'internships' && 'Manage Internships'}
                    {activeTab === 'applications' && 'Applications'}
                    {activeTab === 'settings' && 'Settings'}
                  </h1>
                  <p className="text-sm text-gray-600">Welcome back, {userProfile?.firstName || 'Admin'}</p>
                </div>
              </div>
              
              {activeTab === 'internships' && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <FiPlus className="mr-2 w-4 h-4" />
                  Add Internship
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Search and Filter Bar for Internships */}
          {activeTab === 'internships' && (
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search internships..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center">
                      <div className={`${stat.color} rounded-lg p-3`}>
                        <stat.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="bg-white shadow-sm rounded-xl border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Internships</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {internships.slice(0, 5).map((internship) => (
                    <div key={internship.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{internship.title}</p>
                          <p className="text-sm text-gray-600">{internship.location} • {internship.type}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            internship.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {internship.status}
                          </span>
                          <div className="text-sm text-gray-500">
                            {new Date(internship.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Internships Tab */}
          {activeTab === 'internships' && (
            <div className="space-y-6">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading internships...</span>
                </div>
              ) : filteredInternships.length === 0 ? (
                <div className="text-center py-12">
                  <FiBriefcase className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No internships found</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating a new internship.</p>
                  <div className="mt-6">
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <FiPlus className="mr-2" />
                      Add Internship
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredInternships.map((internship) => (
                    <div key={internship.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {internship.title}
                            </h3>
                            <p className="text-sm text-gray-600">{internship.company}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              internship.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : internship.status === 'inactive'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {internship.status}
                            </span>
                            <div className="relative">
                              <button className="p-1 text-gray-400 hover:text-gray-600">
                                <FiMoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <FiMapPin className="mr-2 w-4 h-4" />
                            {internship.location}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <FiClock className="mr-2 w-4 h-4" />
                            {internship.type}
                          </div>
                          {internship.salary && (
                            <div className="flex items-center text-sm text-gray-600">
                              <FiDollarSign className="mr-2 w-4 h-4" />
                              {internship.salary}
                            </div>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                          {internship.description}
                        </p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">{internship.applicationsCount || 0}</span> applications
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openEditModal(internship)}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <FiEdit3 className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteInternship(internship.id)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="mt-3 text-xs text-gray-400">
                          Created: {new Date(internship.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <div className="space-y-6">
              <div className="bg-white shadow-sm rounded-xl border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {applications
                    .filter(app => internships.some(intern => intern.id === app.internshipId))
                    .map((application) => {
                      const internship = internships.find(intern => intern.id === application.internshipId);
                      return (
                        <div key={application.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {application.applicantName}
                              </p>
                              <p className="text-sm text-gray-600">
                                Applied for: {internship?.title}
                              </p>
                              <p className="text-sm text-gray-500">
                                Email: {application.email}
                              </p>
                            </div>
                            <div className="ml-4">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                application.status === 'pending' 
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : application.status === 'accepted'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {application.status || 'pending'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company Name</label>
                    <p className="mt-1 text-sm text-gray-900">{userProfile?.company}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{currentUser?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Job Title</label>
                    <p className="mt-1 text-sm text-gray-900">{userProfile?.jobTitle}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Internship Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-2xl rounded-xl bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Add New Internship</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleAddInternship} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                    <input
                      type="text"
                      required
                      value={newInternship.title}
                      onChange={(e) => setNewInternship({...newInternship, title: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Software Development Intern"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company *</label>
                    <input
                      type="text"
                      required
                      value={newInternship.company}
                      onChange={(e) => setNewInternship({...newInternship, company: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Tech Corp Inc."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                    <input
                      type="text"
                      required
                      value={newInternship.location}
                      onChange={(e) => setNewInternship({...newInternship, location: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., New York, NY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={newInternship.type}
                      onChange={(e) => setNewInternship({...newInternship, type: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                    <input
                      type="text"
                      value={newInternship.duration}
                      onChange={(e) => setNewInternship({...newInternship, duration: e.target.value})}
                      placeholder="e.g., 3 months"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Salary</label>
                    <input
                      type="text"
                      value={newInternship.salary}
                      onChange={(e) => setNewInternship({...newInternship, salary: e.target.value})}
                      placeholder="e.g., $1500/month"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    required
                    rows={4}
                    value={newInternship.description}
                    onChange={(e) => setNewInternship({...newInternship, description: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the internship role and responsibilities..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
                  <textarea
                    rows={3}
                    value={newInternship.requirements}
                    onChange={(e) => setNewInternship({...newInternship, requirements: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="List the required skills and qualifications..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Application Deadline</label>
                    <input
                      type="date"
                      value={newInternship.applicationDeadline}
                      onChange={(e) => setNewInternship({...newInternship, applicationDeadline: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={newInternship.startDate}
                      onChange={(e) => setNewInternship({...newInternship, startDate: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Creating...' : 'Create Internship'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Internship Modal */}
      {showEditModal && editingInternship && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-2xl rounded-xl bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Edit Internship</h3>
                <button
                  onClick={() => {setShowEditModal(false); setEditingInternship(null);}}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleEditInternship} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                    <input
                      type="text"
                      required
                      value={newInternship.title}
                      onChange={(e) => setNewInternship({...newInternship, title: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company *</label>
                    <input
                      type="text"
                      required
                      value={newInternship.company}
                      onChange={(e) => setNewInternship({...newInternship, company: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                    <input
                      type="text"
                      required
                      value={newInternship.location}
                      onChange={(e) => setNewInternship({...newInternship, location: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={newInternship.type}
                      onChange={(e) => setNewInternship({...newInternship, type: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                    <input
                      type="text"
                      value={newInternship.duration}
                      onChange={(e) => setNewInternship({...newInternship, duration: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Salary</label>
                    <input
                      type="text"
                      value={newInternship.salary}
                      onChange={(e) => setNewInternship({...newInternship, salary: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    required
                    rows={4}
                    value={newInternship.description}
                    onChange={(e) => setNewInternship({...newInternship, description: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
                  <textarea
                    rows={3}
                    value={newInternship.requirements}
                    onChange={(e) => setNewInternship({...newInternship, requirements: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {setShowEditModal(false); setEditingInternship(null);}}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Updating...' : 'Update Internship'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
