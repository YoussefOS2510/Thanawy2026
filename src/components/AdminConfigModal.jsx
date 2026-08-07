import React, { useState, useEffect } from "react";
import { updateConfig, resetDatabaseToDefaults } from "../utils/db";
import { Settings, RefreshCw, X, ShieldAlert, Award, DollarSign, Users, HelpCircle } from "lucide-react";

export default function AdminConfigModal({ isOpen, onClose, gameConfig }) {
  const [activeTab, setActiveTab] = useState("general");
  const [configState, setConfigState] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (gameConfig) {
      // Create a deep copy to edit
      setConfigState(JSON.parse(JSON.stringify(gameConfig)));
    }
  }, [gameConfig, isOpen]);

  if (!isOpen || !configState) return null;

  const handleNestedChange = (path, value) => {
    setConfigState((prev) => {
      const copy = { ...prev };
      let current = copy;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = Number(value);
      return copy;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateConfig(configState);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to update configuration: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm("CRITICAL WARNING: This will completely wipe all game state, delete all logs, reset teams to default names, cash, and reset market prices to original values. This action CANNOT be undone. Are you absolutely sure?")) {
      setIsResetting(true);
      try {
        await resetDatabaseToDefaults();
        alert("Game database has been reset to defaults.");
        onClose();
      } catch (err) {
        console.error(err);
        alert("Reset failed: " + err.message);
      } finally {
        setIsResetting(false);
      }
    }
  };

  const priceItems = [
    { key: "empL1", label: "Employee Level 1" },
    { key: "empL2", label: "Employee Level 2" },
    { key: "empL3", label: "Employee Level 3" },
    { key: "desk", label: "Desk" },
    { key: "tv", label: "TV (Type 1 Support)" },
    { key: "couch", label: "Couch (Type 2 Support)" },
    { key: "computer", label: "Computer (Type 3 Support)" },
    { key: "cert1", label: "Certificate Level 1" },
    { key: "cert2", label: "Certificate Level 2" },
    { key: "cert3", label: "Certificate Level 3" },
    { key: "cert4", label: "Certificate Level 4" },
    { key: "cert5", label: "Certificate Level 5" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-6 bg-slate-900/50 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-sans">Admin Settings & Economics</h2>
              <p className="text-sm text-slate-400">Customize variables, certificate capacities, item inflation prices, and system tools.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 overflow-x-auto scrollbar-thin">
          <button
            onClick={() => setActiveTab("general")}
            className={`border-b-2 py-3 px-4 text-sm font-semibold tracking-wide transition-all ${
              activeTab === "general"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            General & Limits
          </button>
          <button
            onClick={() => setActiveTab("market1")}
            className={`border-b-2 py-3 px-4 text-sm font-semibold tracking-wide transition-all ${
              activeTab === "market1"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Market 1 Prices
          </button>
          <button
            onClick={() => setActiveTab("market2")}
            className={`border-b-2 py-3 px-4 text-sm font-semibold tracking-wide transition-all ${
              activeTab === "market2"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Market 2 Prices
          </button>
          <button
            onClick={() => setActiveTab("market3")}
            className={`border-b-2 py-3 px-4 text-sm font-semibold tracking-wide transition-all ${
              activeTab === "market3"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Market 3 Prices
          </button>
          <button
            onClick={() => setActiveTab("danger")}
            className={`border-b-2 py-3 px-4 text-sm font-semibold tracking-wide transition-all ${
              activeTab === "danger"
                ? "border-rose-500 text-rose-400 bg-rose-500/5"
                : "border-transparent text-slate-400 hover:text-rose-400/80"
            }`}
          >
            Danger Zone
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "general" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* General Settings */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-5 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Users className="h-4 w-4 text-indigo-400" />
                  General Constants
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Starting Cash ($)</label>
                    <input
                      type="number"
                      value={configState.startingCash}
                      onChange={(e) => handleNestedChange(["startingCash"], e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Max Firm Employee Limit</label>
                    <input
                      type="number"
                      value={configState.maxEmployees}
                      onChange={(e) => handleNestedChange(["maxEmployees"], e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Case Revenues */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-5 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                  <DollarSign className="h-4 w-4 text-indigo-400" />
                  Case Revenues ($)
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Type 1 Case Revenue</label>
                    <input
                      type="number"
                      value={configState.caseRevenues.type1}
                      onChange={(e) => handleNestedChange(["caseRevenues", "type1"], e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Type 2 Case Revenue</label>
                    <input
                      type="number"
                      value={configState.caseRevenues.type2}
                      onChange={(e) => handleNestedChange(["caseRevenues", "type2"], e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Type 3 Case Revenue</label>
                    <input
                      type="number"
                      value={configState.caseRevenues.type3}
                      onChange={(e) => handleNestedChange(["caseRevenues", "type3"], e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Certificate Limits */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-5 md:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Award className="h-4 w-4 text-indigo-400" />
                  Certificate Level Capacity Limits (Cases/Market)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <div key={lvl}>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Level {lvl}</label>
                      <input
                        type="number"
                        value={configState.certLimits[lvl]}
                        onChange={(e) => handleNestedChange(["certLimits", lvl.toString()], e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none text-center"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab.startsWith("market") && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-5 space-y-4 animate-fadeIn">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex justify-between items-center">
                <span>{activeTab === "market1" ? "Market 1 Prices" : activeTab === "market2" ? "Market 2 Prices" : "Market 3 Prices"}</span>
                <span className="text-xs text-slate-400 capitalize font-medium italic">Adjust inflation values</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {priceItems.map((item) => (
                  <div key={item.key} className="flex flex-col">
                    <label className="text-xs font-medium text-slate-400 mb-1.5">{item.label}</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-sm">$</span>
                      <input
                        type="number"
                        value={configState.prices[activeTab][item.key] || 0}
                        onChange={(e) => handleNestedChange(["prices", activeTab, item.key], e.target.value)}
                        className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-sm text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "danger" && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-6 space-y-4 animate-fadeIn">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-rose-500/10 p-3 text-rose-400">
                  <ShieldAlert className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-rose-400">Danger Zone: Factory Reset</h3>
                  <p className="text-sm text-slate-400">
                    Executing a factory reset restores the game database to default. It resets the round to Market 1, reinstates default prices and certificate capabilities, clears history logs, and sets cash to standard configured values ($15,000) for all 8 firms.
                  </p>
                </div>
              </div>

              <div className="border-t border-rose-500/10 pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isResetting}
                  className="flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 text-sm font-semibold active:scale-95 transition shadow-lg shadow-rose-600/10 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isResetting ? "animate-spin" : ""}`} />
                  Factory Reset Game Database
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-800 p-6 bg-slate-900/50 backdrop-blur flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700 active:scale-95 transition"
          >
            Cancel
          </button>
          {activeTab !== "danger" && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 active:scale-95 transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              <Settings className="h-4 w-4" />
              Save Configuration
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
