'use strict';

function createPolicyEvaluator(entries = []) {
  const rules = entries.map((entry, index) => Object.freeze({ ...entry, _index: index }));

  return Object.freeze({
    evaluate(request) {
      const matching = rules.filter(rule => matches(rule, request));
      if (matching.length === 0) return Object.freeze({ allowed: false, requiresApproval: false, reason: 'No policy entry' });

      const exactDeny = matching.find(rule => rule.allowed === false && specificity(rule) === 4);
      if (exactDeny) return Object.freeze({ allowed: false, requiresApproval: false, reason: exactDeny.reason || 'Explicit deny' });

      const exact = matching.filter(rule => specificity(rule) === 4).sort((a, b) => b._index - a._index)[0];
      if (exact) return Object.freeze({ allowed: exact.allowed === true, requiresApproval: Boolean(exact.requiresApproval), reason: exact.reason || (exact.allowed ? 'Allowed by policy' : 'Explicit deny') });

      const broad = matching.filter(rule => rule.allowed === true).sort((a, b) => specificity(b) - specificity(a) || b._index - a._index)[0];
      if (!broad) return Object.freeze({ allowed: false, requiresApproval: false, reason: 'No policy entry' });
      return Object.freeze({ allowed: true, requiresApproval: Boolean(broad.requiresApproval), reason: broad.reason || 'Allowed by policy' });
    },
  });
}

function matches(rule, request) {
  return ['agentId', 'skillId', 'capability', 'action'].every(field => rule[field] === '*' || rule[field] === request[field]);
}

function specificity(rule) {
  return ['agentId', 'skillId', 'capability', 'action'].reduce((score, field) => score + (rule[field] === '*' ? 0 : 1), 0);
}

module.exports = { createPolicyEvaluator, matches, specificity };
