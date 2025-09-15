import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { FiArrowLeft, FiSend } from 'react-icons/fi';

const SubmitTaskUpdate = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const preselectInternshipId = useMemo(() => new URLSearchParams(location.search).get('internshipId'), [location.search]);

  const [approvedApplications, setApprovedApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    internshipId: '',
    title: '',
    details: '',
    links: '',
    hours: '',
    workDate: new Date().toISOString().slice(0, 10),
    notes: ''
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'applications'),
          where('applicantId', '==', currentUser.uid),
          where('status', '==', 'approved'),
          orderBy('appliedAt', 'desc')
        );
        const snap = await getDocs(q);
        const apps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setApprovedApplications(apps);
        if (preselectInternshipId && apps.some(a => a.internshipId === preselectInternshipId)) {
          setForm(f => ({ ...f, internshipId: preselectInternshipId }));
        } else if (apps[0]) {
          setForm(f => ({ ...f, internshipId: apps[0].internshipId }));
        }
      } catch (e) {
        console.error('Error loading approved applications', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser, navigate, preselectInternshipId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.internshipId || !form.title.trim() || !form.details.trim()) return;
    setSubmitting(true);
    try {
      const app = approvedApplications.find(a => a.internshipId === form.internshipId);
      await addDoc(collection(db, 'taskUpdates'), {
        internshipId: form.internshipId,
        applicationId: app?.id || null,
        applicantId: currentUser.uid,
        applicantName: app?.applicantName || '',
        applicantEmail: app?.applicantEmail || '',
        companyId: app?.companyId || '',
        internshipTitle: app?.internshipTitle || '',
        title: form.title.trim(),
        details: form.details.trim(),
        links: form.links.trim(),
        hours: form.hours ? Number(form.hours) : null,
        workDate: form.workDate,
        notes: form.notes.trim(),
        status: 'submitted',
        createdAt: new Date().toISOString()
      });
      alert('Task update submitted');
      navigate('/my-tasks');
    } catch (e) {
      console.error('Error submitting task update', e);
      alert('Failed to submit. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900">
              <FiArrowLeft className="mr-2" /> Back
            </button>
            <h1 className="text-2xl font-bold">Submit Task Update</h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {loading ? (
            <p className="text-gray-600">Loading...</p>
          ) : approvedApplications.length === 0 ? (
            <p className="text-gray-600">No approved internships found. You can submit tasks once an internship is approved.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Internship</label>
                <select
                  value={form.internshipId}
                  onChange={(e) => setForm({ ...form, internshipId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                >
                  {approvedApplications.map(a => (
                    <option key={a.id} value={a.internshipId}>
                      {a.internshipTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Implemented user authentication with Firebase"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Description *</label>
                <textarea
                  rows={5}
                  value={form.details}
                  onChange={(e) => setForm({ ...form, details: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Explain your task, approach, tools/technologies used, challenges, and outcomes..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hours Spent</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.hours}
                    onChange={(e) => setForm({ ...form, hours: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., 3.5"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Links (Repo/Docs/Deploy)</label>
                  <input
                    type="text"
                    value={form.links}
                    onChange={(e) => setForm({ ...form, links: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Comma-separated URLs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Work Date</label>
                  <input
                    type="date"
                    value={form.workDate}
                    onChange={(e) => setForm({ ...form, workDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FiSend className="w-4 h-4 mr-2" /> Submit Task Update
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmitTaskUpdate;
