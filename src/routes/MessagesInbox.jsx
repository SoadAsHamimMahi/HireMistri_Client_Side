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
  }, [conversationId, workerId, jobId, user?.uid, navigate, preloadMessages]);

  useEffect(() => {
    const fetchUserProfiles = async () => {
      const toFetch = conversations.filter(conv => conv.workerId && !userProfiles[conv.workerId]).map(conv => conv.workerId);
      for (const wId of toFetch) {
        try {
          const res = await axios.get(`${API_BASE}/api/users/${wId}/public`);
          setUserProfiles(prev => ({ ...prev, [wId]: res.data }));
        } catch {}
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
      className="h-screen overflow-hidden text-slate-100"
      style={{ background: '#111621', fontFamily: "'Inter', sans-serif" }}
    >
      {/* Slim custom scrollbar */}
      <style>{`
        .msg-scroll::-webkit-scrollbar { width: 4px; }
        .msg-scroll::-webkit-scrollbar-track { background: transparent; }
        .msg-scroll::-webkit-scrollbar-thumb { background: rgba(23,84,207,.3); border-radius: 10px; }
        .glass-sidebar { background: #0d111a; }
        .glass-chat { background: rgba(23,84,207,.05); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,.05); }
      `}</style>

      <div className="flex h-full">

        {/* ── Conversations Sidebar ── */}
        <aside
          className={`${showMobileConversations ? 'flex' : 'hidden'} md:flex flex-col flex-shrink-0 glass-sidebar border-r border-[#1754cf]/10`}
          style={{ width: '22rem' }}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-[#1754cf]/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-white">Chats</h3>
              {unreadTotal > 0 && (
                <span className="text-xs bg-[#1754cf]/20 text-[#1754cf] px-2 py-0.5 rounded-full font-bold">
                  {unreadTotal} Unread
                </span>
              )}
              {unreadTotal === 0 && conversations.length > 0 && (
                <span className="text-xs bg-[#1754cf]/20 text-[#1754cf] px-2 py-0.5 rounded-full font-bold">
                  {conversations.length} Active
                </span>
              )}
            </div>
            <Link to="/" className="text-xs bg-[#1754cf] hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5">
              <i className="fas fa-plus text-xs"></i> Browse
            </Link>
          </div>

          {/* Search */}
          <div className="px-4 pt-3 pb-2">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full bg-[#1754cf]/10 border-none rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1754cf]/40 text-slate-200 placeholder:text-slate-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter pills */}
            <div className="flex gap-2 mt-2.5 flex-wrap">
              {['all', 'unread', 'job-related'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs px-3 py-1 rounded-full font-semibold transition-all capitalize ${filter === f ? 'bg-[#1754cf] text-white' : 'bg-[#1a2232] text-slate-400 hover:text-white'}`}
                >
                  {f === 'job-related' ? 'Job-Related' : f.charAt(0).toUpperCase() + f.slice(1)}
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
                    className={`w-full flex items-center gap-3 p-4 text-left transition-all border-l-4 ${
                      isSelected
                        ? 'bg-[#1754cf]/10 border-[#1754cf]'
                        : 'border-transparent hover:bg-[#1754cf]/5'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center font-bold text-lg ${isSelected ? 'border-2 border-[#1754cf]/50' : 'border-2 border-white/5'} bg-[#1754cf]/20 text-[#1754cf]`}>
                        {profile?.profileCover
                          ? <img src={profile.profileCover} alt={conv.workerName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          : initial
                        }
                      </div>
                      {/* online dot - just decorative */}
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0d111a]"></span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="font-semibold text-sm text-white truncate">{conv.workerName || 'User'}</p>
                        <span className="text-[10px] text-slate-500 flex-shrink-0 ml-2">{formatRelativeTime(conv.lastMessageCreatedAt)}</span>
                      </div>
                      {jd && (
                        <p className="text-[10px] text-[#1754cf] font-semibold truncate mb-0.5">
                          <i className="fas fa-briefcase mr-1"></i>{jd.title}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-slate-500 truncate">{conv.lastMessageText || 'No messages yet'}</p>
                        {conv.unreadCount > 0 && (
                          <span className="flex-shrink-0 w-4 h-4 bg-green-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center">
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
        <section className={`${showMobileConversations ? 'hidden' : 'flex'} md:flex flex-1 flex-col overflow-hidden`} style={{ background: '#111621' }}>
          {conversationId ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Mobile back bar */}
              <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-[#1754cf]/10 glass-chat">
                <button
                  onClick={() => { setShowMobileConversations(true); navigate(`/${basePath}`); }}
                  className="p-2 text-slate-400 hover:text-[#1754cf] transition-colors"
                >
                  <i className="fas fa-arrow-left"></i>
                </button>
                {selectedWorkerProfile?.profileCover && (
                  <img src={selectedWorkerProfile.profileCover} alt={selectedConversation?.workerName} className="w-9 h-9 rounded-full object-cover border-2 border-[#1754cf]" referrerPolicy="no-referrer" />
                )}
                <span className="font-semibold text-white">{selectedConversation?.workerName || 'User'}</span>
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
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
              <div className="w-20 h-20 rounded-full bg-[#1754cf]/10 border border-[#1754cf]/20 flex items-center justify-center">
                <i className="fas fa-comments text-3xl text-[#1754cf]/60"></i>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-1">Your Messages</h2>
                <p className="text-slate-500 text-sm max-w-xs">Select a conversation from the sidebar to start messaging a worker</p>
              </div>
              <Link to="/" className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-[#1754cf] hover:bg-blue-600 text-white font-semibold rounded-xl transition-all text-sm">
                <i className="fas fa-search"></i> Browse Workers
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
