import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, onValue, set, update, push, remove } from "firebase/database";
import { DEFAULT_CONFIG, DEFAULT_TEAMS } from "./defaults";

const STORAGE_KEY = "suits_firebase_config";

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
  window.location.reload();
}

export function clearFirebaseConfig() {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}

let app = null;
let db = null;

const firebaseConfig = getSavedFirebaseConfig();
const hasConfig = firebaseConfig && firebaseConfig.apiKey && (firebaseConfig.databaseURL || firebaseConfig.projectId);

if (hasConfig) {
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
  return db !== null;
}

export function listenToGameData(onData, onError) {
  if (!db) {
    if (onError) onError(new Error("Firebase is not initialized. Please configure database credentials."));
    return () => {};
  }
  const gameRef = ref(db, "suits-scoring");
  return onValue(gameRef, (snapshot) => {
    if (snapshot.exists()) {
      onData(snapshot.val());
    } else {
      // First time database is opened, seed defaults
      resetDatabaseToDefaults()
        .then(() => {
          // It will trigger onValue again
        })
        .catch((err) => {
          if (onError) onError(err);
        });
    }
  }, (error) => {
    if (onError) onError(error);
  });
}

export async function resetDatabaseToDefaults() {
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
  if (!db) throw new Error("Firebase not initialized");
  const teamRef = ref(db, `suits-scoring/teams/${teamId}`);
  await update(teamRef, updates);
}

export async function updateGameState(updates) {
  if (!db) throw new Error("Firebase not initialized");
  const stateRef = ref(db, "suits-scoring/gameState");
  await update(stateRef, {
    ...updates,
    lastUpdated: Date.now()
  });
}

export async function updateConfig(updates) {
  if (!db) throw new Error("Firebase not initialized");
  const configRef = ref(db, "suits-scoring/config");
  await update(configRef, updates);
}

export async function logActivity(message) {
  if (!db) return;
  const logsRef = ref(db, "suits-scoring/logs");
  await push(logsRef, {
    timestamp: Date.now(),
    message
  });
}
