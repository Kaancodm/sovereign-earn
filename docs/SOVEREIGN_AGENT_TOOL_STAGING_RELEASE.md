# Sovereign Agent Tool — Staging Release 101–120

## Release intent

Package the Agent Tool as a staging candidate without weakening the execution trust boundary.

## Steps 101–120

101. Freeze the 81–100 contract as the release base.
102. Add a deterministic staging-release gate.
103. Publish a release manifest.
104. Define release evidence requirements.
105. Define browser/product QA as an explicit gate.
106. Keep browser QA fail-closed when evidence is absent.
107. Define the operator smoke flow.
108. Define approval and override evidence.
109. Define audit/result evidence.
110. Define security regression evidence.
111. Define staging rollback procedure.
112. Define release abort conditions.
113. Define post-deploy verification.
114. Define incident handoff fields.
115. Add regression coverage for release controls.
116. Keep release controls outside tool execution authority.
117. Keep Earn/Firebase concerns out of Agent Tool execution logic.
118. Produce a machine-readable evidence schema.
119. Expose a single staging gate command.
120. Mark the candidate **STAGING-CANDIDATE / QA-BLOCKED** until real-browser evidence exists.

## Release gate

A candidate may be called staging-ready only when all of the following are true:

- Agent-core tests pass.
- Repository quality gates pass.
- Staging configuration passes.
- Operator smoke flow passes.
- Security regression passes.
- Real-browser product QA evidence is attached.
- Rollback procedure has been verified.

Until the browser evidence exists, the correct state is **QA-BLOCKED**, not staging-ready.

## Operator smoke flow

`START RUN → DISCOVER TOOL → AUTHORIZE → PENDING APPROVAL → APPROVE/OVERRIDE → EXECUTE → RESULT + AUDIT ID → TERMINAL STATE`

No UI action is allowed to become a second execution path. All execution continues through the existing Agent-Core runtime boundary.
