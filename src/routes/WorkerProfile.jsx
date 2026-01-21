// src/routes/WorkerProfile.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function WorkerProfile() {
  const { workerId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!workerId) {
        setError('Missing worker id');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`${API_BASE}/api/users/${encodeURIComponent(workerId)}/public`, {
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || `Failed to load profile (HTTP ${res.status})`);
        }
        const data = await res.json();
        if (!ignore) setProfile(data);
      } catch (e) {
        if (!ignore) setError(e?.message || 'Failed to load profile');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [workerId]);

  const displayName = useMemo(() => {
    if (!profile) return 'Worker';
    return (
      profile.displayName ||
      [profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
      'Worker'
    );
  }, [profile]);

  const skills = Array.isArray(profile?.skills) ? profile.skills : [];
  const stats = profile?.stats || {};
  const completedJobs = safeNum(stats.workerCompletedJobs);
  const activeOrders = safeNum(stats.workerActiveOrders);
  const responseRate = safeNum(stats.workerResponseRate);
  const responseTimeHours = stats.workerResponseTimeHours !== null && stats.workerResponseTimeHours !== undefined ? safeNum(stats.workerResponseTimeHours) : null;
  const onTimeRate = stats.workerOnTimeRate !== null && stats.workerOnTimeRate !== undefined ? safeNum(stats.workerOnTimeRate) : null;
  const applicationsAsWorker = safeNum(stats.applicationsAsWorker);
  const rating = safeNum(profile?.averageRating || stats.averageRating);
  
  // Trust fields
  const emailVerified = !!profile?.emailVerified;
  const phoneVerified = !!profile?.phoneVerified;
  const memberSince = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : null;
  const lastActive = profile?.lastActiveAt ? new Date(profile.lastActiveAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : null;
  
  // Work credibility fields
  const servicesOffered = profile?.servicesOffered || {};
  const serviceCategories = Array.isArray(servicesOffered.categories) ? servicesOffered.categories : [];
  const serviceTags = Array.isArray(servicesOffered.tags) ? servicesOffered.tags : [];
  const serviceArea = profile?.serviceArea || {};
  const serviceCities = Array.isArray(serviceArea.cities) ? serviceArea.cities : [];
  const serviceRadiusKm = serviceArea.radiusKm || null;
  const experienceYears = profile?.experienceYears || profile?.workExperience || null;
  const certifications = Array.isArray(profile?.certifications) ? profile.certifications : [];
  const languages = Array.isArray(profile?.languages) ? profile.languages : [];
  const portfolio = Array.isArray(profile?.portfolio) ? profile.portfolio : [];
  const pricing = profile?.pricing || {};
  const hourlyRate = pricing.hourlyRate || null;
  const startingPrice = pricing.startingPrice || null;
  const minimumCharge = pricing.minimumCharge || null;
  const currency = pricing.currency || 'BDT';
  
  // Portfolio lightbox state
  const [selectedImage, setSelectedImage] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100">
        <div className="max-w-5xl mx-auto p-6">
          <div className="flex items-center gap-3 mb-6">
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
              <i className="fas fa-arrow-left mr-2"></i>Back
            </button>
          </div>
          <div className="card bg-base-200 shadow-sm border border-base-300">
            <div className="card-body">
              <span className="loading loading-spinner loading-md"></span>
              <p className="opacity-70">Loading worker profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base-100">
        <div className="max-w-5xl mx-auto p-6">
          <button className="btn btn-ghost btn-sm mb-6" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left mr-2"></i>Back
          </button>
          <div className="alert alert-error">
            <i className="fas fa-exclamation-triangle"></i>
            <div>
              <h3 className="font-bold">Failed to load profile</h3>
              <div className="text-sm">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-base-100">
        <div className="max-w-5xl mx-auto p-6">
          <button className="btn btn-ghost btn-sm mb-6" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left mr-2"></i>Back
          </button>
          <div className="alert alert-warning">
            <i className="fas fa-info-circle"></i>
            <span>No profile data found.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between gap-3 mb-6">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left mr-2"></i>Back
          </button>
          <Link to="/applications" className="btn btn-outline btn-sm">
            <i className="fas fa-briefcase mr-2"></i>Applications
          </Link>
        </div>

        <div className="card bg-base-200 shadow-sm border border-base-300 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10">
            <div className="flex flex-col md:flex-row md:items-center gap-5">
              <div className="avatar">
                <div className="w-20 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <img
                    src={profile.profileCover || 'https://i.pravatar.cc/150?img=12'}
                    alt={displayName}
                    onError={(e) => {
                      e.currentTarget.src = 'https://i.pravatar.cc/150?img=12';
                    }}
                  />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-base-content">{displayName}</h1>
                  {profile.isAvailable ? (
                    <span className="badge badge-success gap-2">
                      <i className="fas fa-check-circle"></i>Available
                    </span>
                  ) : (
                    <span className="badge badge-ghost gap-2">
                      <i className="fas fa-pause-circle"></i>Not available
                    </span>
                  )}
                </div>
                <p className="text-base-content opacity-70 mt-1">
                  {profile.headline || 'No headline provided.'}
                </p>
                <p className="text-sm opacity-70 mt-2">
                  <i className="fas fa-map-marker-alt mr-2"></i>
                  {[profile.city, profile.country].filter(Boolean).join(', ') || 'Location not set'}
                </p>
                
                {/* Trust Badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {emailVerified ? (
                    <span className="badge badge-success badge-sm gap-1">
                      <i className="fas fa-check-circle"></i>Email Verified
                    </span>
                  ) : (
                    <span className="badge badge-warning badge-sm gap-1">
                      <i className="fas fa-exclamation-circle"></i>Email Not Verified
                    </span>
                  )}
                  {phoneVerified && (
                    <span className="badge badge-success badge-sm gap-1">
                      <i className="fas fa-phone"></i>Phone Verified
                    </span>
                  )}
                  {memberSince && (
                    <span className="badge badge-info badge-sm gap-1">
                      <i className="fas fa-calendar"></i>Member since {memberSince}
                    </span>
                  )}
                  {lastActive && (
                    <span className="badge badge-ghost badge-sm gap-1">
                      <i className="fas fa-clock"></i>Last active {lastActive}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 min-w-[180px]">
                <button className="btn btn-primary btn-sm">
                  <i className="fas fa-user-check mr-2"></i>Hire / Invite
                </button>
                <button className="btn btn-outline btn-sm">
                  <i className="fas fa-comments mr-2"></i>Message
                </button>
              </div>
            </div>
          </div>

          <div className="card-body">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="stat bg-base-100 rounded-xl border border-base-300">
                <div className="stat-title">Completed</div>
                <div className="stat-value text-primary">{completedJobs}</div>
                <div className="stat-desc">Jobs</div>
              </div>
              <div className="stat bg-base-100 rounded-xl border border-base-300">
                <div className="stat-title">Active</div>
                <div className="stat-value">{activeOrders}</div>
                <div className="stat-desc">Orders</div>
              </div>
              <div className="stat bg-base-100 rounded-xl border border-base-300">
                <div className="stat-title">Response</div>
                <div className="stat-value">{responseRate}%</div>
                <div className="stat-desc">Accepted / applied</div>
              </div>
              <div className="stat bg-base-100 rounded-xl border border-base-300">
                <div className="stat-title">Rating</div>
                <div className="stat-value">{rating.toFixed(1)}</div>
                <div className="stat-desc">Reviews pending</div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">About</h3>
              <p className="opacity-80">
                {profile.bio || 'This worker hasn’t written an about section yet.'}
              </p>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Skills</h3>
              {skills.length === 0 ? (
                <p className="opacity-70">No skills added yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skills.map((s, i) => (
                    <span key={`${s}-${i}`} className="badge badge-outline">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 text-sm opacity-70">
              <p>
                <i className="fas fa-file-alt mr-2"></i>
                Applications submitted: <span className="font-semibold">{applicationsAsWorker}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-full">
            <button
              className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl z-10"
              onClick={() => setSelectedImage(null)}
            >
              <i className="fas fa-times"></i>
            </button>
            <img
              src={selectedImage.url || 'https://via.placeholder.com/800'}
              alt={selectedImage.caption || 'Portfolio image'}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            {selectedImage.caption && (
              <p className="text-white mt-4 text-center">{selectedImage.caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
