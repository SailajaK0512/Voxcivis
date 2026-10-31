import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { Shield, Bell, User, LogOut, Radio, Check, AlertCircle } from 'lucide-react';

export const Navbar = ({ onNavigate, currentView }) => {
  const { user, logout } = useAuth();
  const { isConnected, subscribe } = useWebSocket();
  const [notifications, setNotifications] = useState([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
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
    fetchNotifications();

    const unsubscribe = subscribe((event) => {
      if (event.type === 'STATUS_CHANGED' || event.type === 'DELAY_ALERT') {
        fetchNotifications();
      }
    });

    return unsubscribe;
  }, [user]);

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('voxcivis_token');
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Civic Branding */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">VoxCivis</span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  GovSafe
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Safe-City & Municipal Administration</p>
            </div>
          </div>

          {/* Right section: Status, Role & Controls */}
          <div className="flex items-center gap-4">
            
            {/* Real-time sync badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-[11px] font-mono">{isConnected ? 'Live Sync' : 'Connecting'}</span>
            </div>

            {user ? (
              <>
                {/* Role indicator pill */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-semibold text-slate-800 capitalize">{user.username}</span>
                  <span className="text-slate-400">|</span>
                  <span className="font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded uppercase text-[10px]">
                    {user.role} {user.department_name ? `• ${user.department_name}` : ''}
                  </span>
                </div>

                {/* Notifications Bell */}
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifMenu(!showNotifMenu)}
                    className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition focus:outline-none"
                    aria-label="View notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown menu */}
                  {showNotifMenu && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                      <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Civic Alerts & Notices
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {unreadCount} unread
                        </span>
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-500">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div 
                              key={n.id} 
                              className={`p-3 text-xs transition ${n.is_read ? 'bg-white opacity-70' : 'bg-blue-50/40'}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2">
                                  {n.message_type === 'delay_alert' ? (
                                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                  ) : (
                                    <Bell className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                  )}
                                  <div>
                                    <p className="font-medium text-slate-900">{n.message}</p>
                                    <span className="text-[10px] text-slate-400 mt-1 block">
                                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                </div>
                                {!n.is_read && (
                                  <button
                                    onClick={() => markAsRead(n.id)}
                                    title="Mark as read"
                                    className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="p-2 rounded-lg text-slate-600 hover:text-red-700 hover:bg-red-50 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('login')}
                  className="civic-btn-secondary text-xs py-2 px-3"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onNavigate('register')}
                  className="civic-btn-primary text-xs py-2 px-3"
                >
                  Citizen Register
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
