"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { Orchestrator } = require("../../agent-core/orchestrator");
const { ApprovalStore } = require("../../agent-core/approval");
const { AuditLog } = require("../../agent-core/audit");
const { clearRegistriesForTests, registerAgent, registerSkill, registerTool } = require("../../agent-core/registry");
const { createProductAdapter } = require("./index");

test.beforeEach(() => clearRegistriesForTests());

test("exposes registry metadata without tool executors", () => {
  registerAgent({ id: "agent-1", name: "Agent One" });
  registerSkill({ id: "skill-1", allowedAgents: ["agent-1"] });
  registerTool({ skillId: "skill-1", capability: "video", action: "publish", name: "Publish", execute: async () => "secret" });

  const adapter = createProductAdapter({ orchestrator: new Orchestrator() });
  const tools = adapter.tools.list();
  assert.equal(tools.length, 1);
  assert.deepEqual(tools[0], { skillId: "skill-1", capability: "video", action: "publish", name: "Publish" });
  assert.equal("execute" in tools[0], false);
});

test("approval mutations route through orchestrator audit", () => {
  const auditLog = new AuditLog();
  const approvalStore = new ApprovalStore();
  const orchestrator = new Orchestrator({ auditLog, approvalStore });
  const adapter = createProductAdapter({ orchestrator });
  const approval = approvalStore.create({ runId: "run-1", agentId: "agent-1", toolCallId: "call-1", skillId: "skill-1", capability: "video", action: "publish", args: {}, requestedBy: "agent-1", expiresAt: new Date(Date.now() + 60000).toISOString() });

  adapter.approvals.approve(approval.approvalId, "co-pilot");
  assert.equal(adapter.approvals.get(approval.approvalId).state, "approved");
  assert.equal(adapter.audit.listByRun("run-1").at(-1).type, "approval.approved");
});
