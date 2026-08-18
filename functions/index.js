/**
 * Sovereign Earn – Cloud Functions (Node 20)
 * Projekt: sovereign-bdb76
 */

const admin = require("firebase-admin");

admin.initializeApp();

// Sensei Coaching Flow
const coaching = require("./coaching");
exports.acceptCoachingRequest = coaching.acceptCoachingRequest;
exports.completeCoachingRequest = coaching.completeCoachingRequest;
exports.declineCoachingRequest = coaching.declineCoachingRequest;
exports.cancelCoachingRequest = coaching.cancelCoachingRequest;

// TODO: Bestehende Functions hier exportieren (Postbacks, Auszahlungen, askBuildAdvisor).
// Siehe Handover-Dokument: 07_Firebase_askBuildAdvisor_and_Sensei.js
