import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Users, ChevronDown } from 'lucide-react';

export default function ChatHeader({ status, onlineUsers = [] }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusBadge = () => {
    if (status === 'Connected') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Connected
        </span>
      );
    }
    if (status === 'Connecting...') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          Connecting
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <span className="w-2 h-2 rounded-full bg-rose-500" />
        Connection Lost
      </span>
    );
  };

  const onlineCount = onlineUsers.length;

  return (
    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 relative select-none">
      {/* Title & Connection Status */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
          <MessageSquare size={18} />
        </div>
        <div>
          <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-wide">Team Chat</h2>
          <div className="flex items-center gap-2 mt-0.5">
            {getStatusBadge()}
          </div>
        </div>
      </div>

      {/* Online Members Dropdown Trigger */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
          <span className="font-medium">{onlineCount} Member{onlineCount !== 1 ? 's' : ''} Online</span>
          <ChevronDown size={14} className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Popover */}
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-3 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2 mb-2">
              <span className="flex items-center gap-1.5">
                <Users size={14} className="text-violet-600 dark:text-violet-400" />
                Online Members
              </span>
              <span className="bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 px-1.5 py-0.5 rounded text-[10px]">{onlineCount}</span>
            </div>
            {onlineCount === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-2 text-center italic">No online members</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800">
                {onlineUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 flex-shrink-0" />
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.name} className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold">
                        {u.name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <span className="text-xs text-slate-800 dark:text-slate-200 font-medium truncate">{u.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
