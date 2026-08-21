/**
 * Sovereign Earn – Cloud Functions (Node 20, Functions v2)
 * Zentraler Entrypoint: konsolidiert alle Module.
 *
 *  coaching  – Sensei-Coaching-Escrow (accept/complete/decline/cancel)
 *  workai    – Build-Advisor (A2A), Sensei-Profil, Coaching-Requests
 *  users     – Profil-Erstellung, DSGVO-Löschung
 *  postbacks – Offerwall-Postbacks (Pollfish/BitLabs, HMAC-validiert)
 */

const admin = require("firebase-admin");

admin.initializeApp();

// Sensei-Coaching-Flow (Escrow)
const coaching = require("./coaching");
exports.acceptCoachingRequest = coaching.acceptCoachingRequest;
exports.completeCoachingRequest = coaching.completeCoachingRequest;
exports.declineCoachingRequest = coaching.declineCoachingRequest;
exports.cancelCoachingRequest = coaching.cancelCoachingRequest;

// WorkAI A2A + Sensei-Profil + Coaching-Request-Erstellung
const workai = require("./workai");
exports.createCoachingRequest = workai.createCoachingRequest;
exports.askBuildAdvisor = workai.askBuildAdvisor;
exports.updateSenseiProfile = workai.updateSenseiProfile;
exports.healthCheck = workai.healthCheck;

// Nutzerprofile + DSGVO
const users = require("./users");
exports.ensureUserProfile = users.ensureUserProfile;
exports.requestAccountDeletion = users.requestAccountDeletion;

// Offerwall-Postbacks (HMAC-SHA256 + Idempotenz)
const postbacks = require("./postbacks");
exports.pollfishPostback = postbacks.pollfishPostback;
exports.bitlabsPostback = postbacks.bitlabsPostback;
