import React, { useState, useEffect } from "react";
import { listenToGameData, isFirebaseConnected, resetDatabaseToDefaults, isDemoMode, setDemoMode } from "./utils/db";
import { validateCaseInputs } from "./utils/capacity";

// Components
import TeamCard from "./components/TeamCard";
import Leaderboard from "./components/Leaderboard";
import LogPanel from "./components/LogPanel";
import FirebaseConfigModal from "./components/FirebaseConfigModal";
import AdminConfigModal from "./components/AdminConfigModal";
import TeamOverrideModal from "./components/TeamOverrideModal";
import MarketTransitionModal from "./components/MarketTransitionModal";

// Icons
import { Database, Settings, ArrowRight, Trophy, Sparkles, RefreshCw, Activity, Layers, HelpCircle, ShieldAlert, CloudUpload } from "lucide-react";

export default function App() {
  const [gameData, setGameData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal Open States
  const [isFirebaseOpen, setIsFirebaseOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [activeOverrideTeam, setActiveOverrideTeam] = useState(null);
  const [isTransitionOpen, setIsTransitionOpen] = useState(false);

  const isConnected = isFirebaseConnected();

  useEffect(() => {
    if (!isConnected) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = listenToGameData(
      (data) => {
        setGameData(data);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("Database connection error:", err);
        setError(err.message || "Failed to load database. Please check your credentials.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isConnected]);

  // Factory reset action for starting a new game when game is over or in-progress
  const handleResetGame = async () => {
    if (window.confirm("Are you sure you want to reset the current game and start a new session?")) {
      try {
        setLoading(true);
        await resetDatabaseToDefaults();
        alert("Game has been reset.");
      } catch (err) {
        alert("Reset failed: " + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Run validation on all teams to check for transition readiness
  const getValidationErrorsCount = () => {
    if (!gameData || !gameData.teams) return 0;
    let errorsCount = 0;
    Object.values(gameData.teams).forEach((team) => {
      const validation = validateCaseInputs(team.assets, gameData.config.certLimits, team.casesLogged);
      if (!validation.isValid) errorsCount++;
    });
    return errorsCount;
  };

  const handleTransitionClick = () => {
    const errorCount = getValidationErrorsCount();
    if (errorCount > 0) {
      alert(`Cannot advance market. There are capacity validation errors in ${errorCount} teams' logged cases. Please correct them first!`);
      return;
    }
    setIsTransitionOpen(true);
  };

  // Convert teams object to sorted array by id for consistent display order
  const teamsList = gameData && gameData.teams
    ? Object.values(gameData.teams).sort((a, b) => a.id.localeCompare(b.id))
    : [];

  const currentMarket = gameData?.gameState?.currentMarket || 1;
  const isGameOver = gameData?.gameState?.isGameOver || false;



  // Loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
        <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-400 font-mono tracking-wider">LOADING SYSTEM ARCHITECTURE...</p>
      </div>
    );
  }

  // Database Connection Error view
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-100">
        <div className="max-w-md rounded-2xl border border-rose-500/20 bg-rose-500/5 p-8 shadow-2xl space-y-6">
          <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Database Sync Interrupted</h2>
          <pre className="text-xs bg-slate-950 p-4 rounded-lg border border-slate-800 text-rose-400 overflow-x-auto text-left leading-relaxed">
            {error}
          </pre>
          <div className="flex gap-4">
            <button
              onClick={() => setIsFirebaseOpen(true)}
              className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition"
            >
              Reconfigure
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 transition"
            >
              Retry Connection
            </button>
          </div>
        </div>
        <FirebaseConfigModal isOpen={isFirebaseOpen} onClose={() => setIsFirebaseOpen(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-slate-950 to-slate-950 z-0 pointer-events-none" />

      {/* Main Header */}
      <header className="relative z-10 border-b border-slate-900 bg-slate-900/40 backdrop-blur-md px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-400 border border-indigo-500/25">
            <Trophy className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wide uppercase flex items-center gap-2">
              Suits Scoring <span className="text-indigo-400 font-normal text-sm lowercase border border-indigo-500/25 px-2 py-0.5 rounded-full bg-indigo-500/5">score tracker</span>
            </h1>
            <p className="text-xs text-slate-400">Interactive Game Master Dashboard for 8 Legal Firms</p>
          </div>
        </div>

        {/* Global Action controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status badge */}
          {isDemoMode() ? (
            <div className="flex items-center gap-1.5 bg-amber-500/5 border border-amber-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              Demo Mode (Offline)
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-emerald-500/5 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Syncing
            </div>
          )}

          <button
            onClick={() => setIsFirebaseOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3  py-1.5 text-xs font-semibold text-slate-350 hover:text-white transition active:scale-95"
            title="Configure database server"
          >
            <Database className="h-4 w-4" />
            Database Config
          </button>

          <button
            onClick={() => setIsAdminOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3  py-1.5 text-xs font-semibold text-slate-350 hover:text-white transition active:scale-95"
            title="Configure item prices"
          >
            <Settings className="h-4 w-4" />
            Game settings
          </button>

          {isGameOver ? (
            <button
              onClick={handleResetGame}
              className="flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 px-4 py-1.5 text-xs font-bold text-white transition active:scale-95 shadow-lg shadow-rose-600/15"
            >
              <RefreshCw className="h-4 w-4" />
              New Game Session
            </button>
          ) : (
            <button
              onClick={handleTransitionClick}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 text-xs font-bold text-white transition active:scale-95 shadow-lg shadow-indigo-600/25"
            >
              {currentMarket === 3 ? "Finalize Game" : `Start Market ${currentMarket + 1}`}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Grid Body */}
      <main className="relative z-10 flex-1 p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
        
        {/* Teams Dashboard View (Columns 1-3) */}
        <div className="lg:col-span-3 space-y-6 flex flex-col">
          {/* Active Market Info Header */}
          <div className="flex items-center justify-between bg-slate-900/25 border border-slate-850 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500/10 p-2 rounded-lg text-indigo-400">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Active Phase</span>
                <span className="text-lg font-black text-white">
                  {isGameOver ? "GAME COMPLETED" : `Market ${currentMarket} Active`}
                </span>
              </div>
            </div>
            
            {/* Status alerts */}
            {!isGameOver && (
              <div className="text-right">
                {getValidationErrorsCount() > 0 ? (
                  <span className="text-xs font-semibold bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg text-rose-400">
                    {getValidationErrorsCount()} Teams have capacity warnings
                  </span>
                ) : (
                  <span className="text-xs font-semibold bg-slate-850 px-3 py-1.5 rounded-lg text-slate-450">
                    Ready to advance round
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 8-Team Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 flex-1 overflow-y-auto max-h-[75vh] scrollbar-thin">
            {teamsList.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                config={gameData.config}
                currentMarket={currentMarket}
                onOverride={setActiveOverrideTeam}
              />
            ))}
          </div>
        </div>

        {/* Standings & History Audit Panel (Column 4) */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="flex-1 flex flex-col justify-between gap-6">
            {/* Leaderboard Panel */}
            <div className="flex-1">
              <Leaderboard teams={teamsList} config={gameData.config} />
            </div>
            
            {/* Activity Logs Terminal */}
            <div className="h-[280px]">
              <LogPanel logs={gameData.logs} />
            </div>
          </div>
        </div>

      </main>

      {/* Footer copyright */}
      <footer className="relative z-10 border-t border-slate-900/60 bg-slate-950/80 px-6 py-3 text-center text-[10px] font-mono text-slate-500">
        Suits Score Calculator v1.2.0 • Firebase Realtime DB Engine • Antigravity AI
      </footer>

      {/* Modals Container */}
      <FirebaseConfigModal
        isOpen={isFirebaseOpen}
        onClose={() => setIsFirebaseOpen(false)}
      />
      <AdminConfigModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        gameConfig={gameData?.config}
      />
      <TeamOverrideModal
        isOpen={activeOverrideTeam !== null}
        onClose={() => setActiveOverrideTeam(null)}
        team={activeOverrideTeam}
      />
      <MarketTransitionModal
        isOpen={isTransitionOpen}
        onClose={() => setIsTransitionOpen(false)}
        teams={teamsList}
        config={gameData?.config}
        currentMarket={currentMarket}
      />
    </div>
  );
}
