import React from 'react';

export default function TypingIndicator({ typingUsers = [] }) {
  if (!typingUsers || typingUsers.length === 0) return null;

  const names = typingUsers.map(u => u.name || 'Someone').join(', ');
  const text = typingUsers.length === 1 
    ? `${names} is typing...` 
    : `${names} are typing...`;

  return (
    <div className="flex items-center gap-2 px-2 py-1 text-xs text-violet-600 dark:text-violet-400/90 italic animate-fade-in">
      <div className="flex gap-1 items-center">
        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 dark:bg-violet-400 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 dark:bg-violet-400 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 dark:bg-violet-400 animate-bounce" />
      </div>
      <span>{text}</span>
    </div>
  );
}
