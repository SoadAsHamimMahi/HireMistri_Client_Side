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
  const [contact, setContact] = useState(null);
  const [showJobOfferModal, setShowJobOfferModal] = useState(false);
  const [activeTab, setActiveTab] = useState('about');

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
    return () => { ignore = true; };
  }, [workerId]);

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
          headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
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
    return [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Worker';
  }, [profile]);

  const skills = Array.isArray(profile?.skills) ? profile.skills : [];
  const stats = profile?.stats || {};
  const completedJobs = safeNum(stats.workerCompletedJobs);
  const rating = safeNum(profile?.averageRating || stats.averageRating);
  const totalReviews = safeNum(stats.totalReviews);
  const emailVerified = !!profile?.emailVerified;
  const phoneVerified = !!profile?.phoneVerified;
  const servicesOffered = profile?.servicesOffered || {};
  const serviceCategories = Array.isArray(servicesOffered.categories) ? servicesOffered.categories : [];
  const serviceTags = Array.isArray(servicesOffered.tags) ? servicesOffered.tags : [];
  const serviceArea = profile?.serviceArea || {};
  const serviceCities = Array.isArray(serviceArea.cities) ? serviceArea.cities : [];
  const serviceRadiusKm = serviceArea.radiusKm || null;
  const experienceYears = profile?.experienceYears || profile?.workExperience || null;
  const languages = Array.isArray(profile?.languages) ? profile.languages : [];
  const portfolio = Array.isArray(profile?.portfolio) ? profile.portfolio : [];
  const pricing = profile?.pricing || {};
  const hourlyRate = pricing.hourlyRate || null;
  const currency = pricing.currency || '৳';
  const skillsDisplay = skills.length > 0 ? skills : [...serviceCategories, ...serviceTags].filter(Boolean);

  const [selectedImage, setSelectedImage] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-200 transition-colors duration-300">
        <PageContainer maxWidth="6xl">
          <div className="flex items-center gap-3 mb-6 pt-6">
            <button className="btn btn-ghost btn-circle text-slate-300 hover:text-white" onClick={() => navigate(-1)}>
              <i className="fas fa-arrow-left"></i>
            </button>
          </div>
          <div className="flex items-center justify-center p-20">
            <span className="loading loading-spinner text-blue-500 loading-lg"></span>
          </div>
        </PageContainer>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-200 transition-colors duration-300">
        <PageContainer maxWidth="6xl">
          <div className="flex items-center gap-3 mb-6 pt-6">
            <button className="btn btn-ghost gap-2 text-slate-300" onClick={() => navigate(-1)}>
              <i className="fas fa-arrow-left"></i> Back
            </button>
          </div>
          <div className="text-center p-12 bg-[#1e293b] rounded-2xl border border-slate-700">
            <i className="fas fa-exclamation-triangle text-red-500 text-5xl mb-4"></i>
            <h3 className="font-bold text-2xl text-white">{error ? 'Oops, something went wrong' : 'Worker Not Found'}</h3>
            <p className="text-slate-400 mt-2">{error || 'This profile is currently unavailable.'}</p>
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1121] text-slate-300 pb-20 font-sans selection:bg-blue-500/30">
      <PageContainer maxWidth="6xl">
        
        {/* Top Back Nav */}
        <div className="py-6">
          <button className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left"></i> Back to search
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column (Main Content) */}
          <div className="w-full lg:w-[65%] flex flex-col gap-8">
            
            {/* 1. Header Section */}
            <div>
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* Avatar area with online status */}
                <div className="relative">
                  <div className="w-32 h-32 md:w-40 md:h-40 mask mask-squircle bg-slate-800 border-2 border-slate-700 p-1">
                    <img
                      src={profile.profileCover || 'https://i.pravatar.cc/300?img=12'}
                      alt={displayName}
                      className="object-cover w-full h-full mask mask-squircle"
                      onError={(e) => { e.currentTarget.src = 'https://i.pravatar.cc/300?img=12'; }}
                    />
                  </div>
                  {profile.isAvailable && (
                    <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 border-2 border-[#0b1121] rounded-full z-10 shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-white tracking-tight">{displayName}</h1>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-600/20 text-blue-500 text-[10px] font-bold uppercase tracking-wider border border-blue-600/30">
                      <i className="fas fa-check-circle"></i> Verified
                    </div>
                  </div>
                  
                  <p className="text-slate-300 text-lg font-medium">
                    {profile.headline || 'Professional Worker'}
                  </p>
                  
                  {/* Ratings Row */}
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center text-yellow-500 text-sm">
                      {[1, 2, 3, 4, 5].map(star => (
                        <i key={star} className={`fas fa-star ${star <= rating ? '' : 'text-slate-600'} mr-0.5`}></i>
                      ))}
                    </div>
                    <span className="text-white font-bold ml-1">{rating > 0 ? rating.toFixed(1) : 'New'}</span>
                    <span className="text-slate-500 text-sm">({totalReviews} reviews)</span>
                  </div>

                  {/* Trust Badges */}
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    {emailVerified && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-[11px] font-semibold border border-slate-700/50">
                        <i className="fas fa-id-card text-blue-400"></i> Identity Verified
                      </div>
                    )}
                    {phoneVerified && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-[11px] font-semibold border border-slate-700/50">
                        <i className="fas fa-mobile-alt text-blue-400"></i> Phone Verified
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-[11px] font-semibold border border-slate-700/50">
                      <i className="fas fa-award text-blue-400"></i> Top Rated
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs Outline */}
              <div className="flex items-center gap-8 mt-8 border-b border-slate-800">
                <button 
                  onClick={() => setActiveTab('about')}
                  className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'about' ? 'text-blue-500' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  About
                  {activeTab === 'about' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-md"></div>}
                </button>
                <button 
                  onClick={() => setActiveTab('portfolio')}
                  className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'portfolio' ? 'text-blue-500' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Portfolio
                  {activeTab === 'portfolio' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-md"></div>}
                </button>
                <button 
                  onClick={() => setActiveTab('reviews')}
                  className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'reviews' ? 'text-blue-500' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Reviews
                  {activeTab === 'reviews' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-md"></div>}
                </button>
              </div>
            </div>

            {/* 2. Content Area based on Tabs (Scrolling down usually shows all, but we will lay it out linearly as per design) */}
            
            {/* ABOUT SECTION */}
            <div className="mt-2" id="about">
              <h2 className="text-xl font-bold text-white mb-4">About {displayName.split(' ')[0]}</h2>
              <div className="text-slate-300/90 text-sm leading-relaxed space-y-4">
                <p>
                  {(profile.bio && profile.bio.trim()) || 
                   "Experienced professional committed to providing high-quality services. Dedicated to punctuality, transparent pricing, and excellent workmanship."}
                </p>
              </div>

              {/* Info Grid Boxes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div className="bg-[#121a2f] border border-slate-800/80 rounded-xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Specialty</span>
                  <span className="text-sm font-semibold text-slate-200 truncate">
                    {skillsDisplay.length > 0 ? skillsDisplay[0] : 'General Worker'}
                  </span>
                </div>
                <div className="bg-[#121a2f] border border-slate-800/80 rounded-xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Service Area</span>
                  <span className="text-sm font-semibold text-slate-200 truncate">
                    {serviceRadiusKm ? `Within ${serviceRadiusKm}km` : (serviceCities[0] || 'Local Area')}
                  </span>
                </div>
                <div className="bg-[#121a2f] border border-slate-800/80 rounded-xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Languages</span>
                  <span className="text-sm font-semibold text-slate-200 truncate">
                    {languages.length > 0 ? languages.join(', ') : 'English, Local'}
                  </span>
                </div>
              </div>
            </div>

            {/* PORTFOLIO SECTION */}
            {portfolio.length > 0 && (
              <div className="mt-6" id="portfolio">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Recent Projects</h2>
                  <button className="text-sm font-bold text-blue-500 hover:text-blue-400">View All <i className="fas fa-arrow-right ml-1"></i></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {portfolio.slice(0,2).map((item, i) => {
                    const imgUrl = typeof item === 'string' ? item : (item?.url || item?.imageUrl);
                    if (!imgUrl) return null;
                    return (
                      <button 
                        key={i}
                        className="w-full aspect-video rounded-2xl overflow-hidden cursor-pointer group relative border border-slate-800"
                        onClick={() => setSelectedImage({ url: imgUrl, caption: typeof item === 'object' ? item.caption : '' })}
                      >
                        <img src={imgUrl} alt="Project" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* REVIEWS SECTION */}
            <div className="mt-8" id="reviews">
              <h2 className="text-xl font-bold text-white mb-6">Client Reviews</h2>
              <div className="bg-[#121a2f] border border-slate-800/80 rounded-2xl p-6">
                <ReviewDisplay workerId={workerId} limit={10} />
              </div>
            </div>

          </div>

          {/* Right Column (Floating Panel) */}
          <div className="w-full lg:w-[35%] flex flex-col gap-6">
            
            {/* Pricing & Actions Card */}
            <div className="bg-[#172136] border border-slate-700/50 rounded-2xl p-6 shadow-xl sticky top-24">
              
              {/* Rate Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rate</span>
                  <div className="mt-1">
                    <span className="text-3xl font-extrabold text-white">{hourlyRate ? `${currency}${hourlyRate}` : 'Negotiable'}</span>
                    {hourlyRate && <span className="text-sm text-slate-400 font-medium"> / hr</span>}
                  </div>
                </div>
                <div className="text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded">
                  Instant Booking
                </div>
              </div>

              {/* Stats Layout */}
              <div className="flex flex-col gap-4 mb-8">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-3 text-slate-300">
                    <i className="fas fa-check-circle text-slate-400 w-4 text-center"></i>
                    <span className="font-medium">Jobs Completed</span>
                  </div>
                  <span className="font-bold text-white">{completedJobs > 0 ? `${completedJobs}+` : '0'}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-3 text-slate-300">
                    <i className="fas fa-history text-slate-400 w-4 text-center"></i>
                    <span className="font-medium">Experience</span>
                  </div>
                  <span className="font-bold text-white">{experienceYears ? `${experienceYears} Years` : 'N/A'}</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-3 text-slate-300">
                    <i className="far fa-clock text-slate-400 w-4 text-center"></i>
                    <span className="font-medium">Response Time</span>
                  </div>
                  <span className="font-bold text-green-400">{'< 1 hr'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                {user ? (
                  <button 
                    className="w-full bg-[#2563eb] hover:bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl transition-colors shadow-[0_4px_14px_0_rgba(37,99,235,0.39)]"
                    onClick={() => setShowJobOfferModal(true)}
                  >
                    Hire Now
                  </button>
                ) : (
                  <Link 
                    to="/login"
                    className="w-full text-center bg-[#2563eb] hover:bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl transition-colors shadow-[0_4px_14px_0_rgba(37,99,235,0.39)]"
                  >
                    Login to Hire
                  </Link>
                )}

                <button className="w-full bg-[#1e293b] hover:bg-slate-700 text-white font-semibold py-3.5 px-4 rounded-xl border border-slate-600 transition-colors">
                  Message Worker
                </button>
              </div>

              <div className="mt-5 text-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em]">
                  Secure payment via Hire Mistri Escrow
                </span>
              </div>
            </div>

            {/* Emergency Promo Card */}
            <div className="bg-[#121a2f] border border-slate-800 rounded-2xl p-5 mt-2">
              <h4 className="text-white font-bold text-sm mb-2">Need an emergency fix?</h4>
              <p className="text-slate-400 text-xs mb-4 leading-relaxed">
                {displayName.split(' ')[0]} is currently available for priority emergency jobs in your area.
              </p>
              <button className="text-blue-500 font-bold text-sm tracking-wide hover:text-blue-400 transition-colors">
                Check Availability <i className="fas fa-bolt text-yellow-500 ml-1"></i>
              </button>
            </div>

          </div>
        </div>
      </PageContainer>

      {/* Footer minimal spacer */}
      <div className="mt-20 border-t border-slate-800 py-8 text-center flex flex-col gap-4">
        <div className="flex justify-center gap-6 text-sm text-slate-400 font-medium">
          <Link to="#" className="hover:text-blue-400 transition-colors">About Us</Link>
          <Link to="#" className="hover:text-blue-400 transition-colors">Trust & Safety</Link>
          <Link to="#" className="hover:text-blue-400 transition-colors">Contact Support</Link>
        </div>
        <p className="text-xs text-slate-600 font-semibold tracking-wide">
          © 2024 Hire Mistri Technologies. All rights reserved.
        </p>
      </div>

      {/* Modals */}
      {showJobOfferModal && (
        <JobOfferModal
          workerId={workerId}
          workerName={displayName}
          workerCategories={serviceCategories}
          onClose={() => setShowJobOfferModal(false)}
          onSuccess={() => setShowJobOfferModal(false)}
        />
      )}

      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/80 transition-all duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              className="absolute -top-12 right-0 text-white/50 hover:text-white transition-colors p-2 text-3xl focus:outline-none"
              onClick={() => setSelectedImage(null)}
            >
              <i className="fas fa-times"></i>
            </button>
            <div className="relative rounded-lg overflow-hidden shadow-2xl bg-black">
              <img
                src={selectedImage.url || 'https://via.placeholder.com/800'}
                alt={selectedImage.caption || 'Expanded portfolio image'}
                className="max-w-full max-h-[85vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            {selectedImage.caption && (
              <div className="mt-4 text-slate-300 font-medium text-sm">
                {selectedImage.caption}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
