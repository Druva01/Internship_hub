import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, orderBy, limit } from 'firebase/firestore';
import { FiPlay, FiStopCircle, FiClock, FiCheckCircle, FiXCircle, FiEye } from 'react-icons/fi';

const MyAttendance = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const preselectInternshipId = useMemo(() => new URLSearchParams(location.search).get('internshipId'), [location.search]);

  const [approvedApplications, setApprovedApplications] = useState([]);
  const [internshipId, setInternshipId] = useState('');
  const [activeEntry, setActiveEntry] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!currentUser) { navigate('/login'); return; }
    const load = async () => {
      setLoading(true);
      try {
        // Load approved applications for selection
        const qApps = query(
          collection(db, 'applications'),
          where('applicantId', '==', currentUser.uid),
          where('status', '==', 'approved'),
          orderBy('appliedAt', 'desc')
        );
        const snapApps = await getDocs(qApps);
        const apps = snapApps.docs.map(d => ({ id: d.id, ...d.data() }));
        setApprovedApplications(apps);
        const defaultInternship = preselectInternshipId && apps.some(a => a.internshipId === preselectInternshipId)
          ? preselectInternshipId
          : (apps[0]?.internshipId || '');
        setInternshipId(defaultInternship);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [currentUser, navigate, preselectInternshipId]);

  useEffect(() => {
    const loadEntries = async () => {
      if (!internshipId) { setEntries([]); setActiveEntry(null); return; }
      try {
        // Find active (no punchOut yet)
        const qActive = query(
          collection(db, 'attendance'),
          where('applicantId', '==', currentUser.uid),
          where('internshipId', '==', internshipId),
          where('status', '==', 'in-progress'),
          orderBy('punchInAt', 'desc'),
          limit(1)
        );
        const snapActive = await getDocs(qActive);
        setActiveEntry(snapActive.docs[0] ? { id: snapActive.docs[0].id, ...snapActive.docs[0].data() } : null);

        const qList = query(
          collection(db, 'attendance'),
          where('applicantId', '==', currentUser.uid),
          where('internshipId', '==', internshipId),
          orderBy('punchInAt', 'desc')
        );
        const snapList = await getDocs(qList);
        setEntries(snapList.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error('Error loading attendance', e); }
    };
    if (currentUser && internshipId) loadEntries();
  }, [currentUser, internshipId]);

  const punchIn = async () => {
    if (!internshipId) return alert('Select an internship first.');
    if (activeEntry) return alert('You are already punched in. Please punch out first.');
    setWorking(true);
    try {
      const app = approvedApplications.find(a => a.internshipId === internshipId);
      await addDoc(collection(db, 'attendance'), {
        internshipId,
        applicationId: app?.id || null,
        applicantId: currentUser.uid,
        applicantName: app?.applicantName || '',
        applicantEmail: app?.applicantEmail || '',
        companyId: app?.companyId || '',
        internshipTitle: app?.internshipTitle || '',
        punchInAt: new Date().toISOString(),
        punchOutAt: null,
        status: 'in-progress',
        createdAt: new Date().toISOString()
      });
      alert('Punched in. Have a productive session!');
      setActiveEntry(true); // trigger reload via dependency
      setActiveEntry(null);
      // Reload entries
      setInternshipId(i => i);
    } catch (e) {
      console.error('Punch in failed', e);
      alert('Punch in failed. Try again.');
    } finally { setWorking(false); }
  };

  const punchOut = async () => {
    if (!activeEntry) return alert('No active session to punch out from.');
    setWorking(true);
    try {
      const ref = doc(db, 'attendance', activeEntry.id);
      await updateDoc(ref, { punchOutAt: new Date().toISOString(), status: 'submitted' });
      alert('Punched out. Entry submitted for approval.');
      setActiveEntry(null);
      setInternshipId(i => i); // reload list
    } catch (e) {
      console.error('Punch out failed', e);
      alert('Punch out failed. Try again.');
    } finally { setWorking(false); }
  };

  const statusChip = (status) => {
    const map = {
      'in-progress': 'bg-blue-100 text-blue-800',
      submitted: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    const Icon = status === 'approved' ? FiCheckCircle : status === 'rejected' ? FiXCircle : status === 'in-progress' ? FiEye : FiClock;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-800'}`}>
        <Icon className="w-3 h-3 mr-1"/> {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Attendance</h1>
          <div className="flex items-center space-x-2">
            <select value={internshipId} onChange={e => setInternshipId(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg">
              {approvedApplications.map(a => (
                <option key={a.id} value={a.internshipId}>{a.internshipTitle}</option>
              ))}
            </select>
            {!activeEntry ? (
              <button onClick={punchIn} disabled={working || !internshipId} className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"><FiPlay className="w-4 h-4 mr-2"/> Punch In</button>
            ) : (
              <button onClick={punchOut} disabled={working} className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"><FiStopCircle className="w-4 h-4 mr-2"/> Punch Out</button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : entries.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center text-gray-600">No attendance entries yet.</div>
        ) : (
          <div className="space-y-4">
            {entries.map(e => {
              const duration = e.punchOutAt ? Math.max(0, (new Date(e.punchOutAt).getTime() - new Date(e.punchInAt).getTime())/3600000).toFixed(2) : null;
              return (
                <div key={e.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold">{e.internshipTitle}</h3>
                        {statusChip(e.status)}
                      </div>
                      <p className="text-sm text-gray-600">In: {new Date(e.punchInAt).toLocaleString()} {e.punchOutAt && (<> • Out: {new Date(e.punchOutAt).toLocaleString()}</>)}</p>
                    </div>
                    <div className="text-sm text-gray-600 text-right">
                      <div>Submitted: {new Date(e.createdAt).toLocaleString()}</div>
                      {e.reviewedAt && <div>Reviewed: {new Date(e.reviewedAt).toLocaleString()}</div>}
                    </div>
                  </div>
                  {duration && <p className="mt-2 text-sm text-gray-700">Duration: {duration} hours</p>}
                  {e.rejectionReason && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded"><p className="text-sm text-red-700">Rejected: {e.rejectionReason}</p></div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAttendance;
