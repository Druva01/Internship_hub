import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { FiPlus, FiClock, FiCheckCircle, FiXCircle, FiEye } from 'react-icons/fi';

const MyTaskUpdates = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) { navigate('/login'); return; }
    const load = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'taskUpdates'),
          where('applicantId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        setUpdates(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error('Error loading task updates', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser, navigate]);

  const statusChip = (status) => {
    const map = {
      submitted: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      viewed: 'bg-blue-100 text-blue-800'
    };
    const Icon = status === 'approved' ? FiCheckCircle : status === 'rejected' ? FiXCircle : status === 'viewed' ? FiEye : FiClock;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-800'}`}>
        <Icon className="w-3 h-3 mr-1" /> {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Task Updates</h1>
          <button onClick={() => navigate('/submit-task')} className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <FiPlus className="w-4 h-4 mr-2" /> New Task Update
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : updates.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center text-gray-600">No task updates yet.</div>
        ) : (
          <div className="space-y-4">
            {updates.map(u => (
              <div key={u.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold">{u.title}</h3>
                      {statusChip(u.status)}
                    </div>
                    <p className="text-sm text-gray-600">{u.internshipTitle}</p>
                  </div>
                  <div className="text-sm text-gray-500 text-right">
                    <div>Submitted: {new Date(u.createdAt).toLocaleString()}</div>
                    {u.reviewedAt && <div>Reviewed: {new Date(u.reviewedAt).toLocaleString()}</div>}
                  </div>
                </div>
                <p className="mt-3 text-gray-700 whitespace-pre-wrap">{u.details}</p>
                {u.links && (
                  <p className="mt-2 text-sm text-blue-700 break-all">Links: {u.links}</p>
                )}
                {u.hours && (
                  <p className="mt-1 text-sm text-gray-600">Hours: {u.hours}</p>
                )}
                {u.workDate && (
                  <p className="mt-1 text-sm text-gray-600">Work Date: {new Date(u.workDate).toLocaleDateString()}</p>
                )}
                {u.rejectionReason && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-700">Rejected: {u.rejectionReason}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTaskUpdates;
