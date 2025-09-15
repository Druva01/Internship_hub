import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { FiUsers, FiCheckCircle, FiXCircle, FiEye, FiMail, FiPhone, FiBook, FiCalendar, FiArrowLeft, FiSearch, FiFilter, FiDownload } from 'react-icons/fi';
import jsPDF from 'jspdf';

const AdminApplications = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      // Get all internships created by this admin
      const internshipsQuery = query(
        collection(db, 'internships'),
        where('createdBy', '==', currentUser.uid)
      );
      const internshipsSnapshot = await getDocs(internshipsQuery);
      const internshipIds = internshipsSnapshot.docs.map(doc => doc.id);

      if (internshipIds.length === 0) {
        setApplications([]);
        setLoading(false);
        return;
      }

      // Get applications for these internships
      const applicationsQuery = query(
        collection(db, 'applications'),
        orderBy('appliedAt', 'desc')
      );
      const applicationsSnapshot = await getDocs(applicationsQuery);
      
      const applicationsData = applicationsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(app => internshipIds.includes(app.internshipId));

      setApplications(applicationsData);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser.uid]);

  const filterApplications = useCallback(() => {
    let filtered = applications;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.internshipTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.applicantEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredApplications(filtered);
  }, [applications, statusFilter, searchTerm]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/admin/login');
      return;
    }
    fetchApplications();
  }, [currentUser, navigate, fetchApplications]);

  useEffect(() => {
    filterApplications();
  }, [filterApplications]);

  const handleStatusUpdate = async (applicationId, newStatus, rejectionReason = '', extra = {}) => {
    // Guard: prevent invalid transitions
    const current = applications.find(a => a.id === applicationId) || (selectedApplication?.id === applicationId ? selectedApplication : null);
    const currentStatus = current?.status;
    if (currentStatus === 'approved' && newStatus === 'rejected') {
      alert('This application is already approved and cannot be rejected.');
      return;
    }
    if (currentStatus === 'rejected' && newStatus === 'approved') {
      alert('This application is already rejected and cannot be approved.');
      return;
    }

    setUpdating(applicationId);
    
    try {
      const updateData = {
        status: newStatus,
        statusUpdatedAt: new Date().toISOString(),
        statusUpdatedBy: currentUser.uid,
        ...extra
      };

      if (rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }

      await updateDoc(doc(db, 'applications', applicationId), updateData);

      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { ...app, ...updateData }
          : app
      ));

      // If viewing details, update selected application
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication(prev => ({ ...prev, ...updateData }));
      }

      const msg = newStatus === 'approved'
        ? 'Application approved successfully.'
        : newStatus === 'rejected'
          ? 'Application rejected successfully.'
          : newStatus === 'viewed'
            ? 'Application marked as viewed.'
            : `Application updated: ${newStatus}.`;
      alert(msg);
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('Failed to update application status. Please try again.');
    } finally {
      setUpdating(null);
    }
  };

  const handleApproveWithStartDate = async (applicationId) => {
    // Ask for start date (optional). Accept formats parseable by Date.
    const input = prompt('Enter start date for the candidate (optional, e.g., 2025-10-01):');
    let extra = {};
    if (input) {
      const d = new Date(input);
      if (!isNaN(d.getTime())) {
        extra.startDate = d.toISOString();
      } else {
        alert('Invalid date. Approval will proceed without setting a start date.');
      }
    }
    await handleStatusUpdate(applicationId, 'approved', '', extra);
  };

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'submitted':
        return <FiCalendar className="w-4 h-4 text-yellow-500" />;
      case 'approved':
        return <FiCheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <FiXCircle className="w-4 h-4 text-red-500" />;
      case 'viewed':
        return <FiEye className="w-4 h-4 text-blue-500" />;
      default:
        return <FiCalendar className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'viewed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getApplicationStats = () => {
    const stats = {
      total: applications.length,
  submitted: applications.filter(app => app.status === 'submitted').length,
  approved: applications.filter(app => app.status === 'approved').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
  viewed: applications.filter(app => app.status === 'viewed').length
    };
    return stats;
  };

  const stats = getApplicationStats();

  // Helpers
  const toJSDate = (value) => {
    if (!value) return null;
    try {
      if (typeof value.toDate === 'function') return value.toDate();
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  };

  const generateOfferLetter = (application) => {
    const pdf = new jsPDF();
    const startDate = toJSDate(application.startDate);
    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INTERNSHIP OFFER LETTER', 20, 30);
    // Date
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 50);
    // Greeting
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Dear ${application.applicantName || 'Candidate'},`, 20, 70);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('We are pleased to offer you an internship position with our organization.', 20, 90);
    // Details
    pdf.setFont('helvetica', 'bold');
    pdf.text('Position Details:', 20, 110);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Position: ${application.internshipTitle || ''}`, 20, 125);
    pdf.text(`Company: ${application.companyName || 'Our Company'}`, 20, 140);
    if (startDate) {
      pdf.text(`Start Date: ${startDate.toLocaleDateString()}`, 20, 155);
    }
    // Footer
    pdf.setFont('helvetica', 'bold');
    pdf.text('Congratulations and welcome to the team!', 20, 180);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Best regards,', 20, 195);
    pdf.text('HR Department', 20, 205);
    pdf.text(application.companyName || 'Our Company', 20, 215);
    const nameSlug = (application.applicantName || 'candidate').replace(/\s+/g, '-');
    pdf.save(`offer-letter-${nameSlug}.pdf`);
  };

  const generateJoiningLetter = (application) => {
    const pdf = new jsPDF();
    const startDate = toJSDate(application.startDate);
    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INTERNSHIP JOINING LETTER', 20, 30);
    // Date
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 50);
    // Greeting
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`To: ${application.applicantName || 'Candidate'}`, 20, 70);
    // Body
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`We are pleased to confirm your joining as an intern for the role of ${application.internshipTitle || ''}.`, 20, 90);
    if (startDate) {
      pdf.text(`Please report on ${startDate.toLocaleDateString()} to begin your internship.`, 20, 105);
    }
    pdf.text('Kindly bring a valid ID and any required documents as communicated.', 20, 120);
    // Footer
    pdf.setFont('helvetica', 'bold');
    pdf.text('Welcome aboard!', 20, 145);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Regards,', 20, 160);
    pdf.text('HR Department', 20, 170);
    pdf.text(application.companyName || 'Our Company', 20, 180);
    const nameSlug = (application.applicantName || 'candidate').replace(/\s+/g, '-');
    pdf.save(`joining-letter-${nameSlug}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <FiArrowLeft className="mr-2" />
                Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Manage Applications</h1>
            </div>
            <div className="text-sm text-gray-600">
              {filteredApplications.length} of {applications.length} applications
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <FiUsers className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <FiCalendar className="w-8 h-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Submitted</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.submitted}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <FiCheckCircle className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.approved}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <FiXCircle className="w-8 h-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.rejected}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <FiEye className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Viewed</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.viewed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search applications..."
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
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="viewed">Viewed</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No applications found</h3>
            <p className="mt-2 text-gray-600">
              {applications.length === 0 
                ? 'No applications received yet.' 
                : 'Try adjusting your search criteria.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredApplications.map((application) => (
              <div key={application.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {application.applicantName}
                        </h3>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(application.status)}`}>
                          <div className="flex items-center">
                            {getStatusIcon(application.status)}
                            <span className="ml-1 capitalize">{application.status}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6 mb-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <FiMail className="w-4 h-4 mr-1" />
                          {application.applicantEmail}
                        </div>
                        {application.applicantPhone && (
                          <div className="flex items-center">
                            <FiPhone className="w-4 h-4 mr-1" />
                            {application.applicantPhone}
                          </div>
                        )}
                        <div className="flex items-center">
                          <FiBook className="w-4 h-4 mr-1" />
                          {application.university || 'Not provided'}
                        </div>
                        <div className="flex items-center">
                          <FiCalendar className="w-4 h-4 mr-1" />
                          Applied: {new Date(application.appliedAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Position:</strong> {application.internshipTitle}
                        </p>
                        {application.major && (
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Major:</strong> {application.major}
                          </p>
                        )}
                        {application.graduationYear && (
                          <p className="text-sm text-gray-600">
                            <strong>Graduation Year:</strong> {application.graduationYear}
                          </p>
                        )}
                      </div>

                      {application.coverLetter && (
                        <p className="text-gray-700 mb-4 leading-relaxed">
                          {application.coverLetter.length > 200 
                            ? `${application.coverLetter.substring(0, 200)}...` 
                            : application.coverLetter}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleViewDetails(application)}
                      className="flex items-center px-4 py-2 text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                    >
                      <FiEye className="w-4 h-4 mr-2" />
                      View Full Details
                    </button>
                    
                    <div className="flex items-center space-x-2">
          {application.status === 'submitted' ? (
                        <>
                          <button
            onClick={() => handleStatusUpdate(application.id, 'viewed')}
                            disabled={updating === application.id}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
            <FiEye className="w-4 h-4 mr-2" />
            {updating === application.id ? 'Updating...' : 'Mark Viewed'}
                          </button>
                          <button
            onClick={() => handleApproveWithStartDate(application.id)}
                            disabled={updating === application.id}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            <FiCheckCircle className="w-4 h-4 mr-2" />
                            {updating === application.id ? 'Updating...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Please provide a reason for rejection (optional):');
                              handleStatusUpdate(application.id, 'rejected', reason || '');
                            }}
                            disabled={updating === application.id}
                            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                          >
                            <FiXCircle className="w-4 h-4 mr-2" />
                            {updating === application.id ? 'Updating...' : 'Reject'}
                          </button>
                        </>
          ) : application.status === 'viewed' ? (
                        <>
                          <button
            onClick={() => handleApproveWithStartDate(application.id)}
                            disabled={updating === application.id}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            <FiCheckCircle className="w-4 h-4 mr-2" />
                            {updating === application.id ? 'Updating...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Please provide a reason for rejection (optional):');
                              handleStatusUpdate(application.id, 'rejected', reason || '');
                            }}
                            disabled={updating === application.id}
                            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                          >
                            <FiXCircle className="w-4 h-4 mr-2" />
                            {updating === application.id ? 'Updating...' : 'Reject'}
                          </button>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">
                          Status: {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          {application.statusUpdatedAt && (
                            <> on {new Date(application.statusUpdatedAt).toLocaleDateString()}</>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Application Details Modal */}
      {showDetailsModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedApplication.applicantName}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Application for {selectedApplication.internshipTitle}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedApplication.status)}`}>
                  <div className="flex items-center">
                    {getStatusIcon(selectedApplication.status)}
                    <span className="ml-1 capitalize">{selectedApplication.status}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <FiMail className="w-4 h-4 mr-2 text-gray-400" />
                      <a href={`mailto:${selectedApplication.applicantEmail}`} className="text-primary-600 hover:text-primary-700">
                        {selectedApplication.applicantEmail}
                      </a>
                    </div>
                    {selectedApplication.applicantPhone && (
                      <div className="flex items-center">
                        <FiPhone className="w-4 h-4 mr-2 text-gray-400" />
                        <a href={`tel:${selectedApplication.applicantPhone}`} className="text-primary-600 hover:text-primary-700">
                          {selectedApplication.applicantPhone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Education</h3>
                  <div className="space-y-2 text-sm">
                    {selectedApplication.university && (
                      <p><strong>University:</strong> {selectedApplication.university}</p>
                    )}
                    {selectedApplication.major && (
                      <p><strong>Major:</strong> {selectedApplication.major}</p>
                    )}
                    {selectedApplication.graduationYear && (
                      <p><strong>Graduation Year:</strong> {selectedApplication.graduationYear}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Application Timeline</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Applied:</strong> {new Date(selectedApplication.appliedAt).toLocaleString()}</p>
                  {selectedApplication.statusUpdatedAt && (
                    <p><strong>Status Updated:</strong> {new Date(selectedApplication.statusUpdatedAt).toLocaleString()}</p>
                  )}
                  {selectedApplication.availableStartDate && (
                    <p><strong>Available Start Date:</strong> {new Date(selectedApplication.availableStartDate).toLocaleDateString()}</p>
                  )}
                  {selectedApplication.startDate && (
                    <p><strong>Confirmed Start Date:</strong> {new Date(selectedApplication.startDate).toLocaleDateString()}</p>
                  )}
                </div>
              </div>

              {selectedApplication.coverLetter && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Cover Letter</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedApplication.coverLetter}
                    </p>
                  </div>
                </div>
              )}

              {selectedApplication.whyInterested && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Why Interested</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedApplication.whyInterested}
                    </p>
                  </div>
                </div>
              )}

              {selectedApplication.relevantExperience && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Relevant Experience</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedApplication.relevantExperience}
                    </p>
                  </div>
                </div>
              )}

              {selectedApplication.profile && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Additional Profile Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    {selectedApplication.profile.bio && (
                      <div>
                        <strong className="text-gray-900">Bio:</strong>
                        <p className="text-gray-700 mt-1">{selectedApplication.profile.bio}</p>
                      </div>
                    )}
                    {selectedApplication.profile.skills && (
                      <div>
                        <strong className="text-gray-900">Skills:</strong>
                        <p className="text-gray-700 mt-1">{selectedApplication.profile.skills}</p>
                      </div>
                    )}
                    {selectedApplication.profile.experience && (
                      <div>
                        <strong className="text-gray-900">Experience:</strong>
                        <p className="text-gray-700 mt-1">{selectedApplication.profile.experience}</p>
                      </div>
                    )}
                    {selectedApplication.profile.linkedinUrl && (
                      <div>
                        <strong className="text-gray-900">LinkedIn:</strong>
                        <a 
                          href={selectedApplication.profile.linkedinUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-primary-600 hover:text-primary-700 ml-2"
                        >
                          {selectedApplication.profile.linkedinUrl}
                        </a>
                      </div>
                    )}
                    {selectedApplication.profile.portfolioUrl && (
                      <div>
                        <strong className="text-gray-900">Portfolio:</strong>
                        <a 
                          href={selectedApplication.profile.portfolioUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-primary-600 hover:text-primary-700 ml-2"
                        >
                          {selectedApplication.profile.portfolioUrl}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedApplication.rejectionReason && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Rejection Reason</h3>
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <p className="text-red-700">{selectedApplication.rejectionReason}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-between">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedApplication(null);
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              
      {selectedApplication.status === 'submitted' && (
                <div className="flex space-x-2">
                  <button
        onClick={() => handleStatusUpdate(selectedApplication.id, 'viewed')}
                    disabled={updating === selectedApplication.id}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <FiEye className="w-4 h-4 mr-2" />
        Mark Viewed
                  </button>
                  <button
        onClick={() => handleApproveWithStartDate(selectedApplication.id)}
                    disabled={updating === selectedApplication.id}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    <FiCheckCircle className="w-4 h-4 mr-2" />
        Approve
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Please provide a reason for rejection (optional):');
                      handleStatusUpdate(selectedApplication.id, 'rejected', reason || '');
                    }}
                    disabled={updating === selectedApplication.id}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    <FiXCircle className="w-4 h-4 mr-2" />
                    Reject
                  </button>
                </div>
              )}

      {selectedApplication.status === 'approved' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => generateOfferLetter(selectedApplication)}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <FiDownload className="w-4 h-4 mr-2" />
                    Offer Letter
                  </button>
                  <button
                    onClick={() => generateJoiningLetter(selectedApplication)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FiDownload className="w-4 h-4 mr-2" />
                    Joining Letter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApplications;
