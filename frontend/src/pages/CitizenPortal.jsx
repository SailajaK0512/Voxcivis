import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { PriorityBadge, StatusBadge, HazardBadge } from '../components/PriorityBadge';
import { Send, FileText, CheckCircle2, AlertTriangle, Clock, MapPin, RefreshCw, Bell, AlertCircle } from 'lucide-react';

export const CitizenPortal = () => {
  const { user } = useAuth();
  const { subscribe } = useWebSocket();
  const [complaints, setComplaints] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState(null);

  // Form State
  const [form, setForm] = useState({
    complaint_text: '',
    address: user?.address || '',
    pincode: user?.pincode || '',
    area_importance: 0
  });

  const fetchMyComplaints = async () => {
    try {
      const token = localStorage.getItem('voxcivis_token');
      const res = await fetch('/api/complaints/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setComplaints(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyNotifications = async () => {
    try {
      const token = localStorage.getItem('voxcivis_token');
      const res = await fetch('/api/notifications/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMyComplaints();
    fetchMyNotifications();

    const unsubscribe = subscribe((event) => {
      if (event.type === 'STATUS_CHANGED' || event.type === 'DELAY_ALERT' || event.type === 'COMPLAINT_UPDATED') {
        fetchMyComplaints();
        fetchMyNotifications();
      }
    });

    return unsubscribe;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitFeedback(null);

    try {
      const token = localStorage.getItem('voxcivis_token');
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to submit complaint');
      }

      const created = await res.json();
      setSubmitFeedback({
        type: 'success',
        data: created
      });

      // Clear form
      setForm({
        complaint_text: '',
        address: user?.address || '',
        pincode: user?.pincode || '',
        area_importance: 0
      });

      fetchMyComplaints();
    } catch (err) {
      setSubmitFeedback({
        type: 'error',
        message: err.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Banner */}
      <div className="civic-card p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-semibold text-blue-400 tracking-wider">
            Citizen Grievance Services
          </span>
          <h1 className="text-2xl font-bold mt-1">Welcome, {user?.username}</h1>
          <p className="text-xs text-slate-300 mt-1">
            Registered Jurisdiction: {user?.district}, {user?.state} &bull; Pincode: {user?.pincode}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-2xl font-bold text-white">{complaints.length}</span>
            <span className="text-[11px] text-slate-300 block">Complaints Logged</span>
          </div>
          <button
            onClick={() => { fetchMyComplaints(); fetchMyNotifications(); }}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Complaint Submission Form */}
        <div className="lg:col-span-1">
          <div className="civic-card p-6 sticky top-20">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Lodge Civic Complaint</h2>
            </div>

            {submitFeedback && (
              <div className={`mb-4 p-3.5 rounded-lg text-xs ${
                submitFeedback.type === 'success' 
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {submitFeedback.type === 'success' ? (
                  <div>
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Grievance #{submitFeedback.data.id} Logged!
                    </div>
                    <p className="text-[11px] text-emerald-700 mb-1">
                      <strong>AI Department Routed:</strong> {submitFeedback.data.department_name}
                    </p>
                    <div className="flex items-center gap-2 my-1.5">
                      <span className="text-[11px] text-emerald-900 font-semibold">Priority Assigned:</span>
                      <PriorityBadge classification={submitFeedback.data.priority_classification} score={submitFeedback.data.priority_score} />
                      {submitFeedback.data.is_severe && <HazardBadge isSevere={true} />}
                    </div>
                    {submitFeedback.data.number_of_reports > 1 && (
                      <p className="text-[11px] text-emerald-800 font-semibold mt-1">
                        Linked with {submitFeedback.data.number_of_reports - 1} other matching report(s) in your area!
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{submitFeedback.message}</span>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Describe Civic Issue *
                </label>
                <textarea
                  required
                  rows="4"
                  value={form.complaint_text}
                  onChange={(e) => setForm({ ...form, complaint_text: e.target.value })}
                  placeholder="E.g. Broken transformer sparking near market, road cave-in, sewage overflow..."
                  className="civic-input text-xs"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Automated NLP extracts department and urgent hazard cues.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Incident Address / Landmark *
                </label>
                <input
                  type="text"
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Street, Landmark, Sector"
                  className="civic-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                    placeholder="e.g. 411038"
                    className="civic-input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Area Zone
                  </label>
                  <select
                    value={form.area_importance}
                    onChange={(e) => setForm({ ...form, area_importance: parseInt(e.target.value) })}
                    className="civic-input text-xs"
                  >
                    <option value="0">Standard Residential</option>
                    <option value="10">High-Priority (Hospital/School)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="civic-btn-primary w-full text-xs mt-2"
              >
                {submitting ? 'Analyzing & Filing...' : 'Submit Grievance'}
                <Send className="w-3.5 h-3.5 ml-2" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Submitted Complaints & Real-time Alerts */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recent Advisories & Delay Notices */}
          {notifications.length > 0 && (
            <div className="civic-card p-5 bg-amber-50/50 border-amber-200">
              <div className="flex items-center gap-2 mb-3 text-amber-900 font-bold text-xs uppercase tracking-wider">
                <Bell className="w-4 h-4 text-amber-700" />
                Recent Official Advisories & Status Updates
              </div>
              <div className="space-y-2">
                {notifications.slice(0, 3).map(n => (
                  <div key={n.id} className="p-3 bg-white border border-amber-200 rounded-lg text-xs flex items-start gap-2.5 shadow-2xs">
                    {n.message_type === 'delay_alert' ? (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-slate-800 font-medium">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complaints Table/Cards */}
          <div className="civic-card p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">My Grievance History</h2>
              <span className="text-xs text-slate-500 font-medium">
                {complaints.length} records found
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Loading submitted records...
              </div>
            ) : complaints.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                You have not filed any grievances yet. Use the form on the left to submit an issue.
              </div>
            ) : (
              <div className="space-y-4">
                {complaints.map((c) => (
                  <div key={c.id} className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition bg-slate-50/30">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded">
                          #{c.id}
                        </span>
                        <span className="text-xs font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {c.department_name}
                        </span>
                        <HazardBadge isSevere={c.is_severe} />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <PriorityBadge classification={c.priority_classification} score={c.priority_score} />
                        <StatusBadge status={c.status} />
                      </div>
                    </div>

                    <p className="text-xs font-medium text-slate-800 leading-relaxed mb-3">
                      {c.complaint_text}
                    </p>

                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200 gap-2">
                      <div className="flex items-center gap-1 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.address} ({c.pincode})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {c.number_of_reports > 1 && (
                          <span className="font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            {c.number_of_reports} citizens reported
                          </span>
                        )}
                        <span>Reported: {new Date(c.issue_time).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
