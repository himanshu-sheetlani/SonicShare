const admin = require("firebase-admin");
const dotenv = require("dotenv");
dotenv.config();

try {
  const serviceAccount = {
    type: process.env.type,
    project_id: process.env.project_id,
    private_key_id: process.env.private_key_id,
    private_key: process.env.private_key,
    client_email: process.env.client_email,
    client_id: process.env.client_id,
    auth_uri: process.env.auth_uri,
    token_uri: process.env.token_uri,
    auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url,
    client_x509_cert_url: process.env.client_x509_cert_url,
    universe_domain: process.env.universe_domain,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "sonicshare-76500.appspot.com",
  });

  console.log("Firebase Admin credentials loaded successfully.");
} catch (error) {
  console.warn(
    "⚠️ Firebase Admin initialization failed! Please check if serviceAccountKey.json exists.",
  );
  console.warn("Error Details:", error.message);
}

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

module.exports = { admin, db, auth, storage };
