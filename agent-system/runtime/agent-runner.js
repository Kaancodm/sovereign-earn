const { evaluate } = require('./policy-engine');

/**
 * Minimal deterministic runtime coordinator.
 * Adapters for real plugins/tools are injected by the host application.
 */
class AgentRunner {
  constructor({ agents, capabilities, router, skillRegistry, execute }) {
    this.policies = { agents, capabilities };
    this.router = router;
    this.skillRegistry = skillRegistry;
    this.execute = execute;
  }

  route(task) {
    const text = `${task.objective || ''}`.toLowerCase();
    for (const route of this.router.routes || []) {
      if ((route.keywords || []).some((keyword) => text.includes(keyword.toLowerCase()))) {
        return { agent: route.agent, skill: route.default_skill, domain: route.domain };
      }
    }
    return this.router.default;
  }

  prepare(task) {
    if (!task?.task_id || !task?.objective) throw new Error('task_id and objective are required');
    const assignment = this.route(task);
    if (!this.policies.agents[assignment.agent]) throw new Error('unknown agent');
    if (!this.skillRegistry[assignment.skill]) throw new Error('unknown skill');
    return { ...task, ...assignment, status: 'planned' };
  }

  authorize(task, capability, approval = 'none') {
    return evaluate({
      agent: task.agent,
      capability,
      approval,
      policies: this.policies,
    });
  }

  async run(task, { capability, approval = 'none', input } = {}) {
    const prepared = this.prepare(task);
    const decision = this.authorize(prepared, capability, approval);
    if (decision.decision !== 'allow') {
      return {
        task_id: prepared.task_id,
        status: decision.decision === 'approval_required' ? 'needs_approval' : 'blocked',
        decision,
        agent: prepared.agent,
        skill: prepared.skill,
      };
    }

    if (typeof this.execute !== 'function') {
      throw new Error('No execution adapter configured');
    }

    const result = await this.execute({ task: prepared, capability, input });
    return {
      task_id: prepared.task_id,
      status: 'complete',
      agent: prepared.agent,
      skill: prepared.skill,
      capability,
      result,
    };
  }
}

module.exports = { AgentRunner };
