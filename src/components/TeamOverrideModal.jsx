import React, { useState, useEffect } from "react";
import { updateTeam, logActivity } from "../utils/db";
import { X, Award, DollarSign, Users, Sparkles, ShoppingCart } from "lucide-react";

export default function TeamOverrideModal({ isOpen, onClose, team }) {
  const [cash, setCash] = useState(0);
  const [empL1, setEmpL1] = useState(0);
  const [empL2, setEmpL2] = useState(0);
  const [empL3, setEmpL3] = useState(0);
  const [desks, setDesks] = useState(0);
  const [certLevel, setCertLevel] = useState(0);
  const [tvCharges, setTvCharges] = useState(0);
  const [couchCharges, setCouchCharges] = useState(0);
  const [computerCharges, setComputerCharges] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (team) {
      setCash(team.cash || 0);
      setEmpL1(team.assets?.empL1 || 0);
      setEmpL2(team.assets?.empL2 || 0);
      setEmpL3(team.assets?.empL3 || 0);
      setDesks(team.assets?.desks || 0);
      setCertLevel(team.assets?.certLevel || 0);
      setTvCharges(team.assets?.tvCharges || 0);
      setCouchCharges(team.assets?.couchCharges || 0);
      setComputerCharges(team.assets?.computerCharges || 0);
    }
  }, [team, isOpen]);

  if (!isOpen || !team) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updates = {
        cash: Number(cash),
        assets: {
          empL1: Number(empL1),
          empL2: Number(empL2),
          empL3: Number(empL3),
          desks: Number(desks),
          certLevel: Number(certLevel),
          tvCharges: Number(tvCharges),
          couchCharges: Number(couchCharges),
          computerCharges: Number(computerCharges)
        }
      };

      await updateTeam(team.id, updates);
      await logActivity(`GM overrode assets and cash for team "${team.name}".`);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to override team state: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-6 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Manual Override: {team.name}</h2>
              <p className="text-sm text-slate-400">Directly modify firm funds and asset balances. Use with caution.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Cash Override */}
            <div className="sm:col-span-2 rounded-xl border border-slate-800 bg-slate-950/20 p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                Capital Reserves
              </h3>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Available Cash ($)</label>
                <input
                  type="number"
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Permanent Employees */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/20 p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-4 w-4 text-indigo-400" />
                Staff Members
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Level 1 Employees (Count)</label>
                  <input
                    type="number"
                    value={empL1}
                    onChange={(e) => setEmpL1(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Level 2 Employees (Count)</label>
                  <input
                    type="number"
                    value={empL2}
                    onChange={(e) => setEmpL2(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Level 3 Employees (Count)</label>
                  <input
                    type="number"
                    value={empL3}
                    onChange={(e) => setEmpL3(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Real Estate & Certificate */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/20 p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="h-4 w-4 text-indigo-400" />
                Real Estate & Limits
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Active Desks (Count)</label>
                  <input
                    type="number"
                    value={desks}
                    onChange={(e) => setDesks(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Certificate Level (0-5)</label>
                  <input
                    type="number"
                    value={certLevel}
                    onChange={(e) => setCertLevel(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                    min="0"
                    max="5"
                  />
                </div>
              </div>
            </div>

            {/* Consumables (Charges Remaining) */}
            <div className="sm:col-span-2 rounded-xl border border-slate-800 bg-slate-950/20 p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingCart className="h-4 w-4 text-indigo-400" />
                Consumable Capacity (Charges Left: 1 item = 3 charges)
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">TV Charges</label>
                  <input
                    type="number"
                    value={tvCharges}
                    onChange={(e) => setTvCharges(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-sm text-white focus:border-amber-500 focus:outline-none text-center"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Couch Charges</label>
                  <input
                    type="number"
                    value={couchCharges}
                    onChange={(e) => setCouchCharges(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-sm text-white focus:border-amber-500 focus:outline-none text-center"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Computer Charges</label>
                  <input
                    type="number"
                    value={computerCharges}
                    onChange={(e) => setComputerCharges(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-sm text-white focus:border-amber-500 focus:outline-none text-center"
                    min="0"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Buttons */}
          <div className="border-t border-slate-800 pt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700 active:scale-95 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 active:scale-95 transition disabled:opacity-50"
            >
              Apply Overrides
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
