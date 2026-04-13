import React, { useState, useContext, useEffect, useCallback } from "react";
import { AuthContext } from "../Authentication/AuthProvider";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function MyProfile() {
  const { user, sendVerificationEmail } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const base = (
    import.meta.env.VITE_API_URL || "http://localhost:5000"
  ).replace(/\/$/, "");

  const normalizeProfileImageUrl = useCallback((value) => {
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
  }, [base]);

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
  const fetchUserProfile = useCallback(async () => {
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
  }, [base, normalizeProfileImageUrl, user?.uid, user?.email]);

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
  }, [fetchUserProfile]);

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
  };

  const handleShareProfile = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Profile link copied!");
    } catch (error) {
      console.error("Failed to copy profile link:", error);
      toast.error("Failed to copy link");
    }
  };

  const handleSendVerificationEmail = async () => {
    try {
      await sendVerificationEmail();
      alert("Verification email sent! Please check your inbox.");
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to send verification email");
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
    const publicLocation = [clientData.city, clientData.country].filter(Boolean).join(", ") || "—";

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* ✨ PRIME STATS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Jobs', value: clientData.totalJobsPosted || 0, icon: 'fa-briefcase', color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Completed', value: stats.clientJobsCompleted || 0, icon: 'fa-circle-check', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Hire Rate', value: `${stats.clientHireRate || 0}%`, icon: 'fa-chart-line', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
            { label: 'Cancelled', value: `${stats.clientCancellationRate || 0}%`, icon: 'fa-circle-xmark', color: 'text-rose-400', bg: 'bg-rose-500/10' }
          ].map((stat, i) => (
            <div key={i} className="glass-card p-5 group hover:border-white/20 transition-all duration-500 relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-1">{stat.label}</p>
                <h4 className="text-2xl font-black text-white tracking-tighter">{stat.value}</h4>
              </div>
              <div className={`absolute top-1/2 -right-4 -translate-y-1/2 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-700`}>
                <i className={`fas ${stat.icon} text-6xl`}></i>
              </div>
              <div className={`w-8 h-8 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center text-xs absolute top-4 right-4`}>
                <i className={`fas ${stat.icon}`}></i>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 🏠 PROPERTIES CARD */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
              <i className="fas fa-building-user text-blue-500"></i> My Properties
            </h3>

            <div className="space-y-4">
              <div
                onClick={() => setActiveTab("edit")}
                className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl border border-white/5 hover:border-white/10 hover:bg-white/[0.05] cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 mask mask-squircle bg-blue-600/10 flex items-center justify-center text-blue-400 text-xl group-hover:scale-110 transition-transform">
                    <i className="fas fa-house-chimney"></i>
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-white tracking-tight">Primary Residence</h5>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-tighter">{publicLocation}</p>
                  </div>
                </div>
                <i className="fas fa-arrow-right-long text-white/20 group-hover:text-blue-500 group-hover:translate-x-1 transition-all"></i>
              </div>

              <button
                onClick={() => setActiveTab("edit")}
                className="w-full flex items-center gap-4 p-4 bg-dashed border-2 border-dashed border-white/5 rounded-2xl hover:border-white/20 hover:bg-white/[0.02] transition-all group"
              >
                <div className="w-12 h-12 mask mask-squircle bg-white/5 flex items-center justify-center text-white/20 text-xl group-hover:text-white/40">
                  <i className="fas fa-plus"></i>
                </div>
                <span className="font-bold text-xs text-white/20 group-hover:text-white/40 uppercase tracking-widest">Add New Property</span>
              </button>
            </div>
          </div>

          {/* 📜 ABOUT SECTION */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
              <i className="fas fa-id-badge text-indigo-500"></i> Personal Bio
            </h3>
            <div className="p-5 bg-white/[0.03] rounded-2xl border border-white/5 min-h-[140px] relative overflow-hidden group">
              <i className="fas fa-quote-left absolute top-4 right-4 text-white/[0.02] text-5xl group-hover:text-white/[0.05] transition-all"></i>
              {clientData.bio ? (
                <p className="text-sm text-white/70 leading-relaxed font-medium relative z-10 italic">
                  "{clientData.bio}"
                </p>
              ) : (
                <p className="text-xs text-white/20 italic font-medium leading-relaxed">
                  You haven't added a bio yet. Tell workers a bit about yourself to build trust.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ⭐ WORKER REVIEWS */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-3">
              <i className="fas fa-star text-yellow-500"></i> Worker Feedback
            </h3>

            <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-white">{clientData.averageRating || "0.0"}</span>
                <div className="flex text-yellow-500 text-[10px]">
                  {[...Array(5)].map((_, i) => (
                    <i key={i} className={i < Math.floor(clientData.averageRating || 0) ? "fas fa-star" : "far fa-star"}></i>
                  ))}
                </div>
              </div>
              <div className="h-4 w-px bg-white/10"></div>
              <span className="text-[10px] text-white/30 font-black uppercase tracking-tight">Global Rating</span>
            </div>
          </div>

          {clientData.reviews && clientData.reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clientData.reviews.map((review, idx) => (
                <div key={idx} className="p-5 bg-white/[0.03] rounded-2xl border border-white/5 hover:border-white/15 transition-all group relative overflow-hidden">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 mask mask-squircle bg-white/5 flex items-center justify-center text-white/30 group-hover:bg-blue-600/20 group-hover:text-blue-400 transition-all">
                      <i className="fas fa-user"></i>
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-white tracking-tight">{review.authorName || "Worker"}</h5>
                      <div className="flex text-yellow-500 text-[8px] mt-0.5">
                        {[...Array(5)].map((_, i) => (
                          <i key={i} className={i < review.rating ? "fas fa-star" : "far fa-star"}></i>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-white/50 italic leading-relaxed line-clamp-2">
                    "{review.comment}"
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 bg-white/[0.01] rounded-3xl border border-dashed border-white/10 text-center">
              <div className="w-16 h-16 mask mask-squircle bg-white/5 flex items-center justify-center mb-4">
                <i className="far fa-comments text-2xl text-white/10"></i>
              </div>
              <h4 className="text-white font-bold tracking-tight mb-1">No Reviews Yet</h4>
              <p className="text-white/20 text-[11px]  leading-relaxed font-medium">
                Complete more jobs to receive feedback from the community.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEditProfile = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      
      {/* 👤 PERSONAL INFO GLASS CARD */}
      <div className="glass-card p-8">
        <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
          <i className="fas fa-user-circle text-blue-500"></i> Personal Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative group">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={editForm.firstName}
              onChange={handleEditChange}
              className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-transparent peer"
              id="firstName"
            />
            <label htmlFor="firstName" className="absolute left-5 top-4 text-white/20 text-sm transition-all pointer-events-none peer-focus:-top-2 peer-focus:left-4 peer-focus:text-[10px] peer-focus:text-blue-400 peer-focus:font-black peer-focus:uppercase peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:left-4 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-blue-400 peer-[:not(:placeholder-shown)]:font-black peer-[:not(:placeholder-shown)]:uppercase">First Name</label>
          </div>

          <div className="relative group">
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={editForm.lastName}
              onChange={handleEditChange}
              className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-transparent peer"
              id="lastName"
            />
            <label htmlFor="lastName" className="absolute left-5 top-4 text-white/20 text-sm transition-all pointer-events-none peer-focus:-top-2 peer-focus:left-4 peer-focus:text-[10px] peer-focus:text-blue-400 peer-focus:font-black peer-focus:uppercase peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:left-4 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-blue-400 peer-[:not(:placeholder-shown)]:font-black peer-[:not(:placeholder-shown)]:uppercase">Last Name</label>
          </div>

          <div className="relative group md:col-span-2">
            <input
              type="text"
              name="headline"
              placeholder="Professional Headline"
              value={editForm.headline}
              onChange={handleEditChange}
              className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-transparent peer"
              id="headline"
            />
            <label htmlFor="headline" className="absolute left-5 top-4 text-white/20 text-sm transition-all pointer-events-none peer-focus:-top-2 peer-focus:left-4 peer-focus:text-[10px] peer-focus:text-blue-400 peer-focus:font-black peer-focus:uppercase peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:left-4 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-blue-400 peer-[:not(:placeholder-shown)]:font-black peer-[:not(:placeholder-shown)]:uppercase">Professional Headline</label>
          </div>

          <div className="relative group md:col-span-2">
            <textarea
              name="bio"
              placeholder="Tell workers about yourself..."
              value={editForm.bio}
              onChange={handleEditChange}
              rows={4}
              className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-transparent peer"
              id="bio"
            />
            <label htmlFor="bio" className="absolute left-5 top-4 text-white/20 text-sm transition-all pointer-events-none peer-focus:-top-2 peer-focus:left-4 peer-focus:text-[10px] peer-focus:text-blue-400 peer-focus:font-black peer-focus:uppercase peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:left-4 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-blue-400 peer-[:not(:placeholder-shown)]:font-black peer-[:not(:placeholder-shown)]:uppercase">About You</label>
          </div>
        </div>
      </div>

      {/* 📍 ADDRESS GLASS CARD */}
      <div className="glass-card p-8">
        <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
          <i className="fas fa-location-dot text-indigo-500"></i> Primary Address
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative group md:col-span-2">
            <input
              type="text"
              name="address1"
              placeholder="Address Line 1"
              value={editForm.address1 || ""}
              onChange={handleEditChange}
              className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-transparent peer"
              id="address1"
            />
            <label htmlFor="address1" className="absolute left-5 top-4 text-white/20 text-sm transition-all pointer-events-none peer-focus:-top-2 peer-focus:left-4 peer-focus:text-[10px] peer-focus:text-indigo-400 peer-focus:font-black peer-focus:uppercase peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:left-4 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-indigo-400 peer-[:not(:placeholder-shown)]:font-black peer-[:not(:placeholder-shown)]:uppercase">Address Line 1</label>
          </div>

          <div className="relative group">
            <input
              type="text"
              name="city"
              placeholder="City"
              value={editForm.city || ""}
              onChange={handleEditChange}
              className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-transparent peer"
              id="city"
            />
            <label htmlFor="city" className="absolute left-5 top-4 text-white/20 text-sm transition-all pointer-events-none peer-focus:-top-2 peer-focus:left-4 peer-focus:text-[10px] peer-focus:text-indigo-400 peer-focus:font-black peer-focus:uppercase peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:left-4 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-indigo-400 peer-[:not(:placeholder-shown)]:font-black peer-[:not(:placeholder-shown)]:uppercase">City</label>
          </div>

          <div className="relative group">
            <input
              type="text"
              name="country"
              placeholder="Country"
              value={editForm.country || ""}
              onChange={handleEditChange}
              className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-transparent peer"
              id="country"
            />
            <label htmlFor="country" className="absolute left-5 top-4 text-white/20 text-sm transition-all pointer-events-none peer-focus:-top-2 peer-focus:left-4 peer-focus:text-[10px] peer-focus:text-indigo-400 peer-focus:font-black peer-focus:uppercase peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:left-4 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-indigo-400 peer-[:not(:placeholder-shown)]:font-black peer-[:not(:placeholder-shown)]:uppercase">Country</label>
          </div>
        </div>
      </div>

      {/* 💾 ACTION FOOTER */}
      <div className="flex items-center justify-between glass-card p-6 bg-blue-600/5 border-blue-500/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
            <i className="fas fa-shield-check"></i>
          </div>
          <div>
            <p className="text-xs font-black text-white uppercase tracking-tight">Data Security</p>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-tighter">Your info is protected</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setActiveTab("overview")} className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">
            Discard
          </button>
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 border-none text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-blue-600/20 flex items-center gap-3 active:scale-95"
          >
            {saving ? <span className="loading loading-spinner loading-xs"></span> : <i className="fas fa-cloud-arrow-up"></i>}
            {saving ? "Deploying..." : "Apply Changes"}
          </button>
        </div>
      </div>
    </div>
  );

  const renderChangePassword = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 mx-auto">
      <div className="glass-card p-8">
        <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
          <i className="fas fa-lock text-rose-500"></i> Change Password
        </h3>

        <div className="space-y-6">
          <div className="relative group">
            <input
              type="password"
              name="currentPassword"
              placeholder="Current Password"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all placeholder:text-transparent peer"
              id="currentPassword"
            />
            <label htmlFor="currentPassword" className="absolute left-5 top-4 text-white/20 text-sm transition-all pointer-events-none peer-focus:-top-2 peer-focus:left-4 peer-focus:text-[10px] peer-focus:text-rose-400 peer-focus:font-black peer-focus:uppercase peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:left-4 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-rose-400 peer-[:not(:placeholder-shown)]:font-black peer-[:not(:placeholder-shown)]:uppercase">Current Password</label>
          </div>

          <div className="h-px bg-white/5 w-1/2 mx-auto"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative group">
              <input
                type="password"
                name="newPassword"
                placeholder="New Password"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-transparent peer"
                id="newPassword"
              />
              <label htmlFor="newPassword" className="absolute left-5 top-4 text-white/20 text-sm transition-all pointer-events-none peer-focus:-top-2 peer-focus:left-4 peer-focus:text-[10px] peer-focus:text-blue-400 peer-focus:font-black peer-focus:uppercase peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:left-4 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-blue-400 peer-[:not(:placeholder-shown)]:font-black peer-[:not(:placeholder-shown)]:uppercase">New Password</label>
            </div>

            <div className="relative group">
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-transparent peer"
                id="confirmPassword"
              />
              <label htmlFor="confirmPassword" className="absolute left-5 top-4 text-white/20 text-sm transition-all pointer-events-none peer-focus:-top-2 peer-focus:left-4 peer-focus:text-[10px] peer-focus:text-blue-400 peer-focus:font-black peer-focus:uppercase peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:left-4 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-blue-400 peer-[:not(:placeholder-shown)]:font-black peer-[:not(:placeholder-shown)]:uppercase">Confirm Password</label>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <button
            onClick={handlePasswordUpdate}
            disabled={saving}
            className="w-full py-4 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 disabled:from-slate-800 disabled:to-slate-800 border-none text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-rose-600/20 flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            {saving ? <span className="loading loading-spinner loading-xs"></span> : <i className="fas fa-key-skeleton"></i>}
            {saving ? "Updating Vault..." : "Update Password"}
          </button>
        </div>
      </div>

      <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl text-center">
        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest leading-relaxed">
          Forgot your password? <button className="text-blue-400 hover:text-blue-300 ml-1">Request a reset link</button>
        </p>
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
    <div className="min-h-screen bg-[#0b1121] text-slate-100 selection:bg-blue-500/30 font-sans pb-20">
      {/* Background Blobs for Depth */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
          
          {/* ── Fixed Glass Sidebar ── */}
          <aside className="lg:sticky lg:top-24 space-y-6">
            {/* Profile Brief Card */}
            <div className="glass-card p-6 flex flex-col items-center text-center">
              <div className="relative mb-4 group">
                <div className="w-24 h-24 mask mask-squircle overflow-hidden bg-white/5 ring-1 ring-white/10 shadow-2xl relative">
                  <img
                    src={clientData.profileCover || "https://i.pravatar.cc/150?img=3"}
                    alt="Profile"
                    className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                    onError={(e) => (e.target.src = "https://i.pravatar.cc/150?img=3")}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={saving}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <i className="fas fa-camera text-white text-lg"></i>
                  </div>
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0b1121] shadow-lg animate-pulse"></span>
                {saving && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] rounded-2xl z-20">
                    <span className="loading loading-spinner loading-sm text-blue-400"></span>
                  </div>
                )}
              </div>

              <h2 className="text-xl font-bold text-white tracking-tight truncate w-full">
                {`${clientData.firstName || ""} ${clientData.lastName || ""}`.trim() || "User Profile"}
              </h2>
              <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mt-1">
                Premium Client
              </p>
              
              <div className="mt-4 flex gap-2 w-full">
                <button 
                  onClick={handleShareProfile}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] font-bold text-white/70 transition-all uppercase"
                >
                  <i className="fas fa-share-nodes text-[10px]"></i> Share
                </button>
              </div>
            </div>

            {/* Navigation Sidebar */}
            <nav className="glass-card p-2 space-y-1">
              {[
                { id: 'overview', label: 'Overview', icon: 'fa-grid-2' },
                { id: 'edit', label: 'Account Settings', icon: 'fa-user-gear' },
                { id: 'password', label: 'Security', icon: 'fa-shield-halved' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold transition-all relative overflow-hidden group ${
                    activeTab === tab.id 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <i className={`fas ${tab.icon} text-lg w-5 text-center ${activeTab === tab.id ? 'text-white' : 'group-hover:text-blue-400'}`}></i>
                  <span className="tracking-tight">{tab.label}</span>
                  {activeTab === tab.id && (
                    <span className="absolute right-3 w-1 h-4 bg-white/30 rounded-full"></span>
                  )}
                </button>
              ))}
            </nav>

            {/* Verification Status Banner */}
            <div className="glass-card p-5">
              <h4 className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] mb-4">
                Trust & Safety
              </h4>
              <div className="space-y-3">
                <div className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  clientData.emailVerified 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-white/5 border-white/5 text-white/40 cursor-pointer hover:bg-white/10'
                }`} onClick={!clientData.emailVerified ? handleSendVerificationEmail : undefined}>
                  <div className="flex items-center gap-2.5">
                    <i className={`fas ${clientData.emailVerified ? 'fa-circle-check' : 'fa-envelope'} text-sm`}></i>
                    <span className="text-[11px] font-bold uppercase tracking-tight">Email Verify</span>
                  </div>
                  {!clientData.emailVerified && <i className="fas fa-chevron-right text-[10px] opacity-40"></i>}
                </div>
                
                <div className="flex items-center justify-between p-2.5 rounded-xl border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                  <div className="flex items-center gap-2.5">
                    <i className="fas fa-phone text-sm"></i>
                    <span className="text-[11px] font-bold uppercase tracking-tight">Phone Linked</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl border bg-blue-500/10 border-blue-500/20 text-blue-400">
                  <div className="flex items-center gap-2.5">
                    <i className="fas fa-id-card text-sm"></i>
                    <span className="text-[11px] font-bold uppercase tracking-tight">Identity Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* ── Main Content Area ── */}
          <main className="space-y-8 min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-700">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'edit' && renderEditProfile()}
            {activeTab === 'password' && renderChangePassword()}
          </main>

        </div>
      </div>
    </div>
  );
}
