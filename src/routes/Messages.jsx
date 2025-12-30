import { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../Authentication/AuthProvider';
import { useMessages } from '../contexts/MessagesContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { FaPaperPlane, FaComments } from 'react-icons/fa';
import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export default function Messages({ jobId, workerId, workerName, conversationId: providedConversationId, onClose }) {
  const { user } = useContext(AuthContext);
  const { getCachedMessages, updateMessages, addMessage } = useMessages();
  const { socket, connected, sendMessage, sendTyping, markMessagesRead } = useWebSocket();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [extractedWorkerId, setExtractedWorkerId] = useState(null);
  const [extractedWorkerName, setExtractedWorkerName] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
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
          // Avoid duplicates
          if (prev.some(m => m._id === message._id || (m.id === message.id && m.createdAt === message.createdAt))) {
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

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    <div className="flex flex-col h-[600px] bg-base-200 rounded-lg border border-base-300">
      {/* Header */}
      <div className="p-4 border-b border-base-300 bg-base-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FaComments className="text-primary text-xl" />
          <div>
            <h3 className="font-semibold text-base-content">Messages</h3>
            <p className="text-sm text-base-content opacity-70">{finalWorkerName}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="btn btn-sm btn-ghost">
            ✕
          </button>
        )}
      </div>

      {/* Messages List - No loading state, show cached messages immediately */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-base-content opacity-70">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isSender = msg.senderId === user?.uid;
            return (
              <div
                key={msg._id || msg.id}
                className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    isSender
                      ? 'bg-primary text-primary-content'
                      : 'bg-base-100 text-base-content border border-base-300'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                  <p className={`text-xs mt-1 ${isSender ? 'opacity-80' : 'opacity-60'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {isTyping && <div className="text-sm text-base-content opacity-60 mb-2">Worker is typing...</div>}
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
    </div>
  );
}

