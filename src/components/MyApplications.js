import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import jsPDF from 'jspdf';
import { FiArrowLeft, FiClock, FiCheckCircle, FiXCircle, FiEye, FiDownload, FiCalendar, FiBriefcase, FiMail, FiPhone } from 'react-icons/fi';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStartDateModal, setShowStartDateModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [updatingStartDate, setUpdatingStartDate] = useState(false);
  
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    fetchApplications();
  }, [currentUser, navigate]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'applications'),
        where('applicantId', '==', currentUser.uid),
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
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiClock className="w-5 h-5 text-yellow-500" />;
      case 'accepted':
        return <FiCheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <FiXCircle className="w-5 h-5 text-red-500" />;
      case 'interview':
        return <FiEye className="w-5 h-5 text-blue-500" />;
      default:
        return <FiClock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'interview':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
  };

  const handleStartDateSubmit = async () => {
    if (!selectedApplication || !startDate) return;

    setUpdatingStartDate(true);
    try {
      await updateDoc(doc(db, 'applications', selectedApplication.id), {
        startDate: startDate,
        startDateConfirmed: true,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === selectedApplication.id 
          ? { ...app, startDate, startDateConfirmed: true }
          : app
      ));

      setShowStartDateModal(false);
      setStartDate('');
      alert('Start date confirmed successfully!');
    } catch (error) {
      console.error('Error updating start date:', error);
      alert('Failed to update start date. Please try again.');
    } finally {
      setUpdatingStartDate(false);
    }
  };

  const generateOfferLetter = (application) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let yPosition = 30;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('INTERNSHIP OFFER LETTER', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 20;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, yPosition);
    
    yPosition += 20;
    // Recipient details
    doc.setFont('helvetica', 'bold');
    doc.text('Dear ' + application.applicantName + ',', margin, yPosition);
    
    yPosition += 15;
    doc.setFont('helvetica', 'normal');
    doc.text('We are pleased to offer you an internship position at ' + application.company + '.', margin, yPosition);
    
    yPosition += 20;
    // Position details
    doc.setFont('helvetica', 'bold');
    doc.text('Position Details:', margin, yPosition);
    yPosition += 10;
    doc.setFont('helvetica', 'normal');
    doc.text('Position: ' + application.internshipTitle, margin, yPosition);
    yPosition += 8;
    doc.text('Company: ' + application.company, margin, yPosition);
    yPosition += 8;
    if (application.startDate) {
      doc.text('Start Date: ' + new Date(application.startDate).toLocaleDateString(), margin, yPosition);
      yPosition += 8;
    }
    
    yPosition += 15;
    // Terms and conditions
    doc.setFont('helvetica', 'bold');
    doc.text('Terms and Conditions:', margin, yPosition);
    yPosition += 10;
    doc.setFont('helvetica', 'normal');
    
    const terms = [
      '• This internship is for educational purposes and professional development.',
      '• You will be expected to maintain professional conduct at all times.',
      '• Regular attendance and punctuality are required.',
      '• Confidentiality of company information must be maintained.',
      '• A completion certificate will be provided upon successful completion.'
    ];
    
    terms.forEach(term => {
      doc.text(term, margin, yPosition);
      yPosition += 8;
    });
    
    yPosition += 15;
    doc.text('We look forward to having you join our team.', margin, yPosition);
    
    yPosition += 15;
    doc.text('Best regards,', margin, yPosition);
    yPosition += 8;
    doc.text('HR Department', margin, yPosition);
    yPosition += 8;
    doc.text(application.company, margin, yPosition);
    
    // Footer
    yPosition = doc.internal.pageSize.height - 30;
    doc.setFontSize(10);
    doc.text('This is an automatically generated document.', pageWidth / 2, yPosition, { align: 'center' });
    
    doc.save(`${application.company}_Offer_Letter_${application.applicantName.replace(/\s+/g, '_')}.pdf`);
  };

  const generateJoiningLetter = (application) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let yPosition = 30;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('INTERNSHIP JOINING LETTER', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 20;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, yPosition);
    
    yPosition += 20;
    // Welcome message
    doc.setFont('helvetica', 'bold');
    doc.text('Welcome to ' + application.company + '!', margin, yPosition);
    
    yPosition += 15;
    doc.setFont('helvetica', 'normal');
    doc.text('Dear ' + application.applicantName + ',', margin, yPosition);
    
    yPosition += 10;
    doc.text('Welcome to ' + application.company + '. We are excited to have you join our team as an intern.', margin, yPosition);
    
    yPosition += 20;
    // Joining details
    doc.setFont('helvetica', 'bold');
    doc.text('Joining Details:', margin, yPosition);
    yPosition += 10;
    doc.setFont('helvetica', 'normal');
    doc.text('Name: ' + application.applicantName, margin, yPosition);
    yPosition += 8;
    doc.text('Position: ' + application.internshipTitle, margin, yPosition);
    yPosition += 8;
    doc.text('Department: ' + application.company, margin, yPosition);
    yPosition += 8;
    if (application.startDate) {
      doc.text('Joining Date: ' + new Date(application.startDate).toLocaleDateString(), margin, yPosition);
      yPosition += 8;
    }
    doc.text('Email: ' + application.applicantEmail, margin, yPosition);
    yPosition += 8;
    if (application.applicantPhone) {
      doc.text('Phone: ' + application.applicantPhone, margin, yPosition);
      yPosition += 8;
    }
    if (application.university) {
      doc.text('University: ' + application.university, margin, yPosition);
      yPosition += 8;
    }
    
    yPosition += 15;
    // Instructions
    doc.setFont('helvetica', 'bold');
    doc.text('First Day Instructions:', margin, yPosition);
    yPosition += 10;
    doc.setFont('helvetica', 'normal');
    
    const instructions = [
      '• Report to the HR department at 9:00 AM on your joining date.',
      '• Bring original documents for verification (ID, University letter, etc.).',
      '• Dress code: Business casual.',
      '• Bring a notebook and pen for orientation.',
      '• Contact HR at hr@' + application.company.toLowerCase().replace(/\s+/g, '') + '.com for any queries.'
    ];
    
    instructions.forEach(instruction => {
      doc.text(instruction, margin, yPosition);
      yPosition += 8;
    });
    
    yPosition += 15;
    doc.text('We look forward to your contributions and wish you a successful internship.', margin, yPosition);
    
    yPosition += 15;
    doc.text('Best regards,', margin, yPosition);
    yPosition += 8;
    doc.text('HR Department', margin, yPosition);
    yPosition += 8;
    doc.text(application.company, margin, yPosition);
    
    // Footer
    yPosition = doc.internal.pageSize.height - 30;
    doc.setFontSize(10);
    doc.text('This is an automatically generated document.', pageWidth / 2, yPosition, { align: 'center' });
    
    doc.save(`${application.company}_Joining_Letter_${application.applicantName.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <FiArrowLeft className="mr-2" />
                Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
            </div>
            <div className="text-sm text-gray-600">
              {applications.length} application{applications.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12">
            <FiBriefcase className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No applications yet</h3>
            <p className="mt-2 text-gray-600">Start browsing internships to submit your first application.</p>
            <button
              onClick={() => navigate('/browse-internships')}
              className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Browse Internships
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {applications.map((application) => (
              <div key={application.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {application.internshipTitle}
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
                          <FiBriefcase className="w-4 h-4 mr-1" />
                          {application.company}
                        </div>
                        <div className="flex items-center">
                          <FiCalendar className="w-4 h-4 mr-1" />
                          Applied: {new Date(application.appliedAt).toLocaleDateString()}
                        </div>
                        {application.startDate && (
                          <div className="flex items-center">
                            <FiCalendar className="w-4 h-4 mr-1" />
                            Start Date: {new Date(application.startDate).toLocaleDateString()}
                          </div>
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
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleViewDetails(application)}
                        className="flex items-center px-4 py-2 text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                      >
                        <FiEye className="w-4 h-4 mr-2" />
                        View Details
                      </button>
                      
                      {application.status === 'accepted' && (
                        <div className="flex items-center space-x-2">
                          {!application.startDateConfirmed && (
                            <button
                              onClick={() => {
                                setSelectedApplication(application);
                                setShowStartDateModal(true);
                              }}
                              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <FiCalendar className="w-4 h-4 mr-2" />
                              Confirm Start Date
                            </button>
                          )}
                          
                          <button
                            onClick={() => generateOfferLetter(application)}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <FiDownload className="w-4 h-4 mr-2" />
                            Download Offer Letter
                          </button>
                          
                          {application.startDateConfirmed && (
                            <button
                              onClick={() => generateJoiningLetter(application)}
                              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              <FiDownload className="w-4 h-4 mr-2" />
                              Download Joining Letter
                            </button>
                          )}
                        </div>
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
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Application Details
              </h2>
              <p className="text-gray-600 mt-1">
                {selectedApplication.internshipTitle} at {selectedApplication.company}
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Personal Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <FiMail className="w-4 h-4 mr-2 text-gray-400" />
                      {selectedApplication.applicantEmail}
                    </div>
                    {selectedApplication.applicantPhone && (
                      <div className="flex items-center">
                        <FiPhone className="w-4 h-4 mr-2 text-gray-400" />
                        {selectedApplication.applicantPhone}
                      </div>
                    )}
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

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Application Status</h3>
                  <div className="space-y-2 text-sm">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedApplication.status)}`}>
                      {getStatusIcon(selectedApplication.status)}
                      <span className="ml-1 capitalize">{selectedApplication.status}</span>
                    </div>
                    <p><strong>Applied:</strong> {new Date(selectedApplication.appliedAt).toLocaleDateString()}</p>
                    {selectedApplication.startDate && (
                      <p><strong>Start Date:</strong> {new Date(selectedApplication.startDate).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>

              {selectedApplication.coverLetter && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Cover Letter</h3>
                  <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                    {selectedApplication.coverLetter}
                  </p>
                </div>
              )}

              {selectedApplication.whyInterested && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Why Interested</h3>
                  <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                    {selectedApplication.whyInterested}
                  </p>
                </div>
              )}

              {selectedApplication.relevantExperience && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Relevant Experience</h3>
                  <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                    {selectedApplication.relevantExperience}
                  </p>
                </div>
              )}

              {selectedApplication.profile && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Additional Profile Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    {selectedApplication.profile.skills && (
                      <p><strong>Skills:</strong> {selectedApplication.profile.skills}</p>
                    )}
                    {selectedApplication.profile.linkedinUrl && (
                      <p><strong>LinkedIn:</strong> <a href={selectedApplication.profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">{selectedApplication.profile.linkedinUrl}</a></p>
                    )}
                    {selectedApplication.profile.portfolioUrl && (
                      <p><strong>Portfolio:</strong> <a href={selectedApplication.profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">{selectedApplication.profile.portfolioUrl}</a></p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedApplication(null);
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start Date Confirmation Modal */}
      {showStartDateModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Confirm Start Date
              </h2>
              <p className="text-gray-600 mt-1">
                {selectedApplication.internshipTitle} at {selectedApplication.company}
              </p>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Congratulations! Your application has been accepted. Please confirm your preferred start date.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowStartDateModal(false);
                  setSelectedApplication(null);
                  setStartDate('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartDateSubmit}
                disabled={!startDate || updatingStartDate}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {updatingStartDate ? 'Confirming...' : 'Confirm Start Date'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyApplications;
