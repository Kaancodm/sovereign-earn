# Context Contract v1

Every harness run receives a server-resolved, versioned context manifest. Agent input cannot add authoritative policy, identity, approval, budget, or tool permissions.

## Required manifest

- `contextVersion`
- `runId`
- `agentId`
- `sessionMode`
- `architectureVersion`
- `policyVersion`
- `flowVersion`
- `skillVersions`
- `workspaceMapVersion`
- `artifactRefs`
- `dataClassification`

## Data classification

- `model_visible`: safe for model context.
- `model_restricted`: summarized/minimized before model exposure.
- `core_only`: never supplied to the model; available only to trusted runtime components.

The runtime owns manifest construction and validates referenced versions before execution. Context is append-only for audit purposes and changes create a new manifest version.
