import { useState, useEffect, useRef, useContext, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../Authentication/AuthProvider';
import { useMessages } from '../contexts/MessagesContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { FaPaperPlane, FaComments } from 'react-icons/fa';
import axios from 'axios';
import ChatApplicationStatus from '../components/ChatApplicationStatus';
import ChatJobCreationModal from '../components/ChatJobCreationModal';
import WorkerJobRequestCard from '../components/WorkerJobRequestCard';
import toast from 'react-hot-toast';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export default function Messages({ 
  jobId, 
  workerId, 
  workerName, 
  conversationId: providedConversationId, 
  onClose,
  showHeader = true,
  showUserInfo = false
}) {
  const { user } = useContext(AuthContext) || {};
  const { getCachedMessages, updateMessages, addMessage } = useMessages();
  const { socket, connected, sendMessage, sendTyping, markMessagesRead } = useWebSocket();
  const navigate = useNavigate();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [extractedWorkerId, setExtractedWorkerId] = useState(null);
  const [extractedWorkerName, setExtractedWorkerName] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [workerProfile, setWorkerProfile] = useState(null);
  const [jobDetail, setJobDetail] = useState(null);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [applicationData, setApplicationData] = useState(null);
  const [showJobCreationModal, setShowJobCreationModal] = useState(false);
  const [workerJobRequest, setWorkerJobRequest] = useState(null);
  const [conversationJobs, setConversationJobs] = useState({ jobs: [], workerRequests: [] });
  const [withdrawingOfferId, setWithdrawingOfferId] = useState(null);
  const messagesEndRef = useRef(null);
  
  // Use provided conversationId or generate one - jobId is optional, but workerId and user.uid are required
  const conversationId = providedConversationId || (workerId && user?.uid 
    ? jobId 
      ? `${jobId}_${[user.uid, workerId].sort().join('_')}`
      : `general_${[user.uid, workerId].sort().join('_')}`
    : null);
  
  // Use extracted values if workerId/workerName not provided
  const finalWorkerId = workerId || extractedWorkerId;
  const finalWorkerName = workerName || extractedWorkerName || 'Worker';

  // Get initial messages from cache (instant, no loading)
  const [messages, setMessages] = useState(() => {
    return conversationId ? getCachedMessages(conversationId) : [];
  });

  // Load messages in background (silent update)
  useEffect(() => {
    if (!conversationId || !user?.uid) return;

    const loadMessages = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/api/messages/conversation/${conversationId}?userId=${user.uid}`
        );
        const loadedMessages = response.data || [];
        
        // Update both local state and cache
        setMessages(loadedMessages);
        updateMessages(conversationId, loadedMessages);
        
        // Extract workerId and workerName from messages if not provided
        if (!workerId && loadedMessages.length > 0) {
          const firstMessage = loadedMessages[0];
          const otherId = firstMessage.senderId === user.uid 
            ? firstMessage.recipientId 
            : firstMessage.senderId;
          const otherName = firstMessage.senderId === user.uid 
            ? firstMessage.recipientName 
            : firstMessage.senderName;
          
          if (otherId && !extractedWorkerId) {
            setExtractedWorkerId(otherId);
          }
          if (otherName && !extractedWorkerName) {
            setExtractedWorkerName(otherName);
          }
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    };

    // If no cached messages, load immediately; otherwise load in background
    if (messages.length === 0) {
      loadMessages();
    } else {
      // Small delay to let UI render cached messages first
      setTimeout(loadMessages, 100);
    }

    // Poll for new messages every 3 seconds (silent updates) - fallback if WebSocket not connected
    const interval = connected ? null : setInterval(loadMessages, 3000);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [conversationId, user?.uid, workerId, extractedWorkerId, extractedWorkerName, connected]);

  // WebSocket: Listen for new messages and typing indicators
  useEffect(() => {
    if (!socket || !conversationId) return;

    const handleNewMessage = (message) => {
      if (message.conversationId === conversationId) {
        setMessages(prev => {
          // Avoid duplicates - check by ID, or by content + sender + time (within 5 seconds)
          const isDuplicate = prev.some(m => {
            // Exact ID match
            if (m._id === message._id || m.id === message.id) return true;
            
            // Check if it's a duplicate by content + sender + recipient + time
            // Match by: same sender, same content, same recipient, within 5 seconds
            if (m.senderId === message.senderId && 
                m.recipientId === message.recipientId &&
                m.message === message.message) {
              const mTime = new Date(m.createdAt).getTime();
              const msgTime = new Date(message.createdAt).getTime();
              const timeDiff = Math.abs(msgTime - mTime);
              // If within 5 seconds, it's likely a duplicate (especially if one is temp)
              if (timeDiff < 5000) {
                return true;
              }
            }
            return false;
          });
          
          if (isDuplicate) {
            // Replace temp message with real message if we have a temp one
            const hasTemp = prev.some(m => 
              m._id?.startsWith('temp-') && 
              m.senderId === message.senderId &&
              m.recipientId === message.recipientId &&
              m.message === message.message
            );
            
            if (hasTemp && !message._id?.startsWith('temp-')) {
              // Replace temp message with real one
              return prev.map(m => {
                if (m._id?.startsWith('temp-') && 
                    m.senderId === message.senderId &&
                    m.recipientId === message.recipientId &&
                    m.message === message.message) {
                  return message;
                }
                return m;
              });
            }
            // If duplicate but no temp to replace, just return prev (don't add duplicate)
            return prev;
          }
          return [...prev, message];
        });
        addMessage(conversationId, message);
        // Mark as read if this user is the recipient and the message is from the other user
        if (message.recipientId === user?.uid && message.senderId === finalWorkerId) {
          markMessagesRead(conversationId, finalWorkerId);
        }
      }
    };

    const handleTyping = (data) => {
      if (data.userId === finalWorkerId) { // Check if the typing user is the other participant
        setIsTyping(data.typing);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleTyping);
    };
  }, [socket, conversationId, finalWorkerId, addMessage, user?.uid, markMessagesRead]);

  // Fetch worker profile and job details
  useEffect(() => {
    const fetchWorkerProfile = async () => {
      const targetWorkerId = finalWorkerId;
      if (!targetWorkerId || !showUserInfo) return;
      
      try {
        const response = await axios.get(`${API_BASE}/api/users/${targetWorkerId}/public`);
        setWorkerProfile(response.data);
      } catch (err) {
        console.error('Failed to fetch worker profile:', err);
      }
    };

    const fetchJobDetail = async () => {
      if (!jobId) return;
      
      try {
        const response = await axios.get(`${API_BASE}/api/browse-jobs/${jobId}`);
        setJobDetail(response.data);
      } catch (err) {
        // Job might have been deleted - set to null to avoid retrying
        if (err.response?.status === 404) {
          setJobDetail(null);
        } else {
          console.error('Failed to fetch job details:', err);
        }
      }
    };

    fetchWorkerProfile();
    fetchJobDetail();
  }, [finalWorkerId, jobId, showUserInfo]);

  // Fetch application status for job-related conversations
  useEffect(() => {
    const fetchApplicationStatus = async () => {
      if (!jobId || !user?.uid || !finalWorkerId) {
        setApplicationData(null);
        setApplicationStatus(null);
        return;
      }

      try {
        const response = await axios.get(
          `${API_BASE}/api/applications/${jobId}/${finalWorkerId}`
        );
        setApplicationData(response.data);
        setApplicationStatus(response.data.status || 'pending');
      } catch (err) {
        if (err.response?.status === 404) {
          // No application yet
          setApplicationStatus(null);
          setApplicationData(null);
        } else {
          console.error('Failed to fetch application status:', err);
        }
      }
    };

    fetchApplicationStatus();
  }, [jobId, user?.uid, finalWorkerId]);

  // Fetch worker job requests for this conversation
  useEffect(() => {
    const fetchWorkerJobRequest = async () => {
      if (!conversationId) return;

      try {
        const response = await axios.get(
          `${API_BASE}/api/worker-job-requests?conversationId=${conversationId}`
        );
        if (response.data && response.data.length > 0) {
          setWorkerJobRequest(response.data[0]);
        }
      } catch (err) {
        console.error('Failed to fetch worker job request:', err);
      }
    };

    fetchWorkerJobRequest();
  }, [conversationId]);

  // Task 6.2: Fetch conversation jobs to show pending offer and Withdraw button
  useEffect(() => {
    const fetchConversationJobs = async () => {
      if (!conversationId || !user?.uid) return;
      try {
        const response = await axios.get(
          `${API_BASE}/api/conversations/${conversationId}/jobs`
        );
        setConversationJobs({
          jobs: response.data.jobs || [],
          workerRequests: response.data.workerRequests || []
        });
      } catch (err) {
        console.error('Failed to fetch conversation jobs:', err);
      }
    };
    fetchConversationJobs();
  }, [conversationId, user?.uid]);

  // Pending private job offer sent by this client (can be withdrawn)
  const pendingOfferJob = useMemo(() => {
    return conversationJobs.jobs.find(
      (j) =>
        j.isPrivate &&
        String(j.clientId) === String(user?.uid) &&
        (j.offerStatus === 'pending' || (j.status === 'active' && j.offerStatus !== 'accepted' && j.offerStatus !== 'rejected' && j.offerStatus !== 'withdrawn'))
    ) || null;
  }, [conversationJobs.jobs, user?.uid]);

  const handleWithdrawOffer = async (offerJobId) => {
    if (!user?.uid || !offerJobId) return;
    setWithdrawingOfferId(offerJobId);
    try {
      await axios.post(
        `${API_BASE}/api/job-offers/${offerJobId}/withdraw`,
        { clientId: user.uid }
      );
      toast.success('Job offer withdrawn');
      const response = await axios.get(
        `${API_BASE}/api/conversations/${conversationId}/jobs`
      );
      setConversationJobs({
        jobs: response.data.jobs || [],
        workerRequests: response.data.workerRequests || []
      });
    } catch (err) {
      console.error('Failed to withdraw job offer:', err);
      toast.error(err.response?.data?.error || 'Failed to withdraw job offer');
    } finally {
      setWithdrawingOfferId(null);
    }
  };

  const handleApplicationStatusChange = (newStatus, data) => {
    setApplicationStatus(newStatus);
    setApplicationData(data);
  };

  const handleJobCreated = async (newJobId) => {
    // Single inbox: use canonical conversationId (jobId_clientId_workerId) so client and worker share one thread
    const newConversationId = user?.uid && finalWorkerId
      ? `${newJobId}_${[user.uid, finalWorkerId].sort().join('_')}`
      : null;

    if (newConversationId) {
      try {
        const response = await axios.get(
          `${API_BASE}/api/conversations/${newConversationId}/jobs`
        );
        setConversationJobs({
          jobs: response.data.jobs || [],
          workerRequests: response.data.workerRequests || []
        });
        if (response.data.jobs && response.data.jobs.length > 0) {
          const newJob = response.data.jobs.find(j => j._id === newJobId) || response.data.jobs[0];
          setJobDetail(newJob);
        }
      } catch (err) {
        console.error('Failed to refresh conversation jobs:', err);
      }
      navigate(`/messages/${newConversationId}?jobId=${newJobId}`, { replace: true });
    }

    setShowJobCreationModal(false);
  };

  // Deduplicate messages before rendering - remove duplicates by _id
  const uniqueMessages = useMemo(() => {
    const seen = new Set();
    return messages.filter(msg => {
      const id = msg._id || msg.id;
      if (!id || seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
  }, [messages]);

  // Group messages by date and add date separators
  const messagesWithSeparators = useMemo(() => {
    if (uniqueMessages.length === 0) return [];
    
    const grouped = [];
    let currentDate = null;
    
    uniqueMessages.forEach((msg, index) => {
      const msgDate = new Date(msg.createdAt);
      const dateStr = msgDate.toDateString();
      
      if (dateStr !== currentDate) {
        currentDate = dateStr;
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        let dateLabel = '';
        if (dateStr === today.toDateString()) {
          dateLabel = 'Today';
        } else if (dateStr === yesterday.toDateString()) {
          dateLabel = 'Yesterday';
        } else {
          dateLabel = msgDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }
        
        grouped.push({ type: 'separator', date: dateLabel, key: `sep-${dateStr}` });
      }
      
      grouped.push({ type: 'message', ...msg, key: msg._id || msg.id || `msg-${index}` });
    });
    
    return grouped;
  }, [uniqueMessages]);

  // Format date for display
  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [uniqueMessages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.uid || sending) return;
    
    // Determine recipientId - use finalWorkerId (which includes extracted value)
    let recipientId = finalWorkerId;
    let recipientName = finalWorkerName;
    
    if (!recipientId && messages.length > 0) {
      // Find the recipient from existing messages
      const lastMessage = messages[messages.length - 1];
      recipientId = lastMessage.senderId === user.uid ? lastMessage.recipientId : lastMessage.senderId;
      recipientName = lastMessage.senderId === user.uid 
        ? lastMessage.recipientName 
        : lastMessage.senderName;
    }
    
    if (!recipientId) {
      alert('Unable to determine recipient. Please try again.');
      return;
    }

    setSending(true);
    try {
      const messageData = {
        senderId: user.uid,
        recipientId: recipientId,
        jobId: jobId || null,
        message: newMessage.trim(),
        senderName: user.displayName || user.email || 'Client',
        recipientName: recipientName,
      };

      if (connected) {
        // Send via WebSocket
        sendMessage(messageData);
        // Optimistically add message (WebSocket server will also emit, but this is faster)
        const tempMessage = {
          _id: `temp-${Date.now()}`, // Temporary ID
          ...messageData,
          createdAt: new Date().toISOString(),
          read: false,
        };
        setMessages(prev => [...prev, tempMessage]);
        addMessage(conversationId, tempMessage);
      } else {
        // Fallback to REST API if WebSocket not connected
        const response = await axios.post(`${API_BASE}/api/messages`, messageData);
        const newMsg = response.data;
        setMessages(prev => [...prev, newMsg]);
        addMessage(conversationId, newMsg);
      }
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
      sendTyping(recipientId, false); // Stop typing after sending
    }
  };

  if (!conversationId) {
    return (
      <div className="p-4 text-center text-base-content opacity-70">
        <p className="font-semibold mb-2">Unable to start conversation. Missing required information.</p>
        {!providedConversationId && !workerId && <p className="text-xs mt-1 text-error">Worker ID is missing</p>}
        {!user?.uid && <p className="text-xs mt-1 text-error">User is not logged in</p>}
        {!jobId && <p className="text-xs mt-1 opacity-60">Note: Job ID is optional</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-base-200 rounded-lg border border-base-300">
      {/* Header */}
      {showHeader && (
        <div className="p-4 border-b border-base-300 bg-base-100 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {showUserInfo && workerProfile?.profileCover && (
              <div className="avatar">
                <div className="w-12 h-12 rounded-full">
                  <img
                    src={workerProfile.profileCover}
                    alt={finalWorkerName}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base-content truncate">{finalWorkerName}</h3>
                {showUserInfo && workerProfile?.emailVerified && (
                  <div className="badge badge-success badge-xs">
                    <i className="fas fa-check-circle"></i>
                  </div>
                )}
              </div>
              {showUserInfo && workerProfile && (
                <div className="text-xs text-base-content opacity-70">
                  {[workerProfile.city, workerProfile.country].filter(Boolean).join(', ') || 'Location not set'}
                  {workerProfile.stats?.averageRating > 0 && (
                    <span className="ml-2">
                      <i className="fas fa-star text-warning"></i> {workerProfile.stats.averageRating.toFixed(1)}
                    </span>
                  )}
                </div>
              )}
              {showUserInfo && jobDetail && jobDetail !== null && (
                <div className="mt-1">
                  <Link
                    to={`/My-Posted-Job-Details/${jobId}`}
                    className="text-xs text-primary hover:underline"
                  >
                    <i className="fas fa-briefcase mr-1"></i>
                    {jobDetail.title}
                  </Link>
                </div>
              )}
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="btn btn-sm btn-ghost ml-2">
              ✕
            </button>
          )}
        </div>
      )}

      {/* Worker Job Request Card */}
      {workerJobRequest && (
        <div className="px-4 pt-4 pb-2 border-b border-base-300 bg-base-100">
          <WorkerJobRequestCard 
            request={workerJobRequest}
            userRole="client"
            onStatusChange={(status, data) => {
              setWorkerJobRequest(data);
            }}
          />
        </div>
      )}

      {/* Action Bar - Application Status & Quick Actions */}
      <div className="px-4 pt-4 pb-2 border-b border-base-300 bg-base-100 space-y-2">
        {/* Job-related: Show application status */}
        {jobId && finalWorkerId && (
          <ChatApplicationStatus
            jobId={jobId}
            workerId={finalWorkerId}
            userRole="client"
            onStatusChange={handleApplicationStatusChange}
          />
        )}

        {/* Task 6.2: Pending job offer - Withdraw button */}
        {pendingOfferJob && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-warning/10 rounded-lg border border-warning/30">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-base-content">
                <i className="fas fa-briefcase mr-2 text-warning"></i>
                You sent a job offer: <span className="truncate">{pendingOfferJob.title}</span>
              </p>
              <p className="text-xs text-base-content/70 mt-0.5">Waiting for worker to accept or reject</p>
            </div>
            <button
              type="button"
              onClick={() => handleWithdrawOffer(pendingOfferJob._id)}
              disabled={withdrawingOfferId === pendingOfferJob._id}
              className="btn btn-sm btn-outline btn-warning"
            >
              {withdrawingOfferId === pendingOfferJob._id ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <>
                  <i className="fas fa-undo mr-1"></i>
                  Withdraw offer
                </>
              )}
            </button>
          </div>
        )}

        {/* General conversation: Show create job button */}
        {!jobId && !workerJobRequest && (
          <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg border border-base-300">
            <p className="text-sm text-base-content/70">
              Create a job to start working with this worker
            </p>
            <button
              onClick={() => setShowJobCreationModal(true)}
              className="btn btn-sm btn-primary"
            >
              <i className="fas fa-plus mr-2"></i>
              Create Job
            </button>
          </div>
        )}
      </div>

      {/* Messages List - No loading state, show cached messages immediately */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messagesWithSeparators.length === 0 ? (
          <div className="text-center py-8 text-base-content opacity-70">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messagesWithSeparators.map((item) => {
            if (item.type === 'separator') {
              return (
                <div key={item.key} className="flex items-center justify-center my-4">
                  <div className="divider w-full max-w-xs">
                    <span className="text-xs text-base-content opacity-60 px-2">{item.date}</span>
                  </div>
                </div>
              );
            }
            
            const msg = item;
            const isSender = msg.senderId === user?.uid;
            const isSystemMessage = msg.isSystemMessage === true;
            const showAvatar = !isSender && !isSystemMessage && showUserInfo && workerProfile?.profileCover;
            
            // Render system messages with special styling
            if (isSystemMessage) {
              return (
                <div key={item.key} className="flex items-center justify-center my-2">
                  <div className="bg-base-200 border border-base-300 rounded-lg px-4 py-2 max-w-[85%]">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-info-circle text-primary"></i>
                      <p className="text-sm text-base-content/80 whitespace-pre-wrap break-words">
                        {msg.message}
                      </p>
                    </div>
                    <p className="text-xs text-base-content/50 mt-1 text-center">
                      {formatMessageTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            }
            
            return (
              <div
                key={item.key}
                className={`flex items-end gap-2 ${isSender ? 'justify-end' : 'justify-start'}`}
              >
                {showAvatar && (
                  <div className="avatar flex-shrink-0">
                    <div className="w-8 h-8 rounded-full">
                      <img
                        src={workerProfile.profileCover}
                        alt={finalWorkerName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                  </div>
                )}
                {!showAvatar && !isSender && <div className="w-8"></div>}
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    isSender
                      ? 'bg-primary text-primary-content'
                      : 'bg-base-100 text-base-content border border-base-300'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <p className={`text-xs ${isSender ? 'opacity-80' : 'opacity-60'}`}>
                      {formatMessageTime(msg.createdAt)}
                    </p>
                    {isSender && (
                      <span className={`text-xs ${msg.read ? 'text-primary' : 'opacity-60'}`}>
                        {msg.read ? (
                          <i className="fas fa-check-double"></i>
                        ) : (
                          <i className="fas fa-check"></i>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {isTyping && (
          <div className="text-sm text-base-content opacity-60 mb-2 flex items-center gap-2">
            {showUserInfo && workerProfile?.profileCover && (
              <div className="avatar">
                <div className="w-6 h-6 rounded-full">
                  <img
                    src={workerProfile.profileCover}
                    alt={finalWorkerName}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
            )}
            <span>{finalWorkerName} is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-base-300 bg-base-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              if (connected && finalWorkerId) {
                sendTyping(finalWorkerId, e.target.value.length > 0);
              }
            }}
            placeholder="Type a message..."
            className="input input-bordered flex-1"
            disabled={sending}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <FaPaperPlane />
            )}
          </button>
        </div>
      </form>

      {/* Job Creation Modal */}
      {showJobCreationModal && (
        <ChatJobCreationModal
          onClose={() => setShowJobCreationModal(false)}
          onSuccess={handleJobCreated}
          conversationId={conversationId}
          targetWorkerId={finalWorkerId}
        />
      )}
    </div>
  );
}

