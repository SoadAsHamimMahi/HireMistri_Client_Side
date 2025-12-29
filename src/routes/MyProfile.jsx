import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../Authentication/AuthProvider';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';

export default function MyProfile() {
  const { user } = useContext(AuthContext);
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    // Computed fields
    totalJobsPosted: 0,
    averageRating: 0
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
        email: user.email
      });

      // Then fetch the user profile
      const response = await axios.get(`${base}/api/users/${user.uid}`);
      const userData = response.data;
      
      // Update client data with API response
      setClientData(prev => ({
        ...prev,
        ...userData,
        // Ensure computed fields have defaults
        totalJobsPosted: userData.totalJobsPosted || 0,
        averageRating: userData.averageRating || 0
      }));
      
      // Update edit form with the fetched data
      setEditForm(prev => ({
        ...prev,
        ...userData
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
      
      // Update profile cover URL
      setClientData(prev => ({
        ...prev,
        profileCover: response.data.url
      }));
      
      return response.data.url;
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
        zip: editForm.zip
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
      await uploadAvatar(file);
      alert('Avatar updated successfully!');
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      alert('Failed to upload avatar. Please try again.');
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* About Section */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-base-content">About</h3>
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
        <h3 className="text-lg font-semibold mb-3 text-base-content">Profile Details</h3>
        <div className="space-y-3">
          {[
            { label: 'Full Name', value: `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim() || '—' },
            { label: 'Phone', value: clientData.phone || '—' },
            { label: 'Email', value: clientData.email || '—' },
            { label: 'Address', value: [clientData.address1, clientData.address2, clientData.city, clientData.country].filter(Boolean).join(', ') || '—' },
            { label: 'Work Experience', value: clientData.workExperience || '—' },
            { label: 'Headline', value: clientData.headline || '—' },
            { label: 'Skills', value: clientData.skills && clientData.skills.length > 0 ? clientData.skills.join(', ') : '—' },
            { label: 'Field of Interest', value: 'Client Services' }
          ].map((item, index) => (
            <div key={index} className={`flex justify-between items-center py-2 border-b last:border-b-0 ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <span className="font-medium text-base-content opacity-80">{item.label}:</span>
              <span className="text-base-content">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

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

      {/* Address */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-base-content">Address</h3>
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
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-base-content opacity-70">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`shadow-sm border-b transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-base-content">My Profile</h1>
            <p className="mt-2 text-base-content opacity-70">
              Manage your professional information and showcase your skills to potential workers.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Profile Summary */}
          <div className="lg:col-span-1">
            <div className={`rounded-xl shadow-sm p-6 sticky top-8 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="text-center">
                {/* Profile Picture */}
                <div className="relative inline-block mb-4">
                  <img
                    src={clientData.profileCover || "https://i.pravatar.cc/150?img=3"}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-green-100"
                  />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <i className="fas fa-check text-white text-sm"></i>
                  </div>
                  {/* Upload Button */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <i className="fas fa-camera text-white text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></i>
                  </div>
                </div>

                {/* Name and Phone */}
                <h2 className="text-xl font-bold mb-1 text-base-content">
                  {clientData.displayName || `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim() || 'Client'}
                </h2>
                <p className="mb-6 text-base-content opacity-70">{clientData.phone || 'No phone number'}</p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className={`rounded-lg p-3 transition-colors duration-300 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <p className="text-2xl font-bold text-primary">{clientData.averageRating}</p>
                    <p className="text-sm text-base-content opacity-70">Rating</p>
                  </div>
                  <div className="rounded-lg p-3 transition-colors duration-300 bg-base-200">
                    <p className="text-2xl font-bold text-base-content">{clientData.totalJobsPosted}</p>
                    <p className="text-sm text-base-content opacity-70">Jobs Posted</p>
                  </div>
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
      </div>
    </div>
  );
}
