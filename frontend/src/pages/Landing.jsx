import React from 'react';
import { Shield, User, Wrench, ShieldCheck, ArrowRight, Activity, MapPin, CheckCircle } from 'lucide-react';

export const Landing = ({ onSelectRole }) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 text-center">
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-6 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Official Municipal Safe-City Administration Portal</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 max-w-3xl mx-auto leading-tight">
          VoxCivis Citizen Complaint Management
        </h1>
        
        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Intelligent civic incident reporting, machine-learning department routing, 
          and transparent municipal resolution tracking for safe communities.
        </p>

        {/* Core Value Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Automated AI Dept Classification</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>Hazard & Severity Detection</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-amber-600" />
            <span>Real-time WebSocket Tracking</span>
          </div>
        </div>

      </div>

      {/* Role Selection Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-slate-900">Select Your Portal Access</h2>
          <p className="text-xs text-slate-500 mt-1">Choose your official capacity to sign in or register</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* 1. Citizen Role Card */}
          <div className="civic-card p-6 flex flex-col justify-between hover:border-blue-400 hover:shadow-md transition group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
                <User className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Citizen Portal</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Submit civic grievances, upload incident locations, track real-time ticket progress, and receive automated delay advisories.
              </p>
              <ul className="text-[11px] text-slate-500 space-y-1.5 mb-6">
                <li>• File complaints with Pincode & address</li>
                <li>• View personalized status history</li>
                <li>• Receive real-time worker updates</li>
              </ul>
            </div>
            <div className="pt-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => onSelectRole('citizen', 'login')}
                className="civic-btn-primary w-full text-xs"
              >
                Citizen Sign In
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </button>
            </div>
          </div>

          {/* 2. Admin Role Card */}
          <div className="civic-card p-6 flex flex-col justify-between hover:border-slate-800 hover:shadow-md transition group border-slate-300">
            <div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 mb-4 group-hover:bg-slate-900 group-hover:text-white transition">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Municipal Administrator</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Full-city administrative oversight, department complaint breakdown charts, monthly area trend analytics, and master registry search.
              </p>
              <ul className="text-[11px] text-slate-500 space-y-1.5 mb-6">
                <li>• City-wide KPI dashboard & severe case counts</li>
                <li>• Live department distribution pie chart</li>
                <li>• Filterable master complaint & user records</li>
              </ul>
            </div>
            <div className="pt-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => onSelectRole('admin', 'login')}
                className="civic-btn-primary w-full bg-slate-900 hover:bg-slate-800 text-xs"
              >
                Admin Sign In
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </button>
            </div>
          </div>

          {/* 3. Worker Role Card */}
          <div className="civic-card p-6 flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-4 group-hover:bg-amber-600 group-hover:text-white transition">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Department Worker</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Dedicated operational workbench strictly scoped to your assigned municipal department. Prioritize issues by dynamic urgency scores.
              </p>
              <ul className="text-[11px] text-slate-500 space-y-1.5 mb-6">
                <li>• Department-isolated complaint stream</li>
                <li>• Mark resolved & trigger citizen alerts</li>
                <li>• Dispatch delay notices with justification</li>
              </ul>
            </div>
            <div className="pt-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => onSelectRole('worker', 'login')}
                className="civic-btn-primary w-full bg-slate-800 hover:bg-slate-700 text-xs"
              >
                Worker Sign In
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Quick Demo Access Bar */}
        <div className="mt-8 p-4 rounded-xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Quick Demo Credentials:</span>
            <span>Admin: <code className="bg-white px-1.5 py-0.5 rounded border text-slate-700">admin / admin123</code></span>
            <span>• Citizen: <code className="bg-white px-1.5 py-0.5 rounded border text-slate-700">citizen1 / citizen123</code></span>
            <span>• Worker: <code className="bg-white px-1.5 py-0.5 rounded border text-slate-700">worker_power / worker123</code></span>
          </div>
          <button
            onClick={() => onSelectRole('citizen', 'register')}
            className="text-blue-700 font-semibold hover:underline"
          >
            Create New Citizen Account &rarr;
          </button>
        </div>

      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        VoxCivis Municipal Safe-City Governance System &bull; Public Grievance Redressal Mechanism &bull; Designed for Municipal Integrity
      </footer>

    </div>
  );
};
