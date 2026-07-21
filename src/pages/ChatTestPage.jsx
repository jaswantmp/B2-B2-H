import React, { useState, useEffect, useRef } from 'react';

export default function ChatTestPage() {
  const [teamId, setTeamId] = useState('team-1');
  const [token, setToken] = useState(() => {
    try {
      const authData = JSON.parse(localStorage.getItem('b2b2h-auth') || '{}');
      return authData.token || '';
    } catch (e) {
      return '';
    }
  });
  const [status, setStatus] = useState('Connecting...');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const ws = useRef(null);

  useEffect(() => {
    setStatus('Connecting...');
    setMessages([]); // Clear messages when switching teams or tokens

    const base = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';
    const wsProtocol = base.startsWith('https') ? 'wss' : 'ws';
    const wsHost = base.replace(/^https?:\/\//, '');
    const wsUrl = `${wsProtocol}://${wsHost}/api/v1/ws/${teamId}?token=${encodeURIComponent(token)}`;

    console.log('Connecting to WebSocket:', wsUrl);
    const socket = new WebSocket(wsUrl);
    ws.current = socket;

    socket.onopen = () => {
      setStatus('Connected ✅');
    };

    socket.onmessage = (event) => {
      setMessages((prev) => [...prev, event.data]);
    };

    socket.onerror = (error) => {
      console.error('WebSocket Error:', error);
      setStatus('Disconnected ❌ (Error)');
    };

    socket.onclose = (event) => {
      setStatus(`Disconnected ❌ (Code: ${event.code})`);
    };

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [teamId, token]);

  const handleSend = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN && inputText.trim() !== '') {
      ws.current.send(inputText);
      setInputText('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-violet-400">WebSocket Chat Test</h1>
          <p className="text-sm text-slate-400 mt-1">
            Status: <span className="font-semibold">{status}</span>
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Active Team ID
            </label>
            <input
              id="team-id-input"
              type="text"
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-violet-500"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Authentication Token (JWT)
            </label>
            <input
              id="token-input"
              type="text"
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-violet-500 font-mono text-xs"
              placeholder="Enter JWT token..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <input
              id="chat-input"
              type="text"
              className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-violet-500"
              placeholder="Type your message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              id="chat-send"
              onClick={handleSend}
              disabled={status !== 'Connected ✅'}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors cursor-pointer"
            >
              Send
            </button>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-4">
          <h2 className="text-sm font-semibold text-slate-400 mb-2">Server Responses:</h2>
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 h-48 overflow-y-auto space-y-2">
            {messages.length === 0 ? (
              <span className="text-slate-600 text-sm italic">No messages received yet.</span>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className="text-sm text-slate-300 py-1 border-b border-slate-900 last:border-0">
                  {msg}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


