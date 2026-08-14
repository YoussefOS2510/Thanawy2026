import React, { useState } from "react";
import { updateTeam, updateGameState, logActivity } from "../utils/db";
import { Play, TrendingUp, Award, ArrowRight, Trophy } from "lucide-react";
import { calculateTotalSpend } from "../utils/capacity";

export default function MarketTransitionModal({ isOpen, onClose, teams, config, currentMarket }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const caseRevenues = config?.caseRevenues || { type1: 10000, type2: 15000, type3: 7500 };
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

  if (!isOpen) return null;

  const isGameOverTransition = currentMarket === 3;

  // Pre-calculate transition summaries for each team
  const summaries = teams.map((team) => {
    const assets = team.assets || {};
    const casesLogged = team.casesLogged || { type1: 0, type2: 0, type3: 0 };
    
    // Starting profit for this market
    const startProfit = team.profit !== undefined ? team.profit : (team.cash || 0);
    
    // Revenue earned from logged cases
    const t1Revenue = (casesLogged.type1 || 0) * (caseRevenues.type1 || 10000);
    const t2Revenue = (casesLogged.type2 || 0) * (caseRevenues.type2 || 15000);
    const t3Revenue = (casesLogged.type3 || 0) * (caseRevenues.type3 || 7500);
    const revenue = t1Revenue + t2Revenue + t3Revenue;
    
    const endingProfit = startProfit + revenue;
    const totalCasesCount = (casesLogged.type1 || 0) + (casesLogged.type2 || 0) + (casesLogged.type3 || 0);
    const totalSpend = calculateTotalSpend(assets, currentPrices);

    return {
      teamId: team.id,
      name: team.name,
      startProfit,
      revenue,
      endingProfit,
      totalCasesCount,
      totalSpend,
      casesLogged: { ...casesLogged },
      assets: { ...assets }
    };
  });

  // For final game over display, sort by ending profit
  const sortedFinalSummaries = [...summaries].sort((a, b) => b.endingProfit - a.endingProfit);

  const handleConfirmTransition = async () => {
    setIsProcessing(true);
    try {
      // 1. Process each team
      for (const summary of summaries) {
        const teamObj = teams.find(t => t.id === summary.teamId);
        
        // Deduct consumable charges
        const newTvCharges = Math.max(0, (summary.assets.tvCharges || 0) - (summary.casesLogged.type1 || 0));
        const newCouchCharges = Math.max(0, (summary.assets.couchCharges || 0) - (summary.casesLogged.type2 || 0));
        const newComputerCharges = Math.max(0, (summary.assets.computerCharges || 0) - (summary.casesLogged.type3 || 0));

        // Create history record
        const historyRecord = {
          market: currentMarket,
          startProfit: summary.startProfit,
          roundProfit: summary.revenue,
          endingProfit: summary.endingProfit,
          casesSolved: summary.casesLogged
        };

        const updatedHistory = [...(teamObj?.history || []), historyRecord];

        // Update team in db
        await updateTeam(summary.teamId, {
          profit: summary.endingProfit,
          cash: summary.endingProfit, // sync fallback
          assets: {
            ...summary.assets,
            tvCharges: newTvCharges,
            couchCharges: newCouchCharges,
            computerCharges: newComputerCharges
          },
          casesLogged: { type1: 0, type2: 0, type3: 0 }, // Reset case logging
          history: updatedHistory
        });
      }

      // 2. Update game state
      if (isGameOverTransition) {
        await updateGameState({
          isGameOver: true
        });
        await logActivity(`Game Over. Market 3 completed. Final profits computed.`);
      } else {
        const nextMkt = currentMarket + 1;
        await updateGameState({
          currentMarket: nextMkt
        });
        await logActivity(`Transitioned to Market ${nextMkt}. Case profits added to teams.`);
      }
      
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error processing market transition: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md overflow-y-auto p-4 py-8">
      <div className="w-full max-w-5xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        
        {/* Header */}
        <div className="border-b border-slate-800 p-6 bg-slate-950/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              {isGameOverTransition ? <Trophy className="h-6 w-6 text-yellow-400" /> : <TrendingUp className="h-6 w-6 animate-pulse text-emerald-400" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isGameOverTransition ? "Final Market 3 & Game Resolution" : `End of Market ${currentMarket} - Profit Summary`}
              </h2>
              <p className="text-sm text-slate-400">
                {isGameOverTransition ? "Review final profits and declare the winning firm." : `Approve round profits and advance to Market ${currentMarket + 1}.`}
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isGameOverTransition ? (
            /* Celebration Podium */
            <div className="mb-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-6 text-center space-y-4">
              <Trophy className="h-12 w-12 text-yellow-400 mx-auto animate-bounce" />
              <div className="space-y-1">
                <h3 className="text-2xl font-black tracking-wide text-yellow-400 uppercase">
                  {sortedFinalSummaries[0]?.name} is Victorious!
                </h3>
                <p className="text-slate-350 text-sm">
                  With a final Profit of <strong className="text-emerald-400 font-mono">${sortedFinalSummaries[0]?.endingProfit.toLocaleString()}</strong>, they have won the competition!
                </p>
              </div>
            </div>
          ) : null}

          {/* Detailed Summary Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <th className="p-4">Firm Name</th>
                    <th className="p-4 text-right">Start Profit</th>
                    <th className="p-4 text-right text-amber-400">Total Asset Spend</th>
                    <th className="p-4 text-center">Cases Solved</th>
                    <th className="p-4 text-right text-emerald-400">Round Profit</th>
                    <th className="p-4 text-right text-white">Ending Total Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-sm">
                  {summaries.map((summary) => (
                    <tr key={summary.teamId} className="hover:bg-slate-900/40">
                      <td className="p-4 font-bold text-white">{summary.name}</td>
                      <td className="p-4 text-right font-mono text-slate-400">${summary.startProfit.toLocaleString()}</td>
                      <td className="p-4 text-right font-mono text-amber-400 font-semibold">${summary.totalSpend.toLocaleString()}</td>
                      <td className="p-4 text-center font-mono text-slate-300">
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-xs">
                          {summary.totalCasesCount} cases
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-emerald-400 font-bold">+${summary.revenue.toLocaleString()}</td>
                      <td className="p-4 text-right font-mono font-extrabold text-emerald-300">${summary.endingProfit.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-800 p-6 bg-slate-950/30 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-850 px-4 py-2.5 text-sm font-semibold text-slate-450 hover:bg-slate-800 active:scale-95 transition"
          >
            Go Back
          </button>
          <button
            onClick={handleConfirmTransition}
            disabled={isProcessing}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 active:scale-95 transition"
          >
            {isGameOverTransition ? (
              <>
                <Award className="h-4 w-4" />
                Finalize Game
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Finalize & Start Market {currentMarket + 1}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
