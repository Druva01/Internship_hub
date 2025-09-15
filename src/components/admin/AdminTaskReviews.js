import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, updateDoc, doc, orderBy } from 'firebase/firestore';
import { FiArrowLeft, FiCheckCircle, FiXCircle, FiSearch, FiFilter } from 'react-icons/fi';

const AdminTaskReviews = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [updates, setUpdates] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const load = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // Find internships created by current admin
      const internshipsSnap = await getDocs(query(collection(db, 'internships'), where('createdBy', '==', currentUser.uid)));
      const internshipIds = internshipsSnap.docs.map(d => d.id);
      if (internshipIds.length === 0) { setUpdates([]); setFiltered([]); return; }
      // Load task updates for those internships
      const q1 = query(collection(db, 'taskUpdates'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q1);
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => internshipIds.includes(r.internshipId));
      setUpdates(rows);
      setFiltered(rows);
    } catch (e) {
      console.error('Error loading task updates', e);
    } finally { setLoading(false); }
  }, [currentUser]);

  useEffect(() => { if (currentUser) load(); }, [currentUser, load]);

  useEffect(() => {
    let r = updates;
    if (statusFilter !== 'all') r = r.filter(u => u.status === statusFilter);
    if (search) {
      const s = search.toLowerCase();
      r = r.filter(u => (u.title || '').toLowerCase().includes(s) || (u.applicantName || '').toLowerCase().includes(s) || (u.internshipTitle || '').toLowerCase().includes(s));
    }
    setFiltered(r);
  }, [updates, statusFilter, search]);

  const updateStatus = async (id, status, reason = '') => {
    const current = updates.find(u => u.id === id);
    if (current?.status === 'approved' && status === 'rejected') {
      alert('This task update is already approved and cannot be rejected.');
      return;
    }
    if (current?.status === 'rejected' && status === 'approved') {
      alert('This task update is already rejected and cannot be approved.');
      return;
    }
    setUpdating(id);
    try {
      const data = { status, reviewedAt: new Date().toISOString(), reviewedBy: currentUser.uid };
      if (status === 'rejected' && reason) data.rejectionReason = reason;
      await updateDoc(doc(db, 'taskUpdates', id), data);
      setUpdates(prev => prev.map(x => x.id === id ? { ...x, ...data } : x));
      const msg = status === 'approved' ? 'Task update approved.' : status === 'rejected' ? 'Task update rejected.' : 'Task update marked as viewed.';
      alert(msg);
    } catch (e) {
      console.error('Error updating task status', e);
      alert('Failed to update. Try again.');
    } finally { setUpdating(null); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/admin/dashboard')} className="flex items-center text-gray-600 hover:text-gray-900"><FiArrowLeft className="mr-2"/> Back</button>
            <h1 className="text-2xl font-bold">Review Task Updates</h1>
          </div>
          <div className="text-sm text-gray-600">{filtered.length} of {updates.length}</div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, user, internship" className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="relative">
              <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg">
                <option value="all">All</option>
                <option value="submitted">Submitted</option>
                <option value="viewed">Viewed</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center text-gray-600">No task updates found.</div>
        ) : (
          <div className="space-y-4">
            {filtered.map(u => (
              <div key={u.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{u.title}</h3>
                    <p className="text-sm text-gray-600">{u.applicantName} • {u.internshipTitle}</p>
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
                <div className="mt-4 flex items-center gap-2">
                  <button onClick={() => updateStatus(u.id, 'viewed')} disabled={updating===u.id} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Mark Viewed</button>
                  <button onClick={() => updateStatus(u.id, 'approved')} disabled={updating===u.id} className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"><FiCheckCircle className="w-4 h-4 mr-2"/>Approve</button>
                  <button onClick={() => { const reason = prompt('Reason for rejection (optional):'); updateStatus(u.id, 'rejected', reason || ''); }} disabled={updating===u.id} className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"><FiXCircle className="w-4 h-4 mr-2"/>Reject</button>
                </div>
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

export default AdminTaskReviews;
