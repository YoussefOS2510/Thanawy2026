import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, onValue, set, update, push, remove } from "firebase/database";
import { DEFAULT_CONFIG, DEFAULT_TEAMS } from "./defaults";

const STORAGE_KEY = "suits_firebase_config";
const DEMO_MODE_KEY = "suits_demo_mode";
const DEMO_DATA_KEY = "suits_demo_data";

export function getSavedFirebaseConfig() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse saved Firebase config", e);
    }
  }
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
  };
}

export function saveFirebaseConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  localStorage.setItem(DEMO_MODE_KEY, "false"); // Turn off demo mode if config saved
  window.location.reload();
}

export function clearFirebaseConfig() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem(DEMO_MODE_KEY, "false");
  localStorage.removeItem(DEMO_DATA_KEY);
  window.location.reload();
}

// Demo Mode Helpers
export function isDemoMode() {
  return localStorage.getItem(DEMO_MODE_KEY) === "true";
}

export function setDemoMode(active) {
  localStorage.setItem(DEMO_MODE_KEY, active ? "true" : "false");
  if (active) {
    // Initialize default data for demo
    const initialTeamsObj = {};
    DEFAULT_TEAMS.forEach(team => {
      initialTeamsObj[team.id] = team;
    });
    const defaultData = {
      config: DEFAULT_CONFIG,
      gameState: {
        currentMarket: 1,
        isGameOver: false,
        lastUpdated: Date.now()
      },
      teams: initialTeamsObj,
      logs: {
        system: {
          timestamp: Date.now(),
          message: "Demo session started. Storing game state locally."
        }
      }
    };
    localStorage.setItem(DEMO_DATA_KEY, JSON.stringify(defaultData));
  } else {
    localStorage.removeItem(DEMO_DATA_KEY);
  }
  window.location.reload();
}

let app = null;
let db = null;

const firebaseConfig = getSavedFirebaseConfig();
const hasConfig = firebaseConfig && firebaseConfig.apiKey && (firebaseConfig.databaseURL || firebaseConfig.projectId);
const isDemo = isDemoMode();

if (hasConfig && !isDemo) {
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    db = getDatabase(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

export { db };

export function isFirebaseConnected() {
  return db !== null || isDemo;
}

// Local storage listeners list for Demo Mode
let demoListeners = [];

function notifyDemoListeners(data) {
  demoListeners.forEach(listener => listener(data));
}

function getDemoData() {
  const data = localStorage.getItem(DEMO_DATA_KEY);
  return data ? JSON.parse(data) : null;
}

function saveDemoData(data) {
  localStorage.setItem(DEMO_DATA_KEY, JSON.stringify(data));
  notifyDemoListeners(data);
}

export function listenToGameData(onData, onError) {
  if (isDemo) {
    let data = getDemoData();
    if (!data) {
      // Seed default data if not present
      const initialTeamsObj = {};
      DEFAULT_TEAMS.forEach(team => {
        initialTeamsObj[team.id] = team;
      });
      data = {
        config: DEFAULT_CONFIG,
        gameState: {
          currentMarket: 1,
          isGameOver: false,
          lastUpdated: Date.now()
        },
        teams: initialTeamsObj,
        logs: {
          system: {
            timestamp: Date.now(),
            message: "Demo session initialized."
          }
        }
      };
      saveDemoData(data);
    }
    
    onData(data);
    demoListeners.push(onData);
    
    return () => {
      demoListeners = demoListeners.filter(l => l !== onData);
    };
  }

  if (!db) {
    if (onError) onError(new Error("Firebase is not initialized. Please configure database credentials."));
    return () => {};
  }
  const gameRef = ref(db, "suits-scoring");
  return onValue(gameRef, (snapshot) => {
    if (snapshot.exists()) {
      onData(snapshot.val());
    } else {
      resetDatabaseToDefaults()
        .then(() => {})
        .catch((err) => {
          if (onError) onError(err);
        });
    }
  }, (error) => {
    if (onError) onError(error);
  });
}

export async function resetDatabaseToDefaults() {
  if (isDemo) {
    const initialTeamsObj = {};
    DEFAULT_TEAMS.forEach(team => {
      initialTeamsObj[team.id] = team;
    });
    const defaultData = {
      config: DEFAULT_CONFIG,
      gameState: {
        currentMarket: 1,
        isGameOver: false,
        lastUpdated: Date.now()
      },
      teams: initialTeamsObj,
      logs: {
        system: {
          timestamp: Date.now(),
          message: "Demo session reset."
        }
      }
    };
    saveDemoData(defaultData);
    return;
  }

  if (!db) throw new Error("Firebase not initialized");
  
  const initialTeamsObj = {};
  DEFAULT_TEAMS.forEach(team => {
    initialTeamsObj[team.id] = team;
  });

  const defaultData = {
    config: DEFAULT_CONFIG,
    gameState: {
      currentMarket: 1,
      isGameOver: false,
      lastUpdated: Date.now()
    },
    teams: initialTeamsObj,
    logs: {
      system: {
        timestamp: Date.now(),
        message: "Game initialized and reset to defaults."
      }
    }
  };

  await set(ref(db, "suits-scoring"), defaultData);
}

export async function updateTeam(teamId, updates) {
  if (isDemo) {
    const data = getDemoData();
    if (data && data.teams && data.teams[teamId]) {
      data.teams[teamId] = {
        ...data.teams[teamId],
        ...updates
      };
      saveDemoData(data);
    }
    return;
  }

  if (!db) throw new Error("Firebase not initialized");
  const teamRef = ref(db, `suits-scoring/teams/${teamId}`);
  await update(teamRef, updates);
}

export async function updateGameState(updates) {
  if (isDemo) {
    const data = getDemoData();
    if (data) {
      data.gameState = {
        ...data.gameState,
        ...updates,
        lastUpdated: Date.now()
      };
      saveDemoData(data);
    }
    return;
  }

  if (!db) throw new Error("Firebase not initialized");
  const stateRef = ref(db, "suits-scoring/gameState");
  await update(stateRef, {
    ...updates,
    lastUpdated: Date.now()
  });
}

export async function updateConfig(updates) {
  if (isDemo) {
    const data = getDemoData();
    if (data) {
      data.config = {
        ...data.config,
        ...updates
      };
      saveDemoData(data);
    }
    return;
  }

  if (!db) throw new Error("Firebase not initialized");
  const configRef = ref(db, "suits-scoring/config");
  await update(configRef, updates);
}

export async function logActivity(message) {
  if (isDemo) {
    const data = getDemoData();
    if (data) {
      const logId = "log_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
      if (!data.logs) data.logs = {};
      data.logs[logId] = {
        timestamp: Date.now(),
        message
      };
      saveDemoData(data);
    }
    return;
  }

  if (!db) return;
  const logsRef = ref(db, "suits-scoring/logs");
  await push(logsRef, {
    timestamp: Date.now(),
    message
  });
}
