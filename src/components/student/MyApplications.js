import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { FiClock, FiCheckCircle, FiXCircle, FiEye, FiDownload, FiCalendar } from 'react-icons/fi';
import jsPDF from 'jspdf';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { currentUser } = useAuth();

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

  const fetchMyApplications = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'applications'),
        where('applicantId', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const applicationsData = [];
      for (const docSnapshot of querySnapshot.docs) {
        const appData = { id: docSnapshot.id, ...docSnapshot.data() };
        // Fetch internship details
        if (appData.internshipId) {
          const internshipDoc = await getDoc(doc(db, 'internships', appData.internshipId));
          if (internshipDoc.exists()) {
            appData.internship = internshipDoc.data();
          }
        }
        applicationsData.push(appData);
      }
      // Sort by application date (newest first)
      applicationsData.sort((a, b) => {
        const da = toJSDate(a.appliedAt)?.getTime() || 0;
        const db = toJSDate(b.appliedAt)?.getTime() || 0;
        return db - da;
      });
      setApplications(applicationsData);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchMyApplications();
  }, [fetchMyApplications]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'submitted':
        return <FiClock className="w-5 h-5 text-yellow-500" />;
      case 'viewed':
        return <FiEye className="w-5 h-5 text-blue-500" />;
      case 'approved':
        return <FiCheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <FiXCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FiClock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'viewed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const generateOfferLetter = (application) => {
    const pdf = new jsPDF();
    const internship = application.internship;
    
    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INTERNSHIP OFFER LETTER', 20, 30);
    
    // Date
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 50);
    
    // Student details
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
  pdf.text('Dear ' + (application.applicantName || 'Candidate') + ',', 20, 70);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('We are pleased to offer you an internship position with our organization.', 20, 90);
    
    // Position details
    pdf.setFont('helvetica', 'bold');
    pdf.text('Position Details:', 20, 110);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Position: ${internship.title}`, 20, 125);
    pdf.text(`Company: ${internship.company}`, 20, 140);
    pdf.text(`Location: ${internship.location}`, 20, 155);
    pdf.text(`Duration: ${internship.duration}`, 20, 170);
    if (internship.salary) {
      pdf.text(`Stipend: ${internship.salary}`, 20, 185);
    }
    
    // Start date
    if (application.startDate) {
      pdf.text(`Start Date: ${new Date(application.startDate).toLocaleDateString()}`, 20, 200);
    }
    
    // Responsibilities
    pdf.setFont('helvetica', 'bold');
    pdf.text('Responsibilities:', 20, 220);
    pdf.setFont('helvetica', 'normal');
    const responsibilities = internship.description.substring(0, 300) + '...';
    const lines = pdf.splitTextToSize(responsibilities, 170);
    pdf.text(lines, 20, 235);
    
    // Footer
    pdf.setFont('helvetica', 'bold');
    pdf.text('Congratulations and welcome to the team!', 20, 270);
    
    pdf.setFont('helvetica', 'normal');
    pdf.text('Best regards,', 20, 285);
    pdf.text('HR Department', 20, 295);
    pdf.text(internship.company, 20, 305);
    
  const nameSlug = (application.applicantName || 'candidate').replace(/\s+/g, '-');
  pdf.save(`offer-letter-${nameSlug}.pdf`);
  };

  const generateJoiningLetter = (application) => {
    const pdf = new jsPDF();
    const internship = application.internship || {};
    const startDate = toJSDate(application.startDate);

    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INTERNSHIP JOINING LETTER', 20, 30);

    // Date
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 50);

    // Recipient
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`To: ${application.applicantName || application.fullName || 'Candidate'}`, 20, 70);

    // Body
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`We are pleased to confirm your joining as an intern for the role of ${internship.title || 'the specified position'}.`, 20, 90);
    if (startDate) {
      pdf.text(`Please report on ${startDate.toLocaleDateString()} to begin your internship.`, 20, 105);
    }
    if (internship.company) {
      pdf.text(`Company: ${internship.company}`, 20, 120);
    }
    if (internship.location) {
      pdf.text(`Location: ${internship.location}`, 20, 135);
    }
    pdf.text('Kindly bring a valid ID and any required documents as communicated.', 20, 150);

    // Footer
    pdf.setFont('helvetica', 'bold');
    pdf.text('Welcome aboard!', 20, 175);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Regards,', 20, 190);
    pdf.text('HR Department', 20, 200);
    if (internship.company) pdf.text(internship.company, 20, 210);

    const nameSlug = (application.applicantName || application.fullName || 'candidate').replace(/\s+/g, '-');
    pdf.save(`joining-letter-${nameSlug}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
          <p className="mt-2 text-lg text-gray-600">Track the status of your internship applications</p>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-gray-400 mb-4">
              <FiEye className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
            <p className="text-gray-600">You haven't applied to any internships yet. Start browsing and applying!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {applications.map((application) => (
              <div key={application.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {application.internship?.title || 'Position Title'}
                        </h3>
                        <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(application.status)}`}>
                          {getStatusIcon(application.status)}
                          <span className="capitalize">{application.status}</span>
                        </div>
                      </div>
                      
                      <div className="mt-2 space-y-1">
                        <p className="text-gray-600">
                          <span className="font-medium">Company:</span> {application.internship?.company}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Location:</span> {application.internship?.location}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Applied on:</span> {toJSDate(application.appliedAt)?.toLocaleDateString() || '—'}
                        </p>
            {toJSDate(application.startDate) && (
                          <p className="text-gray-600">
              <span className="font-medium">Start Date:</span> {toJSDate(application.startDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedApplication(application);
                          setShowModal(true);
                        }}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <FiEye className="w-4 h-4 mr-2" />
                        View Details
                      </button>
                      
                      {application.status === 'approved' && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => generateOfferLetter(application)}
                            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                          >
                            <FiDownload className="w-4 h-4 mr-2" />
                            Offer Letter
                          </button>
                          <button
                            onClick={() => generateJoiningLetter(application)}
                            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                          >
                            <FiDownload className="w-4 h-4 mr-2" />
                            Joining Letter
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {application.rejectionReason && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="text-sm font-medium text-red-800 mb-2">Rejection Reason:</h4>
                      <p className="text-sm text-red-700">{application.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Application Details Modal */}
      {showModal && selectedApplication && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-2xl rounded-xl bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Application Details</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiXCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Internship Details */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Internship Details</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><span className="font-medium">Position:</span> {selectedApplication.internship?.title}</p>
                    <p><span className="font-medium">Company:</span> {selectedApplication.internship?.company}</p>
                    <p><span className="font-medium">Location:</span> {selectedApplication.internship?.location}</p>
                    <p><span className="font-medium">Duration:</span> {selectedApplication.internship?.duration}</p>
                    {selectedApplication.internship?.salary && (
                      <p><span className="font-medium">Salary:</span> {selectedApplication.internship?.salary}</p>
                    )}
                  </div>
                </div>

                {/* Application Details */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Your Application</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedApplication.applicantName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedApplication.applicantEmail}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedApplication.applicantPhone}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Cover Letter</label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedApplication.coverLetter}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Skills</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedApplication.skills}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Experience</label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedApplication.experience}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Applied On</label>
                      <p className="mt-1 text-sm text-gray-900">{toJSDate(selectedApplication.appliedAt)?.toLocaleDateString() || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Status and Feedback */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Status</h4>
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(selectedApplication.status)}`}>
                    {getStatusIcon(selectedApplication.status)}
                    <span className="ml-2 capitalize">{selectedApplication.status}</span>
                  </div>
                  
                  {selectedApplication.rejectionReason && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h5 className="font-medium text-red-800 mb-2">Rejection Reason:</h5>
                      <p className="text-red-700">{selectedApplication.rejectionReason}</p>
                    </div>
                  )}

      {toJSDate(selectedApplication.startDate) && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <FiCalendar className="w-5 h-5 text-green-600 mr-2" />
        <span className="font-medium text-green-800">Start Date: {toJSDate(selectedApplication.startDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
                {selectedApplication.status === 'approved' && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => generateOfferLetter(selectedApplication)}
                      className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      <FiDownload className="w-4 h-4 mr-2 inline" />
                      Offer Letter
                    </button>
                    <button
                      onClick={() => generateJoiningLetter(selectedApplication)}
                      className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                    >
                      <FiDownload className="w-4 h-4 mr-2 inline" />
                      Joining Letter
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyApplications;
