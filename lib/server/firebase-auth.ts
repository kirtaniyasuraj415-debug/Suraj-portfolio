import { GoogleAuth } from "google-auth-library";
import { firebaseConfig } from "../firebase-config";

let auth: GoogleAuth | undefined;

export async function getFirestoreAuthorization(): Promise<string | undefined> {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  const useDefault = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.K_SERVICE || process.env.FIREBASE_USE_ADC === "true";
  // Preserve existing rules-based deployments. A web API key alone does not grant write access.
  if (!serviceAccount && !useDefault) return undefined;
  if (!auth) {
    const credentials = serviceAccount ? JSON.parse(serviceAccount) : undefined;
    if (credentials && (credentials.type !== "service_account" || !credentials.client_email || !credentials.private_key)) {
      throw new Error("INVALID_FIREBASE_SERVER_CREDENTIALS");
    }
    auth = new GoogleAuth({
      projectId: firebaseConfig.projectId,
      scopes: ["https://www.googleapis.com/auth/datastore"],
      credentials: credentials ? { client_email: credentials.client_email, private_key: credentials.private_key.replace(/\\n/g, "\n") } : undefined,
    });
  }
  const token = await auth.getAccessToken();
  if (!token) throw new Error("FIREBASE_AUTH_UNAVAILABLE");
  return `Bearer ${token}`;
}
