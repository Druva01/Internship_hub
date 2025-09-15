import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  FiSearch, 
  FiMapPin, 
  FiDollarSign, 
  FiBriefcase, 
  FiUser, 
  FiLogOut, 
  FiClock,
  FiMenu,
  FiX,
  FiHome,
  FiFileText,
  FiCalendar,
  FiSettings,
  FiBell,
  FiStar,
  FiTrendingUp,
  FiActivity,
  FiChevronRight,
  FiTarget,
  FiAward,
  FiBookOpen,
  FiHeart,
  FiEye,
  FiFilter,
  FiMoreVertical
} from 'react-icons/fi';

const AdvancedStudentDashboard = () => {
  const navigate = useNavigate();
  const [internships, setInternships] = useState([]);
  const [filteredInternships, setFilteredInternships] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showNotifications, setShowNotifications] = useState(false);
  const [applications, setApplications] = useState([]);
  const [favoriteInternships, setFavoriteInternships] = useState([]);
  
  const { currentUser, userProfile, logout } = useAuth();

  // Mock data for enhanced features
  const studentStats = {
    applicationsSubmitted: 12,
    interviewsScheduled: 3,
    offersReceived: 1,
    profileViews: 45,
    skillsCompleted: 8,
    certificatesEarned: 2
  };

  const notifications = [
    { id: 1, type: 'application', message: 'Your application for Software Engineer was reviewed', time: '2 hours ago', read: false },
    { id: 2, type: 'interview', message: 'Interview scheduled for tomorrow at 2 PM', time: '1 day ago', read: false },
    { id: 3, type: 'offer', message: 'Congratulations! You received an offer', time: '3 days ago', read: true }
  ];

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiHome, badge: null },
    { id: 'browse', label: 'Browse Internships', icon: FiBriefcase, badge: internships.length },
    { id: 'applications', label: 'My Applications', icon: FiFileText, badge: applications.filter(app => app.status === 'pending').length },
    { id: 'schedule', label: 'Schedule', icon: FiCalendar, badge: 2 },
    { id: 'skills', label: 'Skills & Learning', icon: FiBookOpen, badge: 3 },
    { id: 'profile', label: 'Profile', icon: FiUser, badge: null },
    { id: 'settings', label: 'Settings', icon: FiSettings, badge: null }
  ];

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    const loadData = async () => {
      await fetchInternships();
      await fetchApplications();
    };
    
    loadData();
  }, [currentUser, navigate]);

  useEffect(() => {
    const filtered = internships.filter(internship => {
      const matchesSearch = 
        internship.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        internship.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        internship.location?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || internship.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
    setFilteredInternships(filtered);
  }, [internships, searchTerm, selectedCategory]);

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

  const fetchApplications = async () => {
    try {
      const q = query(
        collection(db, 'applications'),
        where('applicantId', '==', currentUser?.uid || ''),
        orderBy('appliedAt', 'desc')
      );
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

  const toggleFavorite = (internshipId) => {
    setFavoriteInternships(prev => 
      prev.includes(internshipId) 
        ? prev.filter(id => id !== internshipId)
        : [...prev, internshipId]
    );
  };

  // Dashboard Overview Component
  const DashboardOverview = () => (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {userProfile?.name || 'Student'}! 👋</h1>
          <p className="text-blue-100 text-lg">Ready to explore new opportunities today?</p>
          <div className="mt-6 flex flex-wrap gap-4">
            <button
              onClick={() => setActiveSection('browse')}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-200 transform hover:scale-105"
            >
              Browse Internships
            </button>
            <button
              onClick={() => setActiveSection('applications')}
              className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200"
            >
              View Applications
            </button>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 w-40 h-40 bg-white opacity-5 rounded-full"></div>
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white opacity-5 rounded-full"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Applications Submitted</p>
              <p className="text-3xl font-bold text-blue-600">{studentStats.applicationsSubmitted}</p>
              <div className="flex items-center mt-2 text-green-600">
                <FiTrendingUp className="mr-1" />
                <span className="text-sm font-medium">+23% this month</span>
              </div>
            </div>
            <div className="p-4 bg-blue-100 rounded-xl">
              <FiFileText className="text-2xl text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Interviews Scheduled</p>
              <p className="text-3xl font-bold text-purple-600">{studentStats.interviewsScheduled}</p>
              <div className="flex items-center mt-2 text-purple-600">
                <FiCalendar className="mr-1" />
                <span className="text-sm font-medium">2 this week</span>
              </div>
            </div>
            <div className="p-4 bg-purple-100 rounded-xl">
              <FiCalendar className="text-2xl text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Offers Received</p>
              <p className="text-3xl font-bold text-green-600">{studentStats.offersReceived}</p>
              <div className="flex items-center mt-2 text-green-600">
                <FiAward className="mr-1" />
                <span className="text-sm font-medium">Congratulations!</span>
              </div>
            </div>
            <div className="p-4 bg-green-100 rounded-xl">
              <FiAward className="text-2xl text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Profile Views</p>
              <p className="text-3xl font-bold text-orange-600">{studentStats.profileViews}</p>
              <div className="flex items-center mt-2 text-orange-600">
                <FiEye className="mr-1" />
                <span className="text-sm font-medium">+15 this week</span>
              </div>
            </div>
            <div className="p-4 bg-orange-100 rounded-xl">
              <FiEye className="text-2xl text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Skills Completed</p>
              <p className="text-3xl font-bold text-indigo-600">{studentStats.skillsCompleted}</p>
              <div className="flex items-center mt-2 text-indigo-600">
                <FiTarget className="mr-1" />
                <span className="text-sm font-medium">2 more to goal</span>
              </div>
            </div>
            <div className="p-4 bg-indigo-100 rounded-xl">
              <FiTarget className="text-2xl text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Certificates Earned</p>
              <p className="text-3xl font-bold text-pink-600">{studentStats.certificatesEarned}</p>
              <div className="flex items-center mt-2 text-pink-600">
                <FiStar className="mr-1" />
                <span className="text-sm font-medium">Keep it up!</span>
              </div>
            </div>
            <div className="p-4 bg-pink-100 rounded-xl">
              <FiStar className="text-2xl text-pink-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <FiActivity className="mr-2 text-blue-500" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setActiveSection('browse')}
              className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl transition-all duration-200 group"
            >
              <FiBriefcase className="text-2xl text-blue-600 mb-2 group-hover:scale-110 transition-transform duration-200" />
              <p className="font-semibold text-blue-800">Find Internships</p>
            </button>
            <button
              onClick={() => setActiveSection('profile')}
              className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl transition-all duration-200 group"
            >
              <FiUser className="text-2xl text-purple-600 mb-2 group-hover:scale-110 transition-transform duration-200" />
              <p className="font-semibold text-purple-800">Update Profile</p>
            </button>
            <button
              onClick={() => setActiveSection('skills')}
              className="p-4 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-xl transition-all duration-200 group"
            >
              <FiBookOpen className="text-2xl text-green-600 mb-2 group-hover:scale-110 transition-transform duration-200" />
              <p className="font-semibold text-green-800">Learn Skills</p>
            </button>
            <button
              onClick={() => setActiveSection('schedule')}
              className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-xl transition-all duration-200 group"
            >
              <FiCalendar className="text-2xl text-orange-600 mb-2 group-hover:scale-110 transition-transform duration-200" />
              <p className="font-semibold text-orange-800">View Schedule</p>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <FiClock className="mr-2 text-green-500" />
            Recent Activity
          </h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-800">Applied to Software Engineer position</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-800">Completed JavaScript certification</p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-800">Interview scheduled with TechCorp</p>
                <p className="text-xs text-gray-500">3 days ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-800">Profile viewed by 5 companies</p>
                <p className="text-xs text-gray-500">1 week ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Internships */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
            <FiStar className="mr-2 text-yellow-500" />
            Featured Internships
          </h3>
          <button
            onClick={() => setActiveSection('browse')}
            className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
          >
            View All <FiChevronRight className="ml-1" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInternships.slice(0, 3).map((internship) => (
            <div key={internship.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-gray-800 text-sm">{internship.title}</h4>
                <button
                  onClick={() => toggleFavorite(internship.id)}
                  className={`p-1 rounded-full transition-colors duration-200 ${
                    favoriteInternships.includes(internship.id) 
                      ? 'text-red-500 hover:text-red-600' 
                      : 'text-gray-400 hover:text-red-500'
                  }`}
                >
                  <FiHeart className={favoriteInternships.includes(internship.id) ? 'fill-current' : ''} />
                </button>
              </div>
              <p className="text-blue-600 font-medium text-sm mb-2">{internship.company}</p>
              <div className="space-y-1 text-xs text-gray-600 mb-3">
                <div className="flex items-center">
                  <FiMapPin className="mr-2" />
                  {internship.location}
                </div>
                <div className="flex items-center">
                  <FiDollarSign className="mr-2" />
                  {internship.salary}
                </div>
              </div>
              <button
                onClick={() => navigate(`/internships/${internship.id}`)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const BrowseInternships = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Browse Internships</h2>
          <p className="text-gray-600">Discover opportunities that match your interests and skills</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search internships, companies, or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            >
              <option value="all">All Categories</option>
              <option value="Technology">Technology</option>
              <option value="Marketing">Marketing</option>
              <option value="Design">Design</option>
              <option value="Finance">Finance</option>
            </select>
            <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <FiFilter />
            </button>
          </div>
        </div>
      </div>

      {/* Internships Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInternships.map((internship) => (
          <div key={internship.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{internship.title}</h3>
                  <p className="text-blue-600 font-medium">{internship.company}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => toggleFavorite(internship.id)}
                    className={`p-2 rounded-full transition-colors duration-200 ${
                      favoriteInternships.includes(internship.id) 
                        ? 'text-red-500 bg-red-50 hover:bg-red-100' 
                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                    }`}
                  >
                    <FiHeart className={favoriteInternships.includes(internship.id) ? 'fill-current' : ''} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors duration-200">
                    <FiMoreVertical />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-gray-600">
                  <FiMapPin className="mr-2 text-sm" />
                  <span className="text-sm">{internship.location}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <FiClock className="mr-2 text-sm" />
                  <span className="text-sm">{internship.duration}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <FiDollarSign className="mr-2 text-sm" />
                  <span className="text-sm">{internship.salary}</span>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {internship.description}
              </p>

              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  internship.type === 'Remote' ? 'bg-green-100 text-green-800' :
                  internship.type === 'Hybrid' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {internship.type}
                </span>
                <button
                  onClick={() => navigate(`/internships/${internship.id}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Apply Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredInternships.length === 0 && (
        <div className="text-center py-12">
          <FiBriefcase className="mx-auto text-6xl text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Internships Found</h3>
          <p className="text-gray-600">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white shadow-xl transition-all duration-300 ease-in-out fixed h-full z-30 lg:relative lg:z-0`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <FiUser className="text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  InternHub
                </h1>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              {sidebarCollapsed ? <FiChevronRight /> : <FiX />}
            </button>
          </div>
        </div>

        {/* User Profile */}
        {!sidebarCollapsed && (
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">
                {userProfile?.name?.charAt(0) || 'S'}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{userProfile?.name || 'Student'}</p>
                <p className="text-sm text-gray-500">{userProfile?.email || currentUser?.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} p-3 rounded-lg transition-all duration-200 group ${
                  activeSection === item.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center">
                  <Icon className={`${sidebarCollapsed ? '' : 'mr-3'} ${
                    activeSection === item.id ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                  } transition-colors duration-200`} />
                  {!sidebarCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </div>
                {!sidebarCollapsed && item.badge && (
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    activeSection === item.id
                      ? 'bg-white text-blue-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : ''} p-3 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200`}
          >
            <FiLogOut className={sidebarCollapsed ? '' : 'mr-3'} />
            {!sidebarCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 mr-4"
              >
                <FiMenu />
              </button>
              <h2 className="text-2xl font-bold text-gray-800 capitalize">
                {activeSection === 'dashboard' ? 'Dashboard' : 
                 activeSection === 'browse' ? 'Browse Internships' :
                 activeSection === 'applications' ? 'My Applications' :
                 activeSection === 'skills' ? 'Skills & Learning' :
                 activeSection}
              </h2>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search Bar (hidden on mobile) */}
              <div className="relative hidden md:block">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Quick search..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200 relative"
                >
                  <FiBell />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 transform transition-all duration-200 origin-top-right">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-800">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div key={notification.id} className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 ${!notification.read ? 'bg-blue-50' : ''}`}>
                          <p className="text-sm text-gray-800">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar */}
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                {userProfile?.name?.charAt(0) || 'S'}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6">
          {activeSection === 'dashboard' && <DashboardOverview />}
          {activeSection === 'browse' && <BrowseInternships />}
          {activeSection === 'applications' && (
            <div className="text-center py-12">
              <FiFileText className="mx-auto text-6xl text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">My Applications</h3>
              <p className="text-gray-600">Application management coming soon...</p>
            </div>
          )}
          {activeSection === 'schedule' && (
            <div className="text-center py-12">
              <FiCalendar className="mx-auto text-6xl text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Schedule</h3>
              <p className="text-gray-600">Schedule management coming soon...</p>
            </div>
          )}
          {activeSection === 'skills' && (
            <div className="text-center py-12">
              <FiBookOpen className="mx-auto text-6xl text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Skills & Learning</h3>
              <p className="text-gray-600">Skills management coming soon...</p>
            </div>
          )}
          {activeSection === 'profile' && (
            <div className="text-center py-12">
              <FiUser className="mx-auto text-6xl text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Profile</h3>
              <p className="text-gray-600">Profile management coming soon...</p>
            </div>
          )}
          {activeSection === 'settings' && (
            <div className="text-center py-12">
              <FiSettings className="mx-auto text-6xl text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Settings</h3>
              <p className="text-gray-600">Settings management coming soon...</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdvancedStudentDashboard;
