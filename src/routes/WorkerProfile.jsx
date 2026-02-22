// src/routes/WorkerProfile.jsx
import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { AuthContext } from '../Authentication/AuthProvider';
import ReviewDisplay from '../components/ReviewDisplay';
import PageContainer from '../components/layout/PageContainer';
import JobOfferModal from '../components/JobOfferModal';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function WorkerProfile() {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [contact, setContact] = useState(null); // { phone, email } when client has accepted job with worker
  const [showJobOfferModal, setShowJobOfferModal] = useState(false);

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
          cache: 'no-store',
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

  // Fetch contact details only when client is logged in and has accepted job with this worker
  useEffect(() => {
    if (!user?.uid || !workerId || user.uid === workerId) {
      setContact(null);
      return;
    }
    let ignore = false;
    (async () => {
      try {
        const auth = getAuth();
        const token = await auth.currentUser?.getIdToken?.();
        if (!token) {
          if (!ignore) setContact(null);
          return;
        }
        const res = await fetch(`${API_BASE}/api/users/${encodeURIComponent(workerId)}/contact`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok && !ignore) {
          const data = await res.json();
          setContact(data);
        } else {
          if (!ignore) setContact(null);
        }
      } catch {
        if (!ignore) setContact(null);
      }
    })();
    return () => { ignore = true; };
  }, [user?.uid, workerId]);

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
  const totalReviews = safeNum(stats.totalReviews);
  const categoryRatings = stats.categoryRatings || {};
  
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
  const skillsDisplay = skills.length > 0 ? skills : [...serviceCategories, ...serviceTags].filter(Boolean);
  
  // Portfolio lightbox state
  const [selectedImage, setSelectedImage] = useState(null);
  

  if (loading) {
    return (
      <div className="min-h-screen page-bg">
        <PageContainer maxWidth="6xl">
          <div className="flex items-center gap-3 mb-6">
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
              <i className="fas fa-arrow-left mr-2"></i>Back
            </button>
          </div>
          <div className="card bg-base-200 shadow-sm border border-base-300">
            <div className="card-body">
              <span className="loading loading-spinner loading-md"></span>
              <p className="text-muted">Loading worker profile...</p>
            </div>
          </div>
        </PageContainer>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen page-bg">
        <PageContainer maxWidth="6xl">
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
        </PageContainer>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen page-bg">
        <PageContainer maxWidth="6xl">
          <button className="btn btn-ghost btn-sm mb-6" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left mr-2"></i>Back
          </button>
          <div className="alert alert-warning">
            <i className="fas fa-info-circle"></i>
            <span>No profile data found.</span>
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-bg">
      <PageContainer maxWidth="6xl">
        <div className="flex items-center justify-between gap-3 mb-6">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left mr-2"></i>Back
          </button>
          <Link to="/applications" className="btn btn-outline btn-sm">
            <i className="fas fa-briefcase mr-2"></i>Applications
          </Link>
        </div>

        <div className="space-y-8">
          {/* Card 1: Header */}
          <div className="card bg-base-200 shadow-sm border border-base-300 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10">
              <div className="flex flex-col md:flex-row md:items-center gap-5">
                <div className="avatar">
                  <div className="w-16 md:w-20 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                    <img
                      src={profile.profileCover || 'https://i.pravatar.cc/150?img=12'}
                      alt={displayName}
                      onError={(e) => {
                        e.currentTarget.src = 'https://i.pravatar.cc/150?img=12';
                      }}
                    />
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl lg:text-3xl font-bold text-base-content">{displayName}</h1>
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
                  <p className="text-muted">
                    {profile.headline || 'No headline provided.'}
                  </p>
                  <p className="text-sm text-muted">
                    <i className="fas fa-map-marker-alt mr-2"></i>
                    {[profile.city, profile.country].filter(Boolean).join(', ') || 'Location not set'}
                  </p>
                  <div className="flex flex-wrap gap-2">
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
                  {user ? (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowJobOfferModal(true)}
                    >
                      <i className="fas fa-user-check mr-2"></i>Hire / Invite
                    </button>
                  ) : (
                    <Link to="/login" className="btn btn-primary btn-sm">
                      <i className="fas fa-user-check mr-2"></i>Hire / Invite
                    </Link>
                  )}
                  {(contact?.phone || contact?.email) ? (
                    <div className="flex flex-col gap-2">
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone.replace(/\s/g, '')}`}
                          className="btn btn-success btn-sm"
                        >
                          <i className="fas fa-phone mr-2"></i>Call
                        </a>
                      )}
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="btn btn-outline btn-sm"
                        >
                          <i className="fas fa-envelope mr-2"></i>Email
                        </a>
                      )}
                    </div>
                  ) : user ? (
                    <p className="text-xs text-muted max-w-[180px]">
                      Contact details are shared after you accept their application.
                    </p>
                  ) : (
                    <p className="text-xs text-muted max-w-[180px]">
                      Sign in and accept their application to view contact details.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {showJobOfferModal && (
            <JobOfferModal
              workerId={workerId}
              workerName={displayName}
              workerCategories={Array.isArray(profile?.servicesOffered?.categories) ? profile.servicesOffered.categories : []}
              onClose={() => setShowJobOfferModal(false)}
              onSuccess={() => setShowJobOfferModal(false)}
            />
          )}

          {/* Card 2: Stats */}
          <div className="card bg-base-200 shadow-sm border border-base-300">
            <div className="card-body">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <div className="stat bg-base-100 rounded-xl border border-base-300 py-4 px-4">
                  <div className="stat-title text-sm">Completed</div>
                  <div className="stat-value text-primary text-2xl">{completedJobs}</div>
                  <div className="stat-desc text-xs">Jobs</div>
                </div>
                <div className="stat bg-base-100 rounded-xl border border-base-300 py-4 px-4">
                  <div className="stat-title text-sm">Active</div>
                  <div className="stat-value text-2xl">{activeOrders}</div>
                  <div className="stat-desc text-xs">Orders</div>
                </div>
                <div className="stat bg-base-100 rounded-xl border border-base-300 py-4 px-4">
                  <div className="stat-title text-sm">Response</div>
                  <div className="stat-value text-2xl">{responseRate}%</div>
                  <div className="stat-desc text-xs">Accepted / applied</div>
                </div>
                <div className="stat bg-base-100 rounded-xl border border-base-300 py-4 px-4">
                  <div className="stat-title text-sm">Rating</div>
                  <div className="stat-value text-2xl">{rating.toFixed(1)}</div>
                  <div className="stat-desc text-xs">{totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</div>
                </div>
              </div>
              <p className="text-sm text-muted mt-4">
                <i className="fas fa-file-alt mr-2"></i>
                Applications submitted: <span className="font-semibold">{applicationsAsWorker}</span>
              </p>
            </div>
          </div>

          {/* Card 3: About + Skills */}
          <div className="card bg-base-200 shadow-sm border border-base-300">
            <div className="card-body space-y-4">
              <h3 className="text-lg font-semibold mb-0">About</h3>
              <div className="prose prose-sm max-w-none text-base-content">
                <p className="text-base-content opacity-80 leading-relaxed">
                  {(profile.bio && profile.bio.trim()) || (profile.headline && profile.headline.trim()) || 'This worker hasn’t written an about section yet.'}
                </p>
              </div>
              <div className="divider my-2"></div>
              <h3 className="text-base font-semibold">Skills</h3>
              {skillsDisplay.length === 0 ? (
                <p className="text-muted text-sm">No skills added yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skillsDisplay.map((s, i) => (
                    <span key={`${s}-${i}`} className="badge badge-outline">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Card 4: Services + Service Area + Experience */}
          {(serviceCategories.length > 0 || serviceTags.length > 0 || serviceCities.length > 0 || serviceRadiusKm != null || (experienceYears != null && experienceYears !== '')) && (
            <div className="card bg-base-200 shadow-sm border border-base-300">
              <div className="card-body space-y-4">
                {(serviceCategories.length > 0 || serviceTags.length > 0) && (
                  <>
                    <h3 className="text-base font-semibold">Services Offered</h3>
                    <div className="flex flex-wrap gap-2">
                      {serviceCategories.map((c, i) => (
                        <span key={`cat-${i}`} className="badge badge-primary">{c}</span>
                      ))}
                      {serviceTags.map((t, i) => (
                        <span key={`tag-${i}`} className="badge badge-outline">{t}</span>
                      ))}
                    </div>
                  </>
                )}
                {(serviceCities.length > 0 || serviceRadiusKm) && (
                  <>
                    <h3 className="text-base font-semibold">Service Area</h3>
                    <p className="text-muted text-sm">
                      {serviceCities.length > 0 && serviceCities.join(', ')}
                      {serviceRadiusKm && (serviceCities.length > 0 ? ` • Within ${serviceRadiusKm} km` : `Within ${serviceRadiusKm} km radius`)}
                    </p>
                  </>
                )}
                {experienceYears != null && experienceYears !== '' && (
                  <>
                    <h3 className="text-base font-semibold">Experience</h3>
                    <p className="text-muted text-sm">
                      <i className="fas fa-briefcase mr-2 text-primary"></i>
                      {Number(experienceYears) === 0 ? 'Less than 1 year' : `${experienceYears} ${Number(experienceYears) === 1 ? 'year' : 'years'} of experience`}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Card 5: Certifications + Languages */}
          {(certifications.length > 0 || languages.length > 0) && (
            <div className="card bg-base-200 shadow-sm border border-base-300">
              <div className="card-body space-y-4">
                {certifications.length > 0 && (
                  <>
                    <h3 className="text-base font-semibold">Certifications</h3>
                    <ul className="space-y-2">
                      {certifications.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 bg-base-100 rounded-lg p-3 border border-base-300">
                          <i className="fas fa-award text-primary mt-0.5"></i>
                          <div>
                            <span className="font-medium">{c.title || 'Certification'}</span>
                            {(c.issuer || c.year) && (
                              <span className="text-sm text-muted ml-2">
                                {c.issuer}{c.issuer && c.year ? ' • ' : ''}{c.year}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {languages.length > 0 && (
                  <>
                    <h3 className="text-base font-semibold">Languages</h3>
                    <div className="flex flex-wrap gap-2">
                      {languages.map((l, i) => (
                        <span key={i} className="badge badge-ghost gap-1">
                          <i className="fas fa-language"></i>{l}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Card 6: Pricing */}
          {(hourlyRate != null || startingPrice != null || minimumCharge != null) && (
            <div className="card bg-base-200 shadow-sm border border-base-300">
              <div className="card-body space-y-4">
                <h3 className="text-base font-semibold">Pricing</h3>
                <div className="grid gap-2">
                  {hourlyRate != null && (
                    <p className="text-muted text-sm">
                      <span className="text-muted">Hourly rate:</span> {currency} {hourlyRate}
                    </p>
                  )}
                  {startingPrice != null && (
                    <p className="text-muted text-sm">
                      <span className="text-muted">Starting from:</span> {currency} {startingPrice}
                    </p>
                  )}
                  {minimumCharge != null && (
                    <p className="text-muted text-sm">
                      <span className="text-muted">Minimum charge:</span> {currency} {minimumCharge}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Card 7: Portfolio */}
          {portfolio.length > 0 && (
            <div className="card bg-base-200 shadow-sm border border-base-300">
              <div className="card-body space-y-4">
                <h3 className="text-base font-semibold">Portfolio</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {portfolio.map((item, i) => {
                    const imgUrl = typeof item === 'string' ? item : (item?.url || item?.imageUrl);
                    const caption = typeof item === 'object' && item?.caption;
                    if (!imgUrl) return null;
                    return (
                      <button
                        key={i}
                        type="button"
                        className="aspect-square rounded-lg overflow-hidden border border-base-300 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary"
                        onClick={() => setSelectedImage({ url: imgUrl, caption })}
                      >
                        <img src={imgUrl} alt={caption || 'Portfolio'} className="w-full h-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Rating Breakdown */}
          {totalReviews > 0 && Object.keys(categoryRatings).length > 0 && (
            <div className="card bg-base-200 shadow-sm border border-base-300">
              <div className="card-body space-y-4">
                <h3 className="text-lg font-semibold mb-0">Rating Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'qualityOfWork', label: 'Quality of Work', icon: 'fas fa-tools' },
                    { key: 'punctuality', label: 'Punctuality', icon: 'fas fa-clock' },
                    { key: 'communication', label: 'Communication', icon: 'fas fa-comments' },
                    { key: 'professionalism', label: 'Professionalism', icon: 'fas fa-user-tie' },
                    { key: 'valueForMoney', label: 'Value for Money', icon: 'fas fa-dollar-sign' },
                    { key: 'cleanliness', label: 'Cleanliness', icon: 'fas fa-broom' },
                  ].map((category) => {
                    const categoryRating = categoryRatings[category.key] || 0;
                    if (categoryRating === 0) return null;
                    return (
                      <div key={category.key} className="bg-base-100 rounded-lg p-4 border border-base-300">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <i className={`${category.icon} text-primary`}></i>
                            <span className="font-medium text-base-content">{category.label}</span>
                          </div>
                          <span className="text-lg font-bold text-primary">{categoryRating.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <i
                              key={star}
                              className={`fas fa-star text-sm ${
                                star <= Math.round(categoryRating)
                                  ? 'text-yellow-400'
                                  : 'text-muted'
                              }`}
                            ></i>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </PageContainer>

      {/* Reviews Section */}
      {totalReviews > 0 && (
        <PageContainer maxWidth="6xl">
          <div className="card bg-base-200 shadow-sm border border-base-300">
            <div className="card-body space-y-4">
              <h3 className="text-lg font-semibold mb-0 text-base-content">
                <i className="fas fa-star mr-2 text-primary"></i>
                Reviews ({totalReviews})
              </h3>
              <ReviewDisplay workerId={workerId} limit={10} />
            </div>
          </div>
        </PageContainer>
      )}

      {/* Portfolio Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-full">
            <button
              className="absolute top-4 right-4 text-primary-content hover:opacity-80 text-2xl z-10"
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
