// src/routes/WorkerProfile.jsx
import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { AuthContext } from '../Authentication/AuthProvider';
import ReviewDisplay from '../components/ReviewDisplay';
import PageContainer from '../components/layout/PageContainer';
import JobOfferModal from '../components/JobOfferModal';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

const SERVICE_CATEGORY_GROUPS = [
  {
    id: 'home-repair-trades',
    title: 'Home Repair & Trades',
    items: [
      { id: 'electrician', label: 'Electrician' },
      { id: 'plumber', label: 'Plumber' },
      { id: 'ac-service', label: 'AC Service & Repair' },
      { id: 'carpenter', label: 'Carpenter' },
      { id: 'painter', label: 'Painter' },
      { id: 'mason', label: 'Mason / Civil' },
      { id: 'tile-marble', label: 'Tile & Marble Fix' },
      { id: 'welder', label: 'Welder / Fabrication' },
      { id: 'gypsum', label: 'Gypsum / False Ceiling' },
      { id: 'glass-alum', label: 'Glass & Aluminium' },
    ],
  },
  {
    id: 'install-mounting',
    title: 'Install & Mounting',
    items: [
      { id: 'general-install', label: 'Fan, Light & Appliance' },
      { id: 'mounting-decor', label: 'Curtain, Mirror & Shelves' },
      { id: 'tv-mount', label: 'TV Wall Mount' },
      { id: 'water-filter', label: 'Water Filter / Geyser' },
    ],
  },
  {
    id: 'other',
    title: 'Specialized / Other',
    items: [
      { id: 'cleaning', label: 'Cleaning Service' },
      { id: 'security', label: 'Security Guard' },
      { id: 'gardening', label: 'Gardening' },
      { id: 'other', label: 'Other' },
    ],
  },
];

