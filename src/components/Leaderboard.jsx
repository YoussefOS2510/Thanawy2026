import React, { useState } from "react";
import { calculateNetWorth } from "../utils/capacity";
import { Award, DollarSign, Briefcase, TrendingUp } from "lucide-react";

export default function Leaderboard({ teams, config }) {
  const [rankBy, setRankBy] = useState("netWorth"); // "cash" or "netWorth"

  // Sort teams based on criteria
  const sortedTeams = [...teams].sort((a, b) => {
    if (rankBy === "cash") {
      return (b.cash || 0) - (a.cash || 0);
    } else {
      const nwB = calculateNetWorth(b, config);
      const nwA = calculateNetWorth(a, config);
      return nwB - nwA;
    }
  });

  const getRankBadge = (index) => {
    switch (index) {
      case 0:
        return "bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black shadow-lg shadow-yellow-500/25";
      case 1:
        return "bg-gradient-to-r from-slate-350 to-slate-400 text-slate-950 font-bold shadow-lg shadow-slate-400/20";
      case 2:
        return "bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold shadow-lg shadow-amber-700/20";
      default:
        return "bg-slate-800 text-slate-400";
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 mb-4 gap-3">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white uppercase tracking-wider">Live Firm Standings</h2>
        </div>
        
        {/* Toggle Controls */}
        <div className="flex bg-slate-950/60 rounded-lg p-1 border border-slate-850">
          <button
            onClick={() => setRankBy("netWorth")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              rankBy === "netWorth"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <TrendingUp className="h-3 w-3" />
            Net Worth
          </button>
          <button
            onClick={() => setRankBy("cash")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              rankBy === "cash"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <DollarSign className="h-3 w-3" />
            Liquid Cash
          </button>
        </div>
      </div>

      {/* Leaderboard Table List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[350px] lg:max-h-none scrollbar-thin">
        {sortedTeams.map((team, index) => {
          const cashVal = team.cash || 0;
          const netWorthVal = calculateNetWorth(team, config);
          const isTop3 = index < 3;

          return (
            <div 
              key={team.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                isTop3 
                  ? "bg-slate-900 border-indigo-500/20 shadow-sm" 
                  : "bg-slate-950/30 border-slate-850"
              }`}
            >
              <div className="flex items-center gap-3 truncate pr-2">
                {/* Rank number indicator */}
                <div className={`h-6 w-6 rounded-md flex items-center justify-center text-xs ${getRankBadge(index)}`}>
                  {index + 1}
                </div>
                
                <div className="truncate">
                  <span className="font-bold text-slate-100 text-sm block truncate group-hover:text-indigo-400">
                    {team.name}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-2">
                    <span>Lvl {team.assets?.certLevel || 0} Cert</span>
                    <span>•</span>
                    <span>{team.assets?.desks || 0} Desks</span>
                  </span>
                </div>
              </div>

              {/* Financial metric display */}
              <div className="text-right shrink-0">
                <span className="text-sm font-extrabold text-white font-mono block">
                  ${(rankBy === "cash" ? cashVal : netWorthVal).toLocaleString()}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  {rankBy === "cash" ? "cash reserve" : "net asset value"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
