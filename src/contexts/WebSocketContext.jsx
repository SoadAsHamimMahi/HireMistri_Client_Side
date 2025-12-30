import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '../Authentication/AuthProvider';
import { io } from 'socket.io-client';

const WebSocketContext = createContext();

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export function WebSocketProvider({ children }) {
  // #region agent log
  try {
    fetch('http://127.0.0.1:7244/ingest/911a7613-44ba-43a9-92c1-5f0fb37aadca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WebSocketContext.jsx:9',message:'WebSocketProvider init',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  } catch(e) {}
  // #endregion

  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  
  // #region agent log
  try {
    fetch('http://127.0.0.1:7244/ingest/911a7613-44ba-43a9-92c1-5f0fb37aadca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WebSocketContext.jsx:18',message:'AuthContext accessed',data:{hasContext:!!authContext,hasUser:!!user,hasUid:!!user?.uid},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  } catch(e) {}
  // #endregion
  
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // #region agent log
    try {
      fetch('http://127.0.0.1:7244/ingest/911a7613-44ba-43a9-92c1-5f0fb37aadca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WebSocketContext.jsx:25',message:'useEffect triggered',data:{hasUser:!!user,hasUid:!!user?.uid},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    } catch(e) {}
    // #endregion

    if (!user?.uid) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // #region agent log
    try {
      fetch('http://127.0.0.1:7244/ingest/911a7613-44ba-43a9-92c1-5f0fb37aadca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WebSocketContext.jsx:35',message:'Initializing socket.io',data:{apiBase:API_BASE},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    } catch(e) {}
    // #endregion

    let newSocket;
    try {
      // Initialize Socket.io connection
      newSocket = io(API_BASE, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/911a7613-44ba-43a9-92c1-5f0fb37aadca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WebSocketContext.jsx:46',message:'Socket.io created',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/911a7613-44ba-43a9-92c1-5f0fb37aadca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WebSocketContext.jsx:49',message:'Socket.io creation error',data:{error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      console.error('Failed to create socket:', error);
      return;
    }

    newSocket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      setConnected(true);
      // Join user room
      newSocket.emit('join_user', user.uid);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      setConnected(false);
    });

    setSocket(newSocket);
    socketRef.current = newSocket;

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [user?.uid]);

  // Send message via WebSocket
  const sendMessage = (data) => {
    if (socket && connected) {
      socket.emit('message:send', data);
    } else {
      console.warn('WebSocket not connected, message not sent');
    }
  };

  // Send typing indicator
  const sendTyping = (recipientId, typing = true) => {
    if (socket && connected) {
      socket.emit(typing ? 'typing:start' : 'typing:stop', {
        recipientId,
        senderId: user?.uid,
      });
    }
  };

  // Mark messages as read
  const markMessagesRead = (conversationId, senderId) => {
    if (socket && connected) {
      socket.emit('message:read', {
        conversationId,
        userId: user?.uid,
        senderId,
      });
    }
  };

  return (
    <WebSocketContext.Provider
      value={{
        socket,
        connected,
        sendMessage,
        sendTyping,
        markMessagesRead,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
}

