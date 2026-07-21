import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChatHeader from './chat/ChatHeader';
import ChatMessage from './chat/ChatMessage';
import ChatInput from './chat/ChatInput';
import TypingIndicator from './chat/TypingIndicator';
import EmptyState from './chat/EmptyState';
import ChatSkeleton from './chat/ChatSkeleton';
import { useToast } from '../context/ToastContext';

export default function ChatPanel({ teamId }) {
  const [status, setStatus] = useState('Connecting...');
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const ws = useRef(null);
  const reconnectTimer = useRef(null);
  const typingTimers = useRef({});
  const messagesEndRef = useRef(null);
  const { push } = useToast() || { push: () => {} };

  // Current logged in user ID
  const currentUser = (() => {
    try {
      const authData = JSON.parse(localStorage.getItem('b2b2h-auth') || '{}');
      return authData.user || {};
    } catch (e) {
      return {};
    }
  })();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers, scrollToBottom]);

  const connectWebSocket = useCallback(() => {
    if (!teamId) return;

    // Close any open socket before creating a new one
    if (ws.current) {
      ws.current.close();
    }

    setStatus('Connecting...');
    setIsLoadingHistory(true);

    let token = '';
    let currentUserId = '';
    try {
      const authData = JSON.parse(localStorage.getItem('b2b2h-auth') || '{}');
      token = authData.token || '';
      currentUserId = authData.user?.id || '';
    } catch (e) {
      console.error('Failed to parse token in ChatPanel:', e);
    }

    const base = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';
    const wsProtocol = base.startsWith('https') ? 'wss' : 'ws';
    const wsHost = base.replace(/^https?:\/\//, '');
    const wsUrl = `${wsProtocol}://${wsHost}/api/v1/ws/${teamId}?token=${encodeURIComponent(token)}`;

    console.log('[ChatPanel] Connecting to WebSocket:', wsUrl);
    const socket = new WebSocket(wsUrl);
    ws.current = socket;

    socket.onopen = () => {
      console.log('[ChatPanel] WebSocket opened successfully');
      setStatus('Connected');
      setIsLoadingHistory(false);
      push('Connected ✅', 'success');
      if (reconnectTimer.current) {
        clearInterval(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.type === 'history') {
          setMessages(payload.messages || []);
          setIsLoadingHistory(false);
        } else if (payload.type === 'message') {
          const newMsg = payload.data || payload;
          setMessages((prev) => [...prev, newMsg]);
        } else if (payload.type === 'presence') {
          setOnlineUsers(payload.users || []);
        } else if (payload.type === 'typing') {
          const tUser = payload.user;
          if (tUser && tUser.id !== currentUserId) {
            setTypingUsers((prev) => {
              if (prev.some((u) => u.id === tUser.id)) return prev;
              return [...prev, tUser];
            });

            if (typingTimers.current[tUser.id]) {
              clearTimeout(typingTimers.current[tUser.id]);
            }
            typingTimers.current[tUser.id] = setTimeout(() => {
              setTypingUsers((prev) => prev.filter((u) => u.id !== tUser.id));
              delete typingTimers.current[tUser.id];
            }, 2000);
          }
        } else if (payload.id && payload.message) {
          // Backward compatibility for raw message objects
          setMessages((prev) => [...prev, payload]);
        }
      } catch (err) {
        // Legacy fallback for plain text messages
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            message: event.data,
            sender_name: 'Team Member',
            created_at: new Date().toISOString(),
          },
        ]);
      }
    };

    socket.onerror = (err) => {
      console.error('WebSocket Error in ChatPanel:', err);
    };

    socket.onclose = (event) => {
      console.log('[ChatPanel] WebSocket closed with code:', event.code, 'reason:', event.reason);
      setStatus('Connection Lost');
      setIsLoadingHistory(false);
      push('Connection Lost ⚠️. Retrying...', 'warning');

      if (!reconnectTimer.current) {
        reconnectTimer.current = setInterval(() => {
          push('Reconnecting... 🔄', 'info');
          connectWebSocket();
        }, 3000);
      }
    };
  }, [teamId, push]);


  useEffect(() => {
    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
      if (reconnectTimer.current) {
        clearInterval(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      Object.values(typingTimers.current).forEach(clearTimeout);
    };
  }, [connectWebSocket]);

  const handleSendMessage = (text) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN && text.trim() !== '') {
      const payload = {
        type: 'message',
        message: text,
      };
      ws.current.send(JSON.stringify(payload));
    }
  };

  const handleSendTyping = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'typing' }));
    }
  };

  const isConnected = status === 'Connected';

  return (
    <div className="rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/90 shadow-2xl flex flex-col h-[520px]">
      {/* Header with connection status and presence dropdown */}
      <ChatHeader status={status} onlineUsers={onlineUsers} />

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto my-3 pr-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {isLoadingHistory ? (
          <ChatSkeleton />
        ) : messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender_id === currentUser.id;
            const prevMsg = messages[index - 1];
            const isConsecutive = prevMsg && prevMsg.sender_id === msg.sender_id;

            return (
              <ChatMessage
                key={msg.id || index}
                message={msg}
                isMe={isMe}
                isConsecutive={isConsecutive}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      <div className="h-6 flex items-center">
        <TypingIndicator typingUsers={typingUsers} />
      </div>

      {/* Fixed Chat Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onTyping={handleSendTyping}
        isConnected={isConnected}
      />
    </div>
  );
}
