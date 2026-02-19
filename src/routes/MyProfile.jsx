import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../Authentication/AuthProvider';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import PageContainer from '../components/layout/PageContainer';

export default function MyProfile() {
  const { user, sendVerificationEmail, reloadUser } = useContext(AuthContext);
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);

  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

  // Client data from API
  const [clientData, setClientData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    phone: '',
    email: user?.email || '',
    address1: '',
    address2: '',
    city: '',
    country: '',
    zip: '',
    workExperience: '',
    headline: '',
    bio: '',
    skills: [],
    profileCover: '',
    createdAt: '',
    updatedAt: '',
    lastActiveAt: '',
    emailVerified: false,
    // Computed fields
    totalJobsPosted: 0,
    averageRating: 0,
    stats: null,
    // Client-specific fields
    preferences: { categories: [], budgetMin: null, budgetMax: null, currency: 'BDT' }
  });

  const [editForm, setEditForm] = useState(clientData);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Fetch user profile data
  const fetchUserProfile = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      
      // First, sync the user to ensure they exist in the database
      await axios.post(`${base}/api/auth/sync`, {
        uid: user.uid,
        email: user.email,
        role: 'client'
      });

      // Then fetch the user profile
      const response = await axios.get(`${base}/api/users/${user.uid}`);
      const userData = response.data;
      
      // Update client data with API response
      setClientData(prev => ({
        ...prev,
        ...userData,
        // Ensure profileCover is preserved if it exists and is valid
        profileCover: (userData.profileCover && userData.profileCover.trim()) ? userData.profileCover : (prev.profileCover || ''),
        // Ensure computed fields have defaults
        totalJobsPosted: userData.totalJobsPosted || 0,
        averageRating: userData.averageRating || 0,
        stats: userData.stats || null,
        preferences: userData.preferences || { categories: [], budgetMin: null, budgetMax: null, currency: 'BDT' },
        emailVerified: userData.emailVerified || false,
        lastActiveAt: userData.lastActiveAt || null,
      }));
      
      // Update edit form with the fetched data
      setEditForm(prev => ({
        ...prev,
        ...userData,
        preferences: userData.preferences || { categories: [], budgetMin: null, budgetMax: null, currency: 'BDT' }
      }));
      
      
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Keep default values if fetch fails
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateUserProfile = async (profileData) => {
    if (!user?.uid) return;
    
    try {
      setSaving(true);
      
      const response = await axios.patch(`${base}/api/users/${user.uid}`, profileData);
      const updatedData = response.data;
      
      // Update local state with the response
      setClientData(prev => ({
        ...prev,
        ...updatedData
      }));
      
      return updatedData;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Upload avatar
  const uploadAvatar = async (file) => {
    if (!user?.uid || !file) return;
    
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await axios.post(`${base}/api/users/${user.uid}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Server returns absolute URL, use it directly
      const url = response.data?.url;
      if (!url) throw new Error('No URL returned from server');
      return url;
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      throw error;
    }
  };

  // Fetch profile data on component mount
  useEffect(() => {
    fetchUserProfile();
  }, [user?.uid]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      // Prepare data for API (only include fields that should be updated)
      const updateData = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        displayName: editForm.displayName,
        phone: editForm.phone,
        email: editForm.email,
        workExperience: editForm.workExperience,
        headline: editForm.headline,
        bio: editForm.bio,
        skills: editForm.skills,
        address1: editForm.address1,
        address2: editForm.address2,
        city: editForm.city,
        country: editForm.country,
        zip: editForm.zip,
        preferences: editForm.preferences || { categories: [], budgetMin: null, budgetMax: null, currency: 'BDT' }
      };

      await updateUserProfile(updateData);
      alert('Profile updated successfully!');
      setActiveTab('overview'); // Switch back to overview tab
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handlePasswordUpdate = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    // Here you would call API to update password
    alert('Password updated successfully!');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setIsChangingPassword(false);
  };

  const addSkill = (skill) => {
    if (skill.trim() && !editForm.skills.includes(skill.trim())) {
      setEditForm(prev => ({
        ...prev,
        skills: [...prev.skills, skill.trim()]
      }));
    }
  };

  const removeSkill = (skillToRemove) => {
    setEditForm(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSendVerificationEmail = async () => {
    try {
      setSendingVerification(true);
      await sendVerificationEmail();
      alert('Verification email sent! Please check your inbox.');
    } catch (e) {
      console.error(e);
      alert(e.message || 'Failed to send verification email');
    } finally {
      setSendingVerification(false);
    }
  };

  const handleCheckVerification = async () => {
    try {
      await reloadUser();
      if (user?.emailVerified) {
        // Sync to server
        await axios.patch(`${base}/api/users/${user.uid}`, { emailVerified: true });
        setClientData(prev => ({ ...prev, emailVerified: true }));
        alert('Email verified!');
      } else {
        alert('Email not verified yet. Please check your inbox and click the verification link.');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to check verification status');
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      setSaving(true);
      const url = await uploadAvatar(file);
      
      // Update both states immediately with the new URL
      setClientData(prev => ({ ...prev, profileCover: url }));
      setEditForm(prev => ({ ...prev, profileCover: url }));
      
      // Refresh profile data without showing loading screen
      // Use a separate fetch that doesn't set loading state
      try {
        const response = await axios.get(`${base}/api/users/${user.uid}`);
        const userData = response.data;
        // Only update profileCover if server has it, otherwise keep our uploaded URL
        if (userData.profileCover && userData.profileCover.trim()) {
          setClientData(prev => ({ ...prev, ...userData, profileCover: userData.profileCover }));
          setEditForm(prev => ({ ...prev, ...userData, profileCover: userData.profileCover }));
        } else {
          // Server might not have it yet, keep our local URL
          setClientData(prev => ({ ...prev, ...userData, profileCover: url }));
          setEditForm(prev => ({ ...prev, ...userData, profileCover: url }));
        }
      } catch (refreshError) {
        console.warn('Failed to refresh profile after upload:', refreshError);
        // Continue anyway - we already have the URL
      }
      
      alert('Avatar updated successfully!');
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderOverview = () => {
    const stats = clientData.stats || {};
    const fullAddress = [clientData.address1, clientData.address2, clientData.city, clientData.country].filter(Boolean).join(', ');
    const publicLocation = [clientData.city, clientData.country].filter(Boolean).join(', ') || '—';

    return (
      <div className="space-y-6">
        {/* Hiring Credibility */}
        {stats && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-base-content">Hiring Credibility</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`rounded-lg p-4 transition-colors duration-300 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="text-2xl font-bold text-primary">{clientData.totalJobsPosted || 0}</div>
                <div className="text-sm text-base-content opacity-70">Jobs Posted</div>
              </div>
              <div className={`rounded-lg p-4 transition-colors duration-300 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="text-2xl font-bold text-primary">{stats.clientJobsCompleted || 0}</div>
                <div className="text-sm text-base-content opacity-70">Jobs Completed</div>
              </div>
              <div className={`rounded-lg p-4 transition-colors duration-300 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="text-2xl font-bold text-primary">{stats.clientHireRate || 0}%</div>
                <div className="text-sm text-base-content opacity-70">Hire Rate</div>
              </div>
              <div className={`rounded-lg p-4 transition-colors duration-300 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="text-2xl font-bold text-primary">{stats.clientCancellationRate || 0}%</div>
                <div className="text-sm text-base-content opacity-70">Cancellation Rate</div>
              </div>
            </div>
          </div>
        )}

        {/* Account Transparency */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-base-content">Account Information</h3>
          <div className={`rounded-lg p-4 transition-colors duration-300 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="space-y-2">
              {clientData.createdAt && (
                <div className="flex justify-between">
                  <span className="text-base-content opacity-70">Member Since:</span>
                  <span className="text-base-content font-medium">{new Date(clientData.createdAt).toLocaleDateString()}</span>
                </div>
              )}
              {clientData.lastActiveAt && (
                <div className="flex justify-between">
                  <span className="text-base-content opacity-70">Last Active:</span>
                  <span className="text-base-content font-medium">{new Date(clientData.lastActiveAt).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-base-content opacity-70">Email Verified:</span>
                <div className="flex items-center gap-2">
                  <span className={`badge ${(user?.emailVerified || clientData.emailVerified) ? 'badge-success' : 'badge-warning'}`}>
                    {(user?.emailVerified || clientData.emailVerified) ? 'Verified' : 'Not Verified'}
                  </span>
                  {!(user?.emailVerified || clientData.emailVerified) && (
                    <button
                      type="button"
                      className="btn btn-xs btn-primary"
                      onClick={handleSendVerificationEmail}
                      disabled={sendingVerification}
                    >
                      {sendingVerification ? 'Sending...' : 'Verify'}
                    </button>
                  )}
                </div>
              </div>
              {!(user?.emailVerified || clientData.emailVerified) && (
                <div className="mt-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline w-full"
                    onClick={handleCheckVerification}
                  >
                    Check Verification Status
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preferences */}
        {clientData.preferences && (clientData.preferences.categories?.length > 0 || clientData.preferences.budgetMin || clientData.preferences.budgetMax) && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-base-content">Job Preferences</h3>
            <div className={`rounded-lg p-4 transition-colors duration-300 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              {clientData.preferences.categories?.length > 0 && (
                <div className="mb-3">
                  <span className="text-sm text-base-content opacity-70">Preferred Categories: </span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {clientData.preferences.categories.map((cat, i) => (
                      <span key={i} className="badge badge-outline">{cat}</span>
                    ))}
                  </div>
                </div>
              )}
              {(clientData.preferences.budgetMin || clientData.preferences.budgetMax) && (
                <div>
                  <span className="text-sm text-base-content opacity-70">Budget Range: </span>
                  <span className="text-base-content font-medium">
                    {clientData.preferences.currency} {clientData.preferences.budgetMin || '0'} - {clientData.preferences.budgetMax || '∞'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* About Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-base-content">About</h3>
          <div className={`rounded-lg p-4 transition-colors duration-300 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            {clientData.bio ? (
              <p className="text-base-content opacity-80">{clientData.bio}</p>
            ) : (
              <p className="italic text-base-content opacity-60">
                This client hasn't written an about section yet. Add a short intro in Edit Profile.
              </p>
            )}
          </div>
        </div>

        {/* Profile Details */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-base-content">Profile Details</h3>
          <div className="space-y-3">
            {[
              { label: 'Full Name', value: `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim() || '—' },
              { label: 'Phone', value: clientData.phone || '—' },
              { label: 'Email', value: clientData.email || '—' },
              { label: 'Location', value: publicLocation, note: 'Public view shows city/area only' },
              { label: 'Full Address', value: fullAddress || '—', note: 'Private - only visible to you' },
              { label: 'Work Experience', value: clientData.workExperience || '—' },
              { label: 'Headline', value: clientData.headline || '—' },
              { label: 'Skills', value: clientData.skills && clientData.skills.length > 0 ? clientData.skills.join(', ') : '—' },
            ].map((item, index) => (
              <div key={index} className={`flex justify-between items-center py-2 border-b last:border-b-0 ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className="flex-1">
                  <span className="font-medium text-base-content opacity-80">{item.label}:</span>
                  {item.note && <span className="text-xs text-base-content opacity-50 ml-2">({item.note})</span>}
                </div>
                <span className="text-base-content">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderEditProfile = () => (
    <div className="space-y-6">
      {/* Account Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-base-content">Account</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-base-content opacity-80">First Name</label>
            <input
              type="text"
              name="firstName"
              value={editForm.firstName}
              onChange={handleEditChange}
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-base-content opacity-80">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={editForm.lastName}
              onChange={handleEditChange}
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-base-content opacity-80">Display Name</label>
            <input
              type="text"
              name="displayName"
              value={editForm.displayName}
              onChange={handleEditChange}
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-base-content opacity-80">Work Experience (years)</label>
            <input
              type="text"
              name="workExperience"
              value={editForm.workExperience}
              onChange={handleEditChange}
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-base-content opacity-80">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={editForm.phone}
              onChange={handleEditChange}
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-base-content opacity-80">Email</label>
            <input
              type="email"
              name="email"
              value={editForm.email}
              onChange={handleEditChange}
              className="input input-bordered w-full"
            />
          </div>
        </div>
      </div>

      {/* Headline */}
      <div>
        <label className="block text-sm font-medium text-base-content opacity-80 mb-1">Headline (optional)</label>
        <input
          type="text"
          name="headline"
          value={editForm.headline}
          onChange={handleEditChange}
          placeholder="e.g., Professional Client | 5+ years"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-base-content opacity-80 mb-1">Bio (optional)</label>
        <textarea
          name="bio"
          value={editForm.bio}
          onChange={handleEditChange}
          rows={4}
          placeholder="Tell workers about your experience and specialties..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Skills */}
      <div>
        <label className="block text-sm font-medium text-base-content opacity-80 mb-1">Skills (optional)</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="e.g., Project Management, Quality Control"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addSkill(e.target.value);
                e.target.value = '';
              }
            }}
          />
          <button
            type="button"
            onClick={(e) => {
              const input = e.target.previousElementSibling;
              addSkill(input.value);
              input.value = '';
            }}
            className="btn btn-primary"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {editForm.skills.map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-base-200 text-base-content rounded-full text-sm"
            >
              {skill}
              <button
                onClick={() => removeSkill(skill)}
                className="text-base-content opacity-60 hover:text-error"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Preferences */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-base-content">Job Preferences</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-base-content opacity-80">Preferred Job Categories</label>
            <div className="flex flex-wrap gap-2">
              {['Plumber', 'Electrician', 'Carpenter', 'Painter', 'Mechanic', 'AC Repair', 'Appliance Repair', 'Mason', 'Welder', 'Other'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    const cats = editForm.preferences?.categories || [];
                    const newCats = cats.includes(cat)
                      ? cats.filter(c => c !== cat)
                      : [...cats, cat];
                    setEditForm(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, categories: newCats }
                    }));
                  }}
                  className={`btn btn-sm ${(editForm.preferences?.categories || []).includes(cat) ? 'btn-primary' : 'btn-outline'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-base-content opacity-80">Minimum Budget ({editForm.preferences?.currency || 'BDT'})</label>
              <input
                type="number"
                value={editForm.preferences?.budgetMin || ''}
                onChange={(e) => setEditForm(prev => ({
                  ...prev,
                  preferences: { ...prev.preferences, budgetMin: e.target.value ? Number(e.target.value) : null }
                }))}
                placeholder="e.g., 500"
                className="input input-bordered w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-base-content opacity-80">Maximum Budget ({editForm.preferences?.currency || 'BDT'})</label>
              <input
                type="number"
                value={editForm.preferences?.budgetMax || ''}
                onChange={(e) => setEditForm(prev => ({
                  ...prev,
                  preferences: { ...prev.preferences, budgetMax: e.target.value ? Number(e.target.value) : null }
                }))}
                placeholder="e.g., 5000"
                className="input input-bordered w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Address */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-base-content">Address</h3>
        <p className="text-sm text-base-content opacity-70 mb-3">
          <i className="fas fa-info-circle mr-1"></i>
          Public profiles show only city/area. Full address is private and only shared after booking.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-base-content opacity-80">Address Line 1</label>
            <input
              type="text"
              name="address1"
              value={editForm.address1 || ''}
              onChange={handleEditChange}
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-base-content opacity-80">Address Line 2</label>
            <input
              type="text"
              name="address2"
              value={editForm.address2 || ''}
              onChange={handleEditChange}
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-base-content opacity-80">City</label>
            <input
              type="text"
              name="city"
              value={editForm.city || ''}
              onChange={handleEditChange}
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-base-content opacity-80">Country</label>
            <input
              type="text"
              name="country"
              value={editForm.country || ''}
              onChange={handleEditChange}
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-base-content opacity-80">ZIP Code</label>
            <input
              type="text"
              name="zip"
              value={editForm.zip || ''}
              onChange={handleEditChange}
              className="input input-bordered w-full"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => setIsEditing(false)}
          className="btn btn-ghost"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving && <i className="fas fa-spinner fa-spin"></i>}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );

  const renderChangePassword = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-base-content">Change Password</h3>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium mb-1 text-base-content opacity-80">Current Password</label>
            <input
              type="password"
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-base-content opacity-80">New Password</label>
            <input
              type="password"
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-base-content opacity-80">Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              className="input input-bordered w-full"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handlePasswordUpdate}
          className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          Update Password
        </button>
      </div>
    </div>
  );

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center transition-colors duration-300 page-bg">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-base-content opacity-70">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-300 page-bg">
      {/* Header */}
      <div className={`shadow-sm border-b transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-base-content">My Profile</h1>
            <p className="mt-2 text-base-content opacity-70">
              Manage your professional information and showcase your skills to potential workers.
            </p>
          </div>
        </div>
      </div>

      <PageContainer>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Profile Summary */}
          <div className="lg:col-span-1">
            <div className={`rounded-xl shadow-sm p-6 sticky top-8 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="text-center">
                {/* Profile Picture */}
                <div className="relative inline-block mb-4">
                  <img
                    src={(clientData.profileCover && clientData.profileCover.trim()) ? clientData.profileCover : "https://i.pravatar.cc/150?img=3"}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-green-100"
                    onError={(e) => {
                      console.error('Failed to load profile image:', clientData.profileCover);
                      // Only set fallback if it's not already the fallback
                      if (e.target.src !== "https://i.pravatar.cc/150?img=3") {
                        e.target.src = "https://i.pravatar.cc/150?img=3";
                      }
                    }}
                    onLoad={() => {
                      console.log('Profile image loaded successfully:', clientData.profileCover);
                    }}
                  />
                  {saving && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center z-10">
                      <i className="fas fa-spinner fa-spin text-white text-xl"></i>
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <i className="fas fa-check text-white text-sm"></i>
                  </div>
                  {/* Upload Button */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={saving}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <i className="fas fa-camera text-white text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></i>
                  </div>
                </div>

                {/* Name and Phone */}
                <h2 className="text-xl font-bold mb-1 text-base-content">
                  {clientData.displayName || `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim() || 'Client'}
                </h2>
                <p className="mb-6 text-base-content opacity-70">{clientData.phone || 'No phone number'}</p>

                {/* Trust Badges */}
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {user?.emailVerified || clientData.emailVerified ? (
                    <span className="badge badge-success gap-1">
                      <i className="fas fa-check-circle"></i>Email Verified
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="badge badge-warning gap-1">
                        <i className="fas fa-exclamation-triangle"></i>Email Not Verified
                      </span>
                      <button
                        type="button"
                        className="btn btn-xs btn-primary"
                        onClick={handleSendVerificationEmail}
                        disabled={sendingVerification}
                        title="Send verification email"
                      >
                        {sendingVerification ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i> Sending...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-envelope"></i> Verify
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  {clientData.createdAt && (
                    <span className="badge badge-outline gap-1 text-xs">
                      <i className="fas fa-calendar"></i>Member since {new Date(clientData.createdAt).getFullYear()}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className={`rounded-lg p-3 transition-colors duration-300 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <p className="text-2xl font-bold text-primary">{clientData.averageRating || '0.0'}</p>
                    <p className="text-sm text-base-content opacity-70">Rating</p>
                  </div>
                  <div className="rounded-lg p-3 transition-colors duration-300 bg-base-200">
                    <p className="text-2xl font-bold text-base-content">{clientData.totalJobsPosted || 0}</p>
                    <p className="text-sm text-base-content opacity-70">Jobs Posted</p>
                  </div>
                  {clientData.stats && (
                    <>
                      {clientData.stats.clientJobsCompleted !== undefined && (
                        <div className={`rounded-lg p-3 transition-colors duration-300 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <p className="text-2xl font-bold text-primary">{clientData.stats.clientJobsCompleted || 0}</p>
                          <p className="text-sm text-base-content opacity-70">Completed</p>
                        </div>
                      )}
                      {clientData.stats.clientHireRate !== undefined && (
                        <div className={`rounded-lg p-3 transition-colors duration-300 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <p className="text-2xl font-bold text-primary">{clientData.stats.clientHireRate || 0}%</p>
                          <p className="text-sm text-base-content opacity-70">Hire Rate</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* Right Panel - Profile Management */}
          <div className="lg:col-span-2">
            <div className={`rounded-xl shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              {/* Navigation Tabs */}
              <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'overview'
                        ? `border-primary text-primary bg-primary/20`
                        : `border-transparent text-base-content opacity-60 hover:opacity-80`
                    }`}
                  >
                    <i className="fas fa-eye"></i>
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('edit')}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'edit'
                        ? `border-primary text-primary bg-primary/20`
                        : `border-transparent text-base-content opacity-60 hover:opacity-80`
                    }`}
                  >
                    <i className="fas fa-edit"></i>
                    Edit Profile
                  </button>
                  <button
                    onClick={() => setActiveTab('password')}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'password'
                        ? `border-primary text-primary bg-primary/20`
                        : `border-transparent text-base-content opacity-60 hover:opacity-80`
                    }`}
                  >
                    <i className="fas fa-key"></i>
                    Change Password
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'edit' && renderEditProfile()}
                {activeTab === 'password' && renderChangePassword()}
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
