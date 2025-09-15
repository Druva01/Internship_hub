import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { FiArrowLeft, FiEdit, FiTrash2, FiEye, FiPlus, FiSearch, FiFilter, FiMoreVertical } from 'react-icons/fi';

const ManageInternships = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showActions, setShowActions] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'internships'),
      where('createdBy', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const internshipData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInternships(internshipData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleStatusChange = async (internshipId, newStatus) => {
    try {
      await updateDoc(doc(db, 'internships', internshipId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      setShowActions(null);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleDelete = async (internshipId) => {
    if (window.confirm('Are you sure you want to delete this internship? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'internships', internshipId));
        setShowActions(null);
      } catch (error) {
        console.error('Error deleting internship:', error);
        alert('Failed to delete internship. Please try again.');
      }
    }
  };

  const filteredInternships = internships.filter(internship => {
    const matchesSearch = internship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         internship.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || internship.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-red-100 text-red-800'
    };
    return badges[status] || badges.draft;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your internships...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-2xl font-bold text-gray-900">Manage Internships</h1>
            </div>
            <button
              onClick={() => navigate('/admin/create-internship')}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <FiPlus className="mr-2" />
              Create New
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search internships..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Internships List */}
        {filteredInternships.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiEye className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No internships found' : 'No internships yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Create your first internship to get started.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => navigate('/admin/create-internship')}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Create Internship
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInternships.map((internship) => (
              <div key={internship.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{internship.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(internship.status)}`}>
                        {internship.status.charAt(0).toUpperCase() + internship.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{internship.company} • {internship.location}</p>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{internship.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Applications: {internship.applicationsCount || 0}</span>
                      <span>Duration: {internship.duration}</span>
                      {internship.applicationDeadline && (
                        <span>Deadline: {new Date(internship.applicationDeadline).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="relative">
                    <button
                      onClick={() => setShowActions(showActions === internship.id ? null : internship.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <FiMoreVertical />
                    </button>
                    
                    {showActions === internship.id && (
                      <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                        <button
                          onClick={() => navigate(`/admin/edit-internship/${internship.id}`)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                        >
                          <FiEdit className="mr-2" />
                          Edit
                        </button>
                        
                        {internship.status !== 'active' && (
                          <button
                            onClick={() => handleStatusChange(internship.id, 'active')}
                            className="w-full px-4 py-2 text-left text-sm text-green-700 hover:bg-gray-50"
                          >
                            Activate
                          </button>
                        )}
                        
                        {internship.status === 'active' && (
                          <button
                            onClick={() => handleStatusChange(internship.id, 'paused')}
                            className="w-full px-4 py-2 text-left text-sm text-yellow-700 hover:bg-gray-50"
                          >
                            Pause
                          </button>
                        )}
                        
                        {internship.status !== 'closed' && (
                          <button
                            onClick={() => handleStatusChange(internship.id, 'closed')}
                            className="w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-gray-50"
                          >
                            Close
                          </button>
                        )}
                        
                        <hr className="my-1" />
                        <button
                          onClick={() => handleDelete(internship.id)}
                          className="w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50 flex items-center"
                        >
                          <FiTrash2 className="mr-2" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageInternships;
