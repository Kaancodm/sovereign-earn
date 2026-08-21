/**
 * Sovereign Earn – Cloud Functions (Node 22, Functions v2).
 * Zentraler Entrypoint für Coaching, WorkAI, Nutzerprofile und Postbacks.
 */

const admin = require("firebase-admin");
admin.initializeApp();

const coaching = require("./coaching");
exports.acceptCoachingRequest = coaching.acceptCoachingRequest;
exports.completeCoachingRequest = coaching.completeCoachingRequest;
exports.declineCoachingRequest = coaching.declineCoachingRequest;
exports.cancelCoachingRequest = coaching.cancelCoachingRequest;

const workai = require("./workai");
exports.createCoachingRequest = workai.createCoachingRequest;
exports.askBuildAdvisor = workai.askBuildAdvisor;
exports.updateSenseiProfile = workai.updateSenseiProfile;
exports.healthCheck = workai.healthCheck;

const users = require("./users");
exports.ensureUserProfile = users.ensureUserProfile;
exports.requestAccountDeletion = users.requestAccountDeletion;

const postbacks = require("./postbacks");
exports.pollfishPostbackV2 = postbacks.pollfishPostbackV2;
exports.bitlabsPostbackV2 = postbacks.bitlabsPostbackV2;
