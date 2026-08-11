import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, onValue, set, update, push } from "firebase/database";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import { DEFAULT_CONFIG, DEFAULT_TEAMS } from "./defaults";

const STORAGE_KEY = "suits_firebase_config";
const DEMO_MODE_KEY = "suits_demo_mode";
const DEMO_DATA_KEY = "suits_demo_data";

export function getSavedFirebaseConfig() {
  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
  };

  // If .env config exists, prioritize .env
  if (envConfig.apiKey && (envConfig.projectId || envConfig.databaseURL)) {
    return envConfig;
  }

  const savedStr = localStorage.getItem(STORAGE_KEY);
  if (savedStr) {
    try {
      const saved = JSON.parse(savedStr);
      return {
        apiKey: saved.apiKey || envConfig.apiKey,
        authDomain: saved.authDomain || envConfig.authDomain,
        databaseURL: saved.databaseURL || envConfig.databaseURL,
        projectId: saved.projectId || envConfig.projectId,
        storageBucket: saved.storageBucket || envConfig.storageBucket,
        messagingSenderId: saved.messagingSenderId || envConfig.messagingSenderId,
        appId: saved.appId || envConfig.appId,
      };
    } catch (e) {
      console.error("Failed to parse saved Firebase config", e);
    }
  }
  return envConfig;
}

export function saveFirebaseConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  localStorage.setItem(DEMO_MODE_KEY, "false");
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
let firestoreDb = null;

const firebaseConfig = getSavedFirebaseConfig();
const hasConfig = firebaseConfig && firebaseConfig.apiKey && (firebaseConfig.projectId || firebaseConfig.databaseURL);
const isDemo = isDemoMode();

if (hasConfig && !isDemo) {
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }

    if (firebaseConfig.databaseURL) {
      db = getDatabase(app);
      console.log("[Firebase] Realtime Database initialized:", firebaseConfig.databaseURL);
    }

    if (firebaseConfig.projectId) {
      firestoreDb = getFirestore(app);
      console.log("[Firebase] Cloud Firestore initialized:", firebaseConfig.projectId);
    }
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

export { db, firestoreDb };

export function isFirebaseConnected() {
  return db !== null || firestoreDb !== null || isDemo;
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

  // Primary: Listen via Cloud Firestore
  if (firestoreDb) {
    return listenToFirestore(onData, onError);
  }

  // Fallback: Listen via Realtime Database
  if (db) {
    return listenToRTDB(onData, onError);
  }

  if (onError) onError(new Error("Firebase is not initialized. Please check your .env credentials."));
  return () => {};
}

function listenToRTDB(onData, onError) {
  const gameRef = ref(db, "suits-scoring");
  return onValue(gameRef, (snapshot) => {
    if (snapshot.exists()) {
      onData(snapshot.val());
    } else {
      console.log("[RTDB] No data at suits-scoring node. Initializing default game state...");
      resetDatabaseToDefaults()
        .then(() => {})
        .catch((err) => {
          console.error("RTDB Auto-initialization reset error:", err);
          if (onError) onError(err);
        });
    }
  }, (error) => {
    console.error("RTDB Subscription error:", error);
    if (onError) onError(error);
  });
}

function listenToFirestore(onData, onError) {
  const gameDocRef = doc(firestoreDb, "suits-scoring", "game");
  return onSnapshot(
    gameDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onData(docSnap.data());
      } else {
        console.log("[Firestore] No document found at suits-scoring/game. Initializing default data...");
        resetDatabaseToDefaults()
          .then(() => {})
          .catch((err) => {
            console.error("Firestore Auto-initialization reset error:", err);
            if (onError) onError(err);
          });
      }
    },
    (error) => {
      console.error("Firestore subscription error:", error);
      if (onError) onError(error);
    }
  );
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

  if (!db && !firestoreDb) throw new Error("Firebase is not initialized");

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

  if (db) {
    console.log("[RTDB] Writing default data to Realtime Database node 'suits-scoring'...");
    await set(ref(db, "suits-scoring"), defaultData);
    console.log("[RTDB] Successfully initialized Realtime Database!");
  }

  if (firestoreDb) {
    console.log("[Firestore] Writing default data to Cloud Firestore document 'suits-scoring/game'...");
    await setDoc(doc(firestoreDb, "suits-scoring", "game"), defaultData);
    console.log("[Firestore] Successfully initialized Firestore!");
  }
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

  if (!db && !firestoreDb) throw new Error("Firebase is not initialized");

  if (db) {
    console.log(`[RTDB] Updating team ${teamId} in Realtime Database...`);
    const teamRef = ref(db, `suits-scoring/teams/${teamId}`);
    await update(teamRef, updates);
    console.log(`[RTDB] Successfully updated team ${teamId}!`);
  }

  if (firestoreDb) {
    console.log(`[Firestore] Updating team ${teamId} in Cloud Firestore...`);
    await setDoc(doc(firestoreDb, "suits-scoring", "game"), {
      teams: {
        [teamId]: updates
      }
    }, { merge: true });
    console.log(`[Firestore] Successfully updated team ${teamId}!`);
  }
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

  if (!db && !firestoreDb) throw new Error("Firebase is not initialized");

  const payload = {
    ...updates,
    lastUpdated: Date.now()
  };

  if (db) {
    const stateRef = ref(db, "suits-scoring/gameState");
    await update(stateRef, payload);
  }

  if (firestoreDb) {
    await setDoc(doc(firestoreDb, "suits-scoring", "game"), { gameState: payload }, { merge: true });
  }
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

  if (!db && !firestoreDb) throw new Error("Firebase is not initialized");

  if (db) {
    const configRef = ref(db, "suits-scoring/config");
    await update(configRef, updates);
  }

  if (firestoreDb) {
    await setDoc(doc(firestoreDb, "suits-scoring", "game"), { config: updates }, { merge: true });
  }
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

  if (!db && !firestoreDb) return;

  const logId = "log_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
  const logEntry = {
    timestamp: Date.now(),
    message
  };

  if (db) {
    try {
      const logsRef = ref(db, "suits-scoring/logs");
      await push(logsRef, logEntry);
    } catch (e) {
      console.warn("RTDB logActivity error:", e);
    }
  }

  if (firestoreDb) {
    try {
      await setDoc(doc(firestoreDb, "suits-scoring", "game"), {
        logs: {
          [logId]: logEntry
        }
      }, { merge: true });
    } catch (e) {
      console.warn("Firestore logActivity error:", e);
    }
  }
}
