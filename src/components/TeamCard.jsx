import React from "react";
import { updateTeam, logActivity } from "../utils/db";
import { getTotalEmployees, getTotalEmployeeCapacity, getWorkingCapacity, getSolvableMarketCeiling, validateCaseInputs } from "../utils/capacity";
import { Users, Layout, Award, Tv, Sofa, Monitor, Plus, AlertCircle, Edit, DollarSign } from "lucide-react";

export default function TeamCard({ team, config, currentMarket, onOverride }) {
  const currentPrices = config.prices[`market${currentMarket}`];
  const maxEmployees = config.maxEmployees;
  const certLimits = config.certLimits;
  const caseRevenues = config.caseRevenues;

  const assets = team.assets || { empL1: 0, empL2: 0, empL3: 0, desks: 0, certLevel: 0, tvCharges: 0, couchCharges: 0, computerCharges: 0 };
  const cash = team.cash || 0;

  const totalEmployees = getTotalEmployees(assets);
  const employeeCapacity = getTotalEmployeeCapacity(assets);
  const workingCapacity = getWorkingCapacity(assets);
  const solvableCeiling = getSolvableMarketCeiling(assets, certLimits);

  const casesLogged = team.casesLogged || { type1: 0, type2: 0, type3: 0 };
  
  // Validation for UI
  const validation = validateCaseInputs(assets, certLimits, casesLogged);

  const handlePurchase = async (itemKey, cost, itemName) => {
    if (cash < cost) {
      alert("Insufficient funds to purchase " + itemName);
      return;
    }

    const updatedAssets = { ...assets };
    let logMsg = "";

    switch (itemKey) {
      case "empL1":
        if (totalEmployees >= maxEmployees) return;
        if (totalEmployees >= assets.desks) return;
        updatedAssets.empL1 = (updatedAssets.empL1 || 0) + 1;
        break;
      case "empL2":
        if (totalEmployees >= maxEmployees) return;
        if (totalEmployees >= assets.desks) return;
        updatedAssets.empL2 = (updatedAssets.empL2 || 0) + 1;
        break;
      case "empL3":
        if (totalEmployees >= maxEmployees) return;
        if (totalEmployees >= assets.desks) return;
        updatedAssets.empL3 = (updatedAssets.empL3 || 0) + 1;
        break;
      case "desk":
        updatedAssets.desks = (updatedAssets.desks || 0) + 1;
        break;
      case "tv":
        updatedAssets.tvCharges = (updatedAssets.tvCharges || 0) + 3;
        break;
      case "couch":
        updatedAssets.couchCharges = (updatedAssets.couchCharges || 0) + 3;
        break;
      case "computer":
        updatedAssets.computerCharges = (updatedAssets.computerCharges || 0) + 3;
        break;
      case "cert":
        if (assets.certLevel >= 5) return;
        updatedAssets.certLevel = (updatedAssets.certLevel || 0) + 1;
        break;
      default:
        return;
    }

    try {
      await updateTeam(team.id, {
        cash: cash - cost,
        assets: updatedAssets
      });
      await logActivity(`"${team.name}" purchased ${itemName} for $${cost.toLocaleString()}.`);
    } catch (err) {
      console.error(err);
      alert("Purchase failed: " + err.message);
    }
  };

  const handleCasesChange = async (type, value) => {
    const parsed = Math.max(0, parseInt(value || 0, 10));
    const newCasesLogged = { ...casesLogged, [type]: parsed };
    try {
      await updateTeam(team.id, {
        casesLogged: newCasesLogged
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Pre-calculate upgrade cost for Certificate
  const nextCertLevel = (assets.certLevel || 0) + 1;
  const certUpgradeCost = nextCertLevel <= 5 ? currentPrices[`cert${nextCertLevel}`] : null;

  // Limits checks for styling/disabling
  const isAtEmployeeLimit = totalEmployees >= maxEmployees;
  const isAtDeskLimit = totalEmployees >= (assets.desks || 0);

  return (
    <div className="relative rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between group h-full">
      
      {/* Top Banner & Title */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="truncate pr-2">
            <h3 className="text-lg font-bold text-white tracking-wide group-hover:text-indigo-400 transition-colors truncate">
              {team.name}
            </h3>
            <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              Firm Status
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

        {/* Financial Stat */}
        <div className="mb-4 rounded-xl bg-slate-950/40 border border-slate-850 p-3 flex justify-between items-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Available Capital</span>
          <span className="text-xl font-black text-emerald-400 font-mono">
            ${cash.toLocaleString()}
          </span>
        </div>

        {/* Asset Dashboard Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-lg bg-slate-950/20 p-2.5 border border-slate-850">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-indigo-400" />
              Staff
            </span>
            <div className="flex justify-between items-end mt-1">
              <span className="text-base font-extrabold text-white font-mono">
                {totalEmployees} <span className="text-xs text-slate-500 font-normal">/ {maxEmployees}</span>
              </span>
              {isAtEmployeeLimit && (
                <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  Full
                </span>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-slate-950/20 p-2.5 border border-slate-850">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Layout className="h-3.5 w-3.5 text-indigo-400" />
              Desks
            </span>
            <div className="flex justify-between items-end mt-1">
              <span className="text-base font-extrabold text-white font-mono">
                {assets.desks || 0}
              </span>
              {isAtDeskLimit && totalEmployees > 0 && (
                <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  Cap
                </span>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-slate-950/20 p-2.5 border border-slate-850">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Award className="h-3.5 w-3.5 text-indigo-400" />
              Certificate
            </span>
            <div className="mt-1">
              <span className="text-base font-extrabold text-white font-mono">
                Lvl {assets.certLevel || 0}
              </span>
              <span className="block text-[9px] text-slate-500">
                Max {certLimits[assets.certLevel || 0]} cases
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-slate-950/20 p-2.5 border border-slate-850 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Working Capacity
            </span>
            <div className="mt-1">
              <span className="text-sm font-bold text-indigo-400 font-mono">
                {workingCapacity} <span className="text-[10px] text-slate-500 font-normal">cases/mkt</span>
              </span>
            </div>
          </div>
        </div>

        {/* Consumables Inventory Panel */}
        <div className="mb-5 rounded-xl border border-slate-800/80 bg-slate-950/20 p-3 space-y-2">
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

        {/* Purchase Items Panel */}
        <div className="mb-5 border-t border-slate-850 pt-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Market Store (Market {currentMarket})
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            
            {/* L1 Employee */}
            <button
              onClick={() => handlePurchase("empL1", currentPrices.empL1, "Employee Level 1")}
              disabled={cash < currentPrices.empL1 || isAtEmployeeLimit || isAtDeskLimit}
              className={`flex items-center justify-between p-2 rounded-lg border text-left active:scale-95 transition ${
                isAtEmployeeLimit || isAtDeskLimit
                  ? "bg-slate-850 border-slate-800 text-slate-600 cursor-not-allowed"
                  : "bg-slate-950/40 border-slate-800 hover:border-indigo-500 text-white"
              }`}
            >
              <div>
                <span className="block font-bold">Emp L1</span>
                <span className="text-[10px] text-slate-500 font-mono">${currentPrices.empL1.toLocaleString()}</span>
              </div>
              <Plus className="h-3.5 w-3.5 text-slate-500" />
            </button>

            {/* L2 Employee */}
            <button
              onClick={() => handlePurchase("empL2", currentPrices.empL2, "Employee Level 2")}
              disabled={cash < currentPrices.empL2 || isAtEmployeeLimit || isAtDeskLimit}
              className={`flex items-center justify-between p-2 rounded-lg border text-left active:scale-95 transition ${
                isAtEmployeeLimit || isAtDeskLimit
                  ? "bg-slate-850 border-slate-800 text-slate-600 cursor-not-allowed"
                  : "bg-slate-950/40 border-slate-800 hover:border-indigo-500 text-white"
              }`}
            >
              <div>
                <span className="block font-bold">Emp L2</span>
                <span className="text-[10px] text-slate-500 font-mono">${currentPrices.empL2.toLocaleString()}</span>
              </div>
              <Plus className="h-3.5 w-3.5 text-slate-500" />
            </button>

            {/* L3 Employee */}
            <button
              onClick={() => handlePurchase("empL3", currentPrices.empL3, "Employee Level 3")}
              disabled={cash < currentPrices.empL3 || isAtEmployeeLimit || isAtDeskLimit}
              className={`flex items-center justify-between p-2 rounded-lg border text-left active:scale-95 transition ${
                isAtEmployeeLimit || isAtDeskLimit
                  ? "bg-slate-850 border-slate-800 text-slate-600 cursor-not-allowed"
                  : "bg-slate-950/40 border-slate-800 hover:border-indigo-500 text-white"
              }`}
            >
              <div>
                <span className="block font-bold">Emp L3</span>
                <span className="text-[10px] text-slate-500 font-mono">${currentPrices.empL3.toLocaleString()}</span>
              </div>
              <Plus className="h-3.5 w-3.5 text-slate-500" />
            </button>

            {/* Desk */}
            <button
              onClick={() => handlePurchase("desk", currentPrices.desk, "Desk")}
              disabled={cash < currentPrices.desk}
              className="flex items-center justify-between p-2 rounded-lg border border-slate-800 bg-slate-950/40 hover:border-indigo-500 text-white active:scale-95 transition disabled:opacity-40 text-left"
            >
              <div>
                <span className="block font-bold">Desk</span>
                <span className="text-[10px] text-slate-500 font-mono">${currentPrices.desk.toLocaleString()}</span>
              </div>
              <Plus className="h-3.5 w-3.5 text-slate-500" />
            </button>

            {/* TV */}
            <button
              onClick={() => handlePurchase("tv", currentPrices.tv, "TV (Support T1)")}
              disabled={cash < currentPrices.tv}
              className="flex items-center justify-between p-2 rounded-lg border border-slate-800 bg-slate-950/40 hover:border-indigo-500 text-white active:scale-95 transition disabled:opacity-40 text-left"
            >
              <div>
                <span className="block font-bold">TV (T1)</span>
                <span className="text-[10px] text-slate-500 font-mono">${currentPrices.tv.toLocaleString()}</span>
              </div>
              <Plus className="h-3.5 w-3.5 text-slate-500" />
            </button>

            {/* Couch */}
            <button
              onClick={() => handlePurchase("couch", currentPrices.couch, "Couch (Support T2)")}
              disabled={cash < currentPrices.couch}
              className="flex items-center justify-between p-2 rounded-lg border border-slate-800 bg-slate-950/40 hover:border-indigo-500 text-white active:scale-95 transition disabled:opacity-40 text-left"
            >
              <div>
                <span className="block font-bold">Couch (T2)</span>
                <span className="text-[10px] text-slate-500 font-mono">${currentPrices.couch.toLocaleString()}</span>
              </div>
              <Plus className="h-3.5 w-3.5 text-slate-500" />
            </button>

            {/* Computer */}
            <button
              onClick={() => handlePurchase("computer", currentPrices.computer, "Computer (Support T3)")}
              disabled={cash < currentPrices.computer}
              className="flex items-center justify-between p-2 rounded-lg border border-slate-800 bg-slate-950/40 hover:border-indigo-500 text-white active:scale-95 transition disabled:opacity-40 text-left"
            >
              <div>
                <span className="block font-bold">Comp (T3)</span>
                <span className="text-[10px] text-slate-500 font-mono">${currentPrices.computer.toLocaleString()}</span>
              </div>
              <Plus className="h-3.5 w-3.5 text-slate-500" />
            </button>

            {/* Certificate */}
            <button
              onClick={() => handlePurchase("cert", certUpgradeCost, `Certificate Lvl ${nextCertLevel}`)}
              disabled={assets.certLevel >= 5 || !certUpgradeCost || cash < certUpgradeCost}
              className="flex items-center justify-between p-2 rounded-lg border border-slate-800 bg-slate-950/40 hover:border-indigo-500 text-white active:scale-95 transition disabled:opacity-40 text-left"
            >
              <div>
                <span className="block font-bold">
                  {assets.certLevel >= 5 ? "Cert Max" : `Cert Lvl ${nextCertLevel}`}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {assets.certLevel >= 5 ? "-" : `$${certUpgradeCost?.toLocaleString()}`}
                </span>
              </div>
              <Plus className="h-3.5 w-3.5 text-slate-500" />
            </button>

          </div>
          
          {/* Employee Limitations Warnings */}
          <div className="mt-2 space-y-1">
            {isAtEmployeeLimit && (
              <p className="text-[10px] text-rose-400 flex items-center gap-1 font-medium bg-rose-500/5 px-2 py-1 rounded border border-rose-500/10">
                <AlertCircle className="h-3 w-3 shrink-0" />
                Hired maximum employees allowed ({maxEmployees}).
              </p>
            )}
            {isAtDeskLimit && !isAtEmployeeLimit && (
              <p className="text-[10px] text-amber-400 flex items-center gap-1 font-medium bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10 animate-pulse">
                <AlertCircle className="h-3 w-3 shrink-0" />
                Un-desked Employee warning: Purchase Desk to hire more staff.
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Case Logging Panel */}
      <div className="border-t border-slate-850 pt-4 mt-auto">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Resolve Cases (Solvable Ceiling: {solvableCeiling})
          </span>
          <span className="text-[10px] text-slate-500 font-bold">
            Revenue Potential
          </span>
        </div>
        
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            <span className="w-12 text-xs font-semibold text-slate-400 flex items-center gap-1"><Tv className="h-3.5 w-3.5 text-indigo-400" /> T1</span>
            <input
              type="number"
              value={casesLogged.type1 || ""}
              onChange={(e) => handleCasesChange("type1", e.target.value)}
              className="w-16 text-center rounded border border-slate-800 bg-slate-950 p-1 text-xs text-white focus:border-indigo-500 focus:outline-none"
              min="0"
            />
            <span className="text-slate-600 text-xs">x</span>
            <span className="text-xs text-slate-400 font-mono">${caseRevenues.type1.toLocaleString()}</span>
            <span className="ml-auto text-xs text-emerald-400/80 font-semibold font-mono">
              +${((casesLogged.type1 || 0) * caseRevenues.type1).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-12 text-xs font-semibold text-slate-400 flex items-center gap-1"><Sofa className="h-3.5 w-3.5 text-pink-400" /> T2</span>
            <input
              type="number"
              value={casesLogged.type2 || ""}
              onChange={(e) => handleCasesChange("type2", e.target.value)}
              className="w-16 text-center rounded border border-slate-800 bg-slate-950 p-1 text-xs text-white focus:border-indigo-500 focus:outline-none"
              min="0"
            />
            <span className="text-slate-600 text-xs">x</span>
            <span className="text-xs text-slate-400 font-mono">${caseRevenues.type2.toLocaleString()}</span>
            <span className="ml-auto text-xs text-emerald-400/80 font-semibold font-mono">
              +${((casesLogged.type2 || 0) * caseRevenues.type2).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-12 text-xs font-semibold text-slate-400 flex items-center gap-1"><Monitor className="h-3.5 w-3.5 text-cyan-400" /> T3</span>
            <input
              type="number"
              value={casesLogged.type3 || ""}
              onChange={(e) => handleCasesChange("type3", e.target.value)}
              className="w-16 text-center rounded border border-slate-800 bg-slate-950 p-1 text-xs text-white focus:border-indigo-500 focus:outline-none"
              min="0"
            />
            <span className="text-slate-600 text-xs">x</span>
            <span className="text-xs text-slate-400 font-mono">${caseRevenues.type3.toLocaleString()}</span>
            <span className="ml-auto text-xs text-emerald-400/80 font-semibold font-mono">
              +${((casesLogged.type3 || 0) * caseRevenues.type3).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Dynamic Capacity / Validation Alerts */}
        {!validation.isValid && (
          <div className="mt-3 p-2 rounded bg-rose-500/10 border border-rose-500/25 text-[10px] text-rose-400 font-medium space-y-1">
            {Object.values(validation.errors).map((err, idx) => (
              <p key={idx} className="flex items-start gap-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{err}</span>
              </p>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
