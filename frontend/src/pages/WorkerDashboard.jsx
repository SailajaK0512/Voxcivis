import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { PriorityBadge, StatusBadge, HazardBadge } from '../components/PriorityBadge';
import { 
  Wrench, CheckCircle2, Clock, AlertTriangle, Send, 
  MapPin, RefreshCw, AlertCircle, MessageSquare, ChevronRight, Shield
} from 'lucide-react';

export const WorkerDashboard = () => {
  const { user } = useAuth();
  const { subscribe } = useWebSocket();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status Update Modal/State
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [statusAction, setStatusAction] = useState('In Progress');
  const [statusNote, setStatusNote] = useState('');
  const [delayMessage, setDelayMessage] = useState('');
  const [modalType, setModalType] = useState(null); // 'status' or 'delay'
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchWorkerComplaints = async () => {
    try {
      const token = localStorage.getItem('voxcivis_token');
      const res = await fetch('/api/worker/complaints', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setComplaints(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkerComplaints();

    const unsubscribe = subscribe((event) => {
      if (event.type === 'NEW_COMPLAINT' || event.type === 'COMPLAINT_UPDATED' || event.type === 'STATUS_CHANGED') {
        fetchWorkerComplaints();
      }
    });

    return unsubscribe;
  }, [user]);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!activeComplaint) return;
    setActionLoading(true);

    try {
      const token = localStorage.getItem('voxcivis_token');
      const res = await fetch(`/api/complaints/${activeComplaint.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: statusAction,
          note: statusNote || undefined
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Status update failed');
      }

      setFeedback({
        type: 'success',
        text: `Complaint #${activeComplaint.id} updated to '${statusAction}'. Citizen notified.`
      });

      setModalType(null);
      setStatusNote('');
      fetchWorkerComplaints();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendDelay = async (e) => {
    e.preventDefault();
    if (!activeComplaint || !delayMessage.trim()) return;
    setActionLoading(true);

    try {
      const token = localStorage.getItem('voxcivis_token');
      const res = await fetch(`/api/complaints/${activeComplaint.id}/delay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: delayMessage })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to dispatch delay notice');
      }

      setFeedback({
        type: 'success',
        text: `Official delay advisory sent to citizen for complaint #${activeComplaint.id}.`
      });

      setModalType(null);
      setDelayMessage('');
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = complaints.filter(c => c.status === 'Pending').length;
  const inProgressCount = complaints.filter(c => c.status === 'In Progress').length;
  const solvedCount = complaints.filter(c => c.status === 'Solved').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Department Header Banner */}
      <div className="civic-card p-6 bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-semibold text-amber-400 tracking-wider">
              Field Operations Workbench
            </span>
          </div>
          <h1 className="text-2xl font-bold mt-1">
            Department of {user?.department_name || 'Municipal Services'}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Worker ID: {user?.id_number} &bull; Official Account: {user?.username} &bull; Security Scope: Department-Restricted
          </p>
        </div>

        <button
          onClick={fetchWorkerComplaints}
          className="civic-btn-secondary text-xs bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Sync Queue
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-lg text-xs font-semibold flex items-center justify-between ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-500 hover:text-slate-800">
            &times;
          </button>
        </div>
      )}

      {/* Mini KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="civic-card p-4 border-l-4 border-l-orange-500">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pending Action</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{pendingCount}</div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Highest priority at top</span>
        </div>
        <div className="civic-card p-4 border-l-4 border-l-blue-500">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">In Progress</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{inProgressCount}</div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Crew currently deployed</span>
        </div>
        <div className="civic-card p-4 border-l-4 border-l-emerald-500">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Solved by Dept</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{solvedCount}</div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Closed tickets</span>
        </div>
      </div>

      {/* Department Complaint Stream */}
      <div className="civic-card p-6">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Assigned Field Incidents ({complaints.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Complaints classified into your department via automated ML triage
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
            Sorted by Urgency Score
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading department queue...</div>
        ) : complaints.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No active incidents logged for {user?.department_name}. All clean!
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map(c => (
              <div 
                key={c.id} 
                className={`p-5 rounded-xl border transition ${
                  c.status === 'Solved' 
                    ? 'bg-slate-50/60 border-slate-200 opacity-80' 
                    : c.is_severe 
                    ? 'bg-red-50/20 border-red-200' 
                    : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 bg-slate-200 text-slate-900 rounded">
                      #{c.id}
                    </span>
                    <HazardBadge isSevere={c.is_severe} />
                    <PriorityBadge classification={c.priority_classification} score={c.priority_score} />
                    <StatusBadge status={c.status} />
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveComplaint(c);
                        setStatusAction(c.status === 'Pending' ? 'In Progress' : 'Solved');
                        setModalType('status');
                      }}
                      className="civic-btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      Update Status
                    </button>
                    <button
                      onClick={() => {
                        setActiveComplaint(c);
                        setModalType('delay');
                      }}
                      className="civic-btn-secondary text-xs py-1.5 px-3 text-amber-700 hover:bg-amber-50 border-amber-200 flex items-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Notify Delay
                    </button>
                  </div>
                </div>

                {/* Complaint text */}
                <p className="text-sm font-medium text-slate-900 mb-3 leading-relaxed">
                  {c.complaint_text}
                </p>

                {/* Location & Metadata footer */}
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 gap-2">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium">{c.address}</span>
                    <span className="text-slate-400 font-mono">({c.pincode})</span>
                  </div>

                  <div className="flex items-center gap-4 text-[11px]">
                    {c.number_of_reports > 1 && (
                      <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {c.number_of_reports} citizens reported
                      </span>
                    )}
                    <span>Logged by: <strong className="text-slate-700">{c.citizen_username}</strong></span>
                    <span>Date: {new Date(c.issue_time).toLocaleString()}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* Modal: Update Status */}
      {modalType === 'status' && activeComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="civic-card p-6 max-w-md w-full bg-white shadow-xl animate-fade-in">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Update Status &bull; Complaint #{activeComplaint.id}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Updating status will automatically notify the citizen and update the municipal admin dashboard in real-time.
            </p>

            <form onSubmit={handleStatusUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Resolution Status *
                </label>
                <select
                  value={statusAction}
                  onChange={(e) => setStatusAction(e.target.value)}
                  className="civic-input text-xs font-semibold"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress (Crew Dispatched)</option>
                  <option value="Solved">Solved (Work Verified & Closed)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Worker Action Note (Optional)
                </label>
                <textarea
                  rows="3"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="E.g. Repaired high voltage transformer line fuse, tested with multimeter."
                  className="civic-input text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="civic-btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="civic-btn-primary text-xs"
                >
                  {actionLoading ? 'Saving...' : 'Confirm & Notify Citizen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Notify Delay */}
      {modalType === 'delay' && activeComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="civic-card p-6 max-w-md w-full bg-white shadow-xl animate-fade-in">
            <div className="flex items-center gap-2 mb-2 text-amber-700">
              <Clock className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">
                Dispatch Delay Advisory &bull; #{activeComplaint.id}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Citizens must be promptly informed when municipal work is delayed due to weather, parts supply, or grid shutdowns.
            </p>

            <form onSubmit={handleSendDelay} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Delay *
                </label>
                <textarea
                  required
                  rows="3"
                  value={delayMessage}
                  onChange={(e) => setDelayMessage(e.target.value)}
                  placeholder="E.g. Awaiting specialized valve replacement from main depot. Work resumes tomorrow at 9 AM."
                  className="civic-input text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="civic-btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="civic-btn-primary bg-amber-600 hover:bg-amber-700 text-xs text-white"
                >
                  {actionLoading ? 'Sending Alert...' : 'Send Advisory to Citizen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
