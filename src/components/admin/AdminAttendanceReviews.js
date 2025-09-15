import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { collection, getDocs, query, where, updateDoc, doc, orderBy } from 'firebase/firestore';
import { FiCheck, FiX, FiSearch } from 'react-icons/fi';

const AdminAttendanceReviews = () => {
  const { currentUser } = useAuth();
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('submitted');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState('');

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return entries.filter(e => (filter === 'all' ? true : e.status === filter) && (
      e.applicantName?.toLowerCase().includes(s) || e.internshipTitle?.toLowerCase().includes(s) || e.applicantEmail?.toLowerCase().includes(s)
    ));
  }, [entries, filter, search]);

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        // find internships owned by current admin
        const qIntern = query(collection(db, 'internships'), where('createdBy', '==', currentUser.uid));
        const snapIntern = await getDocs(qIntern);
        const ids = new Set(snapIntern.docs.map(d => d.id));

        // load attendance entries for those internships
        const qAtt = query(collection(db, 'attendance'), orderBy('punchInAt', 'desc'));
        const snapAtt = await getDocs(qAtt);
        const list = snapAtt.docs.map(d => ({ id: d.id, ...d.data() })).filter(e => ids.has(e.internshipId));
        setEntries(list);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [currentUser]);

  const act = async (entry, status) => {
    if (entry.status === 'approved' || entry.status === 'rejected') {
      alert('Finalized entries cannot be changed.');
      return;
    }
    if (status === entry.status) return;
    const ref = doc(db, 'attendance', entry.id);
    setWorkingId(entry.id);
    try {
      let rejectionReason;
      if (status === 'rejected') {
        rejectionReason = window.prompt('Enter rejection reason (optional):') || '';
      }
      const patch = { status, reviewedAt: new Date().toISOString(), reviewedBy: currentUser.uid, ...(status==='rejected' ? { rejectionReason } : {}) };
      await updateDoc(ref, patch);
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, ...patch } : e));
      alert(`Attendance ${status}.`);
    } catch (e) {
      console.error(e);
      alert('Action failed.');
    } finally { setWorkingId(''); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-4">Attendance Reviews</h1>
        <div className="bg-white p-4 rounded-lg shadow-sm mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <select value={filter} onChange={e => setFilter(e.target.value)} className="px-3 py-2 border rounded">
              <option value="submitted">Submitted</option>
              <option value="in-progress">In Progress</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">All</option>
            </select>
          </div>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, internship" className="pl-9 pr-3 py-2 border rounded w-72" />
          </div>
        </div>

        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center text-gray-600">No entries found.</div>
        ) : (
          <div className="space-y-4">
            {filtered.map(e => (
              <div key={e.id} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{e.internshipTitle}</h3>
                    <p className="text-sm text-gray-600">{e.applicantName} • {e.applicantEmail}</p>
                    <p className="text-sm text-gray-600 mt-1">In: {new Date(e.punchInAt).toLocaleString()} {e.punchOutAt && (<> • Out: {new Date(e.punchOutAt).toLocaleString()}</>)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button disabled={workingId===e.id || e.status==='approved' || e.status==='rejected'} onClick={() => act(e, 'approved')} className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"><FiCheck className="mr-2"/> Approve</button>
                    <button disabled={workingId===e.id || e.status==='approved' || e.status==='rejected'} onClick={() => act(e, 'rejected')} className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"><FiX className="mr-2"/> Reject</button>
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

export default AdminAttendanceReviews;
