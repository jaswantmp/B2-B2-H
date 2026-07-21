import React from 'react';

function formatTime(isoOrDateStr) {
  if (!isoOrDateStr) return '';
  try {
    let str = String(isoOrDateStr).trim();
    // If ISO string lacks timezone specifier ('Z' or offset), append 'Z' to treat as UTC
    if (!str.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(str)) {
      str += 'Z';
    }
    const d = new Date(str);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch (e) {
    return '';
  }
}

export default function ChatMessage({ message, isMe, isConsecutive }) {
  console.log("created_at received:", message.created_at);
  console.log("Date object:", new Date(message.created_at));

  const formattedTime = formatTime(message.created_at);
  const senderName = message.sender_name || (message.sender_id ? `User ${message.sender_id.slice(0, 8)}` : 'Team Member');
  const avatarUrl = message.sender_avatar;

  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isConsecutive ? 'mt-1' : 'mt-3'} group transition-all duration-200`}>
      {/* Header: Sender Name & Avatar (Only shown if NOT consecutive message and NOT self) */}
      {!isMe && !isConsecutive && (
        <div className="flex items-center gap-2 mb-1 px-1">
          {avatarUrl ? (
            <img src={avatarUrl} alt={senderName} className="w-5 h-5 rounded-full object-cover border border-slate-300 dark:border-slate-700" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/60 border border-violet-300 dark:border-violet-700/50 flex items-center justify-center text-[10px] font-bold text-violet-700 dark:text-violet-300">
              {senderName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">{senderName}</span>
        </div>
      )}

      {/* Bubble + Time Wrapper */}
      <div className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm transition-all ${
        isMe
          ? 'bg-violet-600 text-white rounded-tr-xs shadow-violet-900/10'
          : 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-tl-xs shadow-slate-200/50 dark:shadow-slate-950/50'
      }`}>
        <p className="whitespace-pre-wrap break-words">{message.message}</p>
        
        {/* Time display */}
        {formattedTime && (
          <span className={`block text-[10px] text-right mt-1 font-medium ${
            isMe ? 'text-violet-200/80' : 'text-slate-500 dark:text-slate-400/80'
          }`}>
            {formattedTime}
          </span>
        )}
      </div>
    </div>
  );
}
