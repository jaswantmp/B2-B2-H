import React from 'react';
import { MessageSquare } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 text-center select-none space-y-3">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-violet-600 dark:text-violet-400 shadow-inner">
        <MessageSquare size={28} />
      </div>
      <div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Start the conversation</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
          Be the first person to message your team.
        </p>
      </div>
    </div>
  );
}