function decodeServiceSlug(slug) {
  if (!slug || !slug.includes(':')) return slug;
  const [groupId, itemId] = slug.split(':');
  const group = SERVICE_CATEGORY_GROUPS.find(g => g.id === groupId);
  if (!group) return itemId || slug;
  const item = group.items.find(it => it.id === itemId);
  return item ? item.label : (itemId || slug);
}

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
  const [selectedImage, setSelectedImage] = useState(null);

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
    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
    if (fullName) return fullName;
    return profile.displayName && profile.displayName !== 'User' ? profile.displayName : 'Worker';
  }, [profile]);

  // Data processing
  const stats = profile?.stats || {};
  const completedJobs = safeNum(stats.workerCompletedJobs || stats.jobsCompleted || 0);
  const rating = safeNum(profile?.averageRating || stats.averageRating);
  const totalReviews = safeNum(stats.totalReviews || 0);
  
  const rawServices = Array.isArray(profile?.servicesOffered) ? profile.servicesOffered : [];
  const decodedServices = useMemo(() => {
    return rawServices.map(decodeServiceSlug).filter(Boolean);
  }, [rawServices]);

  const skills = Array.isArray(profile?.skills) ? profile.skills : [];
  const skillsDisplay = [...new Set([...decodedServices, ...skills])];
  
  const experienceYears = profile?.experienceYears || profile?.workExperience || null;
  const portfolio = Array.isArray(profile?.portfolio) ? profile.portfolio : [];
  const pricing = profile?.pricing || {};
  const hourlyRate = pricing.hourlyRate || null;
  const currency = pricing.currency || '৳';

  const serviceCities = Array.isArray(profile?.serviceArea?.cities) ? profile.serviceArea.cities : [];
  if (serviceCities.length === 0 && profile?.city) serviceCities.push(profile.city);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300">
        <PageContainer>
          <div className="flex items-center justify-center p-40">
            <div className="flex flex-col items-center gap-4">
              <span className="loading loading-spinner text-[#0a58ca] loading-lg"></span>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Profile...</p>
            </div>
          </div>
        </PageContainer>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300">
        <PageContainer>
          <div className="flex items-center gap-3 mb-6 pt-6">
            <button className="btn btn-ghost gap-2 text-gray-600 hover:text-gray-900" onClick={() => navigate(-1)}>
              <i className="fas fa-arrow-left"></i> Back
            </button>
          </div>
          <div className="text-center p-8 lg:p-12 bg-white rounded-2xl border border-gray-200 shadow-sm max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
            </div>
            <h3 className="font-bold text-2xl text-gray-900 mb-2">{error ? 'Oops, profile unavailable' : 'Worker Not Found'}</h3>
            <p className="text-gray-500 max-w-md mx-auto">{error || 'This profile is currently unavailable or doesn\'t exist in our records.'}</p>
            <button onClick={() => navigate(-1)} className="mt-8 px-6 py-2.5 bg-[#0a58ca] hover:bg-[#084298] text-white rounded-lg font-semibold shadow-sm transition-all">
              Return to Catalog
            </button>
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20 font-sans selection:bg-[#0a58ca]/20">
      
      {/* 1. Hero / Cover Section */}
      <div className="relative w-full h-[250px] md:h-[300px] bg-gray-200 overflow-hidden">
        <img 
          src={profile.profileBanner || 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=2000'} 
          className="w-full h-full object-cover opacity-90"
          alt="Profile Background"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-gray-50/40 to-transparent"></div>
        
        {/* Back Button Overlay */}
        <div className="absolute top-6 left-6 lg:left-[8.333%] z-10">
          <button 
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-700 hover:text-[#0a58ca] hover:bg-white transition-all text-sm font-semibold shadow-sm"
            onClick={() => navigate(-1)}
          >
            <i className="fas fa-arrow-left"></i> Back to search
          </button>
        </div>
      </div>

      <PageContainer>
        
        {/* Profile Header Overlay */}
        <div className="relative -mt-24 md:-mt-32 z-20 mb-12">
          <div className="flex flex-col md:flex-row items-end gap-6 md:gap-8 px-2 md:px-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-32 h-32 md:w-44 md:h-44 rounded-full bg-white p-1 shadow-md border border-gray-100 relative z-10">
                <img
                  src={profile.profileCover || profile.photoURL || 'https://i.pravatar.cc/400?img=12'}
                  alt={displayName}
                  className="object-cover w-full h-full rounded-full"
                  onError={(e) => { e.currentTarget.src = 'https://i.pravatar.cc/400?img=12'; }}
                />
              </div>
              
              {profile.isAvailable && (
                <div className="absolute bottom-4 right-4 w-6 h-6 bg-green-500 border-4 border-white rounded-full z-20 shadow-sm" title="Available for work"></div>
              )}
            </div>

            {/* Profile Brief */}
            <div className="flex-1 pb-2">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{displayName}</h1>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#0a58ca] text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                  <i className="fas fa-certificate"></i> Verified
                </div>
              </div>
              
              <p className="text-lg text-gray-600 font-medium mb-5">
                {profile.headline || 'Professional Mistri'}
              </p>

              <div className="flex flex-wrap items-center gap-6 bg-white p-3 md:px-5 rounded-xl border border-gray-200 shadow-sm inline-flex">
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-yellow-400 text-base">
                    {[1, 2, 3, 4, 5].map(star => (
                      <i key={star} className={`fas fa-star ${star <= Math.round(rating) ? '' : 'text-gray-200'} mr-0.5`}></i>
                    ))}
                  </div>
                  <div>
                    <span className="text-gray-900 font-bold">{rating > 0 ? rating.toFixed(1) : 'New'}</span>
                    <span className="text-gray-500 text-xs ml-1">({totalReviews})</span>
                  </div>
                </div>
                
                <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

                <div className="flex items-center gap-2">
                  <i className="fas fa-map-marker-alt text-[#0a58ca]"></i>
                  <div>
                    <span className="text-gray-900 font-semibold">{serviceCities.length > 0 ? serviceCities[0] : 'Dhaka'}</span>
                  </div>
                </div>

                {experienceYears && (
                  <>
                    <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
                    <div className="flex items-center gap-2">
                      <i className="fas fa-award text-[#0a58ca]"></i>
                      <div>
                        <span className="text-gray-900 font-semibold">{experienceYears} Years</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column (Main Content) */}
          <div className="w-full lg:w-[65%] flex flex-col gap-8">
            
            {/* 2. Core Expertise Section */}
            <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                Core Expertise
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {skillsDisplay.length > 0 ? skillsDisplay.map((skill, idx) => (
                  <span key={idx} className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium hover:border-[#0a58ca] hover:text-[#0a58ca] transition-colors cursor-default">
                    {skill}
                  </span>
                )) : (
                  <span className="text-gray-500 italic text-sm">No specific expertise listed.</span>
                )}
              </div>
            </section>

            {/* 3. Navigation Tabs */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex">
              {['about', 'portfolio', 'reviews'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3.5 px-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === tab ? 'text-[#0a58ca] border-[#0a58ca] bg-blue-50/30' : 'text-gray-500 border-transparent hover:text-gray-800 hover:bg-gray-50'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* 4. Dynamic Content Sections */}
            <div className="min-h-[400px]">
              
              {/* About Section */}
              {activeTab === 'about' && (
                <div className="animate-in fade-in duration-500">
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Professional Bio</h2>
                    <p className="text-gray-600 text-base leading-relaxed">
                      {(profile.bio && profile.bio.trim()) || 
                       "Professional Mistri with a commitment to excellence. I provide high-quality structural and mechanical solutions with a focus on durability and precision. My approach combines traditional expertise with modern efficiency to ensure your task is handled exactly right."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                      <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600 text-xl shrink-0">
                        <i className="fas fa-check-circle"></i>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Account Status</p>
                        <p className="text-gray-900 font-bold text-base">Identity Verified</p>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-[#0a58ca] text-xl shrink-0">
                        <i className="fas fa-layer-group"></i>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Expertise Range</p>
                        <p className="text-gray-900 font-bold text-base">{decodedServices.length || 1} Categories</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Portfolio Section */}
              {activeTab === 'portfolio' && (
                <div className="animate-in fade-in duration-500">
                  {portfolio.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {portfolio.map((item, i) => {
                        const imgUrl = typeof item === 'string' ? item : (item?.url || item?.imageUrl);
                        const caption = typeof item === 'object' ? item.caption : '';
                        if (!imgUrl) return null;
                        return (
                          <div 
                            key={i} 
                            className="group relative rounded-xl overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer shadow-sm hover:shadow-md transition-all"
                            onClick={() => setSelectedImage({ url: imgUrl, caption })}
                          >
                            <div className="aspect-[4/3] overflow-hidden">
                              <img src={imgUrl} alt="Project" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                            <div className="p-4 bg-white border-t border-gray-100">
                              <p className="text-gray-900 font-semibold text-sm truncate">{caption || 'Project Showcase'}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-sm">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-images text-2xl text-gray-400"></i>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800">No Portfolio Yet</h3>
                      <p className="text-gray-500 text-sm mt-1">This worker hasn't uploaded any past work photos.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Reviews Section */}
              {activeTab === 'reviews' && (
                <div className="animate-in fade-in duration-500">
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-6 md:p-8">
                      <ReviewDisplay workerId={workerId} limit={10} />
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Right Column (Floating Action Panel) */}
          <div className="w-full lg:w-[35%]">
            <div className="sticky top-28 flex flex-col gap-6">
              
              {/* Main Hire Card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 lg:p-8 shadow-sm relative overflow-hidden">
                
                {/* Price Display */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Pricing</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-900">{hourlyRate ? `${currency}${hourlyRate}` : 'Contact'}</span>
                      {hourlyRate && <span className="text-gray-500 font-medium text-sm">/hr</span>}
                    </div>
                  </div>
                  <div className="bg-blue-50 text-[#0a58ca] px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                    Premium
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                       <i className="fas fa-check-circle text-green-500"></i> Jobs Done
                    </p>
                    <p className="text-gray-900 font-bold text-xl">{completedJobs > 0 ? `${completedJobs}+` : 'New'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                       <i className="fas fa-bolt text-yellow-500"></i> Speed
                    </p>
                    <p className="text-gray-900 font-bold text-xl">Fast</p>
                  </div>
                </div>

                {/* Primary Actions */}
                <div className="flex flex-col gap-3">
                  {user ? (
                    <button 
                      className="w-full bg-[#0a58ca] hover:bg-[#084298] text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 text-base"
                      onClick={() => setShowJobOfferModal(true)}
                    >
                      Book Professional <i className="fas fa-arrow-right text-xs"></i>
                    </button>
                  ) : (
                    <Link 
                      to="/login"
                      className="w-full text-center bg-[#0a58ca] hover:bg-[#084298] text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 text-base"
                    >
                      Sign In to Hire
                    </Link>
                  )}

                  <div className="flex gap-3">
                    <button className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl border border-gray-300 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm">
                      <i className="far fa-comment-dots text-gray-400"></i> Chat
                    </button>
                    <button className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl border border-gray-300 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm">
                      <i className="far fa-share-square text-gray-400"></i> Share
                    </button>
                  </div>
                </div>
              </div>

              {/* Security & Support Card */}
              <div className="bg-[#f0f9ff] border border-blue-100 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 text-6xl text-[#0a58ca]/5 rotate-12">
                  <i className="fas fa-shield-alt"></i>
                </div>
                <h4 className="text-gray-900 font-bold mb-2 flex items-center gap-2 text-base">
                  <i className="fas fa-shield-check text-[#0a58ca]"></i> Trust & Safety
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  All payments and communications are securely handled through Hire Mistri platform.
                </p>
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#0a58ca]">
                   <span>Secure Escrow</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </PageContainer>

      {/* Modals */}
      {showJobOfferModal && (
        <JobOfferModal
          workerId={workerId}
          workerName={displayName}
          workerCategories={decodedServices}
          onClose={() => setShowJobOfferModal(false)}
          onSuccess={() => setShowJobOfferModal(false)}
        />
      )}

      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-all duration-300 animate-in fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              className="absolute -top-12 right-0 text-white/70 hover:text-white p-2 text-3xl transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <i className="fas fa-times"></i>
            </button>
            <div className="relative rounded-lg overflow-hidden shadow-2xl bg-black">
              <img
                src={selectedImage.url}
                alt={selectedImage.caption || 'Expanded portfolio image'}
                className="max-w-full max-h-[85vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              {selectedImage.caption && (
                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white text-center">
                  <p className="font-semibold">{selectedImage.caption}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
