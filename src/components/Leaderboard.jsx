import React from "react";
import { TrendingUp, Trophy } from "lucide-react";
import { calculateTotalSpend } from "../utils/capacity";

const COLOR_BADGES = {
  beige: "bg-amber-400/20 text-amber-200 border-amber-400/30",
  green: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  turquoise: "bg-teal-400/20 text-teal-300 border-teal-400/30",
  red: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  orange: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  yellow: "bg-yellow-400/20 text-yellow-300 border-yellow-400/30",
  blue: "bg-blue-500/20 text-blue-400 border-blue-500/30"
};

export default function Leaderboard({ teams, config, currentMarket = 1 }) {
  const currentPrices = config?.prices?.[`market${currentMarket}`] || {
    empL1: 2000,
    empL2: 3500,
    empL3: 5000,
    desk: 1000,
    tv: 5000,
    couch: 7500,
    computer: 10000,
    cert1: 2000,
    cert2: 3500,
    cert3: 5000,
    cert4: 7500,
    cert5: 10000
  };

  // Sort teams based on profit
  const sortedTeams = [...teams].sort((a, b) => {
    const profitB = b.profit !== undefined ? b.profit : (b.cash || 0);
    const profitA = a.profit !== undefined ? a.profit : (a.cash || 0);
    return profitB - profitA;
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
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          <h2 className="text-base font-bold text-white uppercase tracking-wider">Live Profit Standings</h2>
        </div>
        <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          Ranked by Profit
        </span>
      </div>

      {/* Leaderboard Table List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[350px] lg:max-h-none scrollbar-thin">
        {sortedTeams.map((team, index) => {
          const profitVal = team.profit !== undefined ? team.profit : (team.cash || 0);
          const totalSpend = calculateTotalSpend(team.assets, currentPrices);
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
                <div className={`h-6 w-6 rounded-md flex items-center justify-center text-xs shrink-0 ${getRankBadge(index)}`}>
                  {index + 1}
                </div>
                
                <div className="truncate">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-slate-100 text-sm truncate">
                      {team.name}
                    </span>
                    {team.color && (
                      <span className={`text-[9px] font-bold uppercase border px-1.5 py-0.2 rounded shrink-0 ${COLOR_BADGES[team.color] || "bg-slate-800 text-slate-400"}`}>
                        {team.color}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>Lvl {team.assets?.certLevel || 0} Cert</span>
                    <span>•</span>
                    <span>{team.assets?.desks || 0} Desks</span>
                    <span>•</span>
                    <span>{(team.assets?.empL1 || 0) + (team.assets?.empL2 || 0) + (team.assets?.empL3 || 0)} Staff</span>
                  </span>
                </div>
              </div>

              {/* Profit & Spend display */}
              <div className="text-right shrink-0">
                <span className={`text-sm font-extrabold font-mono block ${profitVal >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {profitVal >= 0 ? `$${profitVal.toLocaleString()}` : `-$${Math.abs(profitVal).toLocaleString()}`}
                </span>
                <span className="text-[9px] text-amber-400 font-mono block">
                  Spent: ${totalSpend.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
