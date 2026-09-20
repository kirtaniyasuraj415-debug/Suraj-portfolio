import appletConfig from "../firebase-applet-config.json";

export interface FirebaseAppConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId?: string;
  databaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
  oAuthClientId?: string;
}

export const firebaseConfig = {
  projectId: appletConfig.projectId,
  appId: appletConfig.appId,
  apiKey: appletConfig.apiKey,
  authDomain: appletConfig.authDomain,
  firestoreDatabaseId: appletConfig.firestoreDatabaseId || "(default)",
  databaseId: appletConfig.firestoreDatabaseId || "(default)",
  storageBucket: appletConfig.storageBucket,
  messagingSenderId: appletConfig.messagingSenderId,
  measurementId: appletConfig.measurementId,
  oAuthClientId: appletConfig.oAuthClientId,
};
