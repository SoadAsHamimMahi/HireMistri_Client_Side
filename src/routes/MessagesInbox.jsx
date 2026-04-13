import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../Authentication/AuthProvider';
import { useMessages } from '../contexts/MessagesContext';
import axios from 'axios';
import Messages from './Messages';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export default function MessagesInbox({ basePath = 'messages' }) {
  const { user } = useContext(AuthContext) || {};
  const { conversationId: urlConversationId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { preloadMessages } = useMessages();
  
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [userProfiles, setUserProfiles] = useState({});
  const [jobDetails, setJobDetails] = useState({});
  const [showMobileConversations, setShowMobileConversations] = useState(true);

  const conversationId = urlConversationId || searchParams.get('conversationId') || selectedConversationId;
  const workerId = searchParams.get('workerId');
  const jobId = searchParams.get('jobId');

  // Fetch conversations
  useEffect(() => {
    if (!user?.uid) { setConversations([]); return; }

    const fetchConversations = async () => {
      try {
        setLoadingConversations(true);
        const response = await axios.get(`${API_BASE}/api/messages/conversations?userId=${user.uid}`);
        const rawConvos = response.data || [];
        
        const convos = rawConvos.map(conv => {
          const lastMsg = conv.lastMessage || {};
          const otherId = lastMsg.senderId === user.uid ? (lastMsg.recipientId || null) : (lastMsg.senderId || null);
          const otherName = lastMsg.senderId === user.uid ? (lastMsg.recipientName || 'User') : (lastMsg.senderName || 'User');
          return {
            conversationId: conv._id,
            jobId: lastMsg.jobId || null,
            workerId: otherId,
            clientId: user.uid,
            workerName: otherName,
            lastMessageText: lastMsg.message || '',
            lastMessageCreatedAt: lastMsg.createdAt,
            unreadCount: conv.unreadCount || 0,
          };
        }).filter(conv => conv.conversationId);

        const byWorker = new Map();
        for (const c of convos) {
          const key = c.workerId ?? c.conversationId;
          if (!byWorker.has(key)) byWorker.set(key, []);
          byWorker.get(key).push(c);
        }
        const merged = [];
        byWorker.forEach((group) => {
          const sorted = [...group].sort((a, b) => new Date(b.lastMessageCreatedAt || 0) - new Date(a.lastMessageCreatedAt || 0));
          const latest = sorted[0];
          const totalUnread = group.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
          const bestName = group.reduce((best, c) => (c.workerName && c.workerName !== 'User' ? c.workerName : best), latest.workerName);
          merged.push({ ...latest, unreadCount: totalUnread, workerName: bestName || latest.workerName || 'User', allConversationIds: group.map(c => c.conversationId) });
        });
        
        setConversations(merged);
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
      } finally {
        setLoadingConversations(false);
      }
    };

    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [user?.uid]);

  useEffect(() => {
    if (conversationId) {
      setSelectedConversationId(conversationId);
      if (conversationId) preloadMessages(conversationId);
      if (window.innerWidth < 768) setShowMobileConversations(false);
    } else if (workerId) {
      const ids = [user.uid, workerId].sort();
      const newConversationId = jobId ? `${jobId}_${ids.join('_')}` : `general_${ids.join('_')}`;
      setSelectedConversationId(newConversationId);
      navigate(`/${basePath}/${newConversationId}`, { replace: true });
    }
  }, [conversationId, workerId, jobId, user?.uid, navigate, preloadMessages, basePath]);

  useEffect(() => {
    const fetchUserProfiles = async () => {
      const toFetch = conversations.filter(conv => conv.workerId && !userProfiles[conv.workerId]).map(conv => conv.workerId);
      for (const wId of toFetch) {
        try {
          const res = await axios.get(`${API_BASE}/api/users/${wId}/public`);
          setUserProfiles(prev => ({ ...prev, [wId]: res.data }));
        } catch (error) {
          console.error(`Failed to fetch public profile for ${wId}:`, error);
        }
      }
    };
    if (conversations.length > 0) fetchUserProfiles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]);

  useEffect(() => {
    const fetchJobDetails = async () => {
      const toFetch = conversations.filter(conv => conv.jobId && !jobDetails[conv.jobId]).map(conv => conv.jobId);
      for (const jId of toFetch) {
        try {
          const res = await axios.get(`${API_BASE}/api/jobs/${jId}`);
          setJobDetails(prev => ({ ...prev, [jId]: res.data }));
        } catch (err) {
          if (err.response?.status === 404) setJobDetails(prev => ({ ...prev, [jId]: null }));
        }
      }
    };
    if (conversations.length > 0) fetchJobDetails();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    let filtered = conversations;
    if (filter === 'unread') filtered = filtered.filter(c => c.unreadCount > 0);
    else if (filter === 'job-related') filtered = filtered.filter(c => c.jobId);
    else if (filter === 'general') filtered = filtered.filter(c => !c.jobId);

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(c => {
        const name = c.workerName?.toLowerCase() || '';
        const job = jobDetails[c.jobId]?.title?.toLowerCase() || '';
        return name.includes(s) || job.includes(s);
      });
    }
    return filtered.sort((a, b) => new Date(b.lastMessageCreatedAt || 0) - new Date(a.lastMessageCreatedAt || 0));
  }, [conversations, filter, searchTerm, jobDetails]);

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleConversationClick = (conv) => {
    setSelectedConversationId(conv.conversationId);
    navigate(`/${basePath}/${conv.conversationId}`);
    if (window.innerWidth < 768) setShowMobileConversations(false);
  };

  const selectedConversation = conversations.find(c => c.conversationId === conversationId || (c.allConversationIds && c.allConversationIds.includes(conversationId)));
  const selectedWorkerProfile = selectedConversation?.workerId ? userProfiles[selectedConversation.workerId] : null;
  const unreadTotal = conversations.reduce((s, c) => s + (c.unreadCount || 0), 0);

  return (
    <div
      className="h-screen overflow-hidden text-slate-100 bg-[#0b1121] selection:bg-blue-500/30 font-sans"
    >
      {/* Slim custom scrollbar and glass effects */}
      <style>{`
        .msg-scroll::-webkit-scrollbar { width: 4px; }
        .msg-scroll::-webkit-scrollbar-track { background: transparent; }
        .msg-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .glass-sidebar { background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(20px); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="flex h-full">

        {/* ── Conversations Sidebar ── */}
        <aside
          className={`${showMobileConversations ? 'flex' : 'hidden'} md:flex flex-col flex-shrink-0 glass-sidebar border-r border-white/5`}
          style={{ width: '24rem' }}
        >
          {/* Sidebar Header */}
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div className="flex flex-col">
              <h3 className="font-bold text-xl text-white tracking-tight">Messages</h3>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mt-0.5">
                {unreadTotal > 0 ? `${unreadTotal} Unread` : `${conversations.length} Conversations`}
              </p>
            </div>
            <Link to="/" className="w-8 h-8 flex items-center justify-center bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded-xl transition-all border border-blue-500/20 shadow-lg shadow-blue-600/5">
              <i className="fas fa-plus text-xs"></i>
            </Link>
          </div>

          {/* Search */}
          <div className="px-5 pt-4 pb-2">
            <div className="relative group">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-sm group-focus-within:text-blue-400 transition-colors"></i>
              <input
                type="text"
                placeholder="Search chats or jobs..."
                className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder:text-white/20 transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter pills */}
            <div className="flex gap-2 mt-3.5 no-scrollbar overflow-x-auto pb-1">
              {['all', 'unread', 'job-related'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-[11px] px-4 py-1.5 rounded-full font-bold transition-all uppercase tracking-tighter flex-shrink-0 ${
                    filter === f 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : 'bg-white/5 text-white/40 hover:text-white border border-white/5'
                  }`}
                >
                  {f === 'job-related' ? 'Job Posts' : f}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto msg-scroll">
            {loadingConversations ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <i className="fas fa-spinner fa-spin text-[#1754cf] text-2xl"></i>
                <p className="text-slate-500 text-sm">Loading chats...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-[#1754cf]/10 flex items-center justify-center">
                  <i className="fas fa-inbox text-2xl text-slate-500"></i>
                </div>
                <p className="text-slate-500 text-sm">
                  {searchTerm || filter !== 'all' ? 'No matching conversations' : 'No conversations yet'}
                </p>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const profile = userProfiles[conv.workerId];
                const jd = jobDetails[conv.jobId];
                const isSelected = conv.conversationId === conversationId;
                const initial = (conv.workerName || 'U').charAt(0).toUpperCase();

                return (
                  <button
                    key={conv.conversationId}
                    onClick={() => handleConversationClick(conv)}
                    className={`w-full flex items-center gap-4 p-5 text-left transition-all relative ${
                      isSelected
                        ? 'bg-white/5 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-blue-500 before:rounded-r-full'
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-12 h-12 mask mask-squircle overflow-hidden flex items-center justify-center font-bold text-lg ${
                        isSelected ? 'ring-2 ring-blue-500/50' : 'ring-1 ring-white/10'
                      } bg-white/10 text-white/80`}>
                        {profile?.profileCover
                          ? <img src={profile.profileCover} alt={conv.workerName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          : initial
                        }
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0b1121] shadow-sm"></span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className={`font-bold text-sm tracking-tight truncate ${isSelected ? 'text-white' : 'text-white/80'}`}>
                          {conv.workerName || 'User'}
                        </p>
                        <span className="text-[10px] text-white/30 font-medium uppercase tracking-tighter">
                          {formatRelativeTime(conv.lastMessageCreatedAt)}
                        </span>
                      </div>
                      {jd && (
                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider truncate mb-1 bg-blue-500/10 px-1.5 py-0.5 rounded w-fit max-w-full">
                          <i className="fas fa-briefcase mr-1.5 opacity-70"></i>{jd.title}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-3">
                        <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-white font-semibold' : 'text-white/40'}`}>
                          {conv.lastMessageText || 'No messages yet'}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="flex-shrink-0 min-w-[18px] h-[18px] bg-blue-600 rounded-full text-[9px] text-white font-black flex items-center justify-center shadow-lg shadow-blue-600/30">
                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ── Chat Area ── */}
        <section className={`${showMobileConversations ? 'hidden' : 'flex'} md:flex flex-1 flex-col overflow-hidden bg-[#0b1121]`}>
          {conversationId ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Mobile back bar */}
              <div className="md:hidden flex items-center gap-4 px-5 py-4 border-b border-white/5 bg-white/5 backdrop-blur-xl">
                <button
                  onClick={() => { setShowMobileConversations(true); navigate(`/${basePath}`); }}
                  className="p-2 -ml-2 text-white/60 hover:text-white transition-colors"
                >
                  <i className="fas fa-arrow-left"></i>
                </button>
                <div className="flex items-center gap-3">
                  {selectedWorkerProfile?.profileCover && (
                    <img src={selectedWorkerProfile.profileCover} alt={selectedConversation?.workerName} className="w-10 h-10 mask mask-squircle object-cover ring-1 ring-white/10" referrerPolicy="no-referrer" />
                  )}
                  <span className="font-bold text-white tracking-tight">{selectedConversation?.workerName || 'User'}</span>
                </div>
              </div>

              {/* Messages component fills remaining space */}
              <div className="flex-1 overflow-hidden">
                <Messages
                  conversationId={conversationId}
                  jobId={selectedConversation?.jobId || jobId || null}
                  workerId={selectedConversation?.workerId || workerId || null}
                  workerName={selectedConversation?.workerName || null}
                  showHeader={false}
                  showUserInfo={true}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.05)_0%,transparent_50%)]"></div>
              <div className="w-24 h-24 mask mask-squircle bg-white/5 border border-white/10 flex items-center justify-center relative shadow-2xl">
                <i className="fas fa-comments text-4xl text-blue-500/40"></i>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white animate-pulse">
                  <i className="fas fa-sparkles"></i>
                </div>
              </div>
              <div className="text-center relative">
                <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Your Inbox</h2>
                <p className="text-white/40 text-sm  leading-relaxed font-medium">Select a conversation or browse workers to start a new collaboration</p>
              </div>
              <Link to="/" className="mt-4 flex items-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all text-sm shadow-xl shadow-blue-600/20 active:scale-95">
                <i className="fas fa-search-plus"></i> Find Workers
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
