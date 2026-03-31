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
  const languages = Array.isArray(profile?.languages) ? profile.languages : [];
  const portfolio = Array.isArray(profile?.portfolio) ? profile.portfolio : [];
  const pricing = profile?.pricing || {};
  const hourlyRate = pricing.hourlyRate || null;
  const currency = pricing.currency || '৳';

  const serviceCities = Array.isArray(profile?.serviceArea?.cities) ? profile.serviceArea.cities : [];
  if (serviceCities.length === 0 && profile?.city) serviceCities.push(profile.city);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1121] text-slate-200 transition-colors duration-300">
        <PageContainer maxWidth="6xl">
          <div className="flex items-center justify-center p-40">
            <div className="flex flex-col items-center gap-4">
              <span className="loading loading-spinner text-[#1754cf] loading-lg"></span>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Accessing Profile...</p>
            </div>
          </div>
        </PageContainer>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#0b1121] text-slate-200 transition-colors duration-300">
        <PageContainer maxWidth="6xl">
          <div className="flex items-center gap-3 mb-6 pt-6">
            <button className="btn btn-ghost gap-2 text-slate-300" onClick={() => navigate(-1)}>
              <i className="fas fa-arrow-left"></i> Back
            </button>
          </div>
          <div className="text-center p-12 bg-[#121a2f] rounded-[2rem] border border-slate-800 shadow-2xl">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <i className="fas fa-exclamation-triangle text-red-500 text-3xl"></i>
            </div>
            <h3 className="font-extrabold text-3xl text-white mb-2">{error ? 'Oops, profile unavailable' : 'Worker Not Found'}</h3>
            <p className="text-slate-400 max-w-md mx-auto">{error || 'This profile is currently unavailable or doesn\'t exist in our records.'}</p>
            <button onClick={() => navigate(-1)} className="mt-8 px-8 py-3 bg-[#1754cf] text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all">
              Return to Catalog
            </button>
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1121] text-slate-100 pb-20 font-sans selection:bg-[#1754cf]/30">
      
      {/* 1. Hero / Cover Section */}
      <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden">
        <img 
          src={profile.profileBanner || 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=2000'} 
          className="w-full h-full object-cover opacity-40 scale-105 blur-sm"
          alt="Profile Background"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1121] via-[#0b1121]/60 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b1121] via-transparent to-[#0b1121]"></div>
        
        {/* Back Button Overlay */}
        <div className="absolute top-8 left-8 z-10">
          <button 
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#121a2f]/80 backdrop-blur-xl border border-white/5 text-white/80 hover:text-white hover:border-white/20 transition-all text-sm font-bold shadow-2xl"
            onClick={() => navigate(-1)}
          >
            <i className="fas fa-arrow-left"></i> Back to search
          </button>
        </div>
      </div>

      <PageContainer maxWidth="6xl">
        
        {/* Profile Header Overlay */}
        <div className="relative -mt-40 md:-mt-52 z-20 mb-16">
          <div className="flex flex-col md:flex-row items-end gap-8 px-4">
            {/* Avatar */}
            <div className="relative shrink-0 group">
              <div className="w-40 h-40 md:w-56 md:h-56 mask mask-squircle bg-[#1a2232] p-2 shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10 relative z-10">
                <img
                  src={profile.profileCover || profile.photoURL || 'https://i.pravatar.cc/400?img=12'}
                  alt={displayName}
                  className="object-cover w-full h-full mask mask-squircle transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => { e.currentTarget.src = 'https://i.pravatar.cc/400?img=12'; }}
                />
              </div>
              <div className="absolute -inset-4 bg-gradient-to-br from-[#1754cf]/20 to-transparent blur-3xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
              
              {profile.isAvailable && (
                <div className="absolute bottom-6 right-6 w-8 h-8 bg-emerald-500 border-[6px] border-[#0b1121] rounded-full z-20 shadow-[0_0_25px_rgba(16,185,129,0.6)] animate-pulse"></div>
              )}
            </div>

            {/* Profile Brief */}
            <div className="flex-1 pb-4">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-2xl">{displayName}</h1>
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1754cf]/10 text-[#1754cf] text-[10px] font-black uppercase tracking-[0.15em] border border-[#1754cf]/20 shadow-xl backdrop-blur-md">
                  <i className="fas fa-certificate"></i> Verified Expert
                </div>
              </div>
              
              <p className="text-xl md:text-2xl text-slate-400 font-bold mb-6 tracking-tight">
                {profile.headline || 'Professional Master Mistri'}
              </p>

              <div className="flex flex-wrap items-center gap-8">
                <div className="flex items-center gap-3">
                  <div className="flex items-center text-yellow-500 text-lg">
                    {[1, 2, 3, 4, 5].map(star => (
                      <i key={star} className={`fas fa-star ${star <= Math.round(rating) ? '' : 'text-slate-700'} mr-0.5`}></i>
                    ))}
                  </div>
                  <div>
                    <span className="text-white font-black text-lg">{rating > 0 ? rating.toFixed(1) : 'New'}</span>
                    <span className="text-slate-500 text-xs font-bold block">({totalReviews} Reviews)</span>
                  </div>
                </div>
                
                <div className="h-10 w-[1px] bg-white/10 hidden sm:block"></div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-[#1754cf] border border-blue-500/20">
                    <i className="fas fa-map-marker-alt"></i>
                  </div>
                  <div>
                    <span className="text-white font-black block">{serviceCities.length > 0 ? serviceCities[0] : 'Dhaka'}</span>
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{serviceCities.length > 1 ? `+${serviceCities.length - 1} more cities` : 'Bangladesh'}</span>
                  </div>
                </div>

                {experienceYears && (
                  <>
                    <div className="h-10 w-[1px] bg-white/10 hidden sm:block"></div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                        <i className="fas fa-award"></i>
                      </div>
                      <div>
                        <span className="text-white font-black block">{experienceYears} Years</span>
                        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Experience</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Left Column (Main Content) */}
          <div className="w-full lg:w-[65%] flex flex-col gap-12">
            
            {/* 2. Core Expertise Section */}
            <section className="bg-[#121a2f]/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
              <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                <span className="w-8 h-[1px] bg-slate-800"></span> 
                Core Expertise
              </h3>
              <div className="flex flex-wrap gap-3">
                {skillsDisplay.length > 0 ? skillsDisplay.map((skill, idx) => (
                  <span key={idx} className="px-5 py-2.5 rounded-2xl bg-[#0b1121] border border-white/5 text-slate-200 text-xs font-bold hover:border-[#1754cf]/40 hover:bg-[#1754cf]/10 hover:text-white transition-all cursor-default shadow-lg group">
                    <i className="fas fa-bolt text-[10px] text-[#1754cf] mr-2 opacity-30 group-hover:opacity-100 transition-opacity"></i>
                    {skill}
                  </span>
                )) : (
                  <span className="text-slate-500 italic text-sm">No specific expertise listed.</span>
                )}
              </div>
            </section>

            {/* 3. Navigation Tabs */}
            <div className="sticky top-24 z-30 bg-[#0b1121]/90 backdrop-blur-2xl rounded-3xl p-1.5 border border-white/5 shadow-2xl overflow-hidden mb-4">
              <div className="flex items-center gap-1">
                {['about', 'portfolio', 'reviews'].map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 px-6 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden ${activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                  >
                    <span className="relative z-10">{tab}</span>
                    {activeTab === tab && (
                      <div className="absolute inset-0 bg-[#1754cf] shadow-[0_0_20px_rgba(23,84,207,0.4)] transition-all"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Dynamic Content Sections */}
            <div className="min-h-[400px]">
              
              {/* About Section */}
              {activeTab === 'about' && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                  <div className="flex items-center gap-6 mb-8">
                    <h2 className="text-3xl font-black text-white tracking-tighter">Professional Bio</h2>
                    <div className="h-[1px] flex-1 bg-white/5"></div>
                  </div>
                  
                  <div className="bg-[#121a2f]/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-10 shadow-2xl mb-12">
                    <p className="text-slate-300 text-lg md:text-xl leading-relaxed font-medium">
                      {(profile.bio && profile.bio.trim()) || 
                       "Professional Mistri with a commitment to excellence. I provide high-quality structural and mechanical solutions with a focus on durability and precision. My approach combines traditional expertise with modern efficiency to ensure your task is handled exactly right."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-[#121a2f]/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 flex items-center gap-5 group hover:border-emerald-500/20 transition-all shadow-xl">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-2xl shrink-0 transition-transform group-hover:scale-110 shadow-inner">
                        <i className="fas fa-check-shield"></i>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Account Status</p>
                        <p className="text-white font-black text-lg">Identity Verified</p>
                      </div>
                    </div>
                    
                    <div className="bg-[#121a2f]/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 flex items-center gap-5 group hover:border-[#1754cf]/20 transition-all shadow-xl">
                      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-[#1754cf] text-2xl shrink-0 transition-transform group-hover:scale-110 shadow-inner">
                        <i className="fas fa-language"></i>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Expertise Range</p>
                        <p className="text-white font-black text-lg">{decodedServices.length || 1} Categories</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Portfolio Section */}
              {activeTab === 'portfolio' && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                  <div className="flex items-center gap-6 mb-10">
                    <h2 className="text-3xl font-black text-white tracking-tighter">Work Showcase</h2>
                    <div className="h-[1px] flex-1 bg-white/5"></div>
                  </div>
                  
                  {portfolio.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {portfolio.map((item, i) => {
                        const imgUrl = typeof item === 'string' ? item : (item?.url || item?.imageUrl);
                        const caption = typeof item === 'object' ? item.caption : '';
                        if (!imgUrl) return null;
                        return (
                          <div 
                            key={i} 
                            className="group relative rounded-[2rem] overflow-hidden bg-[#121a2f] border border-white/10 cursor-pointer shadow-2xl"
                            onClick={() => setSelectedImage({ url: imgUrl, caption })}
                          >
                            <div className="aspect-[4/5] overflow-hidden">
                              <img src={imgUrl} alt="Project" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-1" />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8">
                              <p className="text-white font-black text-2xl mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">{caption || 'Project Showcase'}</p>
                              <div className="flex items-center gap-3 text-slate-300 text-xs font-bold uppercase tracking-widest translate-y-4 group-hover:translate-y-0 shadow transition-transform duration-700">
                                <i className="fas fa-calendar-alt text-[#1754cf]"></i> Verified Performance
                              </div>
                            </div>
                            <div className="absolute top-6 right-6 w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-all duration-300">
                              <i className="fas fa-expand-alt"></i>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-[#121a2f]/40 backdrop-blur-md border border-white/5 rounded-[3rem] p-24 text-center shadow-2xl">
                      <div className="w-24 h-24 bg-[#0b1121] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-white/5">
                        <i className="fas fa-images text-4xl text-slate-700"></i>
                      </div>
                      <h3 className="text-2xl font-black text-slate-300 tracking-tight">Portfolio Preview Unavailable</h3>
                      <p className="text-slate-500 mt-2 font-medium">Verified project visuals will appear here as they are uploaded.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Reviews Section */}
              {activeTab === 'reviews' && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                  <div className="flex items-center gap-6 mb-10">
                    <h2 className="text-3xl font-black text-white tracking-tighter">Client Feedback</h2>
                    <div className="h-[1px] flex-1 bg-white/5"></div>
                  </div>
                  
                  <div className="bg-[#121a2f]/40 backdrop-blur-md border border-white/5 rounded-[3rem] p-1 shadow-2xl overflow-hidden">
                    <div className="bg-[#0b1121]/50 p-6 md:p-12">
                      <ReviewDisplay workerId={workerId} limit={10} />
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Right Column (Floating Action Panel) */}
          <div className="w-full lg:w-[35%]">
            <div className="sticky top-28 flex flex-col gap-8">
              
              {/* Main Hire Card */}
              <div className="bg-[#121a2f] border border-white/10 rounded-[3rem] p-10 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#1754cf]/15 rounded-full -mr-24 -mt-24 blur-[80px]"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full -ml-16 -mb-16 blur-[60px]"></div>
                
                {/* Price Display */}
                <div className="flex items-center justify-between mb-10 relative z-10">
                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-2">Expertise Valuation</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-5xl font-black text-white tracking-tighter">{hourlyRate ? `${currency}${hourlyRate}` : 'Contact'}</span>
                      {hourlyRate && <span className="text-slate-400 font-bold text-sm">/hr</span>}
                    </div>
                  </div>
                  <div className="bg-[#1754cf]/15 text-[#1754cf] px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] border border-[#1754cf]/20 shadow-xl backdrop-blur-md">
                    Premium Tier
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-10 relative z-10">
                  <div className="bg-[#0b1121]/60 p-5 rounded-3xl border border-white/5 shadow-inner">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <i className="fas fa-check-circle text-[#1754cf]/60"></i> Hires
                    </p>
                    <p className="text-white font-black text-2xl tracking-tighter">{completedJobs > 0 ? `${completedJobs}+` : 'Elite'}</p>
                  </div>
                  <div className="bg-[#0b1121]/60 p-5 rounded-3xl border border-white/5 shadow-inner">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <i className="fas fa-bolt text-yellow-500/60"></i> Speed
                    </p>
                    <p className="text-white font-black text-2xl tracking-tighter">Fast</p>
                  </div>
                </div>

                {/* Primary Actions */}
                <div className="flex flex-col gap-4 relative z-10">
                  {user ? (
                    <button 
                      className="w-full bg-[#1754cf] hover:bg-blue-600 text-white font-black py-5 rounded-[1.5rem] transition-all shadow-[0_15px_30px_rgba(23,84,207,0.3)] hover:shadow-[0_20px_40px_rgba(23,84,207,0.4)] active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
                      onClick={() => setShowJobOfferModal(true)}
                    >
                      Book Professional <i className="fas fa-arrow-right text-sm"></i>
                    </button>
                  ) : (
                    <Link 
                      to="/login"
                      className="w-full text-center bg-[#1754cf] hover:bg-blue-600 text-white font-black py-5 rounded-[1.5rem] transition-all shadow-[0_10px_25px_rgba(23,84,207,0.2)] flex items-center justify-center gap-3 text-lg"
                    >
                      Sign In to Hire
                    </Link>
                  )}

                  <div className="flex gap-3">
                    <button className="flex-1 bg-[#1a2232] hover:bg-[#243047] text-white font-bold py-4 rounded-2xl border border-white/5 transition-all flex items-center justify-center gap-2 text-sm shadow-xl active:scale-95">
                      <i className="far fa-comment-dots text-[#1754cf]"></i> Chat
                    </button>
                    <button className="flex-1 bg-[#1a2232] hover:bg-[#243047] text-white font-bold py-4 rounded-2xl border border-white/5 transition-all flex items-center justify-center gap-2 text-sm shadow-xl active:scale-95">
                      <i className="far fa-share-square text-[#1754cf]"></i> Share
                    </button>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-center gap-4 relative z-10">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-4 border-[#121a2f] bg-slate-800 overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?u=${i+100}`} className="w-full h-full object-cover" alt="" />
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Hired by {completedJobs + 12} clients
                  </p>
                </div>
              </div>

              {/* Security & Support Card */}
              <div className="bg-gradient-to-br from-[#1754cf]/15 to-transparent border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl">
                <div className="absolute -right-8 -bottom-8 text-9xl text-[#1754cf]/5 rotate-12 transition-transform group-hover:scale-110 group-hover:rotate-0 duration-700">
                  <i className="fas fa-shield-alt"></i>
                </div>
                <h4 className="text-white font-black mb-3 flex items-center gap-3 text-lg">
                  <i className="fas fa-shield-check text-emerald-500"></i> Quality Assurance
                </h4>
                <p className="text-slate-400 text-sm leading-relaxed mb-6 font-medium">
                  {displayName.split(' ')[0]} provides professional-grade service backed by our secure Escrow platform. 
                </p>
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-[#1754cf]">
                   <span>Secure Booking</span>
                   <i className="fas fa-chevron-right"></i>
                </div>
              </div>

            </div>
          </div>
        </div>
      </PageContainer>

      {/* Footer minimal spacer */}
      <footer className="mt-32 pt-16 pb-12 border-t border-white/5 text-center px-6">
        <div className="flex flex-wrap justify-center gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-10">
          <Link to="#" className="hover:text-[#1754cf] transition-colors">Trust Standards</Link>
          <Link to="#" className="hover:text-[#1754cf] transition-colors">Help Center</Link>
          <Link to="#" className="hover:text-[#1754cf] transition-colors">Terms of Service</Link>
        </div>
        <p className="text-xs text-slate-700 font-bold tracking-[0.3em] uppercase">
          © 2024 Hire Mistri Masterpiece Series.
        </p>
      </footer>

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
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-3xl bg-black/90 transition-all duration-500 animate-in fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col items-center">
            <button
              className="absolute -top-16 right-0 text-white/40 hover:text-white transition-colors p-3 text-4xl focus:outline-none bg-white/5 rounded-full backdrop-blur-md border border-white/10"
              onClick={() => setSelectedImage(null)}
            >
              <i className="fas fa-times"></i>
            </button>
            <div className="relative rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10 bg-black group">
              <img
                src={selectedImage.url || 'https://via.placeholder.com/1200'}
                alt={selectedImage.caption || 'Expanded portfolio image'}
                className="max-w-full max-h-[80vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col items-center text-center opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white font-black text-2xl tracking-tight mb-2">{selectedImage.caption || 'Project Showcase'}</p>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">Professional Verification Confirmed</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
