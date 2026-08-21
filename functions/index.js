const admin = require('firebase-admin');
admin.initializeApp();
const coaching = require('./coaching');
exports.createCoachingRequest = coaching.createCoachingRequest;
exports.acceptCoachingRequest = coaching.acceptCoachingRequest;
exports.completeCoachingRequest = coaching.completeCoachingRequest;
exports.declineCoachingRequest = coaching.declineCoachingRequest;
exports.cancelCoachingRequest = coaching.cancelCoachingRequest;
