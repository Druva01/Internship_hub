import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, query, where, orderBy, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { FiSearch, FiMapPin, FiClock, FiDollarSign, FiBriefcase, FiUser, FiLogOut, FiHeart, FiEye, FiCheck, FiX, FiSend } from 'react-icons/fi';

const InternshipBrowser = () => {
  const [internships, setInternships] = useState([]);
  const [filteredInternships, setFilteredInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationData, setApplicationData] = useState({
    coverLetter: '',
    experience: '',
    skills: '',
    availability: '',
    portfolio: '',
    resume: ''
  });
  
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const fetchInternships = useCallback(async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserApplications = useCallback(async () => {
    try {
      const q = query(
        collection(db, 'applications'),
        where('applicantId', '==', currentUser.uid)
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
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    fetchInternships();
    fetchUserApplications();
  }, [currentUser, navigate, fetchInternships, fetchUserApplications]);

  const filterInternships = useCallback(() => {
    let filtered = internships;

    if (searchTerm) {
      filtered = filtered.filter(internship =>
        internship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        internship.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        internship.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (locationFilter) {
      filtered = filtered.filter(internship =>
        internship.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(internship =>
        internship.type === typeFilter
      );
    }

    setFilteredInternships(filtered);
  }, [internships, searchTerm, locationFilter, typeFilter]);

  useEffect(() => {
    filterInternships();
  }, [filterInternships]);

  

  // A user can have only one active application at a time (submitted or viewed)
  const userHasActiveApplication = applications.some(
    (a) => a.status === 'submitted' || a.status === 'viewed'
  );

  

  const hasApplied = (internshipId) => {
    return applications.some(app => app.internshipId === internshipId);
  };

  const getApplicationStatus = (internshipId) => {
    const application = applications.find(app => app.internshipId === internshipId);
    return application ? application.status : null;
  };

  const handleApply = (internship) => {
    if (userHasActiveApplication) {
      alert('You already have an active application. Please wait for a decision before applying to another internship.');
      return;
    }
    setSelectedInternship(internship);
    setShowApplicationModal(true);
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const application = {
        internshipId: selectedInternship.id,
        internshipTitle: selectedInternship.title,
        companyName: selectedInternship.company,
        applicantId: currentUser.uid,
        applicantName: `${userProfile.firstName} ${userProfile.lastName}`,
        applicantEmail: currentUser.email,
        applicantPhone: userProfile.phoneNumber || '',
        university: userProfile.university || '',
        major: userProfile.major || '',
        graduationYear: userProfile.graduationYear || '',
        coverLetter: applicationData.coverLetter,
        experience: applicationData.experience,
        skills: applicationData.skills,
        availability: applicationData.availability,
        portfolio: applicationData.portfolio,
        resume: applicationData.resume,
  status: 'submitted',
        appliedAt: new Date().toISOString(),
        companyId: selectedInternship.createdBy
      };

      await addDoc(collection(db, 'applications'), application);
      
      // Reset form
      setApplicationData({
        coverLetter: '',
        experience: '',
        skills: '',
        availability: '',
        portfolio: '',
        resume: ''
      });
      
      setShowApplicationModal(false);
      setSelectedInternship(null);
      fetchUserApplications(); // Refresh applications
      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Error submitting application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      submitted: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      viewed: 'bg-blue-100 text-blue-800'
    };

    const statusIcons = {
      submitted: FiClock,
      approved: FiCheck,
      rejected: FiX,
      viewed: FiEye
    };

    const Icon = statusIcons[status] || FiClock;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || statusStyles.submitted}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Submitted'}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
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
        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Find Your Dream Internship</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search internships..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setLocationFilter('');
                setTypeFilter('');
              }}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Internships List */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-gray-600">Loading internships...</p>
            </div>
          ) : filteredInternships.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <FiBriefcase className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No internships found</h3>
              <p className="text-gray-500">Try adjusting your search criteria or check back later for new opportunities.</p>
            </div>
          ) : (
            filteredInternships.map((internship) => {
              const applied = hasApplied(internship.id);
              const status = getApplicationStatus(internship.id);
              
              return (
                <div key={internship.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{internship.title}</h3>
                          {applied && (
                            <div className="ml-4">
                              {getStatusBadge(status)}
                            </div>
                          )}
                        </div>
                        <p className="text-lg font-medium text-primary-600 mb-1">{internship.company}</p>
                      </div>
                      <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                        <FiHeart className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <FiMapPin className="w-4 h-4 mr-2 text-gray-400" />
                        {internship.location}
                      </div>
                      <div className="flex items-center">
                        <FiClock className="w-4 h-4 mr-2 text-gray-400" />
                        {internship.type}
                      </div>
                      {internship.duration && (
                        <div className="flex items-center">
                          <FiBriefcase className="w-4 h-4 mr-2 text-gray-400" />
                          {internship.duration}
                        </div>
                      )}
                      {internship.salary && (
                        <div className="flex items-center">
                          <FiDollarSign className="w-4 h-4 mr-2 text-gray-400" />
                          {internship.salary}
                        </div>
                      )}
                    </div>
                    
                    <p className="text-gray-700 mb-6 leading-relaxed">
                      {internship.description.length > 300 
                        ? `${internship.description.substring(0, 300)}...` 
                        : internship.description}
                    </p>

                    {internship.requirements && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Requirements:</h4>
                        <p className="text-sm text-gray-600">{internship.requirements}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        {internship.applicationDeadline && (
                          <span>
                            Deadline: {new Date(internship.applicationDeadline).toLocaleDateString()}
                          </span>
                        )}
                        {internship.startDate && (
                          <span>
                            Start Date: {new Date(internship.startDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-3">
                        <button className="px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors flex items-center">
                          <FiEye className="w-4 h-4 mr-2" />
                          View Details
                        </button>
            {applied || userHasActiveApplication ? (
                          <button 
                            disabled
                            className="px-6 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed flex items-center"
                          >
                            <FiCheck className="w-4 h-4 mr-2" />
              {applied ? 'Applied' : 'Limit Reached'}
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleApply(internship)}
                            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                          >
                            <FiSend className="w-4 h-4 mr-2" />
                            Apply Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Application Modal */}
      {showApplicationModal && selectedInternship && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-xl bg-white">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Apply for {selectedInternship.title}</h3>
              <p className="text-gray-600">at {selectedInternship.company}</p>
            </div>
            
            <form onSubmit={handleSubmitApplication} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Letter *</label>
                <textarea
                  required
                  rows={4}
                  value={applicationData.coverLetter}
                  onChange={(e) => setApplicationData({...applicationData, coverLetter: e.target.value})}
                  placeholder="Tell us why you're interested in this position and what makes you a great candidate..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relevant Experience</label>
                <textarea
                  rows={3}
                  value={applicationData.experience}
                  onChange={(e) => setApplicationData({...applicationData, experience: e.target.value})}
                  placeholder="Describe any relevant work experience, projects, or internships..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skills *</label>
                <textarea
                  required
                  rows={2}
                  value={applicationData.skills}
                  onChange={(e) => setApplicationData({...applicationData, skills: e.target.value})}
                  placeholder="List your relevant skills (e.g., Programming languages, tools, soft skills)..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Availability *</label>
                  <input
                    type="text"
                    required
                    value={applicationData.availability}
                    onChange={(e) => setApplicationData({...applicationData, availability: e.target.value})}
                    placeholder="e.g., Full-time, Part-time, Weekends"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio/Website</label>
                  <input
                    type="url"
                    value={applicationData.portfolio}
                    onChange={(e) => setApplicationData({...applicationData, portfolio: e.target.value})}
                    placeholder="https://your-portfolio.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resume/CV Link</label>
                <input
                  type="url"
                  value={applicationData.resume}
                  onChange={(e) => setApplicationData({...applicationData, resume: e.target.value})}
                  placeholder="https://drive.google.com/your-resume or LinkedIn profile"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Your Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Name:</span> {userProfile?.firstName} {userProfile?.lastName}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {currentUser?.email}
                  </div>
                  <div>
                    <span className="font-medium">University:</span> {userProfile?.university}
                  </div>
                  <div>
                    <span className="font-medium">Major:</span> {userProfile?.major}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowApplicationModal(false);
                    setSelectedInternship(null);
                    setApplicationData({
                      coverLetter: '',
                      experience: '',
                      skills: '',
                      availability: '',
                      portfolio: '',
                      resume: ''
                    });
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
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FiSend className="w-4 h-4 mr-2" />
                      Submit Application
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

export default InternshipBrowser;
