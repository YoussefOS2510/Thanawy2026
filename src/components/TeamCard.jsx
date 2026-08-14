import React, { useState, useEffect } from "react";
import { updateTeam, logActivity } from "../utils/db";
import {
  getTotalEmployees,
  getEffectiveDeskAssignments,
  getWorkingCapacity,
  getSolvableMarketCeiling,
  calculateOptimalCases,
  validateCaseInputs,
  calculateTotalSpend
} from "../utils/capacity";
import {
  Users,
  Layout,
  Award,
  Tv,
  Sofa,
  Monitor,
  Plus,
  Minus,
  AlertCircle,
  Edit,
  Save,
  Check,
  RefreshCw,
  TrendingUp,
  Zap,
  CheckCircle2,
  Armchair,
  Tag,
  ShoppingBag
} from "lucide-react";

const COLOR_THEMES = {
  beige: { border: "border-amber-200/40", text: "text-amber-200", bg: "bg-amber-400", badge: "bg-amber-400/10 text-amber-300 border-amber-400/30" },
  green: { border: "border-emerald-500/40", text: "text-emerald-400", bg: "bg-emerald-400", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  turquoise: { border: "border-teal-400/40", text: "text-teal-300", bg: "bg-teal-400", badge: "bg-teal-400/10 text-teal-300 border-teal-400/30" },
  red: { border: "border-rose-500/40", text: "text-rose-400", bg: "bg-rose-400", badge: "bg-rose-500/10 text-rose-400 border-rose-500/30" },
  purple: { border: "border-purple-500/40", text: "text-purple-400", bg: "bg-purple-400", badge: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
  orange: { border: "border-orange-500/40", text: "text-orange-400", bg: "bg-orange-400", badge: "bg-orange-500/10 text-orange-400 border-orange-500/30" },
  yellow: { border: "border-yellow-400/40", text: "text-yellow-300", bg: "bg-yellow-400", badge: "bg-yellow-400/10 text-yellow-300 border-yellow-400/30" },
  blue: { border: "border-blue-500/40", text: "text-blue-400", bg: "bg-blue-400", badge: "bg-blue-500/10 text-blue-400 border-blue-500/30" }
};

export default function TeamCard({ team, config, currentMarket = 1, onOverride }) {
  const certLimits = config?.certLimits || { 0: 0, 1: 3, 2: 5, 3: 8, 4: 12, 5: 18 };
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

  const assets = team.assets || {
    empL1: 0,
    empL2: 0,
    empL3: 0,
    desks: 0,
    assignedEmpL1: undefined,
    assignedEmpL2: undefined,
    assignedEmpL3: undefined,
    certLevel: 0,
    tvCharges: 0,
    couchCharges: 0,
    computerCharges: 0
  };
  const profit = team.profit !== undefined ? team.profit : (team.cash || 0);

  const totalEmployees = getTotalEmployees(assets);
  const deskInfo = getEffectiveDeskAssignments(assets);
  const workingCapacity = getWorkingCapacity(assets);
  const solvableCeiling = getSolvableMarketCeiling(assets, certLimits);
  const totalSpend = calculateTotalSpend(assets, currentPrices);

  const [localCases, setLocalCases] = useState(team.casesLogged || { type1: 0, type2: 0, type3: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [autoSolveSuccess, setAutoSolveSuccess] = useState(false);
  const [customProfitInput, setCustomProfitInput] = useState("");
  const [isAdjustingProfit, setIsAdjustingProfit] = useState(false);
  const [showDeskManager, setShowDeskManager] = useState(false);

  useEffect(() => {
    if (team.casesLogged) {
      setLocalCases(team.casesLogged);
    }
  }, [team.casesLogged]);

  // Validation for UI using local cases
  const validation = validateCaseInputs(assets, certLimits, localCases);

  // Optimal cases solver preview
  const optimalSolve = calculateOptimalCases(assets, certLimits, caseRevenues);

  // Profit Adjustment handler (+ / -)
  const handleAdjustProfit = async (amount) => {
    const delta = Number(amount);
    if (isNaN(delta) || delta === 0) return;

    setIsAdjustingProfit(true);
    const newProfit = profit + delta;

    try {
      await updateTeam(team.id, {
        profit: newProfit,
        cash: newProfit
      });
      await logActivity(
        `Adjusted profit for "${team.name}" by ${delta >= 0 ? "+" : ""}$${delta.toLocaleString()} (Current Profit: $${newProfit.toLocaleString()}).`
      );
      setCustomProfitInput("");
    } catch (err) {
      console.error(err);
      alert("Failed to adjust profit: " + err.message);
    } finally {
      setIsAdjustingProfit(false);
    }
  };

  // Add / Remove Asset (Free of charge, unconstrained employee hiring)
  const handleModifyAsset = async (itemKey, delta, itemName) => {
    const updatedAssets = { ...assets };

    switch (itemKey) {
      case "empL1":
        updatedAssets.empL1 = Math.max(0, (updatedAssets.empL1 || 0) + delta);
        if (updatedAssets.assignedEmpL1 !== undefined) {
          updatedAssets.assignedEmpL1 = Math.min(updatedAssets.empL1, updatedAssets.assignedEmpL1);
        }
        break;
      case "empL2":
        updatedAssets.empL2 = Math.max(0, (updatedAssets.empL2 || 0) + delta);
        if (updatedAssets.assignedEmpL2 !== undefined) {
          updatedAssets.assignedEmpL2 = Math.min(updatedAssets.empL2, updatedAssets.assignedEmpL2);
        }
        break;
      case "empL3":
        updatedAssets.empL3 = Math.max(0, (updatedAssets.empL3 || 0) + delta);
        if (updatedAssets.assignedEmpL3 !== undefined) {
          updatedAssets.assignedEmpL3 = Math.min(updatedAssets.empL3, updatedAssets.assignedEmpL3);
        }
        break;
      case "desk":
        updatedAssets.desks = Math.max(0, (updatedAssets.desks || 0) + delta);
        break;
      case "tv":
        updatedAssets.tvCharges = Math.max(0, (updatedAssets.tvCharges || 0) + (delta * 3));
        break;
      case "couch":
        updatedAssets.couchCharges = Math.max(0, (updatedAssets.couchCharges || 0) + (delta * 3));
        break;
      case "computer":
        updatedAssets.computerCharges = Math.max(0, (updatedAssets.computerCharges || 0) + (delta * 3));
        break;
      case "cert":
        const nextLevel = (assets.certLevel || 0) + delta;
        if (nextLevel < 0 || nextLevel > 5) return;
        updatedAssets.certLevel = nextLevel;
        break;
      default:
        return;
    }

    try {
      await updateTeam(team.id, {
        assets: updatedAssets
      });
      const newTotalSpend = calculateTotalSpend(updatedAssets, currentPrices);
      await logActivity(
        `"${team.name}" ${delta > 0 ? "bought/added" : "removed"} ${itemName}. (Total Spend: $${newTotalSpend.toLocaleString()})`
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update asset: " + err.message);
    }
  };

  // Adjust desk assignment for specific employee level
  const handleAssignDesk = async (level, delta) => {
    const totalDesks = assets.desks || 0;
    const currentAssignments = {
      empL1: deskInfo.assignedL1,
      empL2: deskInfo.assignedL2,
      empL3: deskInfo.assignedL3
    };

    const targetKey = level === 1 ? "empL1" : level === 2 ? "empL2" : "empL3";
    const totalThisLevel = level === 1 ? (assets.empL1 || 0) : level === 2 ? (assets.empL2 || 0) : (assets.empL3 || 0);

    const currentThisAssigned = currentAssignments[targetKey];
    const newThisAssigned = Math.max(0, Math.min(totalThisLevel, currentThisAssigned + delta));

    // Check desk capacity if seating more
    const otherAssigned = (deskInfo.totalAssigned - currentThisAssigned);
    if (delta > 0 && (otherAssigned + newThisAssigned) > totalDesks) {
      alert(`Cannot seat more staff than available desks (${totalDesks} Desks).`);
      return;
    }

    const updatedAssets = {
      ...assets,
      assignedEmpL1: level === 1 ? newThisAssigned : deskInfo.assignedL1,
      assignedEmpL2: level === 2 ? newThisAssigned : deskInfo.assignedL2,
      assignedEmpL3: level === 3 ? newThisAssigned : deskInfo.assignedL3
    };

    try {
      await updateTeam(team.id, { assets: updatedAssets });
      await logActivity(`"${team.name}" updated desk assignments for Level ${level} staff.`);
    } catch (err) {
      console.error(err);
      alert("Failed to assign desk: " + err.message);
    }
  };

  // Reset desk assignments to automatic optimal seating
  const handleResetToAutoDesks = async () => {
    const updatedAssets = { ...assets };
    delete updatedAssets.assignedEmpL1;
    delete updatedAssets.assignedEmpL2;
    delete updatedAssets.assignedEmpL3;

    try {
      await updateTeam(team.id, { assets: updatedAssets });
      await logActivity(`"${team.name}" reset desk assignments to optimal automatic seating.`);
    } catch (err) {
      console.error(err);
      alert("Failed to reset desk assignments: " + err.message);
    }
  };

  // AUTOMATIC CASE SOLVER & PROFIT HARVESTER
  const handleAutoSolveCases = async () => {
    if (optimalSolve.totalCases === 0) {
      alert("No cases can be solved. Check employee desk assignments, cert limit, and consumable charges (TV, Couch, Comp).");
      return;
    }

    setIsSaving(true);
    setAutoSolveSuccess(false);

    try {
      const addedRevenue = optimalSolve.totalProfit;
      const newProfit = profit + addedRevenue;

      // Deduct consumable charges used
      const updatedAssets = {
        ...assets,
        tvCharges: Math.max(0, (assets.tvCharges || 0) - optimalSolve.type1),
        couchCharges: Math.max(0, (assets.couchCharges || 0) - optimalSolve.type2),
        computerCharges: Math.max(0, (assets.computerCharges || 0) - optimalSolve.type3)
      };

      const historyRecord = {
        timestamp: Date.now(),
        type: "auto_solved",
        casesSolved: {
          type1: optimalSolve.type1,
          type2: optimalSolve.type2,
          type3: optimalSolve.type3
        },
        profitAdded: addedRevenue,
        newProfit
      };

      const updatedHistory = [...(team.history || []), historyRecord];

      await updateTeam(team.id, {
        profit: newProfit,
        cash: newProfit,
        assets: updatedAssets,
        casesLogged: { type1: 0, type2: 0, type3: 0 },
        history: updatedHistory
      });

      setLocalCases({ type1: 0, type2: 0, type3: 0 });

      await logActivity(
        `⚡ Auto-solved ${optimalSolve.totalCases} cases for "${team.name}" (${optimalSolve.type3}x T3, ${optimalSolve.type2}x T2, ${optimalSolve.type1}x T1) -> +$${addedRevenue.toLocaleString()} profit added!`
      );

      setAutoSolveSuccess(true);
      setTimeout(() => setAutoSolveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to auto-solve cases: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-fill cases input fields for preview
  const handleAutoFillInputs = () => {
    setLocalCases({
      type1: optimalSolve.type1,
      type2: optimalSolve.type2,
      type3: optimalSolve.type3
    });
  };

  const handleCasesChange = (type, value) => {
    const parsed = Math.max(0, parseInt(value || 0, 10));
    setLocalCases(prev => ({ ...prev, [type]: parsed }));
  };

  const handleSaveTeam = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updateTeam(team.id, {
        casesLogged: localCases
      });
      await logActivity(`Saved cases for "${team.name}".`);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error(err);
      alert("Failed to save team: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const unassignedStaffCount = totalEmployees - deskInfo.totalAssigned;
  const nextCertLevel = Math.min(5, (assets.certLevel || 0) + 1);
  const nextCertPrice = currentPrices[`cert${nextCertLevel}`] || 0;

  // Round Potential Revenue from manually logged cases
  const potentialProfit =
    (localCases.type1 || 0) * (caseRevenues.type1 || 10000) +
    (localCases.type2 || 0) * (caseRevenues.type2 || 15000) +
    (localCases.type3 || 0) * (caseRevenues.type3 || 7500);

  // Color Theme definitions
  const theme = COLOR_THEMES[team.color] || {
    border: "border-slate-800",
    text: "text-indigo-400",
    bg: "bg-indigo-500/10",
    badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
  };

  return (
    <div className={`relative rounded-2xl border ${theme.border} bg-slate-900/60 p-5 shadow-lg backdrop-blur hover:border-slate-700 transition-all duration-300 flex flex-col justify-between group h-full`}>
      
      {/* Top Banner & Title */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="truncate pr-2">
            <h3 className={`text-lg font-extrabold tracking-wide transition-colors truncate ${theme.text}`}>
              {team.name}
            </h3>
            <span className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className={`h-2 w-2 rounded-full ${theme.bg}`} />
              <span className={`text-[10px] font-bold uppercase border px-1.5 py-0.5 rounded ${theme.badge}`}>
                {team.color || "Firm"}
              </span>
            </span>
          </div>
          
          {/* Quick Override Button */}
          <button 
            onClick={() => onOverride(team)}
            className="rounded-lg p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 transition"
            title="Override team state"
          >
            <Edit className="h-4 w-4" />
          </button>
        </div>

        {/* Total Profit & Total Spend Display Banner */}
        <div className="mb-4 rounded-xl bg-slate-950/70 border border-slate-800 p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              Total Profit
            </span>
            <span className={`text-2xl font-black font-mono tracking-tight ${profit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {profit >= 0 ? `$${profit.toLocaleString()}` : `-$${Math.abs(profit).toLocaleString()}`}
            </span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-850/80 mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <ShoppingBag className="h-3 w-3 text-amber-400" />
              Total Asset Spend
            </span>
            <span className="text-xs font-bold font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
              ${totalSpend.toLocaleString()}
            </span>
          </div>

          {/* Quick Profit Add/Subtract Controls */}
          <div className="pt-2 border-t border-slate-850/80 space-y-2">
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500 text-xs font-mono">$</span>
                <input
                  type="number"
                  placeholder="Amount"
                  value={customProfitInput}
                  onChange={(e) => setCustomProfitInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customProfitInput) {
                      handleAdjustProfit(customProfitInput);
                    }
                  }}
                  className="w-full pl-6 pr-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAdjustProfit(customProfitInput || 1000)}
                disabled={isAdjustingProfit}
                className="flex items-center gap-1 bg-emerald-600/90 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition active:scale-95 shadow-sm shadow-emerald-900/30 disabled:opacity-50"
                title="Add to Profit"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
              <button
                type="button"
                onClick={() => handleAdjustProfit(-(Number(customProfitInput) || 1000))}
                disabled={isAdjustingProfit}
                className="flex items-center gap-1 bg-rose-600/90 hover:bg-rose-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition active:scale-95 shadow-sm shadow-rose-900/30 disabled:opacity-50"
                title="Subtract from Profit"
              >
                <Minus className="h-3.5 w-3.5" />
                Sub
              </button>
            </div>

            {/* Fast Quick Buttons */}
            <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
              <span className="text-slate-500 font-sans font-semibold">Quick:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleAdjustProfit(1000)}
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded transition active:scale-90"
                >
                  +1k
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustProfit(5000)}
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded transition active:scale-90"
                >
                  +5k
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustProfit(-1000)}
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded transition active:scale-90"
                >
                  -1k
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustProfit(-5000)}
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded transition active:scale-90"
                >
                  -5k
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Operational Overview Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          {/* Staff Counter */}
          <div className="rounded-lg bg-slate-950/30 p-2.5 border border-slate-850">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-indigo-400" />
              Staff Total
            </span>
            <div className="flex justify-between items-end mt-1">
              <span className="text-base font-extrabold text-white font-mono">
                {totalEmployees}
              </span>
              <span className="text-[10px] font-medium text-slate-400">
                {deskInfo.totalAssigned} seated
              </span>
            </div>
          </div>

          {/* Desks Counter & Desk Assignment Toggle */}
          <div className="rounded-lg bg-slate-950/30 p-2.5 border border-slate-850 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Layout className="h-3.5 w-3.5 text-indigo-400" />
                Desks
              </span>
              <button
                type="button"
                onClick={() => setShowDeskManager(!showDeskManager)}
                className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border transition ${
                  showDeskManager
                    ? "bg-indigo-600 text-white border-indigo-500"
                    : "bg-slate-800 hover:bg-slate-700 text-indigo-300 border-slate-700"
                }`}
                title="Manage Employee Desk Assignments"
              >
                {showDeskManager ? "Close" : "Assign Desks"}
              </button>
            </div>
            <div className="flex justify-between items-end mt-1">
              <span className="text-base font-extrabold text-white font-mono">
                {assets.desks || 0}
              </span>
              <span className="text-[10px] text-slate-400">
                {Math.max(0, (assets.desks || 0) - deskInfo.totalAssigned)} free
              </span>
            </div>
          </div>

          {/* Certificate */}
          <div className="rounded-lg bg-slate-950/30 p-2.5 border border-slate-850">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Award className="h-3.5 w-3.5 text-indigo-400" />
              Certificate
            </span>
            <div className="mt-1 flex justify-between items-end">
              <span className="text-base font-extrabold text-white font-mono">
                Lvl {assets.certLevel || 0}
              </span>
              <span className="text-[10px] text-slate-500">
                Max {certLimits[assets.certLevel || 0] || 0} cases
              </span>
            </div>
          </div>

          {/* Working Capacity */}
          <div className="rounded-lg bg-slate-950/30 p-2.5 border border-slate-850 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Working Capacity
            </span>
            <div className="mt-1 flex justify-between items-end">
              <span className="text-sm font-bold text-indigo-400 font-mono">
                {workingCapacity} <span className="text-[10px] text-slate-500 font-normal">cases</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Ceiling: {solvableCeiling}
              </span>
            </div>
          </div>
        </div>

        {/* Desk Assignment Drawer (Interactive Desk Allocation) */}
        {showDeskManager && (
          <div className="mb-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3 space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-indigo-500/20 pb-1.5">
              <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                <Armchair className="h-3.5 w-3.5 text-indigo-400" />
                Desk Seating Allocation ({deskInfo.totalAssigned} / {assets.desks || 0} Desks Occupied)
              </span>
              <button
                type="button"
                onClick={handleResetToAutoDesks}
                className="text-[9px] text-indigo-400 hover:text-indigo-200 underline font-medium"
              >
                Auto-Optimize
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              {/* L3 Employees */}
              <div className="flex items-center justify-between bg-slate-950/50 p-1.5 rounded-lg border border-slate-800">
                <span className="font-medium text-slate-200 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  Emp L3 (3 cases): {deskInfo.assignedL3} / {assets.empL3 || 0} at desk
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleAssignDesk(3, -1)}
                    disabled={deskInfo.assignedL3 <= 0}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
                    title="Unseat Emp L3"
                  >
                    <Minus className="h-2.5 w-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAssignDesk(3, 1)}
                    disabled={deskInfo.assignedL3 >= (assets.empL3 || 0) || deskInfo.totalAssigned >= (assets.desks || 0)}
                    className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30"
                    title="Seat Emp L3 at Desk"
                  >
                    <Plus className="h-2.5 w-2.5" />
                  </button>
                </div>
              </div>

              {/* L2 Employees */}
              <div className="flex items-center justify-between bg-slate-950/50 p-1.5 rounded-lg border border-slate-800">
                <span className="font-medium text-slate-200 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-pink-400" />
                  Emp L2 (2 cases): {deskInfo.assignedL2} / {assets.empL2 || 0} at desk
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleAssignDesk(2, -1)}
                    disabled={deskInfo.assignedL2 <= 0}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
                    title="Unseat Emp L2"
                  >
                    <Minus className="h-2.5 w-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAssignDesk(2, 1)}
                    disabled={deskInfo.assignedL2 >= (assets.empL2 || 0) || deskInfo.totalAssigned >= (assets.desks || 0)}
                    className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30"
                    title="Seat Emp L2 at Desk"
                  >
                    <Plus className="h-2.5 w-2.5" />
                  </button>
                </div>
              </div>

              {/* L1 Employees */}
              <div className="flex items-center justify-between bg-slate-950/50 p-1.5 rounded-lg border border-slate-800">
                <span className="font-medium text-slate-200 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-indigo-400" />
                  Emp L1 (1 case): {deskInfo.assignedL1} / {assets.empL1 || 0} at desk
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleAssignDesk(1, -1)}
                    disabled={deskInfo.assignedL1 <= 0}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
                    title="Unseat Emp L1"
                  >
                    <Minus className="h-2.5 w-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAssignDesk(1, 1)}
                    disabled={deskInfo.assignedL1 >= (assets.empL1 || 0) || deskInfo.totalAssigned >= (assets.desks || 0)}
                    className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30"
                    title="Seat Emp L1 at Desk"
                  >
                    <Plus className="h-2.5 w-2.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Consumables Inventory Panel */}
        <div className="mb-3 rounded-xl border border-slate-800/80 bg-slate-950/20 p-2.5 space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800/50 pb-1">
            Consumable Case Capacity (Charges)
          </span>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <span className="text-[9px] font-semibold text-slate-500 block mb-0.5">TV (T1)</span>
              <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${assets.tvCharges > 0 ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-slate-800 text-slate-600"}`}>
                {assets.tvCharges || 0}
              </span>
            </div>
            <div className="text-center">
              <span className="text-[9px] font-semibold text-slate-500 block mb-0.5">Couch (T2)</span>
              <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${assets.couchCharges > 0 ? "bg-pink-500/10 text-pink-400 border border-pink-500/20" : "bg-slate-800 text-slate-600"}`}>
                {assets.couchCharges || 0}
              </span>
            </div>
            <div className="text-center">
              <span className="text-[9px] font-semibold text-slate-500 block mb-0.5">Comp (T3)</span>
              <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${assets.computerCharges > 0 ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "bg-slate-800 text-slate-600"}`}>
                {assets.computerCharges || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Resource Acquisition & Market Store with Visible Prices */}
        <div className="mb-3 border-t border-slate-850 pt-2.5">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Tag className="h-3 w-3 text-indigo-400" />
              Market {currentMarket} Store & Resources
            </span>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
              <ShoppingBag className="h-3 w-3" /> Spent: ${totalSpend.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-xs">
            
            {/* L1 Employee */}
            <div className="flex items-center justify-between p-1.5 rounded-lg border bg-slate-950/40 border-slate-800 text-white">
              <div>
                <span className="block font-bold text-[11px]">Emp L1</span>
                <span className="text-[9px] text-emerald-400 font-mono font-semibold">${(currentPrices.empL1 || 2000).toLocaleString()}</span>
                <span className="text-[9px] text-slate-500 font-mono ml-1.5">({assets.empL1 || 0})</span>
              </div>
              <div className="flex items-center gap-1">
                {(assets.empL1 || 0) > 0 && (
                  <button
                    type="button"
                    onClick={() => handleModifyAsset("empL1", -1, "Employee L1")}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                    title="Remove Emp L1"
                  >
                    <Minus className="h-2.5 w-2.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleModifyAsset("empL1", 1, "Employee L1")}
                  className="p-1 rounded bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-300 hover:text-white transition"
                  title="Hire Emp L1"
                >
                  <Plus className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>

            {/* L2 Employee */}
            <div className="flex items-center justify-between p-1.5 rounded-lg border bg-slate-950/40 border-slate-800 text-white">
              <div>
                <span className="block font-bold text-[11px]">Emp L2</span>
                <span className="text-[9px] text-emerald-400 font-mono font-semibold">${(currentPrices.empL2 || 3500).toLocaleString()}</span>
                <span className="text-[9px] text-slate-500 font-mono ml-1.5">({assets.empL2 || 0})</span>
              </div>
              <div className="flex items-center gap-1">
                {(assets.empL2 || 0) > 0 && (
                  <button
                    type="button"
                    onClick={() => handleModifyAsset("empL2", -1, "Employee L2")}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                    title="Remove Emp L2"
                  >
                    <Minus className="h-2.5 w-2.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleModifyAsset("empL2", 1, "Employee L2")}
                  className="p-1 rounded bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-300 hover:text-white transition"
                  title="Hire Emp L2"
                >
                  <Plus className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>

            {/* L3 Employee */}
            <div className="flex items-center justify-between p-1.5 rounded-lg border bg-slate-950/40 border-slate-800 text-white">
              <div>
                <span className="block font-bold text-[11px]">Emp L3</span>
                <span className="text-[9px] text-emerald-400 font-mono font-semibold">${(currentPrices.empL3 || 5000).toLocaleString()}</span>
                <span className="text-[9px] text-slate-500 font-mono ml-1.5">({assets.empL3 || 0})</span>
              </div>
              <div className="flex items-center gap-1">
                {(assets.empL3 || 0) > 0 && (
                  <button
                    type="button"
                    onClick={() => handleModifyAsset("empL3", -1, "Employee L3")}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                    title="Remove Emp L3"
                  >
                    <Minus className="h-2.5 w-2.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleModifyAsset("empL3", 1, "Employee L3")}
                  className="p-1 rounded bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-300 hover:text-white transition"
                  title="Hire Emp L3"
                >
                  <Plus className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>

            {/* Desk */}
            <div className="flex items-center justify-between p-1.5 rounded-lg border bg-slate-950/40 border-slate-800 text-white">
              <div>
                <span className="block font-bold text-[11px]">Desk</span>
                <span className="text-[9px] text-emerald-400 font-mono font-semibold">${(currentPrices.desk || 1000).toLocaleString()}</span>
                <span className="text-[9px] text-slate-500 font-mono ml-1.5">({assets.desks || 0})</span>
              </div>
              <div className="flex items-center gap-1">
                {(assets.desks || 0) > 0 && (
                  <button
                    type="button"
                    onClick={() => handleModifyAsset("desk", -1, "Desk")}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                    title="Remove Desk"
                  >
                    <Minus className="h-2.5 w-2.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleModifyAsset("desk", 1, "Desk")}
                  className="p-1 rounded bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-300 hover:text-white transition"
                  title="Add Desk"
                >
                  <Plus className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>

            {/* TV (T1) */}
            <div className="flex items-center justify-between p-1.5 rounded-lg border bg-slate-950/40 border-slate-800 text-white">
              <div>
                <span className="block font-bold text-[11px]">TV (T1)</span>
                <span className="text-[9px] text-emerald-400 font-mono font-semibold">${(currentPrices.tv || 5000).toLocaleString()}</span>
                <span className="text-[9px] text-slate-500 font-mono ml-1">({assets.tvCharges || 0} chg)</span>
              </div>
              <div className="flex items-center gap-1">
                {(assets.tvCharges || 0) > 0 && (
                  <button
                    type="button"
                    onClick={() => handleModifyAsset("tv", -1, "TV")}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                    title="Remove TV (-3 Charges)"
                  >
                    <Minus className="h-2.5 w-2.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleModifyAsset("tv", 1, "TV (3 Charges)")}
                  className="p-1 rounded bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-300 hover:text-white transition"
                  title="Buy TV (+3 Charges)"
                >
                  <Plus className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>

            {/* Couch (T2) */}
            <div className="flex items-center justify-between p-1.5 rounded-lg border bg-slate-950/40 border-slate-800 text-white">
              <div>
                <span className="block font-bold text-[11px]">Couch (T2)</span>
                <span className="text-[9px] text-emerald-400 font-mono font-semibold">${(currentPrices.couch || 7500).toLocaleString()}</span>
                <span className="text-[9px] text-slate-500 font-mono ml-1">({assets.couchCharges || 0} chg)</span>
              </div>
              <div className="flex items-center gap-1">
                {(assets.couchCharges || 0) > 0 && (
                  <button
                    type="button"
                    onClick={() => handleModifyAsset("couch", -1, "Couch")}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                    title="Remove Couch (-3 Charges)"
                  >
                    <Minus className="h-2.5 w-2.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleModifyAsset("couch", 1, "Couch (3 Charges)")}
                  className="p-1 rounded bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-300 hover:text-white transition"
                  title="Buy Couch (+3 Charges)"
                >
                  <Plus className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>

            {/* Computer (T3) */}
            <div className="flex items-center justify-between p-1.5 rounded-lg border bg-slate-950/40 border-slate-800 text-white">
              <div>
                <span className="block font-bold text-[11px]">Comp (T3)</span>
                <span className="text-[9px] text-emerald-400 font-mono font-semibold">${(currentPrices.computer || 10000).toLocaleString()}</span>
                <span className="text-[9px] text-slate-500 font-mono ml-1">({assets.computerCharges || 0} chg)</span>
              </div>
              <div className="flex items-center gap-1">
                {(assets.computerCharges || 0) > 0 && (
                  <button
                    type="button"
                    onClick={() => handleModifyAsset("computer", -1, "Computer")}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                    title="Remove Computer (-3 Charges)"
                  >
                    <Minus className="h-2.5 w-2.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleModifyAsset("computer", 1, "Computer (3 Charges)")}
                  className="p-1 rounded bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-300 hover:text-white transition"
                  title="Buy Computer (+3 Charges)"
                >
                  <Plus className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>

            {/* Certificate */}
            <div className="flex items-center justify-between p-1.5 rounded-lg border bg-slate-950/40 border-slate-800 text-white">
              <div>
                <span className="block font-bold text-[11px]">Certificate</span>
                <span className="text-[9px] text-emerald-400 font-mono font-semibold">
                  {assets.certLevel >= 5 ? "Max" : `$${nextCertPrice.toLocaleString()}`}
                </span>
                <span className="text-[9px] text-slate-500 font-mono ml-1.5">(L{assets.certLevel || 0})</span>
              </div>
              <div className="flex items-center gap-1">
                {(assets.certLevel || 0) > 0 && (
                  <button
                    type="button"
                    onClick={() => handleModifyAsset("cert", -1, "Certificate Level")}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                    title="Downgrade Certificate"
                  >
                    <Minus className="h-2.5 w-2.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleModifyAsset("cert", 1, "Certificate Level")}
                  disabled={assets.certLevel >= 5}
                  className="p-1 rounded bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-300 hover:text-white transition disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Upgrade Certificate"
                >
                  <Plus className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>

          </div>
          
          {/* Informative Status Notes */}
          {unassignedStaffCount > 0 && (
            <div className="mt-1.5">
              <p className="text-[10px] text-amber-400 flex items-center justify-between font-medium bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                <span>{unassignedStaffCount} unseated staff member(s). Add desk or assign them to activate.</span>
                <button
                  type="button"
                  onClick={() => setShowDeskManager(true)}
                  className="underline text-[9px] font-bold"
                >
                  Assign
                </button>
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Case Management & Auto-Solving Panel */}
      <div className="border-t border-slate-850 pt-2.5 mt-auto space-y-2.5">
        
        {/* AUTOMATIC SOLVER ACTION BAR */}
        <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 to-slate-900 p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              Auto-Assign Cases to Employees
            </span>
            <span className="text-[10px] font-bold font-mono text-emerald-300">
              +{optimalSolve.totalCases} cases (${optimalSolve.totalProfit.toLocaleString()})
            </span>
          </div>

          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={handleAutoSolveCases}
              disabled={isSaving || optimalSolve.totalCases === 0}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-black transition duration-200 active:scale-95 shadow-md ${
                autoSolveSuccess
                  ? "bg-emerald-500 text-slate-950"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              } disabled:opacity-40 disabled:hover:bg-emerald-600`}
              title="Automatically assign employees to optimal cases, mark as solved, and add profit directly"
            >
              {autoSolveSuccess ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Solved & Profit Added!
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5 fill-white" />
                  Auto-Solve & Add Profit (+${optimalSolve.totalProfit.toLocaleString()})
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleAutoFillInputs}
              disabled={optimalSolve.totalCases === 0}
              className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-bold text-slate-300 transition active:scale-95 disabled:opacity-40"
              title="Auto-fill numbers into input boxes for review"
            >
              Fill Inputs
            </button>
          </div>
        </div>

        {/* Manual Cases Logging Section */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Manual Case Resolver</span>
            <span className="text-slate-400 font-mono">
              Potential: +${potentialProfit.toLocaleString()}
            </span>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-12 text-xs font-semibold text-slate-400 flex items-center gap-1"><Tv className="h-3.5 w-3.5 text-indigo-400" /> T1</span>
              <input
                type="number"
                value={localCases.type1 || ""}
                onChange={(e) => handleCasesChange("type1", e.target.value)}
                className="w-14 text-center rounded border border-slate-800 bg-slate-950 p-1 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
                min="0"
              />
              <span className="text-slate-600 text-xs">x</span>
              <span className="text-[11px] text-slate-400 font-mono">${(caseRevenues.type1 || 10000).toLocaleString()}</span>
              <span className="ml-auto text-xs text-emerald-400/80 font-semibold font-mono">
                +${((localCases.type1 || 0) * (caseRevenues.type1 || 10000)).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-12 text-xs font-semibold text-slate-400 flex items-center gap-1"><Sofa className="h-3.5 w-3.5 text-pink-400" /> T2</span>
              <input
                type="number"
                value={localCases.type2 || ""}
                onChange={(e) => handleCasesChange("type2", e.target.value)}
                className="w-14 text-center rounded border border-slate-800 bg-slate-950 p-1 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
                min="0"
              />
              <span className="text-slate-600 text-xs">x</span>
              <span className="text-[11px] text-slate-400 font-mono">${(caseRevenues.type2 || 15000).toLocaleString()}</span>
              <span className="ml-auto text-xs text-emerald-400/80 font-semibold font-mono">
                +${((localCases.type2 || 0) * (caseRevenues.type2 || 15000)).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-12 text-xs font-semibold text-slate-400 flex items-center gap-1"><Monitor className="h-3.5 w-3.5 text-cyan-400" /> T3</span>
              <input
                type="number"
                value={localCases.type3 || ""}
                onChange={(e) => handleCasesChange("type3", e.target.value)}
                className="w-14 text-center rounded border border-slate-800 bg-slate-950 p-1 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
                min="0"
              />
              <span className="text-slate-600 text-xs">x</span>
              <span className="text-[11px] text-slate-400 font-mono">${(caseRevenues.type3 || 7500).toLocaleString()}</span>
              <span className="ml-auto text-xs text-emerald-400/80 font-semibold font-mono">
                +${((localCases.type3 || 0) * (caseRevenues.type3 || 7500)).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Validation alerts */}
          {!validation.isValid && (
            <div className="p-1.5 rounded bg-rose-500/10 border border-rose-500/25 text-[10px] text-rose-400 font-medium space-y-0.5">
              {Object.values(validation.errors).map((err, idx) => (
                <p key={idx} className="flex items-start gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                  <span>{err}</span>
                </p>
              ))}
            </div>
          )}

          {/* Save Button for manually edited cases */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleSaveTeam}
              disabled={isSaving}
              className={`w-full flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-3 text-xs font-bold transition duration-200 active:scale-95 ${
                saveSuccess
                  ? "bg-indigo-500 text-white"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              } disabled:opacity-50`}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Saving...
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="h-3 w-3 text-white" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-3 w-3" />
                  Save Logged Cases
                </>
              )}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
