import { useContext, useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../Authentication/AuthProvider';
import { useTheme } from '../contexts/ThemeContext';
import { useMessages } from '../contexts/MessagesContext';
import axios from 'axios';
import Messages from './Messages';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const { user, logOut } = useContext(AuthContext); // ✅ access user state
  const { isDarkMode, toggleTheme } = useTheme();
  const { preloadMessages } = useMessages();
  const navigate = useNavigate();
  
  const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

  const categories = [
    'Electrician',
    'Plumber',
    'Mason (Rajmistri)',
    'Carpenter',
    'Welder',
    'Painter',
    'AC Technician',
    'Freezer Mechanic',
    'Car Mechanic'
  ];

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : 'auto';
  }, [isMenuOpen]);

  // Fetch conversations for the user
  useEffect(() => {
    if (!user?.uid) {
      setConversations([]);
      setUnreadCount(0);
      return;
    }

    const fetchConversations = async () => {
      try {
        setLoadingConversations(true);
        const response = await axios.get(`${API_BASE}/api/messages/conversations?userId=${user.uid}`);
        const rawConvos = response.data || [];
        
        // Transform the data structure
        const convos = rawConvos.map(conv => {
          const lastMsg = conv.lastMessage || {};
          // Determine the other participant (not the current user)
          const otherId = lastMsg.senderId === user.uid 
            ? (lastMsg.recipientId || null)
            : (lastMsg.senderId || null);
          const otherName = lastMsg.senderId === user.uid 
            ? (lastMsg.recipientName || 'User')
            : (lastMsg.senderName || 'User');
          
          return {
            conversationId: conv._id,
            jobId: lastMsg.jobId || null,
            workerId: otherId, // For client-side, the other participant is the worker
            clientId: user.uid, // Current user is the client
            workerName: otherName,
            lastMessageText: lastMsg.message || '',
            lastMessageCreatedAt: lastMsg.createdAt,
            unreadCount: conv.unreadCount || 0,
          };
        }).filter(conv => conv.conversationId); // Filter out any invalid conversations
        
        setConversations(convos);
        
        // Calculate total unread count
        const totalUnread = convos.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
        setUnreadCount(totalUnread);
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
      } finally {
        setLoadingConversations(false);
      }
    };

    fetchConversations();
    
    // Poll for new conversations every 5 seconds
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [user?.uid, API_BASE]);

  const handleConversationClick = (conversation) => {
    // Pre-load messages before opening modal
    if (conversation.conversationId) {
      preloadMessages(conversation.conversationId);
    }
    setSelectedConversation(conversation);
    setShowMessages(false);
  };

  const closeMessages = () => {
    setSelectedConversation(null);
    // Refresh conversations when closing
    if (user?.uid) {
      axios.get(`${API_BASE}/api/messages/conversations?userId=${user.uid}`)
        .then(res => {
          const rawConvos = res.data || [];
          const convos = rawConvos.map(conv => {
            const lastMsg = conv.lastMessage || {};
            const otherId = lastMsg.senderId === user.uid ? lastMsg.recipientId : lastMsg.senderId;
            const otherName = lastMsg.senderId === user.uid 
              ? lastMsg.recipientName 
              : lastMsg.senderName;
            
            return {
              conversationId: conv._id,
              jobId: lastMsg.jobId || null,
              workerId: otherId,
              clientId: user.uid,
              workerName: otherName || 'User',
              lastMessageText: lastMsg.message || '',
              lastMessageCreatedAt: lastMsg.createdAt,
              unreadCount: conv.unreadCount || 0,
            };
          });
          setConversations(convos);
          const totalUnread = convos.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
          setUnreadCount(totalUnread);
        })
        .catch(err => console.error('Failed to refresh conversations:', err));
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      alert("You have been logged out!");
      navigate('/login'); 
    } catch (error) {
      console.error("Logout error:", error.message);
    }
  };

  return (
    <div className="w-full">
      {/* Top Navbar */}
      <div className="navbar bg-base-200 text-base-content px-4 md:px-6 shadow-sm justify-between items-center transition-colors duration-300">

        <div className='flex gap-7'>
          <Link to="/" className="text-4xl font-heading font-bold text-base-content">
            Hire<span className="text-primary">Mistri</span>
          </Link>

          {/* Desktop Search Bar */}
          <div className="hidden lg:flex">
            <input
              type="text"
              placeholder="Find Workers"
              className="input input-bordered bg-base-100 text-base-content w-[400px] xl:w-[500px] rounded-l-full"
            />
            <button className="btn btn-primary rounded-r-full border-none">
              <i className="fas fa-search"></i>
            </button>
          </div>
        </div>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-6 text-sm">
          {user ? (
            <>
              <Link to="/dashboard" className="text-base-content hover:text-primary transition-colors font-medium">
                Dashboard
              </Link>
              <Link to="/post-job" className="text-base-content hover:text-primary transition-colors font-medium">
                Post Job
              </Link>
              <Link to="/My-Posted-Jobs" className="text-base-content hover:text-primary transition-colors font-medium">
                My Jobs
              </Link>
              <Link to="/applications" className="text-base-content hover:text-primary transition-colors font-medium">
                Applications
              </Link>
              
              {/* Notifications */}
              <div className="relative">
                <button className="btn btn-ghost btn-circle relative">
                  <i className="far fa-bell text-lg text-base-content"></i>
                  <span className="absolute -top-1 -right-1 bg-error text-error-content text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    2
                  </span>
                </button>
              </div>
              
              {/* Messages */}
              <div className="relative">
                <button 
                  className="btn btn-ghost btn-circle relative"
                  onClick={() => setShowMessages(!showMessages)}
                >
                  <i className="far fa-envelope text-lg text-base-content"></i>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-content text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Messages Dropdown */}
                {showMessages && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setShowMessages(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-80 bg-base-200 border border-base-300 rounded-xl shadow-2xl z-50 max-h-[500px] flex flex-col">
                      <div className="p-4 border-b border-base-300 flex items-center justify-between">
                        <h3 className="font-semibold text-base-content">Messages</h3>
                        <button 
                          onClick={() => setShowMessages(false)}
                          className="btn btn-sm btn-ghost"
                        >
                          ✕
                        </button>
                      </div>
                      
                      <div className="overflow-y-auto flex-1">
                        {loadingConversations ? (
                          <div className="p-4 text-center">
                            <span className="loading loading-spinner loading-sm text-primary"></span>
                            <p className="text-sm text-base-content opacity-70 mt-2">Loading conversations...</p>
                          </div>
                        ) : conversations.length === 0 ? (
                          <div className="p-4 text-center text-base-content opacity-70">
                            <p className="text-sm">No conversations yet</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-base-300">
                            {conversations.map((conv) => {
                              const lastMessageTime = conv.lastMessageCreatedAt 
                                ? new Date(conv.lastMessageCreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : '';
                              
                              return (
                                <button
                                  key={conv.conversationId}
                                  onClick={() => handleConversationClick(conv)}
                                  className="w-full p-4 text-left hover:bg-base-300 transition-colors"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                      <i className="fas fa-user text-primary"></i>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between mb-1">
                                        <p className="font-medium text-sm text-base-content truncate">
                                          {conv.workerName || 'User'}
                                        </p>
                                        {lastMessageTime && (
                                          <span className="text-xs text-base-content opacity-60 ml-2 flex-shrink-0">
                                            {lastMessageTime}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-base-content opacity-70 truncate">
                                        {conv.lastMessageText || 'No messages yet'}
                                      </p>
                                    </div>
                                    {conv.unreadCount > 0 && (
                                      <span className="bg-primary text-primary-content text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
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
                  </>
                )}
              </div>

              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="btn btn-ghost btn-circle"
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <i className={`text-lg text-base-content ${isDarkMode ? 'fas fa-sun' : 'far fa-moon'}`}></i>
              </button>

              {/* User Profile */}
              <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="flex items-center gap-2 text-base-content hover:text-primary transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary/20">
                    <img src="https://i.pravatar.cc/100?img=3" alt="User" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm text-base-content">{user?.email?.split('@')[0] || 'Client'}</p>
                    <p className="text-xs text-base-content opacity-70">01990444882</p>
                  </div>
                  <i className="fas fa-chevron-down text-xs text-base-content"></i>
                </div>
                <ul className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-lg rounded-xl w-48 bg-base-200 border border-base-300">
                  <li><Link to="/dashboard" className="rounded-lg text-base-content hover:bg-primary/10 hover:text-primary">Dashboard</Link></li>
                  <li><Link to="/post-job" className="rounded-lg text-base-content hover:bg-primary/10 hover:text-primary">Post Job</Link></li>
                  <li><Link to="/My-Posted-Jobs" className="rounded-lg text-base-content hover:bg-primary/10 hover:text-primary">My Posted Jobs</Link></li>
                  <li><Link to="/applications" className="rounded-lg text-base-content hover:bg-primary/10 hover:text-primary">Applications</Link></li>
                  <li><Link to="/my-profile" className="rounded-lg text-base-content hover:bg-primary/10 hover:text-primary">My Profile</Link></li>
                  <div className="divider my-1"></div>
                  <li><button onClick={handleLogout} className="rounded-lg text-base-content hover:bg-error/10 hover:text-error">Logout</button></li>
                </ul>
              </div>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary border-none font-medium px-6">
              Login
            </Link>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div className="lg:hidden">
          <button
            className="btn btn-ghost btn-circle"
            onClick={() => setIsMenuOpen(true)}
          >
            <i className="fas fa-bars text-base-content text-xl"></i>
          </button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="lg:hidden px-4 py-2 shadow-sm transition-colors duration-300 bg-base-200">
        <div className="flex">
          <input
            type="text"
            placeholder="Find Workers"
            className="input input-bordered bg-base-100 text-base-content w-full rounded-l-full"
          />
          <button className="btn btn-primary rounded-r-full border-none">
            <i className="fas fa-search"></i>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="fixed top-0 right-0 w-4/5 h-full z-50 px-6 py-6 overflow-y-auto animate-fadeSlideIn rounded-l-xl shadow-lg transition-colors duration-300 bg-base-200 text-base-content">
            <div className="flex items-center justify-between mb-6">
              {user ? (
                <div className="flex items-center gap-3">
                  <img
                    src="https://i.pravatar.cc/100?img=3"
                    alt="User"
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="font-semibold text-base-content">{user.email}</div>
                </div>
              ) : (
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="btn btn-primary border-none">
                  Login
                </Link>
              )}
              <button className="text-xl text-base-content" onClick={() => setIsMenuOpen(false)}>✕</button>
            </div>

            {user && (
              <nav className="flex flex-col gap-3 text-sm">
                <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="text-base-content transition-colors hover:text-primary">Dashboard</Link>
                <Link to="/post-job" onClick={() => setIsMenuOpen(false)} className="text-base-content transition-colors hover:text-primary">Post a Job</Link>
                <Link to="/My-Posted-Jobs" onClick={() => setIsMenuOpen(false)} className="text-base-content transition-colors hover:text-primary">My Posted Jobs</Link>
                <Link to="/applications" onClick={() => setIsMenuOpen(false)} className="text-base-content transition-colors hover:text-primary">Applications</Link>
                <Link to="/my-profile" onClick={() => setIsMenuOpen(false)} className="text-base-content transition-colors hover:text-primary">My Profile</Link>
                
                {/* Mobile Theme Toggle */}
                <button 
                  onClick={toggleTheme}
                  className="flex items-center gap-2 text-base-content transition-colors text-left hover:text-primary"
                >
                  <i className={`text-lg ${isDarkMode ? 'fas fa-sun' : 'far fa-moon'}`}></i>
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </button>
                
                <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="text-base-content transition-colors text-left hover:text-error">Logout</button>
              </nav>
            )}
          </div>
        </>
      )}

      {/* Messages Modal */}
      {selectedConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeMessages} />
          <div className="relative bg-base-200 rounded-xl shadow-2xl w-full max-w-2xl">
            <Messages
              conversationId={selectedConversation.conversationId}
              jobId={selectedConversation.jobId}
              workerId={selectedConversation.workerId}
              workerName={selectedConversation.workerName || 'User'}
              onClose={closeMessages}
            />
          </div>
        </div>
      )}

      {/* Desktop Category Bar */}
      <div className="border-t border-base-300 text-xl px-4 py-2 hidden lg:flex gap-4 overflow-x-auto whitespace-nowrap transition-colors duration-300 bg-base-200">
        {categories.map((cat, idx) => (
          <NavLink
            key={idx}
            to={`/services/${cat.toLowerCase().replace(/\s|\(|\)/g, '-')}`}
            className={({ isActive }) =>
              `hover:underline transition-colors ${isActive ? 'font-semibold text-primary' : 'text-base-content hover:text-base-content'}`
            }
          >
            {cat}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
