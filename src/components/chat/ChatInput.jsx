import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';

export default function ChatInput({ onSendMessage, onTyping, isConnected }) {
  const [text, setText] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const typingTimerRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setText(val);

    if (val.trim() && isConnected) {
      if (!typingTimerRef.current) {
        onTyping();
      }
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        typingTimerRef.current = null;
      }, 500);
    }
  };

  const handleSend = () => {
    if (text.trim() && isConnected) {
      onSendMessage(text);
      setText('');
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isSendDisabled = !text.trim() || !isConnected;

  const getPlaceholder = () => {
    if (!isConnected) return 'Connecting...';
    return isMobile ? 'Message...' : 'Type a message...';
  };

  return (
    <div className="flex flex-col w-full min-w-0">
      <div className="relative flex items-center gap-1.5 sm:gap-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500 focus-within:shadow-[0_0_12px_rgba(139,92,246,0.25)] transition-all duration-200 min-h-[44px] sm:min-h-[48px] w-full min-w-0">
        <textarea
          id="team-chat-input"
          rows={1}
          style={{ outline: 'none', appearance: 'none', boxShadow: 'none' }}
          className="flex-1 min-w-0 max-h-32 min-h-[32px] sm:min-h-[36px] px-2.5 sm:px-3 py-1 bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm border-0 border-none outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 focus:border-none focus-visible:border-none shadow-none focus:shadow-none appearance-none resize-none scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 leading-relaxed"
          placeholder={getPlaceholder()}
          value={text}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={!isConnected}
        />
        <button
          id="team-chat-send"
          type="button"
          onClick={handleSend}
          disabled={isSendDisabled}
          className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
            isSendDisabled
              ? 'bg-slate-200 dark:bg-slate-800/80 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
              : 'bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/20 active:scale-95'
          }`}
          title="Send Message"
        >
          <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
      <div className="hidden sm:flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-500 mt-1 px-1 font-medium select-none">
        <span>Press <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-[10px] text-slate-600 dark:text-slate-400">Enter</kbd> to send • <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-[10px] text-slate-600 dark:text-slate-400">Shift + Enter</kbd> for new line</span>
      </div>
    </div>
  );
}

