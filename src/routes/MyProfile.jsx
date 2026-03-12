import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../Authentication/AuthProvider";
import { useTheme } from "../contexts/ThemeContext";
import axios from "axios";
import PageContainer from "../components/layout/PageContainer";
import { toast } from "react-hot-toast";

export default function MyProfile() {
  const { user, sendVerificationEmail, reloadUser } = useContext(AuthContext);
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);

  const base = (
    import.meta.env.VITE_API_URL || "http://localhost:5000"
  ).replace(/\/$/, "");

  const normalizeProfileImageUrl = (value) => {
    if (!value || typeof value !== "string") return "";
    const raw = value.trim();
    if (!raw) return "";
    try {
      const parsed = new URL(raw);
      if (parsed.pathname.startsWith("/uploads/")) {
        return `${base}${parsed.pathname}`;
      }
      return raw;
    } catch {
      if (raw.startsWith("/uploads/")) return `${base}${raw}`;
      return raw;
    }
  };

  // Client data from API
  const [clientData, setClientData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: user?.email || "",
    address1: "",
    address2: "",
    city: "",
    country: "",
    zip: "",
    workExperience: "",
    headline: "",
    bio: "",
    skills: [],
    profileCover: "",
    createdAt: "",
    updatedAt: "",
    lastActiveAt: "",
    emailVerified: false,
    // Computed fields
    totalJobsPosted: 0,
    averageRating: 0,
    stats: null,
    // Client-specific fields
    preferences: {
      categories: [],
      budgetMin: null,
      budgetMax: null,
      currency: "BDT",
    },
  });

  const [editForm, setEditForm] = useState(clientData);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
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
        role: "client",
      });

      // Then fetch the user profile
      const response = await axios.get(`${base}/api/users/${user.uid}`);
      const userData = response.data;

      // Update client data with API response
      setClientData((prev) => ({
        ...prev,
        ...userData,
        // Ensure profileCover is preserved if it exists and is valid
        profileCover:
          userData.profileCover && userData.profileCover.trim()
            ? normalizeProfileImageUrl(userData.profileCover)
            : prev.profileCover || "",
        // Ensure computed fields have defaults
        totalJobsPosted: userData.totalJobsPosted || 0,
        averageRating: userData.averageRating || 0,
        stats: userData.stats || null,
        preferences: userData.preferences || {
          categories: [],
          budgetMin: null,
          budgetMax: null,
          currency: "BDT",
        },
        emailVerified: userData.emailVerified || false,
        lastActiveAt: userData.lastActiveAt || null,
      }));

      // Update edit form with the fetched data
      setEditForm((prev) => ({
        ...prev,
        ...userData,
        profileCover:
          userData.profileCover && userData.profileCover.trim()
            ? normalizeProfileImageUrl(userData.profileCover)
            : prev.profileCover || "",
        preferences: userData.preferences || {
          categories: [],
          budgetMin: null,
          budgetMax: null,
          currency: "BDT",
        },
      }));
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
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

      const response = await axios.patch(
        `${base}/api/users/${user.uid}`,
        profileData,
      );
      const updatedData = response.data;

      // Update local state with the response
      setClientData((prev) => ({
        ...prev,
        ...updatedData,
      }));

      return updatedData;
    } catch (error) {
      console.error("Failed to update user profile:", error);
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
      formData.append("avatar", file);

      // Do not force Content-Type for FormData; browser sets correct boundary.
      const response = await axios.post(
        `${base}/api/users/${user.uid}/avatar`,
        formData,
      );

      // Server returns absolute URL, use it directly
      const url = normalizeProfileImageUrl(response.data?.url);
      if (!url) throw new Error("No URL returned from server");
      return url;
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      throw error;
    }
  };

  // Fetch profile data on component mount
  useEffect(() => {
    fetchUserProfile();
  }, [user?.uid]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      // Prepare data for API (only include fields that should be updated)
      const updateData = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
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
        preferences: editForm.preferences || {
          categories: [],
          budgetMin: null,
          budgetMax: null,
          currency: "BDT",
        },
      };

      await updateUserProfile(updateData);
      toast.success("Profile updated successfully!");
      setActiveTab("overview"); // Switch back to overview tab
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast.error("Failed to update profile. Please try again.");
    }
  };

  const handlePasswordUpdate = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    // Here you would call API to update password
    toast.success("Password updated successfully!");
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setIsChangingPassword(false);
  };

  const handleShareProfile = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Profile link copied!");
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const addSkill = (skill) => {
    if (skill.trim() && !editForm.skills.includes(skill.trim())) {
      setEditForm((prev) => ({
        ...prev,
        skills: [...prev.skills, skill.trim()],
      }));
    }
  };

  const removeSkill = (skillToRemove) => {
    setEditForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleSendVerificationEmail = async () => {
    try {
      setSendingVerification(true);
      await sendVerificationEmail();
      alert("Verification email sent! Please check your inbox.");
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to send verification email");
    } finally {
      setSendingVerification(false);
    }
  };

  const handleCheckVerification = async () => {
    try {
      await reloadUser();
      if (user?.emailVerified) {
        // Sync to server
        await axios.patch(`${base}/api/users/${user.uid}`, {
          emailVerified: true,
        });
        setClientData((prev) => ({ ...prev, emailVerified: true }));
        alert("Email verified!");
      } else {
        alert(
          "Email not verified yet. Please check your inbox and click the verification link.",
        );
      }
    } catch (e) {
      console.error(e);
      alert("Failed to check verification status");
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    try {
      setSaving(true);
      const url = await uploadAvatar(file);

      // Update both states immediately with the new URL
      setClientData((prev) => ({ ...prev, profileCover: url }));
      setEditForm((prev) => ({ ...prev, profileCover: url }));

      // Refresh profile data without showing loading screen
      // Use a separate fetch that doesn't set loading state
      try {
        const response = await axios.get(`${base}/api/users/${user.uid}`);
        const userData = response.data;
        const normalizedServerUrl = normalizeProfileImageUrl(
          userData.profileCover,
        );
        // Only update profileCover if server has it, otherwise keep our uploaded URL
        if (normalizedServerUrl) {
          setClientData((prev) => ({
            ...prev,
            ...userData,
            profileCover: normalizedServerUrl,
          }));
          setEditForm((prev) => ({
            ...prev,
            ...userData,
            profileCover: normalizedServerUrl,
          }));
        } else {
          // Server might not have it yet, keep our local URL
          setClientData((prev) => ({
            ...prev,
            ...userData,
            profileCover: url,
          }));
          setEditForm((prev) => ({ ...prev, ...userData, profileCover: url }));
        }
      } catch (refreshError) {
        console.warn("Failed to refresh profile after upload:", refreshError);
        // Continue anyway - we already have the URL
      }

      alert("Avatar updated successfully!");
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      alert("Failed to upload avatar. Please try again.");
    } finally {
      e.target.value = "";
      setSaving(false);
    }
  };

  const renderOverview = () => {
    const stats = clientData.stats || {};
    const fullAddress = [
      clientData.address1,
      clientData.address2,
      clientData.city,
      clientData.country,
    ]
      .filter(Boolean)
      .join(", ");
    const publicLocation =
      [clientData.city, clientData.country].filter(Boolean).join(", ") || "—";

    return (
      <div className="space-y-8">
        {/* STATS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Jobs */}
          <div className="bg-[#121a2f] border border-slate-700/50 rounded-xl p-5 flex items-center justify-between shadow-lg shadow-black/20 hover:-translate-y-1 transition-transform duration-300">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
                Total Jobs
              </p>
              <h4 className="text-2xl font-bold text-white">
                {clientData.totalJobsPosted || 0}
              </h4>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
              <i className="fas fa-briefcase"></i>
            </div>
          </div>

          {/* Completed Jobs */}
          <div className="bg-[#121a2f] border border-slate-700/50 rounded-xl p-5 flex items-center justify-between shadow-lg shadow-black/20 hover:-translate-y-1 transition-transform duration-300">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
                Completed
              </p>
              <h4 className="text-2xl font-bold text-white">
                {stats.clientJobsCompleted || 0}
              </h4>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
              <i className="fas fa-check-circle"></i>
            </div>
          </div>

          {/* Hire Rate */}
          <div className="bg-[#121a2f] border border-slate-700/50 rounded-xl p-5 flex items-center justify-between shadow-lg shadow-black/20 hover:-translate-y-1 transition-transform duration-300">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
                Hire Rate
              </p>
              <h4 className="text-2xl font-bold text-white">
                {stats.clientHireRate || 0}%
              </h4>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-400/10 flex items-center justify-center text-blue-400">
              <i className="fas fa-chart-line"></i>
            </div>
          </div>

          {/* Cancellation Rate */}
          <div className="bg-[#121a2f] border border-slate-700/50 rounded-xl p-5 flex items-center justify-between shadow-lg shadow-black/20 hover:-translate-y-1 transition-transform duration-300">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
                Cancellations
              </p>
              <h4 className="text-2xl font-bold text-white">
                {stats.clientCancellationRate || 0}%
              </h4>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
              <i className="fas fa-times-circle"></i>
            </div>
          </div>
        </div>

        {/* DETAILS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Saved Properties */}
          <div className="bg-[#121a2f] border border-slate-700/50 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <i className="far fa-building text-blue-500"></i> Saved Properties
            </h3>

            <div className="space-y-3">
              {/* Note: In a real app, this would map over an array of saved properties */}
              <div
                onClick={() => setActiveTab("edit")}
                className="flex items-center justify-between p-4 bg-[#0b1121] rounded-lg border border-slate-800 hover:border-slate-600 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden">
                    <i className="fas fa-home text-slate-400 text-xl"></i>
                  </div>
                  <div>
                    <h5 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                      Primary Address
                    </h5>
                    <p className="text-xs text-slate-400">{publicLocation}</p>
                  </div>
                </div>
                <i className="fas fa-chevron-right text-slate-600 group-hover:text-blue-500"></i>
              </div>

              <div
                onClick={() => setActiveTab("edit")}
                className="flex items-center justify-between p-4 bg-[#0b1121] rounded-lg border border-slate-800 cursor-pointer opacity-50 hover:opacity-100 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-slate-800/50 flex items-center justify-center border border-dashed border-slate-600">
                    <i className="fas fa-plus text-slate-500"></i>
                  </div>
                  <div>
                    <h5 className="font-medium text-slate-300 border-b border-transparent inline-block">
                      Add Property
                    </h5>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* About / Bio */}
          <div className="bg-[#121a2f] border border-slate-700/50 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <i className="far fa-user text-blue-500"></i> About
            </h3>
            <div className="p-4 bg-[#0b1121] rounded-lg border border-slate-800 min-h-[120px]">
              {clientData.bio ? (
                <p className="text-slate-300 leading-relaxed text-sm">
                  {clientData.bio}
                </p>
              ) : (
                <p className="italic text-slate-500 text-sm">
                  This client hasn't written an about section yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* REVIEWS SECTION */}
        <div className="bg-[#121a2f] border border-slate-700/50 rounded-xl p-6 shadow-lg">
          <div className="flex justify-between items-end mb-6 border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white">What Workers Say</h3>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-2xl font-bold text-white">
                    {clientData.averageRating || "0.0"}
                  </span>
                  <i className="fas fa-star text-yellow-500 text-lg"></i>
                </div>
                <span className="text-xs text-slate-400">
                  Based on past jobs
                </span>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          {clientData.reviews && clientData.reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clientData.reviews.map((review, idx) => (
                <div
                  key={idx}
                  className="p-5 bg-[#0b1121] rounded-xl border border-slate-800 relative group hover:border-slate-700 transition-colors"
                >
                  <i className="fas fa-quote-right absolute top-4 right-4 text-slate-800 text-4xl group-hover:text-slate-700 transition-colors"></i>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                      <i className="fas fa-user text-slate-400"></i>
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-slate-200">
                        {review.authorName || "Worker"}
                      </h5>
                      <div className="flex text-yellow-500 text-[10px]">
                        {[...Array(5)].map((_, i) => (
                          <i
                            key={i}
                            className={
                              i < review.rating ? "fas fa-star" : "far fa-star"
                            }
                          ></i>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 italic">
                    "{review.comment}"
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 px-4 bg-[#0b1121] rounded-xl border border-slate-800 text-center relative overflow-hidden">
              <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                <i className="far fa-comment-alt text-3xl text-slate-500"></i>
              </div>
              <h4 className="text-white font-bold mb-1">No Reviews Yet</h4>
              <p className="text-slate-400 text-sm max-w-sm">
                This client hasn't received any reviews from workers yet. Check
                back later.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEditProfile = () => (
    <div className="space-y-6">
      <div className="bg-[#121a2f] border border-slate-700/50 rounded-lg p-6 mb-6 mt-6">
        <h3 className="text-lg font-bold text-white mb-4">Account</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-base-content opacity-80">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              value={editForm.firstName}
              onChange={handleEditChange}
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-base-content opacity-80">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={editForm.lastName}
              onChange={handleEditChange}
              className="input input-bordered w-full"
            />
          </div>
        </div>
      </div>
      {/* Headline */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-base-content opacity-80 mb-1">
            Headline (optional)
          </label>
          <input
            type="text"
            name="headline"
            value={editForm.headline}
            onChange={handleEditChange}
            placeholder="e.g., Property Manager"
            className="w-full px-3 py-2 border border-base-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-base-content opacity-80 mb-1">
          About Me (Bio)
        </label>
        <textarea
          name="bio"
          value={editForm.bio}
          onChange={handleEditChange}
          rows={4}
          placeholder="Write a little about yourself or the types of properties you manage..."
          className="w-full px-3 py-2 border border-base-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      <div className="bg-[#121a2f] border border-slate-700/50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-bold text-white mb-4">Address</h3>
        <p className="text-sm text-slate-400 mb-3">
          <i className="fas fa-info-circle mr-1"></i>
          Public profiles show only city/area. Full address is private and only
          shared after booking.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-base-content opacity-80">
              Address Line 1
            </label>
            <input
              type="text"
              name="address1"
              value={editForm.address1 || ""}
              onChange={handleEditChange}
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-base-content opacity-80">
              Address Line 2
            </label>
            <input
              type="text"
              name="address2"
              value={editForm.address2 || ""}
              onChange={handleEditChange}
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-base-content opacity-80">
              City
            </label>
            <input
              type="text"
              name="city"
              value={editForm.city || ""}
              onChange={handleEditChange}
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-base-content opacity-80">
              Country
            </label>
            <input
              type="text"
              name="country"
              value={editForm.country || ""}
              onChange={handleEditChange}
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-base-content opacity-80">
              ZIP Code
            </label>
            <input
              type="text"
              name="zip"
              value={editForm.zip || ""}
              onChange={handleEditChange}
              className="input input-bordered w-full"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button onClick={() => setIsEditing(false)} className="btn btn-ghost">
          Cancel
        </button>
        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving && <i className="fas fa-spinner fa-spin"></i>}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );

  const renderChangePassword = () => (
    <div className="space-y-6">
      <div className="bg-[#121a2f] border border-slate-700/50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-bold text-white mb-4">Change Password</h3>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium mb-1 text-base-content opacity-80">
              Current Password
            </label>
            <input
              type="password"
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-base-content opacity-80">
              New Password
            </label>
            <input
              type="password"
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-base-content opacity-80">
              Confirm New Password
            </label>
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
        <button onClick={handlePasswordUpdate} className="btn btn-primary">
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
          <p className="text-muted">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Background container to match Stitch dark blue UI */}
      <div className="min-h-screen pb-12">
        {/* Header - Transparent/Minimal */}
        <div className="pt-8 pb-4">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Client Hub
            </h1>
          </div>
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
            {/* Left Sidebar - Profile Card (Stitch Inspired) */}
            <div className="lg:col-span-1">
              <div className="bg-[#121a2f] border border-slate-700/50 rounded-2xl p-6 sticky top-24 shadow-xl flex flex-col items-center">
                {/* Profile Picture & Online Dot */}
                <div className="relative mb-5 group pt-4">
                  <div className="w-28 h-28 rounded-full rounded-tl-none rounded-tr-3xl overflow-hidden border-4 border-[#0b1121] shadow-lg relative bg-slate-800">
                    <img
                      src={
                        clientData.profileCover &&
                        clientData.profileCover.trim()
                          ? clientData.profileCover
                          : "https://i.pravatar.cc/150?img=3"
                      }
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        if (
                          e.target.src !== "https://i.pravatar.cc/150?img=3"
                        ) {
                          e.target.src = "https://i.pravatar.cc/150?img=3";
                        }
                      }}
                    />
                    {/* Hover Upload Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={saving}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <i className="fas fa-camera text-white text-xl"></i>
                    </div>
                  </div>
                  {/* Status Dot */}
                  <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-4 border-[#121a2f] rounded-full shadow-md z-10"></div>
                  {saving && (
                    <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-2 shadow-lg z-20 animate-pulse">
                      <i className="fas fa-spinner fa-spin text-white text-xs"></i>
                    </div>
                  )}
                </div>

                {/* Name & Role */}
                <h2 className="text-2xl font-bold text-white text-center tracking-tight leading-tight">
                  {`${clientData.firstName || ""} ${clientData.lastName || ""}`.trim() ||
                    "Client Profile"}
                </h2>
                <p className="text-blue-500 font-semibold text-sm mt-1 uppercase tracking-wider mb-2">
                  Client Profile
                </p>
                <p className="text-slate-500 text-xs mb-6">
                  {clientData.createdAt
                    ? `Member since ${new Date(clientData.createdAt).toLocaleDateString("default", { month: "short", year: "numeric" })}`
                    : ""}
                </p>

                {/* Actions */}
                <div className="w-full space-y-3 mb-8">
                  <button
                    onClick={() => setActiveTab("edit")}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-pen text-sm"></i> Edit Profile
                  </button>
                  <button
                    onClick={handleShareProfile}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-700"
                  >
                    <i className="fas fa-share-alt text-sm"></i> Share Profile
                  </button>
                </div>

                {/* Verification Badges */}
                <div className="w-full bg-[#0b1121] rounded-xl p-4 border border-slate-800">
                  <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 text-center">
                    Verification Status
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Email Status */}
                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold ${user?.emailVerified || clientData.emailVerified ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" : "bg-slate-800 text-slate-400 border border-slate-700 cursor-pointer hover:bg-slate-700"}`}
                      onClick={
                        !(user?.emailVerified || clientData.emailVerified)
                          ? handleSendVerificationEmail
                          : undefined
                      }
                    >
                      <i
                        className={`fas ${user?.emailVerified || clientData.emailVerified ? "fa-check-circle" : "fa-envelope"}`}
                      ></i>{" "}
                      Email
                    </div>

                    {/* Phone Status - Mock */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      <i className="fas fa-check-circle"></i> Phone
                    </div>

                    {/* Payment Status - Mock */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold bg-slate-800 text-slate-500 border border-slate-700">
                      <i className="fas fa-minus-circle"></i> Payment
                    </div>

                    {/* ID Status - Mock */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      <i className="fas fa-id-card"></i> ID
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Main Content Areas */}
            <div className="lg:col-span-1 border border-slate-800 rounded-2xl bg-[#0b1121]/50 overflow-hidden">
              {/* Minimal horizontal nav */}
              <div className="flex border-b border-slate-800 bg-[#121a2f]">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-6 py-4 text-sm font-semibold transition-colors border-b-2 ${activeTab === "overview" ? "border-blue-500 text-white" : "border-transparent text-slate-400 hover:text-slate-200"}`}
                >
                  {" "}
                  Overview{" "}
                </button>
                <button
                  onClick={() => setActiveTab("edit")}
                  className={`px-6 py-4 text-sm font-semibold transition-colors border-b-2 ${activeTab === "edit" ? "border-blue-500 text-white" : "border-transparent text-slate-400 hover:text-slate-200"}`}
                >
                  {" "}
                  Update Details{" "}
                </button>
                <button
                  onClick={() => setActiveTab("password")}
                  className={`px-6 py-4 text-sm font-semibold transition-colors border-b-2 ${activeTab === "password" ? "border-blue-500 text-white" : "border-transparent text-slate-400 hover:text-slate-200"}`}
                >
                  {" "}
                  Security{" "}
                </button>
              </div>

              {/* Rendering active section */}
              <div className="p-6">
                {activeTab === "overview" && renderOverview()}
                {/* Provide basic styling wrapper so the generated edit forms fit in */}
                {activeTab === "edit" && (
                  <div className="p-4 bg-[#121a2f] border border-slate-800 rounded-xl">
                    {renderEditProfile()}
                  </div>
                )}
                {activeTab === "password" && (
                  <div className="p-4 bg-[#121a2f] border border-slate-800 rounded-xl">
                    {renderChangePassword()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
