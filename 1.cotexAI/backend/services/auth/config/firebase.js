import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import serviceAccount from "../serviceAccountKey.json" with { type: "json" };

const firebaseApp = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert(serviceAccount)
    });

const adminAuth = getAuth(firebaseApp);

export { firebaseApp, adminAuth };
export default adminAuth;