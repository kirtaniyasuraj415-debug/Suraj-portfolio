import type { Analytics } from "firebase/analytics";
import { firebaseConfig } from "./firebase-config";
export { firebaseConfig } from "./firebase-config";

let analyticsPromise: Promise<Analytics | null> | undefined;

// Optional analytics must never prevent the enquiry form from hydrating.
export async function getClientAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;
  analyticsPromise ??= (async () => {
    try {
      const [{ initializeApp, getApps, getApp }, { getAnalytics, isSupported }] = await Promise.all([
        import("firebase/app"),
        import("firebase/analytics"),
      ]);
      if (!(await isSupported())) return null;
      const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
      return getAnalytics(app);
    } catch {
      return null;
    }
  })();
  return analyticsPromise;
}
