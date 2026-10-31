import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { DepartmentPieChart, MonthlyTrendsChart } from '../components/Charts';
import { PriorityBadge, StatusBadge, HazardBadge } from '../components/PriorityBadge';
import { 
  Shield, AlertTriangle, Clock, CheckCircle2, Search, Filter, 
  Users, RefreshCw, BarChart3, Database, MapPin, Building2, Eye
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { subscribe } = useWebSocket();

  // Metrics & Charts
  const [metrics, setMetrics] = useState({
    total_cases: 0,
    critical_severe_cases: 0,
    pending_cases: 0,
    solved_cases: 0,
    in_progress_cases: 0
  });
  const [deptDistribution, setDeptDistribution] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Complaint Table
  const [complaints, setComplaints] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [activeTab, setActiveTab] = useState('complaints'); // 'complaints' or 'users'
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Real-time flash notification banner
  const [liveAlert, setLiveAlert] = useState(null);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('voxcivis_token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // 1. Metrics
      const mRes = await fetch('/api/admin/metrics', { headers });
      if (mRes.ok) setMetrics(await mRes.json());

      // 2. Dept Distribution
      const dRes = await fetch('/api/admin/dept-distribution', { headers });
      if (dRes.ok) setDeptDistribution(await dRes.json());

      // 3. Monthly Trends
      const tRes = await fetch('/api/admin/monthly-trends', { headers });
      if (tRes.ok) setMonthlyTrends(await tRes.json());

      // 4. Departments
      const depRes = await fetch('/api/meta/departments', { headers });
      if (depRes.ok) setDepartments(await depRes.json());

      // 5. Complaints
      fetchComplaints();

      // 6. Users
      const uRes = await fetch('/api/admin/users', { headers });
      if (uRes.ok) setUsersList(await uRes.json());

    } catch (e) {
      console.error("Dashboard fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaints = async () => {
    const token = localStorage.getItem('voxcivis_token');
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== 'All') params.append('status', statusFilter);
    if (deptFilter) params.append('department_id', deptFilter);
    if (priorityFilter && priorityFilter !== 'All') params.append('priority', priorityFilter);
    if (search) params.append('search', search);

    try {
      const res = await fetch(`/api/complaints?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setComplaints(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Subscribe to real-time events via WebSocket
    const unsubscribe = subscribe((event) => {
      if (event.type === 'NEW_COMPLAINT') {
        setLiveAlert(`New incident reported in ${event.payload.department} (${event.payload.priority_classification} priority)`);
        fetchDashboardData();
      } else if (event.type === 'STATUS_CHANGED' || event.type === 'COMPLAINT_UPDATED') {
        fetchDashboardData();
      }
    });

    // Clear live alert after 6 seconds
    let timer;
    if (liveAlert) {
      timer = setTimeout(() => setLiveAlert(null), 6000);
    }

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [liveAlert]);

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, deptFilter, priorityFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Real-time event pop-up banner */}
      {liveAlert && (
        <div className="p-3 bg-blue-600 text-white rounded-lg shadow-md text-xs font-semibold flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>REAL-TIME UPDATE: {liveAlert}</span>
          </div>
          <button onClick={() => setLiveAlert(null)} className="text-white hover:text-blue-200">
            &times;
          </button>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-slate-800" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Municipal Safe-City Command Center
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time cross-departmental grievance telemetry, NLP triage and resolution metrics
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="civic-btn-secondary text-xs flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Dashboard
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Cases */}
        <div className="civic-card p-5 border-l-4 border-l-slate-800">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Cases
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{metrics.total_cases}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">City-wide volume</span>
        </div>

        {/* Severe / Critical Cases */}
        <div className="civic-card p-5 border-l-4 border-l-red-600 bg-red-50/20">
          <span className="text-[11px] font-semibold text-red-700 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Severe / Critical
          </span>
          <div className="text-2xl font-bold text-red-700 mt-1">{metrics.critical_severe_cases}</div>
          <span className="text-[10px] text-red-500 mt-1 block">Immediate hazard triage</span>
        </div>

        {/* Pending Cases */}
        <div className="civic-card p-5 border-l-4 border-l-orange-500">
          <span className="text-[11px] font-semibold text-orange-600 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{metrics.pending_cases}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Awaiting worker assignment</span>
        </div>

        {/* In Progress */}
        <div className="civic-card p-5 border-l-4 border-l-blue-600">
          <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" />
            In Progress
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{metrics.in_progress_cases}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Active field remediation</span>
        </div>

        {/* Solved Cases */}
        <div className="civic-card p-5 border-l-4 border-l-emerald-600">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Solved Cases
          </span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{metrics.solved_cases}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Verified & closed</span>
        </div>

      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Department Pie / Donut Chart */}
        <div className="civic-card p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Department-wise Complaint Distribution
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">Pie Breakdown</span>
          </div>
          <DepartmentPieChart data={deptDistribution} />
        </div>

        {/* Monthly Complaint Trends by Area */}
        <div className="civic-card p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Monthly Complaint Trends by Area
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">District Density</span>
          </div>
          <MonthlyTrendsChart data={monthlyTrends} />
        </div>

      </div>

      {/* Central Database Table Section */}
      <div className="civic-card overflow-hidden">
        
        {/* Table Tabs */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('complaints')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'complaints'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Central Complaint Database ({complaints.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'users'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              User Directory ({usersList.length})
            </button>
          </div>

          {activeTab === 'complaints' && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchComplaints()}
                  placeholder="Search text, address, pincode..."
                  className="civic-input text-xs py-1.5 pl-8 w-44 sm:w-56"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="civic-input text-xs py-1.5 w-28"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Solved">Solved</option>
              </select>

              {/* Department Filter */}
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="civic-input text-xs py-1.5 w-36"
              >
                <option value="">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="civic-input text-xs py-1.5 w-28"
              >
                <option value="All">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

            </div>
          )}

        </div>

        {/* Complaints Table */}
        {activeTab === 'complaints' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-800 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Grievance & Location</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Priority Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Citizen</th>
                  <th className="px-4 py-3">Reports</th>
                  <th className="px-4 py-3">Logged Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400">
                      No complaints match the specified filters.
                    </td>
                  </tr>
                ) : (
                  complaints.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        #{c.id}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-medium text-slate-900 line-clamp-2">
                          {c.complaint_text}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{c.address} ({c.pincode})</span>
                        </div>
                        {c.is_severe && (
                          <div className="mt-1">
                            <HazardBadge isSevere={true} />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-blue-900">
                        {c.department_name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <PriorityBadge classification={c.priority_classification} score={c.priority_score} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {c.citizen_username}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {c.number_of_reports > 1 ? (
                          <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                            {c.number_of_reports} reports
                          </span>
                        ) : (
                          <span className="text-slate-400">1</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-slate-500">
                        {new Date(c.issue_time).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Users Directory */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-800 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Official Role</th>
                  <th className="px-4 py-3">Gov ID</th>
                  <th className="px-4 py-3">Jurisdiction / Address</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Department (Workers)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {u.id}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {u.username}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                        u.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : u.role === 'worker' 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {u.id_number}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {u.district}, {u.state} ({u.pincode})
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {u.phone_number}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {u.department_name || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
