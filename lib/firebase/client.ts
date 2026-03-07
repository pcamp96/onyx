import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

interface ClientEnv {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  measurementId?: string;
}

export function getFirebaseClient(config: ClientEnv) {
  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  return {
    app,
    auth: getAuth(app),
  };
}
