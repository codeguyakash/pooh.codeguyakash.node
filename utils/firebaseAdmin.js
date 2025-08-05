const admin = require('firebase-admin');

const serviceAccount = {
  type: process.env.S_ACCOUNT_TYPE,
  project_id: process.env.S_PROJECT_ID,
  private_key_id: process.env.S_PRIVATE_KEY_ID,
  private_key: process.env.S_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.S_CLIENT_EMAIL,
  client_id: process.env.S_CLIENT_ID,
  auth_uri: process.env.S_AUTH_URI,
  token_uri: process.env.S_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.S_CLIENT_X509_CERT_URL,
  universe_domain: process.env.S_UNIVERSE_DOMAIN,
};
// console.log(serviceAccount);
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;
