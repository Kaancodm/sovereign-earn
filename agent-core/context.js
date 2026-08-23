"use strict";

const DATA_CLASSES = Object.freeze(["model_visible", "model_restricted", "core_only"]);
function requireString(value, field) { if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${field} is required`); return value.trim(); }
function createContextManifest(input = {}) {
  const required = ["contextVersion", "runId", "agentId", "sessionMode", "architectureVersion", "policyVersion", "flowVersion", "workspaceMapVersion"];
  for (const field of required) requireString(input[field], field);
  const classification = input.dataClassification || {};
  for (const value of Object.values(classification)) if (!DATA_CLASSES.includes(value)) throw new TypeError("dataClassification value is invalid");
  return Object.freeze({
    contextVersion: input.contextVersion, runId: input.runId, agentId: input.agentId, sessionMode: input.sessionMode,
    architectureVersion: input.architectureVersion, policyVersion: input.policyVersion, flowVersion: input.flowVersion,
    skillVersions: Object.freeze([...(input.skillVersions || [])]), workspaceMapVersion: input.workspaceMapVersion,
    artifactRefs: Object.freeze([...(input.artifactRefs || [])]), dataClassification: Object.freeze({ ...classification }),
  });
}
module.exports = { DATA_CLASSES, createContextManifest };
