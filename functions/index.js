/**
 * Sovereign Earn – Cloud Functions (Node 22, Functions v2).
 * Zentraler Entrypoint für Build Advisor, Nutzerprofile und optionale Finanzpfade.
 *
 * Closed-beta safety: coaching/escrow, coins and offerwall postbacks are disabled
 * unless FINANCIALS_ENABLED is explicitly set to "true" in the deployment runtime.
 */

const admin = require("firebase-admin");
admin.initializeApp();

const FINANCIALS_ENABLED = process.env.FINANCIALS_ENABLED === "true";

const workai = require("./workai");
exports.askBuildAdvisor = workai.askBuildAdvisor;
exports.healthCheck = workai.healthCheck;

const users = require("./users");
exports.ensureUserProfile = users.ensureUserProfile;
exports.requestAccountDeletion = users.requestAccountDeletion;

if (FINANCIALS_ENABLED) {
  const coaching = require("./coaching");
  exports.acceptCoachingRequest = coaching.acceptCoachingRequest;
  exports.completeCoachingRequest = coaching.completeCoachingRequest;
  exports.declineCoachingRequest = coaching.declineCoachingRequest;
  exports.cancelCoachingRequest = coaching.cancelCoachingRequest;

  exports.createCoachingRequest = workai.createCoachingRequest;
  exports.updateSenseiProfile = workai.updateSenseiProfile;

  const postbacks = require("./postbacks");
  exports.pollfishPostbackV2 = postbacks.pollfishPostbackV2;
  exports.bitlabsPostbackV2 = postbacks.bitlabsPostbackV2;
}
