import React from 'react';

export default function ChatSkeleton() {
  return (
    <div className="space-y-4 animate-pulse p-2">
      {/* Received message skeleton */}
      <div className="flex items-start gap-3 max-w-[75%]">
        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-24" />
          <div className="h-10 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl rounded-tl-none w-full" />
        </div>
      </div>

      {/* Sent message skeleton */}
      <div className="flex items-end justify-end max-w-[70%] ml-auto">
        <div className="space-y-2 flex-1 flex flex-col items-end">
          <div className="h-10 bg-violet-200 dark:bg-violet-900/40 rounded-2xl rounded-tr-none w-3/4" />
        </div>
      </div>

      {/* Another received message skeleton */}
      <div className="flex items-start gap-3 max-w-[65%]">
        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-20" />
          <div className="h-12 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl rounded-tl-none w-full" />
        </div>
      </div>
    </div>
  );
}
