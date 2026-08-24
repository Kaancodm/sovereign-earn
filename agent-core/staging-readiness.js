"use strict";

function evaluateStagingReadiness({ ciGreen, securityGreen, auditVerified, e2eGreen, docsComplete, browserQa = false }) {
  const checks = {
    ciGreen: Boolean(ciGreen),
    securityGreen: Boolean(securityGreen),
    auditVerified: Boolean(auditVerified),
    e2eGreen: Boolean(e2eGreen),
    docsComplete: Boolean(docsComplete),
    browserQa: Boolean(browserQa),
  };

  const blocking = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  return {
    ready: blocking.length === 0,
    checks,
    blocking,
  };
}

module.exports = { evaluateStagingReadiness };
