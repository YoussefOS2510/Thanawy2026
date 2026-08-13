import React, { useState } from "react";
import { getSavedFirebaseConfig, saveFirebaseConfig, clearFirebaseConfig, isFirebaseConnected, resetDatabaseToDefaults } from "../utils/db";
import { Database, Save, Trash2, X, Send } from "lucide-react";

export default function FirebaseConfigModal({ isOpen, onClose }) {
  const [config, setConfig] = useState(getSavedFirebaseConfig());
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const isConnected = isFirebaseConnected();

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleForceSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      await resetDatabaseToDefaults();
      alert("Successfully written initial data to Cloud Firestore! Check your Firebase console under collection 'suits-scoring'.");
    } catch (err) {
      console.error(err);
      setError("Firestore write failed: " + (err.message || err));
      alert("Firestore Sync Error: " + (err.message || err));
    } finally {
      setSyncing(false);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!config.apiKey) {
      setError("API Key is required.");
      return;
    }
    if (!config.databaseURL && !config.projectId) {
      setError("Either Database URL or Project ID is required.");
      return;
    }
    setError(null);
    saveFirebaseConfig(config);
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear the Firebase configuration? This will reset the app connection.")) {
      clearFirebaseConfig();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl transition-all">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
          <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Firebase Database Setup</h2>
            <p className="text-sm text-slate-400">Configure your Firebase connection for real-time synchronization.</p>
          </div>
        </div>

        <div className="mb-4">
          <div className={`flex items-center gap-2 rounded-lg p-3 text-sm font-medium ${
            isConnected 
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
              : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
          }`}>
            <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            {isConnected 
              ? "Connected to Firebase Realtime Database" 
              : "Database not connected. Please enter configuration."}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              API Key <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="apiKey"
              value={config.apiKey}
              onChange={handleChange}
              placeholder="AIzaSy..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Database URL <span className="text-slate-500">(Recommended)</span>
              </label>
              <input
                type="url"
                name="databaseURL"
                value={config.databaseURL}
                onChange={handleChange}
                placeholder="https://your-app-default-rtdb.firebaseio.com"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Project ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="projectId"
                value={config.projectId}
                onChange={handleChange}
                placeholder="your-project-id"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                required
              />
            </div>
          </div>

          <details className="group">
            <summary className="flex cursor-pointer items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider select-none hover:text-white py-1">
              <span>Advanced Config (Auth / App IDs)</span>
              <span className="transition group-open:rotate-180">
                <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" className="h-4 w-4 text-slate-400"><path d="M6 9l6 6 6-6"></path></svg>
              </span>
            </summary>
            <div className="mt-4 space-y-4 border-t border-slate-800/50 pt-4 animate-slideDown">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Auth Domain</label>
                  <input
                    type="text"
                    name="authDomain"
                    value={config.authDomain || ""}
                    onChange={handleChange}
                    placeholder="your-project-id.firebaseapp.com"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-white placeholder-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">App ID</label>
                  <input
                    type="text"
                    name="appId"
                    value={config.appId || ""}
                    onChange={handleChange}
                    placeholder="1:1234567890:web:abcdef"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-white placeholder-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Storage Bucket</label>
                  <input
                    type="text"
                    name="storageBucket"
                    value={config.storageBucket || ""}
                    onChange={handleChange}
                    placeholder="your-project-id.appspot.com"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-white placeholder-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Messaging Sender ID</label>
                  <input
                    type="text"
                    name="messagingSenderId"
                    value={config.messagingSenderId || ""}
                    onChange={handleChange}
                    placeholder="1234567890"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-white placeholder-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </details>

          <div className="flex gap-3 border-t border-slate-800 pt-5 mt-6 justify-between flex-wrap">
            <div className="flex gap-2">
              {isConnected && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 active:scale-95 transition"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Local Storage
                </button>
              )}
              <button
                type="button"
                onClick={handleForceSync}
                disabled={syncing}
                className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {syncing ? "Writing to Firebase..." : "Force Seed Firebase Database"}
              </button>
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700 active:scale-95 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 active:scale-95 transition shadow-lg shadow-indigo-600/20 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <Save className="h-4 w-4" />
                Save & Initialize
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
