import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiEdit3, FiSave, FiX, FiCamera, FiArrowLeft, FiBook, FiUpload, FiDownload, FiTrash2, FiFile } from 'react-icons/fi';

const UserProfile = () => {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState({ photo: false, resume: false });
  const photoInputRef = useRef(null);
  const resumeInputRef = useRef(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    university: '',
    major: '',
    graduationYear: '',
    dateOfBirth: '',
    address: '',
    bio: '',
    skills: '',
    experience: '',
    linkedinUrl: '',
    portfolioUrl: ''
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (userProfile) {
      setFormData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        email: userProfile.email || currentUser.email || '',
        phoneNumber: userProfile.phoneNumber || '',
        university: userProfile.university || '',
        major: userProfile.major || '',
        graduationYear: userProfile.graduationYear || '',
        dateOfBirth: userProfile.dateOfBirth || '',
        address: userProfile.address || '',
        bio: userProfile.bio || '',
        skills: userProfile.skills || '',
        experience: userProfile.experience || '',
        linkedinUrl: userProfile.linkedinUrl || '',
        portfolioUrl: userProfile.portfolioUrl || ''
      });
    }
  }, [currentUser, userProfile, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await updateUserProfile(formData);
      setMessage('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (userProfile) {
      setFormData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        email: userProfile.email || currentUser.email || '',
        phoneNumber: userProfile.phoneNumber || '',
        university: userProfile.university || '',
        major: userProfile.major || '',
        graduationYear: userProfile.graduationYear || '',
        dateOfBirth: userProfile.dateOfBirth || '',
        address: userProfile.address || '',
        bio: userProfile.bio || '',
        skills: userProfile.skills || '',
        experience: userProfile.experience || '',
        linkedinUrl: userProfile.linkedinUrl || '',
        portfolioUrl: userProfile.portfolioUrl || ''
      });
    }
    setIsEditing(false);
    setMessage('');
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage('Please select a valid image file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image file size must be less than 5MB.');
      return;
    }

    setUploading(prev => ({ ...prev, photo: true }));
    setMessage('');

    try {
      // Create a reference to the file location
      const fileRef = ref(storage, `profile-photos/${currentUser.uid}/${Date.now()}-${file.name}`);
      
      // Upload the file
      await uploadBytes(fileRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(fileRef);
      
      // Update the user profile with the new photo URL
      await updateUserProfile({ photoURL: downloadURL });
      
      setMessage('Profile photo updated successfully!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      setMessage('Failed to upload photo. Please try again.');
    } finally {
      setUploading(prev => ({ ...prev, photo: false }));
    }
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type (PDF only)
    if (file.type !== 'application/pdf') {
      setMessage('Please select a PDF file for your resume.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setMessage('Resume file size must be less than 10MB.');
      return;
    }

    setUploading(prev => ({ ...prev, resume: true }));
    setMessage('');

    try {
      // Delete old resume if exists
      if (userProfile?.resumeURL) {
        try {
          const oldResumeRef = ref(storage, userProfile.resumeURL);
          await deleteObject(oldResumeRef);
        } catch (error) {
          console.log('Old resume not found or already deleted');
        }
      }

      // Create a reference to the file location
      const fileRef = ref(storage, `resumes/${currentUser.uid}/${Date.now()}-${file.name}`);
      
      // Upload the file
      await uploadBytes(fileRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(fileRef);
      
      // Update the user profile with the new resume URL
      await updateUserProfile({ 
        resumeURL: downloadURL,
        resumeName: file.name
      });
      
      setMessage('Resume uploaded successfully!');
    } catch (error) {
      console.error('Error uploading resume:', error);
      setMessage('Failed to upload resume. Please try again.');
    } finally {
      setUploading(prev => ({ ...prev, resume: false }));
    }
  };

  const handleDeleteResume = async () => {
    if (!userProfile?.resumeURL) return;

    if (!window.confirm('Are you sure you want to delete your resume?')) return;

    setUploading(prev => ({ ...prev, resume: true }));

    try {
      // Delete the file from storage
      const resumeRef = ref(storage, userProfile.resumeURL);
      await deleteObject(resumeRef);

      // Update the user profile to remove resume URL
      await updateUserProfile({ 
        resumeURL: null,
        resumeName: null
      });

      setMessage('Resume deleted successfully!');
    } catch (error) {
      console.error('Error deleting resume:', error);
      setMessage('Failed to delete resume. Please try again.');
    } finally {
      setUploading(prev => ({ ...prev, resume: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <FiArrowLeft className="mr-2" />
                Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <FiEdit3 className="mr-2" />
                Edit Profile
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FiX className="mr-2" />
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <FiSave className="mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('successfully') 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-primary-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center overflow-hidden">
                  {userProfile?.photoURL ? (
                    <img 
                      src={userProfile.photoURL} 
                      alt="Profile" 
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <FiUser className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                {isEditing && (
                  <>
                    <button 
                      onClick={() => photoInputRef.current?.click()}
                      disabled={uploading.photo}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                      {uploading.photo ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <FiCamera className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </>
                )}
              </div>
              <div className="text-white flex-1">
                <h2 className="text-2xl font-bold">
                  {formData.firstName} {formData.lastName}
                </h2>
                <p className="text-primary-100">{formData.email}</p>
                <p className="text-primary-200 text-sm">
                  {userProfile?.role === 'student' ? 'Student' : 'User'}
                  {formData.university && ` at ${formData.university}`}
                </p>
              </div>
              
              {/* Resume Section */}
              <div className="text-white">
                <div className="bg-white/10 rounded-lg p-4 min-w-[200px]">
                  <h3 className="text-sm font-semibold mb-2 flex items-center">
                    <FiFile className="mr-2" />
                    Resume
                  </h3>
                  {userProfile?.resumeURL ? (
                    <div className="space-y-2">
                      <p className="text-xs text-primary-100 truncate">
                        {userProfile.resumeName || 'resume.pdf'}
                      </p>
                      <div className="flex space-x-2">
                        <a
                          href={userProfile.resumeURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-2 py-1 bg-white/20 rounded text-xs hover:bg-white/30 transition-colors"
                        >
                          <FiDownload className="w-3 h-3 mr-1" />
                          View
                        </a>
                        {isEditing && (
                          <>
                            <button
                              onClick={() => resumeInputRef.current?.click()}
                              disabled={uploading.resume}
                              className="flex items-center px-2 py-1 bg-white/20 rounded text-xs hover:bg-white/30 transition-colors disabled:opacity-50"
                            >
                              {uploading.resume ? (
                                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                              ) : (
                                <FiUpload className="w-3 h-3 mr-1" />
                              )}
                              Update
                            </button>
                            <button
                              onClick={handleDeleteResume}
                              disabled={uploading.resume}
                              className="flex items-center px-2 py-1 bg-red-500/80 rounded text-xs hover:bg-red-500 transition-colors disabled:opacity-50"
                            >
                              <FiTrash2 className="w-3 h-3 mr-1" />
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-primary-100">No resume uploaded</p>
                      {isEditing && (
                        <button
                          onClick={() => resumeInputRef.current?.click()}
                          disabled={uploading.resume}
                          className="flex items-center px-2 py-1 bg-white/20 rounded text-xs hover:bg-white/30 transition-colors disabled:opacity-50"
                        >
                          {uploading.resume ? (
                            <>
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <FiUpload className="w-3 h-3 mr-1" />
                              Upload Resume
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                  {isEditing && (
                    <input
                      ref={resumeInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleResumeUpload}
                      className="hidden"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiUser className="mr-2 text-primary-600" />
                  Personal Information
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={true} // Email should not be editable
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <div className="relative">
                  <FiMapPin className="absolute left-3 top-3 text-gray-400" />
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={!isEditing}
                    rows={2}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>

              {/* Education Information */}
              <div className="md:col-span-2 mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiBook className="mr-2 text-primary-600" />
                  Education Information
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  University
                </label>
                <input
                  type="text"
                  name="university"
                  value={formData.university}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Major
                </label>
                <input
                  type="text"
                  name="major"
                  value={formData.major}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Graduation Year
                </label>
                <select
                  name="graduationYear"
                  value={formData.graduationYear}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">Select Year</option>
                  {Array.from({length: 10}, (_, i) => {
                    const year = new Date().getFullYear() + i;
                    return <option key={year} value={year}>{year}</option>;
                  })}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  disabled={!isEditing}
                  rows={3}
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills (comma-separated)
                </label>
                <textarea
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  disabled={!isEditing}
                  rows={2}
                  placeholder="e.g., JavaScript, React, Python, Data Analysis..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience
                </label>
                <textarea
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  disabled={!isEditing}
                  rows={3}
                  placeholder="Describe your relevant experience, projects, or achievements..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  name="linkedinUrl"
                  value={formData.linkedinUrl}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Portfolio URL
                </label>
                <input
                  type="url"
                  name="portfolioUrl"
                  value={formData.portfolioUrl}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="https://yourportfolio.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>

            {isEditing && (
              <div className="mt-8 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
