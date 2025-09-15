import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  FiPlus, FiEdit3, FiTrash2, FiUsers, FiBriefcase, FiTrendingUp, FiLogOut, 
  FiMapPin, FiClock, FiDollarSign, FiMenu, FiX, FiEye, FiCheck, FiFileText,
  FiMail, FiPhone, FiCalendar, FiDownload, FiSearch, FiUser
} from 'react-icons/fi';
import jsPDF from 'jspdf';

const ModernAdminDashboard = () => {
  // State management
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInternship, setEditingInternship] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
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
      const q = query(
        collection(db, 'applications'),
        where('companyId', '==', currentUser.uid),
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

  const handleUpdateInternship = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateDoc(doc(db, 'internships', editingInternship.id), {
        ...editingInternship,
        updatedAt: new Date().toISOString()
      });
      
      setEditingInternship(null);
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

  const handleApplicationStatusUpdate = async (applicationId, newStatus, startDate = null) => {
    try {
      const updateData = {
        status: newStatus,
        updatedAt: new Date().toISOString()
      };

      if (startDate) {
        updateData.startDate = startDate;
      }

      await updateDoc(doc(db, 'applications', applicationId), updateData);
      fetchApplications();
      
      if (newStatus === 'approved' && startDate) {
        // Generate offer letter
        generateOfferLetter(selectedApplication, startDate);
      }
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const generateOfferLetter = (application, startDate) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    
    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INTERNSHIP OFFER LETTER', pageWidth / 2, 30, { align: 'center' });
    
    // Company info
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${userProfile?.company || 'Company Name'}`, 20, 60);
    pdf.text(`${currentUser.email}`, 20, 70);
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 80);
    
    // Applicant info
    pdf.text(`Dear ${application.applicantName},`, 20, 100);
    
    // Body
    const bodyText = `
We are pleased to offer you an internship position at ${userProfile?.company || 'our company'}.

Position: ${application.internshipTitle}
Start Date: ${new Date(startDate).toLocaleDateString()}
Company: ${application.companyName}

We believe your skills and enthusiasm will be valuable additions to our team.

Please confirm your acceptance by replying to this offer.

Sincerely,
${userProfile?.firstName} ${userProfile?.lastName}
${userProfile?.jobTitle || 'HR Manager'}
${userProfile?.company || 'Company Name'}
    `;
    
    const lines = pdf.splitTextToSize(bodyText, pageWidth - 40);
    pdf.text(lines, 20, 120);
    
    // Save the PDF
    pdf.save(`offer-letter-${application.applicantName.replace(/\s+/g, '-')}.pdf`);
  };

  const generateJoiningLetter = (application) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    
    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('JOINING LETTER', pageWidth / 2, 30, { align: 'center' });
    
    // Company info
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${userProfile?.company || 'Company Name'}`, 20, 60);
    pdf.text(`${currentUser.email}`, 20, 70);
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 80);
    
    // Body
    const bodyText = `
Dear ${application.applicantName},

Welcome to ${userProfile?.company || 'our company'}!

We are excited to have you join our team as an intern for the position of ${application.internshipTitle}.

Joining Details:
- Position: ${application.internshipTitle}
- Start Date: ${new Date(application.startDate).toLocaleDateString()}
- Reporting Manager: ${userProfile?.firstName} ${userProfile?.lastName}
- Contact: ${currentUser.email}

Please bring the following documents on your first day:
1. Government-issued ID
2. Educational certificates
3. Resume
4. Passport-size photographs

We look forward to working with you!

Best regards,
${userProfile?.firstName} ${userProfile?.lastName}
${userProfile?.jobTitle || 'HR Manager'}
${userProfile?.company || 'Company Name'}
    `;
    
    const lines = pdf.splitTextToSize(bodyText, pageWidth - 40);
    pdf.text(lines, 20, 100);
    
    // Save the PDF
    pdf.save(`joining-letter-${application.applicantName.replace(/\s+/g, '-')}.pdf`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const sidebarItems = [
    { id: 'overview', name: 'Overview', icon: FiTrendingUp },
    { id: 'internships', name: 'Manage Internships', icon: FiBriefcase },
    { id: 'applications', name: 'Applications', icon: FiUsers },
    { id: 'analytics', name: 'Analytics', icon: FiTrendingUp },
  ];

  const stats = [
    {
      title: 'Total Internships',
      value: internships.length,
      icon: FiBriefcase,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Total Applications',
      value: applications.length,
      icon: FiUsers,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'Pending Reviews',
      value: applications.filter(app => app.status === 'pending').length,
      icon: FiClock,
      color: 'bg-yellow-500',
      change: '+5%'
    },
    {
      title: 'Approved',
      value: applications.filter(app => app.status === 'approved').length,
      icon: FiCheck,
      color: 'bg-purple-500',
      change: '+15%'
    }
  ];

  const filteredApplications = applications.filter(app =>
    app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.internshipTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-lg transition-all duration-300 ease-in-out`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
        
        <nav className="mt-8">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                activeSection === item.id ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600' : 'text-gray-700'
              }`}
            >
              <item.icon className={`w-5 h-5 ${sidebarOpen ? 'mr-3' : 'mx-auto'}`} />
              {sidebarOpen && <span className="font-medium">{item.name}</span>}
            </button>
          ))}
        </nav>

        {sidebarOpen && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {userProfile?.firstName?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {userProfile?.firstName} {userProfile?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{userProfile?.company}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full mt-3 flex items-center justify-center px-3 py-2 text-sm text-gray-700 hover:text-red-600 transition-colors"
              >
                <FiLogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {sidebarItems.find(item => item.id === activeSection)?.name || 'Dashboard'}
              </h2>
              <p className="text-gray-600">Manage your internship programs</p>
            </div>
            {activeSection === 'internships' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <FiPlus className="w-4 h-4 mr-2" />
                Add Internship
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                        <p className="text-sm text-green-600 mt-1">{stat.change} from last month</p>
                      </div>
                      <div className={`${stat.color} rounded-lg p-3`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Applications</h3>
                <div className="space-y-4">
                  {applications.slice(0, 5).map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <FiUser className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{app.applicantName}</p>
                          <p className="text-sm text-gray-600">{app.internshipTitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          app.status === 'approved' ? 'bg-green-100 text-green-800' :
                          app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {app.status}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedApplication(app);
                            setShowApplicationModal(true);
                          }}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Internships Management Section */}
          {activeSection === 'internships' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {internships.map((internship) => (
                  <div key={internship.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{internship.title}</h3>
                        <p className="text-gray-600">{internship.company}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingInternship(internship)}
                          className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                        >
                          <FiEdit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteInternship(internship.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <FiMapPin className="w-4 h-4 mr-2" />
                        {internship.location}
                      </div>
                      <div className="flex items-center">
                        <FiClock className="w-4 h-4 mr-2" />
                        {internship.type}
                      </div>
                      {internship.salary && (
                        <div className="flex items-center">
                          <FiDollarSign className="w-4 h-4 mr-2" />
                          {internship.salary}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        internship.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {internship.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {applications.filter(app => app.internshipId === internship.id).length} applications
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Applications Section */}
          {activeSection === 'applications' && (
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search applications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Applications List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Applicant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Position
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Applied Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredApplications.map((app) => (
                        <tr key={app.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                                <span className="text-primary-600 font-medium">
                                  {app.applicantName.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{app.applicantName}</div>
                                <div className="text-sm text-gray-500">{app.applicantEmail}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{app.internshipTitle}</div>
                            <div className="text-sm text-gray-500">{app.companyName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(app.appliedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              app.status === 'approved' ? 'bg-green-100 text-green-800' :
                              app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => {
                                setSelectedApplication(app);
                                setShowApplicationModal(true);
                              }}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                            {app.status === 'approved' && (
                              <>
                                <button
                                  onClick={() => generateOfferLetter(app, app.startDate)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  <FiDownload className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => generateJoiningLetter(app)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <FiFileText className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Application Detail Modal */}
      {showApplicationModal && selectedApplication && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-xl bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Application Details</h3>
              <button
                onClick={() => setShowApplicationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Applicant Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Applicant Information</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Name</label>
                    <p className="text-gray-900">{selectedApplication.applicantName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900">{selectedApplication.applicantEmail}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-gray-900">{selectedApplication.applicantPhone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">University</label>
                    <p className="text-gray-900">{selectedApplication.university}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Major</label>
                    <p className="text-gray-900">{selectedApplication.major}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Graduation Year</label>
                    <p className="text-gray-900">{selectedApplication.graduationYear}</p>
                  </div>
                </div>
              </div>

              {/* Application Details */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Application Details</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Position</label>
                    <p className="text-gray-900">{selectedApplication.internshipTitle}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Applied Date</label>
                    <p className="text-gray-900">{new Date(selectedApplication.appliedAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Cover Letter</label>
                    <p className="text-gray-900 text-sm">{selectedApplication.coverLetter}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Skills</label>
                    <p className="text-gray-900 text-sm">{selectedApplication.skills}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Experience</label>
                    <p className="text-gray-900 text-sm">{selectedApplication.experience || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Availability</label>
                    <p className="text-gray-900 text-sm">{selectedApplication.availability}</p>
                  </div>
                  {selectedApplication.portfolio && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Portfolio</label>
                      <a href={selectedApplication.portfolio} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 text-sm">
                        View Portfolio
                      </a>
                    </div>
                  )}
                  {selectedApplication.resume && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Resume</label>
                      <a href={selectedApplication.resume} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 text-sm">
                        View Resume
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status Update Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-600 mr-3">Current Status:</span>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    selectedApplication.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    selectedApplication.status === 'approved' ? 'bg-green-100 text-green-800' :
                    selectedApplication.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedApplication.status}
                  </span>
                </div>
                
                {selectedApplication.status === 'pending' && (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleApplicationStatusUpdate(selectedApplication.id, 'rejected')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        const startDate = prompt('Enter start date (YYYY-MM-DD):');
                        if (startDate) {
                          handleApplicationStatusUpdate(selectedApplication.id, 'approved', startDate);
                        }
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Approve & Set Start Date
                    </button>
                  </div>
                )}

                {selectedApplication.status === 'approved' && (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => generateOfferLetter(selectedApplication, selectedApplication.startDate)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <FiDownload className="w-4 h-4 mr-2" />
                      Download Offer Letter
                    </button>
                    <button
                      onClick={() => generateJoiningLetter(selectedApplication)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                    >
                      <FiFileText className="w-4 h-4 mr-2" />
                      Download Joining Letter
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Internship Modal */}
      {(showAddModal || editingInternship) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-xl bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingInternship ? 'Edit Internship' : 'Add New Internship'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingInternship(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={editingInternship ? handleUpdateInternship : handleAddInternship} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                  <input
                    type="text"
                    required
                    value={editingInternship ? editingInternship.title : newInternship.title}
                    onChange={(e) => 
                      editingInternship 
                        ? setEditingInternship({...editingInternship, title: e.target.value})
                        : setNewInternship({...newInternship, title: e.target.value})
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Software Engineering Intern"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company *</label>
                  <input
                    type="text"
                    required
                    value={editingInternship ? editingInternship.company : newInternship.company}
                    onChange={(e) => 
                      editingInternship 
                        ? setEditingInternship({...editingInternship, company: e.target.value})
                        : setNewInternship({...newInternship, company: e.target.value})
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Company name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                  <input
                    type="text"
                    required
                    value={editingInternship ? editingInternship.location : newInternship.location}
                    onChange={(e) => 
                      editingInternship 
                        ? setEditingInternship({...editingInternship, location: e.target.value})
                        : setNewInternship({...newInternship, location: e.target.value})
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., New York, NY"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                  <select
                    value={editingInternship ? editingInternship.type : newInternship.type}
                    onChange={(e) => 
                      editingInternship 
                        ? setEditingInternship({...editingInternship, type: e.target.value})
                        : setNewInternship({...newInternship, type: e.target.value})
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                    value={editingInternship ? editingInternship.duration : newInternship.duration}
                    onChange={(e) => 
                      editingInternship 
                        ? setEditingInternship({...editingInternship, duration: e.target.value})
                        : setNewInternship({...newInternship, duration: e.target.value})
                    }
                    placeholder="e.g., 3 months"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary</label>
                  <input
                    type="text"
                    value={editingInternship ? editingInternship.salary : newInternship.salary}
                    onChange={(e) => 
                      editingInternship 
                        ? setEditingInternship({...editingInternship, salary: e.target.value})
                        : setNewInternship({...newInternship, salary: e.target.value})
                    }
                    placeholder="e.g., $1500/month"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  required
                  rows={4}
                  value={editingInternship ? editingInternship.description : newInternship.description}
                  onChange={(e) => 
                    editingInternship 
                      ? setEditingInternship({...editingInternship, description: e.target.value})
                      : setNewInternship({...newInternship, description: e.target.value})
                  }
                  placeholder="Describe the internship role, responsibilities, and what the intern will learn..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
                <textarea
                  rows={3}
                  value={editingInternship ? editingInternship.requirements : newInternship.requirements}
                  onChange={(e) => 
                    editingInternship 
                      ? setEditingInternship({...editingInternship, requirements: e.target.value})
                      : setNewInternship({...newInternship, requirements: e.target.value})
                  }
                  placeholder="List the required skills, education, and experience..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Application Deadline</label>
                  <input
                    type="date"
                    value={editingInternship ? editingInternship.applicationDeadline : newInternship.applicationDeadline}
                    onChange={(e) => 
                      editingInternship 
                        ? setEditingInternship({...editingInternship, applicationDeadline: e.target.value})
                        : setNewInternship({...newInternship, applicationDeadline: e.target.value})
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={editingInternship ? editingInternship.startDate : newInternship.startDate}
                    onChange={(e) => 
                      editingInternship 
                        ? setEditingInternship({...editingInternship, startDate: e.target.value})
                        : setNewInternship({...newInternship, startDate: e.target.value})
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingInternship(null);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingInternship ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    <>
                      {editingInternship ? 'Update Internship' : 'Add Internship'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernAdminDashboard;
