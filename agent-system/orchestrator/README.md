# Sovereign Orchestrator v1

The orchestrator routes a request to the smallest capable agent and skill while preserving least privilege and approval boundaries.

## Runtime sequence

1. **Intake** — normalize the request into an objective and scope.
2. **Classify** — determine the domain and risk.
3. **Plan** — identify required skills and capabilities.
4. **Assign** — choose the least-privileged capable agent using `task-router.yml`.
5. **Check** — validate capability and permission before every tool action.
6. **Gate** — stop for approval when the action crosses an approval boundary.
7. **Execute** — perform only permitted actions.
8. **Verify** — independently confirm consequential results.
9. **Handover** — pass context, never authority.
10. **Report** — record actions, evidence, blockers, approvals, and open loops.

## Fail-closed behavior

Unknown tasks, unavailable capabilities, insufficient permissions, missing approvals, and failed verification must not be treated as success.

## First implementation target

This v1 is the policy/configuration layer. Runtime integration should consume these contracts rather than hard-code agent permissions in individual skills.
