import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, UserPlus, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export const Register = ({ onNavigate }) => {
  const { register } = useAuth();
  const [locations, setLocations] = useState({});
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    id_number: '',
    date_of_birth: '',
    phone_number: '',
    state: '',
    district: '',
    mandal: '',
    sector: '',
    village_name: '',
    pincode: '',
    address: '',
    role: 'citizen',
    department_id: ''
  });

  useEffect(() => {
    // Fetch state and districts
    fetch('/api/meta/locations')
      .then(r => r.json())
      .then(data => {
        setLocations(data);
        const firstState = Object.keys(data)[0];
        if (firstState) {
          setForm(prev => ({
            ...prev,
            state: firstState,
            district: data[firstState][0] || ''
          }));
        }
      })
      .catch(console.error);

    // Fetch departments
    fetch('/api/meta/departments')
      .then(r => r.json())
      .then(data => setDepartments(data))
      .catch(console.error);
  }, []);

  const handleStateChange = (e) => {
    const selectedState = e.target.value;
    const districtList = locations[selectedState] || [];
    setForm(prev => ({
      ...prev,
      state: selectedState,
      district: districtList[0] || ''
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!/\d/.test(form.password)) {
      setError('Password must contain at least one number.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        username: form.username,
        password: form.password,
        id_number: form.id_number,
        date_of_birth: form.date_of_birth,
        phone_number: form.phone_number,
        state: form.state,
        district: form.district,
        mandal: form.mandal,
        sector: form.sector,
        village_name: form.village_name,
        pincode: form.pincode,
        address: form.address,
        role: form.role,
        department_id: form.role === 'worker' && form.department_id ? parseInt(form.department_id) : null
      };

      const user = await register(payload);
      if (user.role === 'admin') onNavigate('admin');
      else if (user.role === 'worker') onNavigate('worker');
      else onNavigate('citizen');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto civic-card p-8">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-3 shadow-xs">
            <UserPlus className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Official Municipal Registration</h2>
          <p className="text-xs text-slate-500 mt-1">
            Complete your citizen identity profile to submit grievances and track civic services
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Account Credentials */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 pb-1 border-b border-slate-200">
              1. Account Credentials & Security
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  required
                  value={form.username}
                  onChange={handleChange}
                  placeholder="e.g. rahul_sharma"
                  className="civic-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password * (Min 6, 1 number)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="password"
                    required
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                    spellCheck="false"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min 6 chars + digit"
                    className={`civic-input pr-10 ${showPassword ? '' : 'secure-masked'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="confirmPassword"
                    required
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                    spellCheck="false"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat password"
                    className={`civic-input pr-10 ${showPassword ? '' : 'secure-masked'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Identity & Personal Info */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 pb-1 border-b border-slate-200">
              2. Citizen Identification & Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  National / Voter ID *
                </label>
                <input
                  type="text"
                  name="id_number"
                  required
                  value={form.id_number}
                  onChange={handleChange}
                  placeholder="e.g. CIT-IND-8849"
                  className="civic-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  required
                  value={form.date_of_birth}
                  onChange={handleChange}
                  className="civic-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  required
                  value={form.phone_number}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  className="civic-input"
                />
              </div>
            </div>
          </div>

          {/* Regional & Civic Jurisdiction (Dropdowns) */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 pb-1 border-b border-slate-200">
              3. Jurisdiction & Location Details
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State (Dropdown) *
                </label>
                <select
                  value={form.state}
                  onChange={handleStateChange}
                  className="civic-input"
                >
                  {Object.keys(locations).map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  District (Dropdown) *
                </label>
                <select
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  className="civic-input"
                >
                  {(locations[form.state] || []).map(dist => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mandal *
                </label>
                <input
                  type="text"
                  name="mandal"
                  required
                  value={form.mandal}
                  onChange={handleChange}
                  placeholder="e.g. Kothrud"
                  className="civic-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sector *
                </label>
                <input
                  type="text"
                  name="sector"
                  required
                  value={form.sector}
                  onChange={handleChange}
                  placeholder="e.g. Sector 4"
                  className="civic-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Village / Locality *
                </label>
                <input
                  type="text"
                  name="village_name"
                  required
                  value={form.village_name}
                  onChange={handleChange}
                  placeholder="e.g. Shivajinagar"
                  className="civic-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pincode *
                </label>
                <input
                  type="text"
                  name="pincode"
                  required
                  value={form.pincode}
                  onChange={handleChange}
                  placeholder="e.g. 411038"
                  className="civic-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Street Address *
              </label>
              <textarea
                name="address"
                rows="2"
                required
                value={form.address}
                onChange={handleChange}
                placeholder="House / Flat No., Landmark, Street"
                className="civic-input"
              />
            </div>
          </div>

          {/* Role Specification */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 pb-1 border-b border-slate-200">
              4. System Role Allocation
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select User Role *
                </label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="civic-input font-medium"
                >
                  <option value="citizen">Citizen (Grievance Filing & Tracking)</option>
                  <option value="worker">Department Worker (Field Resolution)</option>
                  <option value="admin">Administrator (Municipal Oversight)</option>
                </select>
              </div>

              {form.role === 'worker' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Designated Department *
                  </label>
                  <select
                    name="department_id"
                    required
                    value={form.department_id}
                    onChange={handleChange}
                    className="civic-input font-medium text-blue-900"
                  >
                    <option value="">-- Choose Assigned Department --</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Already registered? Sign In
            </button>
            <button
              type="submit"
              disabled={loading}
              className="civic-btn-primary"
            >
              {loading ? 'Registering Citizen Profile...' : 'Complete Registration'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
