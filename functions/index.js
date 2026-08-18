const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.healthCheck = functions.https.onRequest((req, res) => {
  res.status(200).json({
    ok: true,
    service: "sovereign-earn-functions"
  });
});
