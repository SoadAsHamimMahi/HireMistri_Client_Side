import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../Authentication/AuthProvider';
import { useMessages } from '../contexts/MessagesContext';
import axios from 'axios';
import Messages from './Messages';
import { FaSearch, FaFilter, FaArrowLeft } from 'react-icons/fa';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export default function MessagesInbox() {
  const { user } = useContext(AuthContext) || {};
  const { conversationId: urlConversationId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { preloadMessages } = useMessages();
  
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, job-related, general
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [userProfiles, setUserProfiles] = useState({}); // Cache for user profiles
  const [jobDetails, setJobDetails] = useState({}); // Cache for job details
  const [showMobileConversations, setShowMobileConversations] = useState(true);

  // Get conversation ID from URL params or search params
  const conversationId = urlConversationId || searchParams.get('conversationId') || selectedConversationId;
  const workerId = searchParams.get('workerId');
  const jobId = searchParams.get('jobId');

  // Fetch conversations
  useEffect(() => {
    if (!user?.uid) {
      setConversations([]);
      return;
    }

    const fetchConversations = async () => {
      try {
        setLoadingConversations(true);
        const response = await axios.get(`${API_BASE}/api/messages/conversations?userId=${user.uid}`);
        const rawConvos = response.data || [];
        
        const convos = rawConvos.map(conv => {
          const lastMsg = conv.lastMessage || {};
          const otherId = lastMsg.senderId === user.uid 
            ? (lastMsg.recipientId || null)
            : (lastMsg.senderId || null);
          const otherName = lastMsg.senderId === user.uid 
            ? (lastMsg.recipientName || 'User')
            : (lastMsg.senderName || 'User');
          
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

        // Single inbox per worker: group by workerId so one row per worker (latest thread + merged unread)
        const byWorker = new Map();
        for (const c of convos) {
          const key = c.workerId ?? c.conversationId;
          if (!byWorker.has(key)) byWorker.set(key, []);
          byWorker.get(key).push(c);
        }
        const merged = [];
        byWorker.forEach((group) => {
          const sorted = [...group].sort(
            (a, b) => new Date(b.lastMessageCreatedAt || 0) - new Date(a.lastMessageCreatedAt || 0)
          );
          const latest = sorted[0];
          const totalUnread = group.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
          const bestName = group.reduce(
            (best, c) => (c.workerName && c.workerName !== 'User' ? c.workerName : best),
            latest.workerName
          );
          merged.push({
            ...latest,
            unreadCount: totalUnread,
            workerName: bestName || latest.workerName || 'User',
            allConversationIds: group.map(c => c.conversationId),
          });
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

  // Set selected conversation from URL or search params
  useEffect(() => {
    if (conversationId) {
      setSelectedConversationId(conversationId);
      if (conversationId) {
        preloadMessages(conversationId);
      }
      // On mobile, hide conversations list when conversation is selected
      if (window.innerWidth < 768) {
        setShowMobileConversations(false);
      }
    } else if (workerId) {
      // Generate conversation ID for new conversation
      const ids = [user.uid, workerId].sort();
      const newConversationId = jobId ? `${jobId}_${ids.join('_')}` : `general_${ids.join('_')}`;
      setSelectedConversationId(newConversationId);
      navigate(`/messages/${newConversationId}`, { replace: true });
    }
  }, [conversationId, workerId, jobId, user?.uid, navigate, preloadMessages]);

  // Fetch user profiles for conversations
  useEffect(() => {
    const fetchUserProfiles = async () => {
      const profilesToFetch = conversations
        .filter(conv => conv.workerId && !userProfiles[conv.workerId])
        .map(conv => conv.workerId);

      for (const workerId of profilesToFetch) {
        try {
          const response = await axios.get(`${API_BASE}/api/users/${workerId}/public`);
          setUserProfiles(prev => ({ ...prev, [workerId]: response.data }));
        } catch (err) {
          console.error(`Failed to fetch profile for ${workerId}:`, err);
        }
      }
    };

    if (conversations.length > 0) {
      fetchUserProfiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]);

  // Fetch job details for job-related conversations
  useEffect(() => {
    const fetchJobDetails = async () => {
      const jobsToFetch = conversations
        .filter(conv => conv.jobId && !jobDetails[conv.jobId])
        .map(conv => conv.jobId);

      for (const jobId of jobsToFetch) {
        try {
          const response = await axios.get(`${API_BASE}/api/jobs/${jobId}`);
          setJobDetails(prev => ({ ...prev, [jobId]: response.data }));
        } catch (err) {
          // Job might have been deleted - mark as null to avoid retrying
          if (err.response?.status === 404) {
            setJobDetails(prev => ({ ...prev, [jobId]: null }));
          } else {
            console.error(`Failed to fetch job ${jobId}:`, err);
          }
        }
      }
    };

    if (conversations.length > 0) {
      fetchJobDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]);

  // Filter and search conversations
  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Apply filter
    if (filter === 'unread') {
      filtered = filtered.filter(conv => conv.unreadCount > 0);
    } else if (filter === 'job-related') {
      filtered = filtered.filter(conv => conv.jobId);
    } else if (filter === 'general') {
      filtered = filtered.filter(conv => !conv.jobId);
    }

    // Apply search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(conv => {
        const name = conv.workerName?.toLowerCase() || '';
        const jobTitle = jobDetails[conv.jobId]?.title?.toLowerCase() || '';
        return name.includes(search) || jobTitle.includes(search);
      });
    }

    // Sort by last message time (most recent first)
    return filtered.sort((a, b) => {
      const aTime = new Date(a.lastMessageCreatedAt || 0).getTime();
      const bTime = new Date(b.lastMessageCreatedAt || 0).getTime();
      return bTime - aTime;
    });
  }, [conversations, filter, searchTerm, jobDetails]);

  // Format relative time
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
    navigate(`/messages/${conv.conversationId}`);
    if (window.innerWidth < 768) {
      setShowMobileConversations(false);
    }
  };

  const selectedConversation = conversations.find(
    c => c.conversationId === conversationId || (c.allConversationIds && c.allConversationIds.includes(conversationId))
  );
  const selectedWorkerProfile = selectedConversation?.workerId ? userProfiles[selectedConversation.workerId] : null;
  const selectedJobDetail = selectedConversation?.jobId ? jobDetails[selectedConversation.jobId] : null;

  return (
    <div className="min-h-screen page-bg">
      <div className="flex h-screen">
        {/* Conversations Sidebar */}
        <div className={`${
          showMobileConversations ? 'flex' : 'hidden'
        } md:flex flex-col w-full md:w-80 lg:w-96 border-r border-base-300 bg-base-200`}>
          {/* Header */}
          <div className="p-4 border-b border-base-300 bg-base-100">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-base-content">Messages</h1>
              <Link
                to="/"
                className="btn btn-sm btn-primary"
                onClick={() => setShowMobileConversations(false)}
              >
                <i className="fas fa-plus mr-2"></i>
                Browse Workers
              </Link>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content opacity-50" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="input input-bordered w-full pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              <select
                className="select select-bordered select-sm flex-1"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="job-related">Job Related</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="p-4 text-center">
                <span className="loading loading-spinner loading-md text-primary"></span>
                <p className="text-sm text-base-content opacity-70 mt-2">Loading conversations...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-base-content opacity-70">
                <i className="fas fa-inbox text-4xl mb-2 opacity-30"></i>
                <p className="text-sm">
                  {searchTerm || filter !== 'all' ? 'No conversations match your filters' : 'No conversations yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-base-300">
                {filteredConversations.map((conv) => {
                  const profile = userProfiles[conv.workerId];
                  const jobDetail = jobDetails[conv.jobId];
                  const isSelected = conv.conversationId === conversationId;

                  return (
                    <button
                      key={conv.conversationId}
                      onClick={() => handleConversationClick(conv)}
                      className={`w-full p-4 text-left hover:bg-base-300 transition-colors ${
                        isSelected ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Profile Picture */}
                        <div className="avatar flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                            {profile?.profileCover ? (
                              <img
                                src={profile.profileCover}
                                alt={conv.workerName}
                                className="w-full h-full rounded-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className={`w-full h-full rounded-full flex items-center justify-center ${profile?.profileCover ? 'hidden' : ''}`}>
                              <i className="fas fa-user text-primary text-lg"></i>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm text-base-content truncate">
                                {conv.workerName || 'User'}
                              </p>
                              {profile?.emailVerified && (
                                <div className="badge badge-success badge-xs">
                                  <i className="fas fa-check-circle"></i>
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-base-content opacity-60 flex-shrink-0 ml-2">
                              {formatRelativeTime(conv.lastMessageCreatedAt)}
                            </span>
                          </div>
                          
                          {jobDetail && jobDetail !== null && (
                            <div className="mb-1">
                              <span className="badge badge-outline badge-xs">
                                <i className="fas fa-briefcase mr-1"></i>
                                {jobDetail.title}
                              </span>
                            </div>
                          )}

                          <p className="text-xs text-base-content opacity-70 truncate">
                            {conv.lastMessageText || 'No messages yet'}
                          </p>
                        </div>

                        {conv.unreadCount > 0 && (
                          <span className="badge badge-primary badge-sm flex-shrink-0">
                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Message View */}
        <div className={`${
          showMobileConversations ? 'hidden' : 'flex'
        } md:flex flex-1 flex-col bg-base-100`}>
          {conversationId ? (
            <>
              {/* Mobile back button */}
              <div className="md:hidden p-4 border-b border-base-300 bg-base-100 flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowMobileConversations(true);
                    navigate('/messages');
                  }}
                  className="btn btn-sm btn-ghost"
                >
                  <FaArrowLeft />
                </button>
                <div className="flex items-center gap-3 flex-1">
                  {selectedWorkerProfile?.profileCover && (
                    <div className="avatar">
                      <div className="w-10 h-10 rounded-full">
                        <img
                          src={selectedWorkerProfile.profileCover}
                          alt={selectedConversation?.workerName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-base-content">
                      {selectedConversation?.workerName || 'User'}
                    </h3>
                    {selectedWorkerProfile && (
                      <p className="text-xs text-base-content opacity-70">
                        {[selectedWorkerProfile.city, selectedWorkerProfile.country].filter(Boolean).join(', ') || 'Location not set'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages Component */}
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
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-base-200">
              <div className="text-center p-8">
                <i className="fas fa-comments text-6xl text-base-content opacity-30 mb-4"></i>
                <h2 className="text-xl font-semibold text-base-content mb-2">Select a conversation</h2>
                <p className="text-base-content opacity-70 mb-4">
                  Choose a conversation from the sidebar to start messaging
                </p>
                <Link to="/" className="btn btn-primary">
                  <i className="fas fa-plus mr-2"></i>
                  Browse Workers
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
