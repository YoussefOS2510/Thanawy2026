import React from "react";
import { Terminal, Calendar } from "lucide-react";

export default function LogPanel({ logs }) {
  // Convert logs object to array and sort by timestamp desc
  const logsList = logs
    ? Object.keys(logs).map((key) => ({
        id: key,
        ...logs[key]
      })).sort((a, b) => b.timestamp - a.timestamp)
    : [];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-lg flex flex-col h-full max-h-[300px]">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-3">
        <Terminal className="h-4 w-4 text-indigo-400" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">GM Action & Audit Logs</span>
      </div>

      {/* Terminal View */}
      <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs scrollbar-thin scrollbar-thumb-slate-850">
        {logsList.length === 0 ? (
          <div className="text-slate-650 text-center py-6">
            No events logged yet.
          </div>
        ) : (
          logsList.map((log) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit"
            });
            return (
              <div key={log.id} className="flex gap-2 leading-relaxed text-slate-350 hover:text-white transition-colors">
                <span className="text-slate-600 font-semibold select-none">[{timeStr}]</span>
                <span className="break-all">{log.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
