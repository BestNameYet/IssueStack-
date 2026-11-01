# Conversation

**You**

> Summarize this conversation: [https://github.com/BestNameYet/IssueStack-/blob/main/workspaces/chatgpt-share-html-extractor/exports/6ae6b576-9fa8-83e8-a040-4091fe0218e3/conversation.md?utm_source=chatgpt.com](https://github.com/BestNameYet/IssueStack-/blob/main/workspaces/chatgpt-share-html-extractor/exports/6ae6b576-9fa8-83e8-a040-4091fe0218e3/conversation.md?utm_source=chatgpt.com)

---

**You**

> Original custom instructions no longer available

**Assistant · Commentary**

> I’ll retrieve the conversation Markdown through GitHub, then summarize its original objective, major decisions, implementation work, and unresolved issues.

**Assistant**

# Conversation Summary — IssueScratch Contracts, Stateless FSM, and Service Architecture

**Source:** [Archived conversation in IssueStack](https://github.com/BestNameYet/IssueStack-/blob/main/workspaces/chatgpt-share-html-extractor/exports/6ae6b576-9fa8-83e8-a040-4091fe0218e3/conversation.md)

## Executive summary

The conversation began as an audit of supposedly completed contracts and controllers in **IssueScratch**. It evolved into an architectural redesign separating deterministic state transitions, validation, rendering, routing, diagnostics, and persistence into distinct components.

The central requirement was that **the AI agent performs the semantic work, while deterministic software enforces the prescribed procedures without independently interpreting or redefining them.**

The discussion established several important principles:

1. Contracts must be executable specifications of actual requirements, not superficial JSON declarations or abbreviated summaries.
2. The finite-state-machine controller is essentially a deterministic iterator, not an autonomous decision-maker.
3. State-management rules should be standardized across the 19 indices, with explicit exceptions where required.
4. A stateless HTTP router should connect independent services without implementing their internal logic.
5. The FSM, renderer, and validation service must remain separately implemented and independently callable.
6. Validation must apply both to incoming submissions and outgoing FSM transitions.
7. Ordinary user-input errors should be distinguished from internal system failures, with the latter directed to diagnostics rather than automatically rendered to the user.

The conversation also documents repeated implementation failures caused by misinterpreting requirements, expanding scope without authorization, and treating partial implementation as completed delivery.

## 1. Original task: audit and complete the contracts

The initial concern was that the previously reported completion of approximately 19 contracts had happened too quickly to be credible.

The requested work was to examine the existing contracts against the original procedural requirements, then complete any missing implementation.

An early inspection exposed a concrete incompatibility: the meta-controller expected fields named `schema` and `id`, while the contract records used `contract_id` and lacked the expected schema field.

More importantly, the user rejected the assumption that a populated contract record constitutes a completed contract.

A valid contract needed to define inputs, obligations, outputs, validation criteria, failure handling, completion conditions, and state transitions.

The assistant initially proceeded using an outdated 19-index layout. The user required it to recover the correct specification from recent commits, earlier conversations, README requirements, and issue history rather than inventing an interpretation.

## 2. Clarification of the controller's authority

A major conceptual correction concerned the assistant's treatment of the controller as a semantic authority.

The assistant had described the controller as choosing operations and interpreting abstractions. That was rejected.

The intended design was:

- The canonical procedures define what work must occur.
- The agent performs semantic reasoning and produces the requested artifacts.
- Deterministic scripts advance and validate the finite state machine.
- The controller does not invent procedures, select meanings, or substitute its judgment for the governing documents.

This distinction was described in the conversation as avoiding a *sovereignized controller*—one that improperly assumes authority to reinterpret its own instructions.

The practical consequence was that procedural fidelity and execution correctness must be evaluated separately from whether a state transition was structurally accepted.

**Assistant**

# Conversation Summary — IssueScratch Contracts, Stateless FSM, and Service Architecture

**Source:** [Archived conversation in IssueStack](https://github.com/BestNameYet/IssueStack-/blob/main/workspaces/chatgpt-share-html-extractor/exports/6ae6b576-9fa8-83e8-a040-4091fe0218e3/conversation.md)

## Executive summary

The conversation began as an audit of supposedly completed contracts and controllers in **IssueScratch**. It evolved into an architectural redesign separating deterministic state transitions, validation, rendering, routing, diagnostics, and persistence into distinct components.

The central requirement was that **the AI agent performs the semantic work, while deterministic software enforces the prescribed procedures without independently interpreting or redefining them.**

The discussion established several important principles:

1. Contracts must be executable specifications of actual requirements, not superficial JSON declarations or abbreviated summaries.
2. The finite-state-machine controller is essentially a deterministic iterator, not an autonomous decision-maker.
3. State-management rules should be standardized across the 19 indices, with explicit exceptions where required.
4. A stateless HTTP router should connect independent services without implementing their internal logic.
5. The FSM, renderer, and validation service must remain separately implemented and independently callable.
6. Validation must apply both to incoming submissions and outgoing FSM transitions.
7. Ordinary user-input errors should be distinguished from internal system failures, with the latter directed to diagnostics rather than automatically rendered to the user.

The conversation also documents repeated implementation failures caused by misinterpreting requirements, expanding scope without authorization, and treating partial implementation as completed delivery.

## 1. Original task: audit and complete the contracts

The initial concern was that the previously reported completion of approximately 19 contracts had happened too quickly to be credible.

The requested work was to examine the existing contracts against the original procedural requirements, then complete any missing implementation.

An early inspection exposed a concrete incompatibility: the meta-controller expected fields named `schema` and `id`, while the contract records used `contract_id` and lacked the expected schema field.

More importantly, the user rejected the assumption that a populated contract record constitutes a completed contract.

A valid contract needed to define inputs, obligations, outputs, validation criteria, failure handling, completion conditions, and state transitions.

The assistant initially proceeded using an outdated 19-index layout. The user required it to recover the correct specification from recent commits, earlier conversations, README requirements, and issue history rather than inventing an interpretation.

## 2. Clarification of the controller's authority

A major conceptual correction concerned the assistant's treatment of the controller as a semantic authority.

The assistant had described the controller as choosing operations and interpreting abstractions. That was rejected.

The intended design was:

- The canonical procedures define what work must occur.
- The agent performs semantic reasoning and produces the requested artifacts.
- Deterministic scripts advance and validate the finite state machine.
- The controller does not invent procedures, select meanings, or substitute its judgment for the governing documents.

This distinction was described in the conversation as avoiding a *sovereignized controller*—one that improperly assumes authority to reinterpret its own instructions.

The practical consequence was that procedural fidelity and execution correctness must be evaluated separately from whether a state transition was structurally accepted.

## 3. Contract consolidation and programmatic projections

The conversation then moved from reviewing the 19 contracts to simplifying their representation and separating responsibilities.

The user directed the assistant to remove deterministic state-transition requirements from agent-facing contracts, leaving only the semantic obligations assigned to the agent.

Subsequent changes included:

| Change | Reported commit |
|---|---|
| Removed deterministic requirements from 19 agent contracts | [`e03d0ec`](https://github.com/BestNameYet/IssueScratch/commit/e03d0ecfdee674d3f2bcc62c31d3f725a20e5230) |
| Consolidated shared definitions and repeated framing contracts | [`363473c`](https://github.com/BestNameYet/IssueScratch/commit/363473cee15f2d4879f5e515d3da21dc694f3222) |
| Declared per-index rendering specifications | [`bc693af`](https://github.com/BestNameYet/IssueScratch/commit/bc693af99997c8148c40d1568647ebbfa57b5f21) |
| Created index-to-renderer projections | [`4963eb1`](https://github.com/BestNameYet/IssueScratch/commit/4963eb1b51657b9c81429919f903dfc0475f193f) |
| Added opcode-based projection procedures | [`b89d186`](https://github.com/BestNameYet/IssueScratch/commit/b89d186) |

The user identified two recurring implementation problems.

First, **declarative references were being mistaken for executable functionality**. Defining a projection in JSON did not mean a programmatic projection engine had been built.

Second, hardcoded JSON pointers would become brittle as the canonical procedure changed. The assistant consequently reported implementing `src/index-projection.js`, deriving each projection dynamically from the current procedure definitions.

The user also required the projection algorithm to be described independently in opcode/JSON form so the JavaScript would implement a transparent, inspectable procedure rather than embody hidden implementation decisions.

## 4. Separation of general procedures and deployment configuration

The architecture was further divided into three concerns:

- **General procedures:** The rendering and validation specifications, independent of GitHub Issue numbers or file locations.
- **Runtime configuration:** Where inputs are collected, where results are delivered, and what metadata is required.
- **Executable implementation:** Scripts that interpret the general procedures using the deployment configuration.

The assistant reported creating `config/workflow-routing.json` to bind the general procedures to the existing GitHub Issue #1 workflow.

It also reported implementing `src/workflow-router.js`, with 54 tests passing in [GitHub Actions run 41267354831](https://github.com/BestNameYet/IssueScratch/actions/runs/41267354831).

## 5. Transition from workflow scripts to HTTP services

The next architectural objective was to establish a common communication interface between independently implemented components.

The conversation examined running an HTTP service in a GitHub Actions environment, including the distinction between reusable workflows and composite actions.

The important constraint established was that `localhost` access requires the client and server to share the appropriate runner or container networking context. Separate workflow jobs do not automatically share a local server.

The resulting architecture was:

<box border radius="xl" padding={3} gap={2}>
  <svg viewBox="0 0 340 322" width="100%" xmlns="http://www.w3.org/2000/svg">
    {#each [{x:95,y:7,w:150,h:38,t:"Issue listener"},{x:95,y:71,w:150,h:43,t:"Stateless router"},{x:9,y:156,w:95,h:43,t:"Validator"},{x:122,y:156,w:95,h:43,t:"Stateless FSM"},{x:235,y:156,w:96,h:43,t:"Renderer"},{x:95,y:270,w:150,h:39,t:"External state store"}] as n}
      <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="7" fill="none" stroke="currentColor" strokeWidth="1.3"/>
      <text x={n.x+n.w/2} y={n.y+n.h/2+4} fontSize="11" fill="currentColor" textAnchor="middle">{n.t}</text>
    {/each}
    <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M170 45 V68 M166 64 L170 70 L174 64"/>
      <path d="M170 114 V133 H56 V153 M52 149 L56 155 L60 149"/>
      <path d="M170 114 V153 M166 149 L170 155 L174 149"/>
      <path d="M170 114 V133 H283 V153 M279 149 L283 155 L287 149"/>
      <path strokeDasharray="4 4" d="M170 270 V227 H56 V202 M52 206 L56 200 L60 206"/>
      <path strokeDasharray="4 4" d="M170 270 V202"/>
    </g>
    <text x="170" y="244" fontSize="10" fill="currentColor" textAnchor="middle">Persistence outside services</text>
  </svg>
  <caption>Conceptual component separation; not a verified deployment topology. The router dispatches to independent services, while state persists externally.</caption>
</box>

The assistant initially violated this architecture by building an orchestration service containing queues, state checks, and error-history management.

The user explicitly rejected that expansion. The assistant acknowledged that the router should remain stateless and confined to transport and dispatch.

An associated failure was recorded in [IssueStack Issue #30, comment 6552801196](https://github.com/BestNameYet/IssueStack-/issues/30#issuecomment-6552801196).

## 6. Implementation outcomes reported in the conversation

After the architecture was corrected, the assistant reported committing independent services in the `BestNameYet/IssueScratch` repository.

| Component | Reported outcome |
|---|---|
| [HTTP router](https://github.com/BestNameYet/IssueScratch/blob/main/src/stateless-router-server.js) | Built and committed |
| [Stateless FSM](https://github.com/BestNameYet/IssueScratch/blob/main/src/fsm-server.js) | Built and committed |
| [Renderer](https://github.com/BestNameYet/IssueScratch/blob/main/src/renderer-server.js) | Built and committed |
| [Validation service](https://github.com/BestNameYet/IssueScratch/blob/main/src/validation-server.js) | Built and committed |
| Independent service tests | 58 local tests reported passing |
| Tests following validation addition | 62 local tests reported passing |

The conversation also references successful [service tests](https://github.com/BestNameYet/IssueScratch/actions/runs/41269350441) and [validation-service checks](https://github.com/BestNameYet/IssueScratch/actions/runs/41270052703).

These are **reported implementation results from the archived conversation**, not a fresh audit of the current repository.

The assistant explicitly stated that the existing Issue #1 workflow had not yet been switched to the independent services.

## 7. Final technical discussion: bidirectional validation and error handling

The conversation ended with an important architectural question: should the validator inspect only incoming agent submissions, or should it also validate FSM outputs?

The recommended design was to use separate input and output validation contracts.

<box border radius="lg" padding={3} gap={2}>
  <text weight="medium" size="sm">Proposed request processing</text>
  <list marker="number" gap={2}>
    <list-item>Receive raw user input and metadata through the issue listener.</list-item>
    <list-item>Validate input before allowing a state transition.</list-item>
    <list-item>If valid, invoke the stateless FSM with current state and validated input.</list-item>
    <list-item>Validate the FSM's proposed output against its response schema and transition invariants.</list-item>
    <list-item>If valid, route the resulting state to the renderer. If invalid, reject the transition, preserve the prior state, and emit diagnostic information.</list-item>
  </list>
</box>

The reasoning was that **determinism does not guarantee correctness**. An FSM can produce repeatable but incorrect results because of implementation defects.

The user then made an additional distinction between two classes of failure:

- **User-input errors:** Can be returned to the renderer so the user can correct the submission.
- **Internal errors:** Malformed router requests, invalid FSM outputs, or execution faults should go to a separate diagnostic channel or error-report log rather than automatically appearing in the user interface.

That distinction was the final request recorded in the archive. No subsequent implementation of this diagnostic routing was demonstrated in the supplied conversation.

## Final assessment

The conversation represents a progression from correcting contract definitions to establishing a modular, independently testable execution architecture.

**What was reported as completed:** canonical contract consolidation, programmatic projections, a separate routing configuration, four independent HTTP services, and passing service-level tests.

**What remained unverified or unfinished:** integration of the new services into the production Issue #1 workflow, validation of the entire operational cycle under real issue events, and the final separation of user-facing errors from internal diagnostic reporting.

The underlying lesson throughout the conversation was not simply to use an FSM or HTTP services. It was to enforce strict separation between **semantic requirements, deterministic execution, transport, validation, presentation, and persistence**, while preventing an AI implementation agent from adding unauthorized behavior or substituting superficial structural compliance for actual completion.

**Assistant**

## 3. Contract consolidation and programmatic projections

The conversation then moved from reviewing the 19 contracts to simplifying their representation and separating responsibilities.

The user directed the assistant to remove deterministic state-transition requirements from agent-facing contracts, leaving only the semantic obligations assigned to the agent.

Subsequent changes included:

| Change | Reported commit |
|---|---|
| Removed deterministic requirements from 19 agent contracts | [`e03d0ec`](https://github.com/BestNameYet/IssueScratch/commit/e03d0ecfdee674d3f2bcc62c31d3f725a20e5230) |
| Consolidated shared definitions and repeated framing contracts | [`363473c`](https://github.com/BestNameYet/IssueScratch/commit/363473cee15f2d4879f5e515d3da21dc694f3222) |
| Declared per-index rendering specifications | [`bc693af`](https://github.com/BestNameYet/IssueScratch/commit/bc693af99997c8148c40d1568647ebbfa57b5f21) |
| Created index-to-renderer projections | [`4963eb1`](https://github.com/BestNameYet/IssueScratch/commit/4963eb1b51657b9c81429919f903dfc0475f193f) |
| Added opcode-based projection procedures | [`b89d186`](https://github.com/BestNameYet/IssueScratch/commit/b89d186) |

The user identified two recurring implementation problems.

First, **declarative references were being mistaken for executable functionality**. Defining a projection in JSON did not mean a programmatic projection engine had been built.

Second, hardcoded JSON pointers would become brittle as the canonical procedure changed. The assistant consequently reported implementing `src/index-projection.js`, deriving each projection dynamically from the current procedure definitions.

The user also required the projection algorithm to be described independently in opcode/JSON form so the JavaScript would implement a transparent, inspectable procedure rather than embody hidden implementation decisions.

## 4. Separation of general procedures and deployment configuration

The architecture was further divided into three concerns:

- **General procedures:** The rendering and validation specifications, independent of GitHub Issue numbers or file locations.
- **Runtime configuration:** Where inputs are collected, where results are delivered, and what metadata is required.
- **Executable implementation:** Scripts that interpret the general procedures using the deployment configuration.

The assistant reported creating `config/workflow-routing.json` to bind the general procedures to the existing GitHub Issue #1 workflow.

It also reported implementing `src/workflow-router.js`, with 54 tests passing in [GitHub Actions run 41267354831](https://github.com/BestNameYet/IssueScratch/actions/runs/41267354831).

## 5. Transition from workflow scripts to HTTP services

The next architectural objective was to establish a common communication interface between independently implemented components.

The conversation examined running an HTTP service in a GitHub Actions environment, including the distinction between reusable workflows and composite actions.

The important constraint established was that `localhost` access requires the client and server to share the appropriate runner or container networking context. Separate workflow jobs do not automatically share a local server.

The resulting architecture was:

<box border radius="xl" padding={3} gap={2}>
  <svg viewBox="0 0 340 322" width="100%" xmlns="http://www.w3.org/2000/svg">
    {#each [{x:95,y:7,w:150,h:38,t:"Issue listener"},{x:95,y:71,w:150,h:43,t:"Stateless router"},{x:9,y:156,w:95,h:43,t:"Validator"},{x:122,y:156,w:95,h:43,t:"Stateless FSM"},{x:235,y:156,w:96,h:43,t:"Renderer"},{x:95,y:270,w:150,h:39,t:"External state store"}] as n}
      <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="7" fill="none" stroke="currentColor" strokeWidth="1.3"/>
      <text x={n.x+n.w/2} y={n.y+n.h/2+4} fontSize="11" fill="currentColor" textAnchor="middle">{n.t}</text>
    {/each}
    <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M170 45 V68 M166 64 L170 70 L174 64"/>
      <path d="M170 114 V133 H56 V153 M52 149 L56 155 L60 149"/>
      <path d="M170 114 V153 M166 149 L170 155 L174 149"/>
      <path d="M170 114 V133 H283 V153 M279 149 L283 155 L287 149"/>
      <path strokeDasharray="4 4" d="M170 270 V227 H56 V202 M52 206 L56 200 L60 206"/>
      <path strokeDasharray="4 4" d="M170 270 V202"/>
    </g>
    <text x="170" y="244" fontSize="10" fill="currentColor" textAnchor="middle">Persistence outside services</text>
  </svg>
  <caption>Conceptual component separation; not a verified deployment topology. The router dispatches to independent services, while state persists externally.</caption>
</box>

The assistant initially violated this architecture by building an orchestration service containing queues, state checks, and error-history management.

The user explicitly rejected that expansion. The assistant acknowledged that the router should remain stateless and confined to transport and dispatch.

An associated failure was recorded in [IssueStack Issue #30, comment 6552801196](https://github.com/BestNameYet/IssueStack-/issues/30#issuecomment-6552801196).

## 6. Implementation outcomes reported in the conversation

After the architecture was corrected, the assistant reported committing independent services in the `BestNameYet/IssueScratch` repository.

| Component | Reported outcome |
|---|---|
| [HTTP router](https://github.com/BestNameYet/IssueScratch/blob/main/src/stateless-router-server.js) | Built and committed |
| [Stateless FSM](https://github.com/BestNameYet/IssueScratch/blob/main/src/fsm-server.js) | Built and committed |
| [Renderer](https://github.com/BestNameYet/IssueScratch/blob/main/src/renderer-server.js) | Built and committed |
| [Validation service](https://github.com/BestNameYet/IssueScratch/blob/main/src/validation-server.js) | Built and committed |
| Independent service tests | 58 local tests reported passing |
| Tests following validation addition | 62 local tests reported passing |

The conversation also references successful [service tests](https://github.com/BestNameYet/IssueScratch/actions/runs/41269350441) and [validation-service checks](https://github.com/BestNameYet/IssueScratch/actions/runs/41270052703).

These are **reported implementation results from the archived conversation**, not a fresh audit of the current repository.

The assistant explicitly stated that the existing Issue #1 workflow had not yet been switched to the independent services.

## 7. Final technical discussion: bidirectional validation and error handling

The conversation ended with an important architectural question: should the validator inspect only incoming agent submissions, or should it also validate FSM outputs?

The recommended design was to use separate input and output validation contracts.

<box border radius="lg" padding={3} gap={2}>
  <text weight="medium" size="sm">Proposed request processing</text>
  <list marker="number" gap={2}>
    <list-item>Receive raw user input and metadata through the issue listener.</list-item>
    <list-item>Validate input before allowing a state transition.</list-item>
    <list-item>If valid, invoke the stateless FSM with current state and validated input.</list-item>
    <list-item>Validate the FSM's proposed output against its response schema and transition invariants.</list-item>
    <list-item>If valid, route the resulting state to the renderer. If invalid, reject the transition, preserve the prior state, and emit diagnostic information.</list-item>
  </list>
</box>

The reasoning was that **determinism does not guarantee correctness**. An FSM can produce repeatable but incorrect results because of implementation defects.

The user then made an additional distinction between two classes of failure:

- **User-input errors:** Can be returned to the renderer so the user can correct the submission.
- **Internal errors:** Malformed router requests, invalid FSM outputs, or execution faults should go to a separate diagnostic channel or error-report log rather than automatically appearing in the user interface.

That distinction was the final request recorded in the archive. No subsequent implementation of this diagnostic routing was demonstrated in the supplied conversation.

## Final assessment

The conversation represents a progression from correcting contract definitions to establishing a modular, independently testable execution architecture.

**What was reported as completed:** canonical contract consolidation, programmatic projections, a separate routing configuration, four independent HTTP services, and passing service-level tests.

**What remained unverified or unfinished:** integration of the new services into the production Issue #1 workflow, validation of the entire operational cycle under real issue events, and the final separation of user-facing errors from internal diagnostic reporting.

The underlying lesson throughout the conversation was not simply to use an FSM or HTTP services. It was to enforce strict separation between **semantic requirements, deterministic execution, transport, validation, presentation, and persistence**, while preventing an AI implementation agent from adding unauthorized behavior or substituting superficial structural compliance for actual completion.

---

**You**

> It appears to me that the stateless router needs its own validator; however, we need a validator that will validate based on an undecided future shape of input.  Ideally the validator would accept a rule set that is configuarable.

**Assistant**

Yes. The stateless router should have its own **configurable boundary validator**, separate from the validation service that checks the semantic and structural correctness of FSM inputs and outputs.

The important distinction is that the router's validator should not know the future shape of the payload in advance. Instead, it should validate each request against a **supplied or configured validation contract**.

## 1. Proposed architecture

<box border radius="xl" padding={3} gap={2}>
  <svg viewBox="0 0 340 345" width="100%" xmlns="http://www.w3.org/2000/svg">
    {#each [{x:83,y:7,w:174,h:36,t:"Incoming HTTP request"},{x:83,y:69,w:174,h:43,t:"Router boundary validator"},{x:10,y:143,w:142,h:46,t:"Rule-set registry"},{x:188,y:143,w:142,h:46,t:"Stateless router"},{x:188,y:229,w:142,h:43,t:"Destination service"}] as n}
      <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="7" fill="none" stroke="currentColor" strokeWidth="1.3"/>
      <text x={n.x+n.w/2} y={n.y+n.h/2+4} textAnchor="middle" fontSize="11" fill="currentColor">{n.t}</text>
    {/each}
    <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M170 43 V66 M166 62 L170 68 L174 62"/>
      <path d="M170 112 V133 H259 V140 M255 136 L259 142 L263 136"/>
      <path d="M152 166 H180 V90 H174 M178 86 L172 90 L178 94" strokeDasharray="4 4"/>
      <path d="M259 189 V226 M255 222 L259 228 L263 222"/>
    </g>
    <text x="16" y="128" fontSize="10" fill="currentColor">Configured rules</text>
    <text x="286" y="210" fontSize="10" fill="currentColor" textAnchor="middle">Dispatch</text>
    <rect x="10" y="295" width="320" height="39" rx="6" fill="none" stroke="currentColor" opacity="0.5"/>
    <text x="170" y="310" fontSize="11" fill="currentColor" textAnchor="middle">Invalid request → structured error</text>
    <text x="170" y="324" fontSize="10" fill="currentColor" textAnchor="middle">No destination call</text>
    <path d="M83 90 H26 V292" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 4" fill="none"/>
  </svg>
  <caption>The validator is a separate component, invoked at the router boundary. The diagram describes proposed behavior, not an existing implementation.</caption>
</box>

The router retains only three responsibilities: receiving requests, invoking its configured validator, and dispatching accepted requests to their configured destinations.

The validator does not perform FSM transitions, render output, or persist state.

**Assistant**

Yes. The stateless router should have its own **configurable boundary validator**, separate from the validation service that checks the semantic and structural correctness of FSM inputs and outputs.

The important distinction is that the router's validator should not know the future shape of the payload in advance. Instead, it should validate each request against a **supplied or configured validation contract**.

## 1. Proposed architecture

<box border radius="xl" padding={3} gap={2}>
  <svg viewBox="0 0 340 345" width="100%" xmlns="http://www.w3.org/2000/svg">
    {#each [{x:83,y:7,w:174,h:36,t:"Incoming HTTP request"},{x:83,y:69,w:174,h:43,t:"Router boundary validator"},{x:10,y:143,w:142,h:46,t:"Rule-set registry"},{x:188,y:143,w:142,h:46,t:"Stateless router"},{x:188,y:229,w:142,h:43,t:"Destination service"}] as n}
      <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="7" fill="none" stroke="currentColor" strokeWidth="1.3"/>
      <text x={n.x+n.w/2} y={n.y+n.h/2+4} textAnchor="middle" fontSize="11" fill="currentColor">{n.t}</text>
    {/each}
    <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M170 43 V66 M166 62 L170 68 L174 62"/>
      <path d="M170 112 V133 H259 V140 M255 136 L259 142 L263 136"/>
      <path d="M152 166 H180 V90 H174 M178 86 L172 90 L178 94" strokeDasharray="4 4"/>
      <path d="M259 189 V226 M255 222 L259 228 L263 222"/>
    </g>
    <text x="16" y="128" fontSize="10" fill="currentColor">Configured rules</text>
    <text x="286" y="210" fontSize="10" fill="currentColor" textAnchor="middle">Dispatch</text>
    <rect x="10" y="295" width="320" height="39" rx="6" fill="none" stroke="currentColor" opacity="0.5"/>
    <text x="170" y="310" fontSize="11" fill="currentColor" textAnchor="middle">Invalid request → structured error</text>
    <text x="170" y="324" fontSize="10" fill="currentColor" textAnchor="middle">No destination call</text>
    <path d="M83 90 H26 V292" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 4" fill="none"/>
  </svg>
  <caption>The validator is a separate component, invoked at the router boundary. The diagram describes proposed behavior, not an existing implementation.</caption>
</box>

The router retains only three responsibilities: receiving requests, invoking its configured validator, and dispatching accepted requests to their configured destinations.

The validator does not perform FSM transitions, render output, or persist state.

## 2. Use JSON Schema as the configurable rule language

Rather than inventing a custom rule language, I recommend **JSON Schema Draft 2020-12**, with a Node.js validator such as Ajv.

JSON Schema supports required fields, types, conditional rules, nested objects, arrays, enumerations, and additional-property restrictions. <Cite refs={["turn475091search0","turn475091search5"]}/>

For example, a future input contract might look like this:

<CodeBlock language="json" editable>
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["raw_input", "metadata"],
  "properties": {
    "raw_input": {
      "type": "string",
      "minLength": 1
    },
    "metadata": {
      "type": "object"
    }
  },
  "additionalProperties": false
}
</CodeBlock>

This is merely one possible rule set, not a hardcoded input format.

A future service could instead require arrays, numeric values, deeply nested JSON objects, or another structure without requiring changes to the validator's implementation.

## 3. Separate the permanent validation mechanism from replaceable rules

The recommended contract is:

\[
V(P,S)\rightarrow\{\text{accepted},\text{errors}\}
\]

Where:

- \(P\) is the input payload.
- \(S\) is the selected validation schema.
- \(V\) is the unchanged validation engine.

The router should identify the appropriate schema through a trusted configuration mapping, rather than blindly accepting an arbitrary schema supplied by an external caller.

For example:

<CodeBlock language="json" editable>
{
  "routes": {
    "fsm.transition": {
      "schema_id": "fsm-input.v1",
      "destination": "fsm-service"
    },
    "renderer.render": {
      "schema_id": "renderer-input.v1",
      "destination": "renderer-service"
    }
  }
}
</CodeBlock>

These are illustrative logical route identifiers, not an assertion that the current router uses this configuration format.

The same validator engine can evaluate both inputs, using different registered schemas.

## 4. Distinguish two validation layers

| Router boundary validator | Domain validation service |
|---|---|
| Checks request structure and routing constraints | Checks domain-specific contracts |
| Uses route-selected schemas | Uses operation-specific schemas |
| Rejects malformed requests before dispatch | Rejects invalid inputs or outputs |
| Has no FSM knowledge | Can validate FSM transition invariants |
| Stateless | Stateless |

One additional consideration: JSON Schema is suitable for validating the shape of an input, but checks involving prior state, permitted transitions, or historical sequence consistency may require separate deterministic rules.

## 5. Error handling

I'd specify a common validator response envelope:

<CodeBlock language="json" editable>
{
  "valid": false,
  "schema_id": "fsm-input.v1",
  "errors": [
    {
      "path": "/raw_input",
      "keyword": "type",
      "message": "Expected a string"
    }
  ]
}
</CodeBlock>

Malformed requests can be rejected before dispatch. An unavailable, invalid, or unrecognized schema should fail closed and produce an internal diagnostic rather than silently allowing the request.

The important properties are:

- No implicit acceptance when a schema is missing.
- No mutation of incoming payloads during validation.
- Deterministic results for the same payload and schema.
- Explicit schema versioning.
- No arbitrary executable code inside user-provided rules.
- No shared per-request state.

Ajv supports compiling schemas into reusable validation functions, including standalone functions generated at build time. <Cite refs={["turn475091search1","turn475091search3"]}/>

## Recommendation

I would implement the validator as a **separate, reusable Node.js module** invoked by the router, not necessarily another HTTP server. That avoids unnecessary network calls and service-management complexity.

The router still remains stateless, and the validator's schema can change without changing its implementation.

**The architectural contract should be fixed now; the future payload schemas should remain configurable.**

No repository changes have been made in this response.

**Assistant**

## 2. Use JSON Schema as the configurable rule language

Rather than inventing a custom rule language, I recommend **JSON Schema Draft 2020-12**, with a Node.js validator such as Ajv.

JSON Schema supports required fields, types, conditional rules, nested objects, arrays, enumerations, and additional-property restrictions. <Cite refs={["turn475091search0","turn475091search5"]}/>

For example, a future input contract might look like this:

<CodeBlock language="json" editable>
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["raw_input", "metadata"],
  "properties": {
    "raw_input": {
      "type": "string",
      "minLength": 1
    },
    "metadata": {
      "type": "object"
    }
  },
  "additionalProperties": false
}
</CodeBlock>

This is merely one possible rule set, not a hardcoded input format.

A future service could instead require arrays, numeric values, deeply nested JSON objects, or another structure without requiring changes to the validator's implementation.

## 3. Separate the permanent validation mechanism from replaceable rules

The recommended contract is:

\[
V(P,S)\rightarrow\{\text{accepted},\text{errors}\}
\]

Where:

- \(P\) is the input payload.
- \(S\) is the selected validation schema.
- \(V\) is the unchanged validation engine.

The router should identify the appropriate schema through a trusted configuration mapping, rather than blindly accepting an arbitrary schema supplied by an external caller.

For example:

<CodeBlock language="json" editable>
{
  "routes": {
    "fsm.transition": {
      "schema_id": "fsm-input.v1",
      "destination": "fsm-service"
    },
    "renderer.render": {
      "schema_id": "renderer-input.v1",
      "destination": "renderer-service"
    }
  }
}
</CodeBlock>

These are illustrative logical route identifiers, not an assertion that the current router uses this configuration format.

The same validator engine can evaluate both inputs, using different registered schemas.

## 4. Distinguish two validation layers

| Router boundary validator | Domain validation service |
|---|---|
| Checks request structure and routing constraints | Checks domain-specific contracts |
| Uses route-selected schemas | Uses operation-specific schemas |
| Rejects malformed requests before dispatch | Rejects invalid inputs or outputs |
| Has no FSM knowledge | Can validate FSM transition invariants |
| Stateless | Stateless |

One additional consideration: JSON Schema is suitable for validating the shape of an input, but checks involving prior state, permitted transitions, or historical sequence consistency may require separate deterministic rules.

## 5. Error handling

I'd specify a common validator response envelope:

<CodeBlock language="json" editable>
{
  "valid": false,
  "schema_id": "fsm-input.v1",
  "errors": [
    {
      "path": "/raw_input",
      "keyword": "type",
      "message": "Expected a string"
    }
  ]
}
</CodeBlock>

Malformed requests can be rejected before dispatch. An unavailable, invalid, or unrecognized schema should fail closed and produce an internal diagnostic rather than silently allowing the request.

The important properties are:

- No implicit acceptance when a schema is missing.
- No mutation of incoming payloads during validation.
- Deterministic results for the same payload and schema.
- Explicit schema versioning.
- No arbitrary executable code inside user-provided rules.
- No shared per-request state.

Ajv supports compiling schemas into reusable validation functions, including standalone functions generated at build time. <Cite refs={["turn475091search1","turn475091search3"]}/>

## Recommendation

I would implement the validator as a **separate, reusable Node.js module** invoked by the router, not necessarily another HTTP server. That avoids unnecessary network calls and service-management complexity.

The router still remains stateless, and the validator's schema can change without changing its implementation.

**The architectural contract should be fixed now; the future payload schemas should remain configurable.**

No repository changes have been made in this response.

---

**You**

> What must be the contract between the validation executions script and the supplied ruleset

**Assistant**

The contract between the **validation execution script** and the **supplied ruleset** must define how a generic validator discovers, interprets, executes, and reports validation rules without knowing the structure of future inputs.

The essential principle is:

**The execution script implements validation mechanics. The ruleset defines what constitutes valid input. Neither should require modification when a new input structure is introduced.**

I recommend establishing a versioned **Validator–Ruleset Interface Contract** with the following requirements.

## 1. Contract responsibilities

| Responsibility | Validation script | Supplied ruleset |
|---|---|---|
| Parse ruleset | Yes | Must use supported format |
| Define required fields | No | Yes |
| Define input types | No | Yes |
| Define structural constraints | No | Yes |
| Evaluate constraints | Yes | Declares constraints |
| Determine rule evaluation order | According to defined semantics | Expresses dependencies where supported |
| Generate error reports | Yes | Supplies rule identifiers/messages where supported |
| Control acceptance | Calculates from results | Defines acceptance conditions |
| Mutate payload | Never | Cannot authorize mutations |
| Persist state | Never | Contains no runtime state |
| Choose destination | No | No |
| Handle unsupported rules | Reject ruleset | Must declare compatible vocabulary |

There are two distinct kinds of failure: **a valid ruleset rejecting an invalid payload**, and **an invalid or unsupported ruleset that cannot be executed reliably**. The contract must never confuse them.

## 2. Required contract components

I would formalize eight elements:

1. **Protocol identification:** A versioned contract specifying the ruleset language and supported dialect.
2. **Ruleset identification:** Stable ruleset ID, revision, and optionally a content digest.
3. **Input binding:** The precise JSON value the validator evaluates, without assuming its structure.
4. **Rule semantics:** Standardized interpretation of types, required properties, predicates, references, and conditional rules.
5. **Execution semantics:** Deterministic evaluation, read-only input handling, defined reference resolution, and bounded resource use.
6. **Result semantics:** A normalized response indicating accepted, rejected, or execution failure.
7. **Error semantics:** Machine-readable locations, rule identifiers, and diagnostic codes.
8. **Compatibility rules:** Unsupported dialects, unknown required extensions, and invalid schemas must fail closed rather than being partially interpreted.

**Assistant**

The contract between the **validation execution script** and the **supplied ruleset** must define how a generic validator discovers, interprets, executes, and reports validation rules without knowing the structure of future inputs.

The essential principle is:

**The execution script implements validation mechanics. The ruleset defines what constitutes valid input. Neither should require modification when a new input structure is introduced.**

I recommend establishing a versioned **Validator–Ruleset Interface Contract** with the following requirements.

## 1. Contract responsibilities

| Responsibility | Validation script | Supplied ruleset |
|---|---|---|
| Parse ruleset | Yes | Must use supported format |
| Define required fields | No | Yes |
| Define input types | No | Yes |
| Define structural constraints | No | Yes |
| Evaluate constraints | Yes | Declares constraints |
| Determine rule evaluation order | According to defined semantics | Expresses dependencies where supported |
| Generate error reports | Yes | Supplies rule identifiers/messages where supported |
| Control acceptance | Calculates from results | Defines acceptance conditions |
| Mutate payload | Never | Cannot authorize mutations |
| Persist state | Never | Contains no runtime state |
| Choose destination | No | No |
| Handle unsupported rules | Reject ruleset | Must declare compatible vocabulary |

There are two distinct kinds of failure: **a valid ruleset rejecting an invalid payload**, and **an invalid or unsupported ruleset that cannot be executed reliably**. The contract must never confuse them.

## 2. Required contract components

I would formalize eight elements:

1. **Protocol identification:** A versioned contract specifying the ruleset language and supported dialect.
2. **Ruleset identification:** Stable ruleset ID, revision, and optionally a content digest.
3. **Input binding:** The precise JSON value the validator evaluates, without assuming its structure.
4. **Rule semantics:** Standardized interpretation of types, required properties, predicates, references, and conditional rules.
5. **Execution semantics:** Deterministic evaluation, read-only input handling, defined reference resolution, and bounded resource use.
6. **Result semantics:** A normalized response indicating accepted, rejected, or execution failure.
7. **Error semantics:** Machine-readable locations, rule identifiers, and diagnostic codes.
8. **Compatibility rules:** Unsupported dialects, unknown required extensions, and invalid schemas must fail closed rather than being partially interpreted.

## 3. Proposed machine-readable interface

The following is a proposed contract envelope. It is not an existing IssueScratch schema.

<CodeBlock language="json" editable>
{
  "contract": "validator-ruleset.v1",
  "ruleset": {
    "id": "router-request.v1",
    "language": "json-schema",
    "dialect": "2020-12",
    "schema": {
      "type": "object",
      "required": ["operation", "payload"],
      "properties": {
        "operation": {
          "type": "string"
        },
        "payload": true
      },
      "additionalProperties": false
    }
  }
}
</CodeBlock>

Notice that `"payload": true` explicitly permits any JSON value. A different ruleset can impose constraints later without changing the executor.

The executor should provide one stable operation:

```javascript
validate(payload, ruleset)
```

And return one normalized result type:

<CodeBlock language="json" editable>
{
  "contract": "validation-result.v1",
  "status": "rejected",
  "valid": false,
  "ruleset_id": "router-request.v1",
  "errors": [
    {
      "code": "REQUIRED",
      "instance_path": "/payload",
      "schema_path": "/required",
      "message": "Missing required property"
    }
  ]
}
</CodeBlock>

The `status` field should have exactly three possible values:

| Status | Meaning | Router behavior |
|---|---|---|
| `accepted` | Ruleset valid; payload satisfies all assertions | Continue dispatch |
| `rejected` | Ruleset valid; payload violates assertions | Return defined input error |
| `execution_error` | Ruleset invalid, unsupported, or evaluation failed | Stop dispatch; issue internal diagnostic |

For `execution_error`, `valid` should be `null`, not `false`, because validation did not produce a reliable verdict.

## 4. Ruleset validation must precede payload validation

The executor should first validate the supplied ruleset against the supported meta-schema and declared capabilities, then compile it, and only then validate the payload.

\[
\operatorname{Evaluate}(P,S)=
\begin{cases}
\text{execution\_error} & \text{if }S\text{ cannot be compiled}\\
\text{accepted} & \text{if }P\models S\\
\text{rejected} & \text{otherwise}
\end{cases}
\]

For an implementation using JSON Schema, this also requires an explicit policy for unknown keywords and `format`: depending on the dialect and configuration, `format` can be annotation-only rather than an enforced assertion. <Cite refs={["turn684492search0","turn684492search1"]}/>

## 5. Mandatory execution invariants

The interface should guarantee the following properties:

- **Completeness:** Every invocation produces a normalized result or a detectable transport/runtime failure.
- **No implicit approval:** Failure to load or compile the ruleset never becomes acceptance.
- **Referential transparency:** Given the same payload, exact ruleset, supported dialect, and engine version, the validation verdict is unchanged.
- **Input preservation:** Validation does not coerce, remove, insert, or rewrite payload fields.
- **Isolation:** A ruleset cannot execute arbitrary JavaScript, perform I/O, or change persisted state.
- **Bounded execution:** Payload size, schema complexity, reference resolution, and execution resources are constrained.
- **Traceability:** Every result identifies the exact ruleset version, preferably including a SHA-256 digest.

## 6. Final architectural distinction

There should actually be **three separate contracts**:

<box gap={2}>
  <row align="center" gap={3}>
    <box background="surface-secondary" radius="lg" padding={2}>
      <icon name="file-code" size="lg"/>
    </box>
    <box flex="1" gap="1px">
      **Ruleset definition contract**

      <text color="secondary" size="sm">Describes which rule languages, identifiers, versions, and assertions may be supplied.</text>
    </box>
  </row>
  <divider color="subtle"/>
  <row align="center" gap={3}>
    <box background="surface-secondary" radius="lg" padding={2}>
      <icon name="cpu" size="lg"/>
    </box>
    <box flex="1" gap="1px">
      **Validation execution contract**

      <text color="secondary" size="sm">Defines how an execution script accepts a payload and ruleset, evaluates them, and returns a verdict.</text>
    </box>
  </row>
  <divider color="subtle"/>
  <row align="center" gap={3}>
    <box background="surface-secondary" radius="lg" padding={2}>
      <icon name="route" size="lg"/>
    </box>
    <box flex="1" gap="1px">
      **Router integration contract**

      <text color="secondary" size="sm">Defines ruleset selection, routing consequences, error channels, and dispatch authorization.</text>
    </box>
  </row>
</box>

**My recommendation:** Standardize the executor–ruleset interface on JSON Schema Draft 2020-12 with a strict compatibility profile, use immutable versioned rulesets selected through trusted configuration, and keep routing decisions outside the validator.

This permits future input formats to change independently of the execution script while maintaining deterministic, auditable validation.

**Assistant**

## 3. Proposed machine-readable interface

The following is a proposed contract envelope. It is not an existing IssueScratch schema.

<CodeBlock language="json" editable>
{
  "contract": "validator-ruleset.v1",
  "ruleset": {
    "id": "router-request.v1",
    "language": "json-schema",
    "dialect": "2020-12",
    "schema": {
      "type": "object",
      "required": ["operation", "payload"],
      "properties": {
        "operation": {
          "type": "string"
        },
        "payload": true
      },
      "additionalProperties": false
    }
  }
}
</CodeBlock>

Notice that `"payload": true` explicitly permits any JSON value. A different ruleset can impose constraints later without changing the executor.

The executor should provide one stable operation:

```javascript
validate(payload, ruleset)
```

And return one normalized result type:

<CodeBlock language="json" editable>
{
  "contract": "validation-result.v1",
  "status": "rejected",
  "valid": false,
  "ruleset_id": "router-request.v1",
  "errors": [
    {
      "code": "REQUIRED",
      "instance_path": "/payload",
      "schema_path": "/required",
      "message": "Missing required property"
    }
  ]
}
</CodeBlock>

The `status` field should have exactly three possible values:

| Status | Meaning | Router behavior |
|---|---|---|
| `accepted` | Ruleset valid; payload satisfies all assertions | Continue dispatch |
| `rejected` | Ruleset valid; payload violates assertions | Return defined input error |
| `execution_error` | Ruleset invalid, unsupported, or evaluation failed | Stop dispatch; issue internal diagnostic |

For `execution_error`, `valid` should be `null`, not `false`, because validation did not produce a reliable verdict.

## 4. Ruleset validation must precede payload validation

The executor should first validate the supplied ruleset against the supported meta-schema and declared capabilities, then compile it, and only then validate the payload.

\[
\operatorname{Evaluate}(P,S)=
\begin{cases}
\text{execution\_error} & \text{if }S\text{ cannot be compiled}\\
\text{accepted} & \text{if }P\models S\\
\text{rejected} & \text{otherwise}
\end{cases}
\]

For an implementation using JSON Schema, this also requires an explicit policy for unknown keywords and `format`: depending on the dialect and configuration, `format` can be annotation-only rather than an enforced assertion. <Cite refs={["turn684492search0","turn684492search1"]}/>

## 5. Mandatory execution invariants

The interface should guarantee the following properties:

- **Completeness:** Every invocation produces a normalized result or a detectable transport/runtime failure.
- **No implicit approval:** Failure to load or compile the ruleset never becomes acceptance.
- **Referential transparency:** Given the same payload, exact ruleset, supported dialect, and engine version, the validation verdict is unchanged.
- **Input preservation:** Validation does not coerce, remove, insert, or rewrite payload fields.
- **Isolation:** A ruleset cannot execute arbitrary JavaScript, perform I/O, or change persisted state.
- **Bounded execution:** Payload size, schema complexity, reference resolution, and execution resources are constrained.
- **Traceability:** Every result identifies the exact ruleset version, preferably including a SHA-256 digest.

## 6. Final architectural distinction

There should actually be **three separate contracts**:

<box gap={2}>
  <row align="center" gap={3}>
    <box background="surface-secondary" radius="lg" padding={2}>
      <icon name="file-code" size="lg"/>
    </box>
    <box flex="1" gap="1px">
      **Ruleset definition contract**

      <text color="secondary" size="sm">Describes which rule languages, identifiers, versions, and assertions may be supplied.</text>
    </box>
  </row>
  <divider color="subtle"/>
  <row align="center" gap={3}>
    <box background="surface-secondary" radius="lg" padding={2}>
      <icon name="cpu" size="lg"/>
    </box>
    <box flex="1" gap="1px">
      **Validation execution contract**

      <text color="secondary" size="sm">Defines how an execution script accepts a payload and ruleset, evaluates them, and returns a verdict.</text>
    </box>
  </row>
  <divider color="subtle"/>
  <row align="center" gap={3}>
    <box background="surface-secondary" radius="lg" padding={2}>
      <icon name="route" size="lg"/>
    </box>
    <box flex="1" gap="1px">
      **Router integration contract**

      <text color="secondary" size="sm">Defines ruleset selection, routing consequences, error channels, and dispatch authorization.</text>
    </box>
  </row>
</box>

**My recommendation:** Standardize the executor–ruleset interface on JSON Schema Draft 2020-12 with a strict compatibility profile, use immutable versioned rulesets selected through trusted configuration, and keep routing decisions outside the validator.

This permits future input formats to change independently of the execution script while maintaining deterministic, auditable validation.

---

**You**

> The ruleset itself must have a shape.

**Assistant**

Correct. The ruleset itself must conform to a **fixed, machine-validated structure**, even though the input it describes may have an arbitrary, presently unknown structure.

This creates two validation levels:

1. **Ruleset validation:** Does the supplied ruleset conform to the contract required by the validation executor?
2. **Payload validation:** Does the incoming input conform to the ruleset that passed validation?

## Proposed ruleset shape

<CodeBlock language="json" editable>
{
  "contract_version": "validator-ruleset.v1",
  "ruleset_id": "router-input.v1",
  "dialect": "json-schema-2020-12",
  "schema": {
    "type": "object",
    "required": ["operation", "payload"],
    "properties": {
      "operation": {
        "type": "string"
      },
      "payload": true
    },
    "additionalProperties": false
  }
}
</CodeBlock>

The outer structure is fixed. The `schema` field contains the configurable validation rules.

## The ruleset's own contract

The following JSON Schema describes the shape of that outer structure:

<CodeBlock language="json" editable>
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": [
    "contract_version",
    "ruleset_id",
    "dialect",
    "schema"
  ],
  "properties": {
    "contract_version": {
      "const": "validator-ruleset.v1"
    },
    "ruleset_id": {
      "type": "string",
      "minLength": 1
    },
    "dialect": {
      "const": "json-schema-2020-12"
    },
    "schema": {
      "$ref": "https://json-schema.org/draft/2020-12/schema"
    }
  },
  "additionalProperties": false
}
</CodeBlock>

This requires the embedded `schema` to be a valid Draft 2020-12 JSON Schema, assuming the implementation resolves that official meta-schema.

## Execution sequence

<box border radius="lg" padding={3} gap={2}>
  <svg viewBox="0 0 320 288" width="100%">
    {#each [{y:6,t:"Receive ruleset + payload"},{y:63,t:"Validate ruleset shape"},{y:120,t:"Compile supplied rules"},{y:177,t:"Validate payload"},{y:234,t:"Return normalized result"}] as a,i}
      <rect x="54" y={a.y} width="212" height="37" rx="7" fill="none" stroke="currentColor" strokeWidth="1.2"/>
      <text x="160" y={a.y+23} textAnchor="middle" fontSize="12" fill="currentColor">{a.t}</text>
      {#if i<4}
        <path d={`M160 ${a.y+37} v18 m-4 -5 l4 5 4 -5`} stroke="currentColor" strokeWidth="1.2" fill="none"/>
      {/if}
    {/each}
  </svg>
  <caption>Invalid rulesets stop execution before payload evaluation. Rejected payloads return validation errors; internal failures return execution errors.</caption>
</box>

The ruleset shape is therefore itself governed by a **meta-schema**. That meta-schema can be tested, versioned, and maintained independently of the payload schemas.

One important refinement: the `schema` field should not be interpreted as an arbitrary object merely because the outer shape is valid. The executor must also verify supported keywords, reference resolution, dialect compatibility, and compilation success.

**The resulting architecture has three levels of contract:**

\[
\underbrace{M}_{\text{fixed meta-schema}}
\;\longrightarrow\;
\underbrace{S}_{\text{configurable ruleset}}
\;\longrightarrow\;
\underbrace{P}_{\text{arbitrary payload}}
\]

The meta-schema validates the ruleset; the ruleset validates the payload. The validation execution script applies both without needing to know the future payload structure.

---

**You**

> What are the deterministic test we might like to perform on an input.

**Assistant**

For the configurable validation engine, we should identify the full range of **deterministic tests that can be declared in a ruleset and executed without subjective interpretation by the validator**.

These tests should be organized into families. Each family represents a class of operations that the executor knows how to perform, while the ruleset supplies the operands, constraints, and acceptance conditions.

## 1. Deterministic validation test catalog

| Category | Tests | Examples |
|---|---|---|
| 1. Presence | Required, optional, forbidden, nullability | `field A must exist` |
| 2. Type | String, number, integer, boolean, object, array, null | `age must be integer` |
| 3. Value | Equality, inequality, enum, constant | `status ∈ {accepted, rejected}` |
| 4. Numeric | Minimum, maximum, exclusive bounds, multiple of | `count >= 0` |
| 5. String | Length, regex, prefix, suffix, substring | `nonce matches pattern` |
| 6. Array | Minimum/maximum length, unique items, item types, positional constraints | `19 elements required` |
| 7. Object | Allowed keys, required keys, property count, dependent fields | `nonce requires timestamp` |
| 8. Nested structure | Recursive objects, nested arrays, schema references | `metadata.source.id is string` |
| 9. Conditional | If/then/else, implications, exclusive alternatives | `if status=accepted, require receipt` |
| 10. Logical composition | AND, OR, NOT, exactly one, all of | `one of three valid variants` |
| 11. Cross-field | Equality, ordering, arithmetic relationships, mutual exclusion | `start_index <= end_index` |
| 12. Referential | Referenced identifier exists, reference type matches | `contract_ref exists in registry` |
| 13. Temporal | Valid timestamps, ordering, permitted intervals | `created_at <= updated_at` |
| 14. State-transition | Allowed transition, invariant preservation, terminal-state restrictions | `index advances exactly once` |
| 15. Identity/integrity | SHA-256 equality, signature verification, immutable identifier checks | `payload digest matches receipt` |
| 16. Encoding/serialization | Valid JSON, UTF-8, canonical representation, byte limits | `input parses as JSON` |
| 17. Consistency | Duplicate detection, contradictions, repeated-value consistency | `nonce is unique in submitted array` |
| 18. Resource limits | Payload size, nesting depth, string length, schema complexity | `maximum depth 32` |
| 19. Authorization | Caller identity, allowed operations, destination restrictions | `caller may invoke route X` |
| 20. Protocol conformance | Version compatibility, permitted operation, required response shape | `contract_version = v1` |

Not all of these are expressible using standard JSON Schema alone. Cross-field comparisons, authorization, external reference existence, cryptographic checks, and state-transition validation generally require dedicated deterministic operators.

**Assistant**

For the configurable validation engine, we should identify the full range of **deterministic tests that can be declared in a ruleset and executed without subjective interpretation by the validator**.

These tests should be organized into families. Each family represents a class of operations that the executor knows how to perform, while the ruleset supplies the operands, constraints, and acceptance conditions.

## 1. Deterministic validation test catalog

| Category | Tests | Examples |
|---|---|---|
| 1. Presence | Required, optional, forbidden, nullability | `field A must exist` |
| 2. Type | String, number, integer, boolean, object, array, null | `age must be integer` |
| 3. Value | Equality, inequality, enum, constant | `status ∈ {accepted, rejected}` |
| 4. Numeric | Minimum, maximum, exclusive bounds, multiple of | `count >= 0` |
| 5. String | Length, regex, prefix, suffix, substring | `nonce matches pattern` |
| 6. Array | Minimum/maximum length, unique items, item types, positional constraints | `19 elements required` |
| 7. Object | Allowed keys, required keys, property count, dependent fields | `nonce requires timestamp` |
| 8. Nested structure | Recursive objects, nested arrays, schema references | `metadata.source.id is string` |
| 9. Conditional | If/then/else, implications, exclusive alternatives | `if status=accepted, require receipt` |
| 10. Logical composition | AND, OR, NOT, exactly one, all of | `one of three valid variants` |
| 11. Cross-field | Equality, ordering, arithmetic relationships, mutual exclusion | `start_index <= end_index` |
| 12. Referential | Referenced identifier exists, reference type matches | `contract_ref exists in registry` |
| 13. Temporal | Valid timestamps, ordering, permitted intervals | `created_at <= updated_at` |
| 14. State-transition | Allowed transition, invariant preservation, terminal-state restrictions | `index advances exactly once` |
| 15. Identity/integrity | SHA-256 equality, signature verification, immutable identifier checks | `payload digest matches receipt` |
| 16. Encoding/serialization | Valid JSON, UTF-8, canonical representation, byte limits | `input parses as JSON` |
| 17. Consistency | Duplicate detection, contradictions, repeated-value consistency | `nonce is unique in submitted array` |
| 18. Resource limits | Payload size, nesting depth, string length, schema complexity | `maximum depth 32` |
| 19. Authorization | Caller identity, allowed operations, destination restrictions | `caller may invoke route X` |
| 20. Protocol conformance | Version compatibility, permitted operation, required response shape | `contract_version = v1` |

Not all of these are expressible using standard JSON Schema alone. Cross-field comparisons, authorization, external reference existence, cryptographic checks, and state-transition validation generally require dedicated deterministic operators.

## 2. Three classes of deterministic tests

I would distinguish tests by what information they require.

<box gap={3}>
  <row align="start" gap={3}>
    <box background="surface-secondary" radius="lg" padding={2}>
      <icon name="check-check" size="lg"/>
    </box>
    <box flex="1" gap={1}>
      **Class A — Self-contained assertions**

      Evaluate the input using only its own contents and the ruleset. Examples include type checking, length, regex, required properties, numerical bounds, and local uniqueness.

      These are the simplest and most portable tests.
    </box>
  </row>
  <divider color="subtle"/>
  <row align="start" gap={3}>
    <box background="surface-secondary" radius="lg" padding={2}>
      <icon name="workflow" size="lg"/>
    </box>
    <box flex="1" gap={1}>
      **Class B — Relational assertions**

      Compare multiple values, possibly across a supplied current-state object, previous state, or transition proposal.

      Examples include index progression, previous-state preservation, cross-field equality, and consistency between a receipt and a transition.
    </box>
  </row>
  <divider color="subtle"/>
  <row align="start" gap={3}>
    <box background="surface-secondary" radius="lg" padding={2}>
      <icon name="shield-check" size="lg"/>
    </box>
    <box flex="1" gap={1}>
      **Class C — Context-dependent assertions**

      Validate against trusted external information supplied to or accessed by the executor.

      Examples include registered identifiers, authorization policies, persisted nonces, cryptographic keys, and externally stored hashes.
    </box>
  </row>
</box>

Class C can still be deterministic, but only relative to a specified, stable context snapshot. A validator that queries changing external state without controlling that context cannot guarantee identical results across repeated executions.

## 3. Shape the ruleset around test operators

Rather than embedding validation logic as executable JavaScript, the ruleset could declare operators and operands.

For example:

<CodeBlock language="json" editable>
{
  "contract_version": "validator-ruleset.v1",
  "ruleset_id": "sample.v1",
  "tests": [
    {
      "id": "T001",
      "operator": "type",
      "path": "/nonce",
      "expected": "string"
    },
    {
      "id": "T002",
      "operator": "min_length",
      "path": "/nonce",
      "value": 1
    },
    {
      "id": "T003",
      "operator": "enum",
      "path": "/status",
      "values": ["pending", "accepted", "rejected"]
    },
    {
      "id": "T004",
      "operator": "less_than_or_equal",
      "left_path": "/start_index",
      "right_path": "/end_index"
    }
  ]
}
</CodeBlock>

This is a candidate custom operator-based ruleset format, not standard JSON Schema. Each operator would need a precisely defined operand shape, type behavior, missing-path behavior, and error code.

The advantage is that the execution engine does not need to know anything about `nonce`, `status`, or indices. Those are merely data paths specified by the ruleset.

## 4. Test the validator itself

There is a second category of tests: deterministic conformance tests of the validator implementation.

These should establish that the executor behaves correctly, including when confronted with malformed rulesets.

| Executor test | Expected result |
|---|---|
| Valid ruleset, valid input | Accepted |
| Valid ruleset, invalid input | Rejected |
| Malformed ruleset | Execution error |
| Unknown operator | Execution error |
| Invalid operator operands | Execution error |
| Missing referenced input path | Defined failure or non-match according to operator |
| Identical input and ruleset | Identical validation verdict |
| Input object after validation | Unchanged |
| Duplicate rule identifiers | Ruleset rejected |
| Unsupported ruleset version | Execution error |
| Excessive payload or computation | Bounded failure |
| Conflicting rules | Evaluated by explicit logical semantics; no arbitrary resolution |

## 5. Design decision: a fixed vocabulary of operators

The key design choice is whether the validation engine accepts an arbitrary programming language or a restricted set of deterministic operators.

I recommend the restricted approach.

Each supported operator would have a formal contract defining its name, operands, accepted operand types, evaluation algorithm, output, and failure behavior. The ruleset meta-schema would then validate not just the overall ruleset shape but also every individual test declaration.

We would have:

\[
\text{Meta-schema}
\rightarrow
\text{Ruleset}
\rightarrow
\text{Test operators}
\rightarrow
\text{Validation result}
\]

**For the router specifically**, I would initially enable only self-contained structural tests, protocol assertions, and bounded integrity checks. State-transition rules, semantic evaluation, and domain-specific reference checks should remain outside its boundary validator.

That gives us a reusable validation engine without turning the stateless router into an orchestration or business-logic service.

**Assistant**

## 2. Three classes of deterministic tests

I would distinguish tests by what information they require.

<box gap={3}>
  <row align="start" gap={3}>
    <box background="surface-secondary" radius="lg" padding={2}>
      <icon name="check-check" size="lg"/>
    </box>
    <box flex="1" gap={1}>
      **Class A — Self-contained assertions**

      Evaluate the input using only its own contents and the ruleset. Examples include type checking, length, regex, required properties, numerical bounds, and local uniqueness.

      These are the simplest and most portable tests.
    </box>
  </row>
  <divider color="subtle"/>
  <row align="start" gap={3}>
    <box background="surface-secondary" radius="lg" padding={2}>
      <icon name="workflow" size="lg"/>
    </box>
    <box flex="1" gap={1}>
      **Class B — Relational assertions**

      Compare multiple values, possibly across a supplied current-state object, previous state, or transition proposal.

      Examples include index progression, previous-state preservation, cross-field equality, and consistency between a receipt and a transition.
    </box>
  </row>
  <divider color="subtle"/>
  <row align="start" gap={3}>
    <box background="surface-secondary" radius="lg" padding={2}>
      <icon name="shield-check" size="lg"/>
    </box>
    <box flex="1" gap={1}>
      **Class C — Context-dependent assertions**

      Validate against trusted external information supplied to or accessed by the executor.

      Examples include registered identifiers, authorization policies, persisted nonces, cryptographic keys, and externally stored hashes.
    </box>
  </row>
</box>

Class C can still be deterministic, but only relative to a specified, stable context snapshot. A validator that queries changing external state without controlling that context cannot guarantee identical results across repeated executions.

## 3. Shape the ruleset around test operators

Rather than embedding validation logic as executable JavaScript, the ruleset could declare operators and operands.

For example:

<CodeBlock language="json" editable>
{
  "contract_version": "validator-ruleset.v1",
  "ruleset_id": "sample.v1",
  "tests": [
    {
      "id": "T001",
      "operator": "type",
      "path": "/nonce",
      "expected": "string"
    },
    {
      "id": "T002",
      "operator": "min_length",
      "path": "/nonce",
      "value": 1
    },
    {
      "id": "T003",
      "operator": "enum",
      "path": "/status",
      "values": ["pending", "accepted", "rejected"]
    },
    {
      "id": "T004",
      "operator": "less_than_or_equal",
      "left_path": "/start_index",
      "right_path": "/end_index"
    }
  ]
}
</CodeBlock>

This is a candidate custom operator-based ruleset format, not standard JSON Schema. Each operator would need a precisely defined operand shape, type behavior, missing-path behavior, and error code.

The advantage is that the execution engine does not need to know anything about `nonce`, `status`, or indices. Those are merely data paths specified by the ruleset.

## 4. Test the validator itself

There is a second category of tests: deterministic conformance tests of the validator implementation.

These should establish that the executor behaves correctly, including when confronted with malformed rulesets.

| Executor test | Expected result |
|---|---|
| Valid ruleset, valid input | Accepted |
| Valid ruleset, invalid input | Rejected |
| Malformed ruleset | Execution error |
| Unknown operator | Execution error |
| Invalid operator operands | Execution error |
| Missing referenced input path | Defined failure or non-match according to operator |
| Identical input and ruleset | Identical validation verdict |
| Input object after validation | Unchanged |
| Duplicate rule identifiers | Ruleset rejected |
| Unsupported ruleset version | Execution error |
| Excessive payload or computation | Bounded failure |
| Conflicting rules | Evaluated by explicit logical semantics; no arbitrary resolution |

## 5. Design decision: a fixed vocabulary of operators

The key design choice is whether the validation engine accepts an arbitrary programming language or a restricted set of deterministic operators.

I recommend the restricted approach.

Each supported operator would have a formal contract defining its name, operands, accepted operand types, evaluation algorithm, output, and failure behavior. The ruleset meta-schema would then validate not just the overall ruleset shape but also every individual test declaration.

We would have:

\[
\text{Meta-schema}
\rightarrow
\text{Ruleset}
\rightarrow
\text{Test operators}
\rightarrow
\text{Validation result}
\]

**For the router specifically**, I would initially enable only self-contained structural tests, protocol assertions, and bounded integrity checks. State-transition rules, semantic evaluation, and domain-specific reference checks should remain outside its boundary validator.

That gives us a reusable validation engine without turning the stateless router into an orchestration or business-logic service.

---

**You**

> What are the tests that we typically perform?

**Assistant**

In a typical software validation system, most input checks fall into **10 common categories**. These are the tests I would prioritize for the configurable validator.

| Test | What it checks | Example |
|---|---|---|
| 1. Presence | Required or forbidden fields | `nonce` must exist |
| 2. Type | Correct data type | `index` must be an integer |
| 3. Format | Recognized representation | Valid UUID, date, email, or JSON |
| 4. Range | Numeric or length boundaries | `index` between 0 and 18 |
| 5. Membership | Value belongs to permitted set | `status` is `accepted` or `rejected` |
| 6. Pattern | Text matches a defined expression | Nonce matches a regex |
| 7. Structure | Objects, arrays, nesting, and allowed properties | Array contains exactly 19 elements |
| 8. Uniqueness | Values or identifiers are not duplicated | Each test ID appears once |
| 9. Relationships | Multiple values satisfy a constraint | `start_index <= end_index` |
| 10. Conditional rules | Requirements depend on other values | If accepted, a receipt is required |

## Additional tests commonly used in execution systems

For the IssueScratch router and FSM architecture, another five are particularly relevant.

| Test | Purpose |
|---|---|
| Schema compatibility | Ruleset conforms to its own meta-schema |
| Reference integrity | Referenced contracts, paths, or identifiers exist |
| State invariants | Proposed state satisfies deterministic transition rules |
| Digest verification | SHA-256 matches the expected content |
| Protocol validation | Request follows the specified version and operation contract |

## Typical validation sequence

<box border radius="lg" padding={3} gap={2}>
  <list marker="number" gap={2}>
    <list-item>**Parse:** Is the input syntactically valid?</list-item>
    <list-item>**Shape:** Does it contain the expected structure and fields?</list-item>
    <list-item>**Type:** Are the values the correct types?</list-item>
    <list-item>**Constraints:** Do values satisfy bounds, patterns, enums, and uniqueness requirements?</list-item>
    <list-item>**Relationships:** Are cross-field and conditional requirements satisfied?</list-item>
    <list-item>**Integrity:** Are references, identifiers, and supplied digests consistent?</list-item>
    <list-item>**Verdict:** Return accepted, rejected, or execution error with structured diagnostics.</list-item>
  </list>
</box>

This is a logical evaluation sequence; independent checks can run in a different order if the contract defines how errors are collected.

### Recommended minimal operator set

For a general-purpose configurable validator, I would start with these operators:

`required`, `forbidden`, `type`, `equals`, `enum`, `minimum`, `maximum`, `minLength`, `maxLength`, `pattern`, `minItems`, `maxItems`, `uniqueItems`, `properties`, `additionalProperties`, `allOf`, `anyOf`, `oneOf`, `not`, `if/then/else`.

These correspond closely to established JSON Schema validation capabilities.

**The critical distinction:** Most input validation is structural and can be performed without understanding the input's meaning. Semantic correctness, FSM progression, and authorization require additional contracts or trusted context.

For the stateless router, structural and protocol validation should be the default. The other checks should be invoked only when explicitly configured.

---

**You**

> What are the tests we are performing on inputs in this case?

**Assistant**

In the current **IssueScratch architecture**, we are validating inputs submitted through GitHub issue comments before passing them through the stateless router to the finite state machine.

The important distinction is that these are not arbitrary inputs. They are submissions to a prescribed, indexed procedure with an expected input structure, current state, and transition contract.

We therefore need to validate two things separately:

1. **The incoming request:** Whether the router can safely and correctly interpret and dispatch it.
2. **The submitted procedural input:** Whether the submission satisfies the requirements of the current FSM index.

**Assistant**

In the current **IssueScratch architecture**, we are validating inputs submitted through GitHub issue comments before passing them through the stateless router to the finite state machine.

The important distinction is that these are not arbitrary inputs. They are submissions to a prescribed, indexed procedure with an expected input structure, current state, and transition contract.

We therefore need to validate two things separately:

1. **The incoming request:** Whether the router can safely and correctly interpret and dispatch it.
2. **The submitted procedural input:** Whether the submission satisfies the requirements of the current FSM index.

I checked the current IssueScratch implementation and its documented validation procedure.

The existing input-validation specification defines **nine deterministic predicates (V01–V09)**:

| ID | Test actually specified | Failure code |
|---|---|---|
| V01 | Input parses as exactly one JSON value, without surrounding prose or Markdown | `INVALID_JSON` |
| V02 | Parsed root is a JSON array | `INVALID_ROOT` |
| V03 | Every array element is an object with exactly one `scratchpad` key, containing a nonempty object | `INVALID_WRAPPER` |
| V04 | Candidate submission identity matches the supplied validation context | `SOURCE_MISMATCH` |
| V05 | Candidate adds exactly one entry at the expected index | `OUT_OF_SEQUENCE` |
| V06 | Previously accepted entries remain unchanged | `PREFIX_CHANGED` |
| V07 | The current index has a uniquely resolvable contract | `CONTRACT_UNAVAILABLE` |
| V08 | New scratchpad satisfies the current index's required structural fields and types | `INVALID_FIELD` |
| V09 | Operation-specific or conditional output fields satisfy the applicable structural contract | `INVALID_OPERATION_OUTPUT` |

Source: [IssueScratch input-validation specification](https://github.com/BestNameYet/IssueScratch/blob/main/docs/agent-input-validation-procedure.json)

## What the current JavaScript actually executes

The existing [input-validator.js](https://github.com/BestNameYet/IssueScratch/blob/main/src/input-validator.js) implements much of this behavior, but there are notable differences:

- **V01–V03:** Explicitly implemented.
- **V05:** Checks array length and expected index; checks progression values when a state snapshot is supplied.
- **V06:** Checks the accepted-prefix SHA-256 when state is supplied.
- **V08–V09:** Delegates structural validation to `validateEntryStructure()` using the canonical controller profile.
- **V04:** Does not explicitly compare a candidate identity against a separate expected identity.
- **V07:** Does not explicitly implement the documented unique-contract resolution procedure in this file.

The validator also checks the types of `raw_input`, `metadata`, and `metadata.expected_index`, and computes a SHA-256 digest of the raw submission.

## Crucial distinction

The existing validation system is **not yet the fully configurable ruleset-driven validator we have been discussing**.

It implements IssueScratch-specific assumptions directly in JavaScript, including the root-array format, `scratchpad` wrapper, index progression, and optional state-prefix check.

Moreover, the [stateless router](https://github.com/BestNameYet/IssueScratch/blob/main/src/stateless-router-server.js) currently matches configured HTTP routes and forwards requests. It does not execute a configurable payload-validation ruleset before forwarding.

**Therefore, our immediate architectural requirement is to express these nine predicates as declarations in a ruleset, while making the validation executor independent of IssueScratch's specific input format.**

That would preserve the existing validation requirements while allowing future services to supply completely different input contracts without rewriting the execution engine.

**Assistant**

I checked the current IssueScratch implementation and its documented validation procedure.

The existing input-validation specification defines **nine deterministic predicates (V01–V09)**:

| ID | Test actually specified | Failure code |
|---|---|---|
| V01 | Input parses as exactly one JSON value, without surrounding prose or Markdown | `INVALID_JSON` |
| V02 | Parsed root is a JSON array | `INVALID_ROOT` |
| V03 | Every array element is an object with exactly one `scratchpad` key, containing a nonempty object | `INVALID_WRAPPER` |
| V04 | Candidate submission identity matches the supplied validation context | `SOURCE_MISMATCH` |
| V05 | Candidate adds exactly one entry at the expected index | `OUT_OF_SEQUENCE` |
| V06 | Previously accepted entries remain unchanged | `PREFIX_CHANGED` |
| V07 | The current index has a uniquely resolvable contract | `CONTRACT_UNAVAILABLE` |
| V08 | New scratchpad satisfies the current index's required structural fields and types | `INVALID_FIELD` |
| V09 | Operation-specific or conditional output fields satisfy the applicable structural contract | `INVALID_OPERATION_OUTPUT` |

Source: [IssueScratch input-validation specification](https://github.com/BestNameYet/IssueScratch/blob/main/docs/agent-input-validation-procedure.json)

## What the current JavaScript actually executes

The existing [input-validator.js](https://github.com/BestNameYet/IssueScratch/blob/main/src/input-validator.js) implements much of this behavior, but there are notable differences:

- **V01–V03:** Explicitly implemented.
- **V05:** Checks array length and expected index; checks progression values when a state snapshot is supplied.
- **V06:** Checks the accepted-prefix SHA-256 when state is supplied.
- **V08–V09:** Delegates structural validation to `validateEntryStructure()` using the canonical controller profile.
- **V04:** Does not explicitly compare a candidate identity against a separate expected identity.
- **V07:** Does not explicitly implement the documented unique-contract resolution procedure in this file.

The validator also checks the types of `raw_input`, `metadata`, and `metadata.expected_index`, and computes a SHA-256 digest of the raw submission.

## Crucial distinction

The existing validation system is **not yet the fully configurable ruleset-driven validator we have been discussing**.

It implements IssueScratch-specific assumptions directly in JavaScript, including the root-array format, `scratchpad` wrapper, index progression, and optional state-prefix check.

Moreover, the [stateless router](https://github.com/BestNameYet/IssueScratch/blob/main/src/stateless-router-server.js) currently matches configured HTTP routes and forwards requests. It does not execute a configurable payload-validation ruleset before forwarding.

**Therefore, our immediate architectural requirement is to express these nine predicates as declarations in a ruleset, while making the validation executor independent of IssueScratch's specific input format.**

That would preserve the existing validation requirements while allowing future services to supply completely different input contracts without rewriting the execution engine.

---

**You**

> We only want to validate #1 pre router

**Assistant**

Understood. **Only V01 — JSON syntax validation — will execute before the router.**

The pre-router validator has one responsibility: determine whether the incoming raw input is syntactically valid JSON.

| Condition | Result |
|---|---|
| Input parses as exactly one JSON value | Accept and forward to router |
| Input contains malformed JSON | Reject with `INVALID_JSON` |
| Input contains additional non-whitespace content after the JSON value | Reject with `INVALID_JSON` |

The validator will **not** check root type, required fields, array structure, scratchpad wrappers, state progression, or semantic correctness.

Its contract is:

\[
V(\text{raw input}) \rightarrow \{\text{valid},\text{invalid}\}
\]

The accepted JSON value may be an object, array, string, number, boolean, or `null`.

**Execution boundary:** The pre-router validator performs only syntax validation. All subsequent validation remains the responsibility of downstream components.

No repository modifications have been made.

---

**You**

> Therefore lets define allowed router input.

**Assistant**

## Allowed Router Input — Contract v1

The router should accept **any syntactically valid JSON value** from the pre-router validator.

Because V01 is the only pre-router validation predicate, the router must not assume that its input is an object, array, or any particular application-specific structure.

### 1. Admissible input types

| JSON type | Example | Allowed |
|---|---|---|
| Object | `{"operation":"transition"}` | Yes |
| Array | `[1,2,3]` | Yes |
| String | `"hello"` | Yes |
| Number | `42` | Yes |
| Boolean | `true` | Yes |
| Null | `null` | Yes |

### 2. Router input contract

<CodeBlock language="json" editable>
{
  "contract_id": "router-input.v1",
  "encoding": "UTF-8",
  "serialization": "JSON",
  "syntax_validation": "V01",
  "accepted_json_types": [
    "object",
    "array",
    "string",
    "number",
    "boolean",
    "null"
  ],
  "payload_mutation": false,
  "application_schema": null,
  "routing": {
    "selection_source": "trusted_configuration",
    "payload_independent": true
  }
}
</CodeBlock>

### 3. Routing metadata

The router still requires enough information to identify a destination. That information should come from the **HTTP request and trusted route configuration**, not from assumptions about the JSON payload.

For example:

<CodeBlock language="http">
POST /fsm/transition HTTP/1.1
Content-Type: application/json

{"current_state":8,"input":{"scratchpad":{}}}
</CodeBlock>

Here, `/fsm/transition` selects the destination. The JSON body remains opaque to the router.

### 4. Router behavior

1. Receive a request containing V01-validated JSON.
2. Match the HTTP method and path against configured routes.
3. Forward the original payload to the configured destination without changing its content.
4. Return the downstream response or a transport-level error.

An unknown route is a routing failure, not a JSON validation failure.

**Boundary invariant:** The router may inspect the HTTP envelope for routing purposes, but it must not inspect, interpret, transform, or validate the application-level JSON structure.

This establishes a fixed router interface that supports arbitrary future payload structures without changing the router's validation contract.

The current IssueScratch router forwards raw HTTP request bodies; it does not yet enforce this V01 pre-router boundary. No repository changes have been made.

---

**You**

> We definte the API.  Let's define the route endpoints.

**Assistant · Commentary**

> I’ll check the existing route configuration and service interfaces, then define the API endpoints without adding application logic to the router.

**Assistant**

# Stateless Router API — Endpoint Contract v1

The API should expose the independent services through a single router address, with routing determined by the **HTTP method and endpoint path**, not by the contents of the JSON payload.

I verified that IssueScratch currently defines three forwarding routes and a health endpoint in [`config/stateless-services.json`](https://github.com/BestNameYet/IssueScratch/blob/main/config/stateless-services.json).

## 1. Proposed endpoint registry

| Method | Public endpoint | Destination | Purpose |
|---|---|---|---|
| `POST` | `/state` | FSM service | Request a state transition |
| `POST` | `/validate` | Validation service | Validate a procedural submission |
| `POST` | `/render` | Renderer service | Produce rendered output |
| `GET` | `/health` | Router itself | Check router availability |

These preserve the existing configured endpoint names.

The router exposes one base address:

`http://127.0.0.1:8787`

The underlying services have separate local addresses.

## 2. Routing topology

<box border radius="xl" padding={3} gap={2}>
  <svg viewBox="0 0 340 274" width="100%">
    <rect x="6" y="96" width="131" height="73" rx="8" fill="none" stroke="currentColor" strokeWidth="1.4"/>
    <text x="71" y="117" fill="currentColor" fontWeight="600" fontSize="12" textAnchor="middle">HTTP Router</text>
    <text x="71" y="136" fill="currentColor" fontSize="11" textAnchor="middle">127.0.0.1:8787</text>
    <text x="71" y="153" fill="currentColor" fontSize="10" textAnchor="middle">Stateless</text>
    {#each [{y:10,path:"/state",t:"FSM",port:"8788"},{y:101,path:"/validate",t:"Validator",port:"8790"},{y:192,path:"/render",t:"Renderer",port:"8789"}] as n}
      <path d={`M137 133 H158 V${n.y+26} H197`} stroke="currentColor" strokeWidth="1.3" fill="none"/>
      <path d={`M192 ${n.y+22} L198 ${n.y+26} L192 ${n.y+30}`} stroke="currentColor" strokeWidth="1.3" fill="none"/>
      <rect x="198" y={n.y} width="134" height="53" rx="7" fill="none" stroke="currentColor" strokeWidth="1.2"/>
      <text x="265" y={n.y+17} fill="currentColor" fontWeight="600" fontSize="12" textAnchor="middle">{n.t}</text>
      <text x="265" y={n.y+34} fill="currentColor" fontSize="10" textAnchor="middle">127.0.0.1:{n.port}</text>
      <text x="170" y={n.y+16} fill="currentColor" fontSize="9" textAnchor="middle">{n.path}</text>
    {/each}
    <text x="71" y="187" fill="currentColor" fontSize="10" textAnchor="middle">GET /health is local</text>
  </svg>
</box>

## 3. Endpoint behavior

### `POST /state`

Forwards the JSON body unchanged to the FSM's `POST /transition` endpoint. The FSM receives the supplied current state and input and returns a transition result. The router does not determine whether the transition is valid.

### `POST /validate`

Forwards the JSON body unchanged to the domain validation service's `POST /validate` endpoint. The downstream validator performs the checks applicable to that operation.

This is distinct from the proposed **pre-router V01 syntax check**, which only determines whether the incoming body is valid JSON.

### `POST /render`

Forwards the JSON body unchanged to the renderer's `POST /render` endpoint. The renderer processes the supplied projection and bindings independently of the FSM.

### `GET /health`

Returns:

```json
{
  "ok": true
}
```

This verifies that the router is responding, not that every downstream service is healthy.

## 4. API-level invariants

All three POST endpoints should obey the same transport contract:

- Request body must contain exactly one syntactically valid JSON value, with no restriction on its JSON root type.
- Route matching uses the HTTP method and pathname.
- Destination selection uses trusted configuration.
- The router must not alter the request body or inspect application-level fields.
- An unmatched endpoint returns `404`.
- A downstream connection failure returns `502`.
- The router must not maintain application state, perform FSM transitions, or render content.
- Downstream validation errors remain the responsibility of the destination service.

For a strictly enforced V01 boundary, the syntax validator must be placed ahead of the router's forwarding operation. The current router does not yet enforce that prerequisite.

## 5. Versioning and extension

I recommend retaining the four existing paths as **API v1**, rather than introducing unnecessary endpoint aliases.

Future services would be added through the routing configuration:

```json
{
  "method": "POST",
  "path": "/example",
  "service": "example-service",
  "upstream_path": "/execute"
}
```

That example is a proposed extension pattern, not an existing endpoint.

**Architectural decision:** The API's endpoint registry and routing configuration define where messages go. The pre-router validator establishes JSON syntax validity. Downstream services define what the messages mean.

This defines the initial API without modifying any repository files.

---

**You**

> the validate service is currently a preprocessor for the FSM, let's include it but it should be for testing...it simply never forwards payloads to the FSM under /validate

**Assistant**

Agreed. We should retain `POST /validate` as an **independent testing endpoint**, separate from the normal FSM execution path.

The validation service remains the FSM's preprocessing validator, but its public `/validate` endpoint performs validation only. It never forwards the payload to the FSM or initiates a transition.

## Revised API contract

| Method | Endpoint | Behavior | Forwards to FSM? |
|---|---|---|---|
| `POST` | `/state` | Route a state-transition request to the FSM execution path | Yes, after required preprocessing |
| `POST` | `/validate` | Execute validation and return the results | **Never** |
| `POST` | `/render` | Route a rendering request to the renderer | No |
| `GET` | `/health` | Return router health status | No |

## Validation service: two invocation contexts

<box border radius="lg" padding={3} gap={2}>
  <svg viewBox="0 0 340 238" width="100%">
    <g fill="none" stroke="currentColor" strokeWidth="1.3">
      <rect x="6" y="9" width="103" height="40" rx="7"/>
      <rect x="137" y="9" width="192" height="40" rx="7"/>
      <rect x="137" y="92" width="192" height="44" rx="7"/>
      <rect x="137" y="182" width="192" height="40" rx="7"/>
      <path d="M109 29 H134 M130 25 L135 29 L130 33"/>
      <path d="M233 49 V89 M229 85 L233 90 L237 85"/>
      <path d="M233 136 V179 M229 175 L233 180 L237 175"/>
    </g>
    <g fill="currentColor" fontSize="11" textAnchor="middle">
      <text x="57" y="24">POST</text>
      <text x="57" y="38">/state</text>
      <text x="233" y="25">Validator</text>
      <text x="233" y="39">Preprocessing</text>
      <text x="233" y="109">Validated input</text>
      <text x="233" y="124">or rejection</text>
      <text x="233" y="198">FSM transition</text>
      <text x="233" y="211">Accepted only</text>
    </g>
    <rect x="6" y="92" width="103" height="44" rx="7" fill="none" stroke="currentColor" strokeWidth="1.3"/>
    <g stroke="currentColor" fill="none" strokeWidth="1.3">
      <path d="M109 113 H134 M130 109 L135 113 L130 117"/>
    </g>
    <text x="57" y="108" fontSize="11" fill="currentColor" textAnchor="middle">POST</text>
    <text x="57" y="122" fontSize="11" fill="currentColor" textAnchor="middle">/validate</text>
    <text x="57" y="154" fontSize="10" fill="currentColor" textAnchor="middle">Test only</text>
    <text x="57" y="166" fontSize="10" fill="currentColor" textAnchor="middle">Return verdict</text>
  </svg>
  <caption>Conceptual processing behavior. The validator never independently calls the FSM.</caption>
</box>

### Endpoint-specific invariants

**`POST /validate`**

- Executes the supplied validation procedure against the candidate.
- Returns acceptance, rejection, or execution failure.
- Does not invoke the FSM.
- Does not advance or persist state.
- Does not produce a rendering request.

**`POST /state`**

- Uses the validation service as a prerequisite to FSM execution.
- Invokes the FSM only when preprocessing succeeds.
- Does not advance state when validation rejects the input.
- Leaves persistence to the external caller.

One implementation distinction matters: the current IssueScratch router only forwards `/state` directly to the FSM and `/validate` directly to the validator. The mandatory validation-before-FSM sequence is **not currently implemented by the stateless router**. It should be coordinated by the calling workflow or another explicitly authorized component, rather than adding orchestration logic to the router.

**Contract decision:** `/validate` is a terminal validation endpoint. A successful response means the input passed validation; it does not authorize that endpoint to initiate a state transition.

No repository changes were made.

---

**You**

> Is render necessary, render is the default action when the FSM responds to the router.

**Assistant**

No. **A separate public `/render` endpoint is unnecessary** if rendering is the default action after the FSM returns its response to the router.

The renderer should remain an independent service, but the router can invoke it as the configured next destination.

## Revised API

| Method | Endpoint | Behavior |
|---|---|---|
| `POST` | `/state` | Validate input → FSM → Renderer → Return output |
| `POST` | `/validate` | Validate input → Return test result; never invoke FSM |
| `GET` | `/health` | Return router health status |

## Default execution flow

<box border radius="lg" padding={3}>
  <svg viewBox="0 0 340 218" width="100%">
    {#each [{x:8,y:12,w:92,h:37,t:"Router"},{x:127,y:12,w:112,h:37,t:"Validator"},{x:127,y:98,w:112,h:37,t:"FSM"},{x:127,y:169,w:112,h:37,t:"Renderer"}] as n}
      <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="6" stroke="currentColor" fill="none"/>
      <text x={n.x+n.w/2} y={n.y+23} fontSize="12" textAnchor="middle" fill="currentColor">{n.t}</text>
    {/each}
    <g stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round">
      <path d="M100 30 H124 M120 26 L125 30 L120 34"/>
      <path d="M183 49 V95 M179 91 L183 96 L187 91"/>
      <path d="M183 135 V166 M179 162 L183 167 L187 162"/>
      <path strokeDasharray="4 4" d="M127 188 H54 V52"/>
    </g>
    <text x="59" y="119" fontSize="10" textAnchor="middle" fill="currentColor">Rendered</text>
    <text x="59" y="132" fontSize="10" textAnchor="middle" fill="currentColor">response</text>
    <text x="183" y="75" fontSize="10" fill="currentColor" textAnchor="middle">If accepted</text>
    <text x="264" y="153" fontSize="10" fill="currentColor">Default</text>
  </svg>
</box>

The router would use a configured sequence:

`input → validation → FSM → rendering → response`

For rejected user input, the validation result would be rendered as an input error without invoking the FSM. Internal errors would go to the diagnostic channel rather than automatically appearing in the normal rendering flow.

### Architectural implication

This introduces a distinction worth making explicit: the router remains **stateless**, but it is now responsible for coordinating a predetermined sequence of service calls. Statelessness does not prohibit that coordination, although it goes beyond a pure forwarding proxy.

The FSM and renderer remain independent and unaware of each other. The router manages their communication.

**Recommendation:** Remove `/render` from the public API, retain the renderer as an internal service, and define rendering as the default post-FSM operation for `/state`.

This is a proposed contract revision; no implementation changes have been made.

---

**You**

> The FSM doesn't communicate with the renderer

**Assistant**

Correct. **The FSM and renderer have no direct communication or dependency.** Both communicate exclusively through the router.

The execution sequence is:

1. The router receives the request.
2. The router sends the input to the validation service.
3. If accepted, the router sends the validated input and supplied state to the FSM.
4. The FSM returns its transition result **to the router**.
5. The router sends the appropriate result and rendering inputs **to the renderer**.
6. The renderer returns the rendered output **to the router**.
7. The router returns the response to the caller.

<box border radius="lg" padding={3} gap={2}>
  <svg viewBox="0 0 340 231" width="100%">
    <rect x="8" y="79" width="108" height="69" rx="8" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    <text x="62" y="107" fontSize="13" fontWeight="600" textAnchor="middle" fill="currentColor">Router</text>
    <text x="62" y="123" fontSize="10" textAnchor="middle" fill="currentColor">Central dispatcher</text>
    {#each [{y:9,t:"Validator"},{y:92,t:"FSM"},{y:175,t:"Renderer"}] as a}
      <rect x="222" y={a.y} width="110" height="40" rx="7" fill="none" stroke="currentColor" strokeWidth="1.2"/>
      <text x="277" y={a.y+25} fontSize="12" textAnchor="middle" fill="currentColor">{a.t}</text>
      <path d={`M116 111 H168 V${a.y+15} H218`} stroke="currentColor" strokeWidth="1.2" fill="none"/>
      <path d={`M218 ${a.y+34} H181 V136 H116`} stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 3" fill="none"/>
    {/each}
  </svg>
  <caption>Solid lines: router requests. Dashed lines: service responses to router. No direct service-to-service connections.</caption>
</box>

The FSM does not know that a renderer exists. The renderer does not know that an FSM exists. The router holds the configuration that connects their independent interfaces.

For `POST /validate`, the router returns the validation result without proceeding to the FSM.

**No direct FSM-to-renderer communication is required or permitted under this contract.**

---

**You**

> The Router strictly doesn't communicate directly with the FSM, it communicates with the validator.

**Assistant**

The router communicates with the **validator**, not directly with the FSM.

That changes the execution contract:

1. **Router → Validator:** Submit incoming payload and validation context.
2. **Validator → FSM:** Forward accepted input for state-transition processing.
3. **FSM → Validator:** Return the transition result.
4. **Validator → Router:** Return the validated transition result, including any output-contract checks.
5. **Router → Renderer:** Submit the result for rendering.
6. **Renderer → Router:** Return the rendered output.
7. **Router → Caller:** Deliver the response.

## Architecture

<box border radius="lg" padding={3}>
  <svg viewBox="0 0 320 270" width="100%">
    {#each [{y:8,t:"Router"},{y:76,t:"Validator"},{y:144,t:"FSM"},{y:222,t:"Renderer"}] as n}
      <rect x="96" y={n.y} width="128" height="39" rx="7" fill="none" stroke="currentColor" strokeWidth="1.3"/>
      <text x="160" y={n.y+24} textAnchor="middle" fontSize="12" fill="currentColor">{n.t}</text>
    {/each}
    <g stroke="currentColor" strokeWidth="1.5" fill="none">
      <path d="M143 47 V73 l-4 -6 m4 6 l4 -6"/>
      <path d="M177 76 V50 l-4 6 m4 -6 l4 6" strokeDasharray="4 3"/>
      <path d="M143 115 V141 l-4 -6 m4 6 l4 -6"/>
      <path d="M177 144 V118 l-4 6 m4 -6 l4 6" strokeDasharray="4 3"/>
      <path d="M224 27 H267 V241 H227 l7 -4 m-7 4 l7 4"/>
      <path d="M96 241 H53 V27 H93 l-7 -4 m7 4 l-7 4" strokeDasharray="4 3"/>
    </g>
  </svg>
</box>

### `/validate` exception

`POST /validate` invokes the validator in **test-only mode**. It returns the validation verdict directly to the router and never forwards the payload to the FSM.

### Architectural invariants

- The router has no direct FSM connection.
- The FSM has no direct renderer connection.
- The validator is the exclusive gateway to the FSM.
- Only accepted inputs may reach the FSM.
- FSM output validation occurs before the router receives the transition result.
- Rendering is initiated by the router, not by the FSM or validator.
- Application state remains external to these stateless services.

**Important:** This is the architecture now being specified, not the currently implemented IssueScratch topology. The existing implementation would need modification to conform.

---

**You**

> The validator communicates with the routers validator.

**Assistant**

The architecture must distinguish **two independent validators**:

1. **Router Validator (V01):** Validates JSON syntax at the router boundary.
2. **FSM Validator:** Validates procedural inputs and FSM outputs, communicating with the Router Validator rather than directly with the router's routing logic.

## Revised communication architecture

<box border radius="lg" padding={3}>
  <svg viewBox="0 0 340 293" width="100%">
    {#each [{x:10,y:105,w:91,h:45,t:"Router"},{x:128,y:105,w:112,h:45,t:"Router Validator"},{x:128,y:15,w:112,h:45,t:"FSM Validator"},{x:265,y:15,w:68,h:45,t:"FSM"},{x:128,y:233,w:112,h:45,t:"Renderer"}] as n}
      <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="7" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      <text x={n.x+n.w/2} y={n.y+n.h/2+4} fontSize={n.t==="Router Validator"||n.t==="FSM Validator"?10:12} textAnchor="middle" fill="currentColor">{n.t}</text>
    {/each}
    <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M101 119 H125 M121 115 L126 119 L121 123"/>
      <path d="M128 137 H104 M108 133 L103 137 L108 141" strokeDasharray="4 3"/>
      <path d="M168 105 V63 M164 67 L168 61 L172 67"/>
      <path d="M200 60 V103 M196 99 L200 105 L204 99" strokeDasharray="4 3"/>
      <path d="M240 28 H262 M258 24 L264 28 L258 32"/>
      <path d="M265 46 H243 M247 42 L241 46 L247 50" strokeDasharray="4 3"/>
      <path d="M55 150 V257 H125 M121 253 L127 257 L121 261"/>
      <path d="M128 271 H42 V151" strokeDasharray="4 3"/>
    </g>
    <text x="270" y="88" fontSize="10" fill="currentColor" textAnchor="middle">Solid: request</text>
    <text x="270" y="101" fontSize="10" fill="currentColor" textAnchor="middle">Dashed: response</text>
  </svg>
</box>

## Normal `/state` execution

1. Router receives a request and passes it to Router Validator.
2. Router Validator performs V01 JSON syntax validation.
3. Router Validator communicates with FSM Validator.
4. FSM Validator validates the procedural input.
5. FSM Validator communicates with FSM and receives its transition result.
6. FSM Validator checks the output contract and returns the result to Router Validator.
7. Router Validator returns the result to Router.
8. Router sends the result to Renderer and receives the rendered response.
9. Router responds to the caller.

For `POST /validate`, processing stops after the FSM Validator returns its validation verdict to Router Validator. No FSM execution occurs.

**Invariant:** The Router never communicates directly with the FSM Validator or FSM. The FSM Validator communicates with the Router Validator, and the FSM communicates exclusively with the FSM Validator.

This is the revised proposed architecture. No repository changes have been made.

---

**You**

> Essently the endpoints hit the router validator first

**Assistant**

Correct. **Every incoming API request passes through the Router Validator before the router performs any dispatch.**

The Router Validator is the common entry boundary for all endpoints.

## Endpoint processing

| Endpoint | First operation | Subsequent routing |
|---|---|---|
| `POST /state` | Router Validator (V01) | FSM Validator → FSM → FSM Validator → Router Validator → Router → Renderer |
| `POST /validate` | Router Validator (V01) | FSM Validator → Router Validator → Return test result |
| `GET /health` | Router Validator (HTTP protocol checks only) | Router health response |

The Router Validator applies JSON syntax validation to POST bodies. A GET request without a body does not require JSON parsing.

## Communication contract

<box border radius="lg" padding={3} gap={2}>
  <svg viewBox="0 0 320 276" width="100%">
    {#each [{x:80,y:4,w:160,h:35,t:"Incoming API request"},{x:80,y:59,w:160,h:40,t:"Router Validator"},{x:80,y:119,w:160,h:40,t:"FSM Validator"},{x:80,y:179,w:160,h:40,t:"FSM"}] as n}
      <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="7" fill="none" stroke="currentColor" strokeWidth="1.2"/>
      <text x={n.x+n.w/2} y={n.y+n.h/2+4} fontSize="12" fill="currentColor" textAnchor="middle">{n.t}</text>
    {/each}
    <g stroke="currentColor" strokeWidth="1.4" fill="none">
      <path d="M160 39 V56 M156 52 L160 58 L164 52"/>
      <path d="M144 99 V116 M140 112 L144 118 L148 112"/>
      <path d="M144 159 V176 M140 172 L144 178 L148 172"/>
      <path d="M176 179 V162 M172 166 L176 160 L180 166" strokeDasharray="4 3"/>
      <path d="M176 119 V102 M172 106 L176 100 L180 106" strokeDasharray="4 3"/>
    </g>
    <text x="160" y="249" fontSize="11" textAnchor="middle" fill="currentColor">Results return through the validator boundary</text>
  </svg>
</box>

The router's dispatch logic remains separate from the Router Validator. After the FSM result has returned through the validation boundary, the router invokes the renderer by default.

**The defining invariant is that no endpoint bypasses the Router Validator.** The FSM Validator is responsible for procedural validation, while the Router Validator enforces the common API input boundary and mediates its responses.

---

**You**

> So when a POST is made, we have to say what it must include to be valid

**Assistant**

Yes. We need to define the **HTTP POST request contract** that every request must satisfy before the Router Validator permits processing.

The contract should distinguish between the required HTTP envelope and the application payload, whose structure is determined by downstream validators.

## Proposed POST request contract v1

| Component | Requirement | Validation |
|---|---|---|
| HTTP method | Must be `POST` | Exact match |
| Endpoint | Must be a registered path | Route membership |
| Content-Type | Must be `application/json` | Header check |
| Body | Required and nonempty | Presence |
| JSON syntax | Exactly one valid JSON value | V01 |
| Payload structure | Any valid JSON type | No structural restrictions |
| Body size | Within configured maximum | Byte count |
| Authentication | Required if endpoint policy specifies it | Independent security check |

## Example request

```http
POST /state HTTP/1.1
Host: 127.0.0.1:8787
Content-Type: application/json

{
  "current_state": 8,
  "input": {
    "scratchpad": {
      "text[string]": "Example"
    }
  }
}
```

The Router Validator only verifies the HTTP contract and JSON syntax. It does not check whether `current_state`, `input`, or `scratchpad` exist. That is the responsibility of the FSM Validator.

## Endpoint-specific contracts

| Endpoint | Required request contents |
|---|---|
| `POST /state` | Valid JSON body; downstream FSM Validator determines the required fields |
| `POST /validate` | Valid JSON body; downstream validator determines the test-input structure |

This preserves our decision that **V01 is the only application-payload test performed at the router boundary**. HTTP method, path, Content-Type, and transport-size checks are separate protocol requirements.

## Recommended response codes

| Code | Meaning |
|---|---|
| `200` | Request processed successfully |
| `400` | Malformed JSON |
| `404` | Unknown endpoint |
| `405` | Method not allowed for a known endpoint |
| `413` | Payload exceeds maximum size |
| `415` | Unsupported Content-Type |
| `502` | Downstream service unavailable |

### Important design choice

We should **not require an `operation`, `state`, `metadata`, or `payload` field in every POST request** unless we deliberately introduce a common application envelope.

Since the endpoint already determines the operation, a mandatory `operation` field would be redundant.

**My recommendation:** Make the POST request contract fixed at the HTTP and JSON-syntax level, then let each destination service define the shape of its own payload.

That gives the Router Validator a stable, deterministic contract without making future payload formats dependent on the router.

---

**You**

> Yes, essentially the router endpoints is the service it offers

**Assistant**

Exactly. **The router's API endpoints define the services it offers to callers.** The endpoint identifies the requested service, so an additional `service` or `operation` field in the JSON body is unnecessary.

The architecture has two separate contracts:

1. **Endpoint contract:** Defines which service the caller is requesting, the permitted HTTP method, and the request requirements.
2. **Payload contract:** Defines the input requirements of that service, enforced by its downstream validator.

## Router service catalog

| Endpoint | Service offered | Execution behavior |
|---|---|---|
| `POST /state` | State transition | Router Validator → FSM Validator → FSM → return through validators → Router → Renderer |
| `POST /validate` | Validation testing | Router Validator → FSM Validator → return verdict; no FSM execution |
| `GET /health` | Router health | Return availability status |

The Router Validator is the common entry point for each endpoint. For POST requests, it enforces the HTTP request contract and V01 JSON syntax validation before dispatch.

## Core contract

\[
\text{HTTP endpoint} \rightarrow \text{Service selection}
\]

\[
\text{JSON body} \rightarrow \text{Service input}
\]

This means the router can expose additional services in the future simply by registering new endpoints and their destinations, without changing its general JSON syntax validator.

**The endpoint registry is therefore the router's service catalog, and the endpoint-specific contracts define what each service accepts.**

---

**You**

> for the FSM what endpoints should be exposed

**Assistant**

For the **stateless FSM**, I recommend exposing only **one operational endpoint** through the router, plus an optional health endpoint for infrastructure monitoring.

The FSM should not expose separate endpoints for each state, index, or transition. Those are inputs to the same deterministic transition function.

## Recommended FSM endpoints

| Method | Public endpoint | Purpose |
|---|---|---|
| `POST` | `/state` | Evaluate a transition using the supplied current state and validated input |
| `GET` | `/state/schema` | Return the FSM's declared input/output contract |
| `GET` | `/health` | Report service availability |

The schema endpoint is optional, but useful for discovering and independently testing the FSM's contract.

## 1. `POST /state` — State transition

The request should contain the following information when it reaches the FSM through its validator:

| Field | Purpose |
|---|---|
| `current_state` | Current state supplied by the caller |
| `input` | Validated input for the transition |
| `context` | Any additional deterministic values required by the transition rules |

The FSM computes:

\[
T(S,I,C)\rightarrow(S',R)
\]

Where \(S\) is the current state, \(I\) is the validated input, \(C\) is any required context, \(S'\) is the resulting state, and \(R\) is the transition result.

The FSM does not retrieve state, persist state, validate JSON syntax, or communicate with the renderer.

## 2. `GET /state/schema` — Contract discovery

Returns the versioned schema defining what inputs the FSM accepts and what outputs it produces.

This supports dynamic validation rulesets without requiring the router to understand the FSM's internal state model.

It must not execute a transition.

## 3. `GET /health` — Availability

Returns a minimal availability result, such as:

```json
{"ok":true}
```

It does not establish that transitions or downstream services are functioning correctly.

## Execution topology

<box border radius="lg" padding={3} gap={2}>
  <svg viewBox="0 0 320 214" width="100%">
    {#each [{y:8,t:"POST /state"},{y:65,t:"Router Validator"},{y:122,t:"FSM Validator"},{y:179,t:"Stateless FSM"}] as a,i}
      <rect x="74" y={a.y} width="172" height="33" rx="6" stroke="currentColor" fill="none" strokeWidth="1.2"/>
      <text x="160" y={a.y+21} textAnchor="middle" fill="currentColor" fontSize="12">{a.t}</text>
      {#if i<3}
        <path d={`M160 ${a.y+33} v22 l-4 -6 m4 6 l4 -6`} stroke="currentColor" fill="none" strokeWidth="1.3"/>
      {/if}
    {/each}
  </svg>
  <caption>The FSM is accessible only through its validator. The response returns through the same boundary to the router.</caption>
</box>

### Important endpoint distinction

The public router endpoint can remain `POST /state`, while the FSM's internal service endpoint remains `POST /transition`, as it is in the current IssueScratch implementation.

These do not need identical names.

**Recommendation:** Keep one operational FSM endpoint. Expose contract discovery and health only if needed, and avoid adding endpoints such as `/advance`, `/reset`, `/retry`, or `/render` because those would introduce unnecessary interface complexity or state-management responsibilities.

No repository changes have been made.

---

**You**

> What if the current state is necessary?

**Assistant**

If the **current state is necessary to determine the next transition**, it must be supplied as part of the FSM's input contract.

Because the FSM is stateless, it cannot independently know which state it is currently in. The caller must supply that information.

## FSM input contract

```json
{
  "current_state": {
    "index": 8,
    "status": "awaiting_input"
  },
  "input": {
    "scratchpad": {
      "text[string]": "Example"
    }
  }
}
```

The FSM computes:

\[
T(S_{\text{current}}, I) \rightarrow (S_{\text{next}}, R)
\]

Where:

- \(S_{\text{current}}\) is the supplied current state.
- \(I\) is the validated input.
- \(S_{\text{next}}\) is the computed next state.
- \(R\) is the transition outcome.

## Where does the current state originate?

The current state must come from an external state-management component or persistent store.

The communication path would be:

<box border radius="lg" padding={3} gap={2}>
  <svg viewBox="0 0 320 220" width="100%">
    {#each [{x:76,y:5,t:"External state store"},{x:76,y:62,t:"Router Validator"},{x:76,y:119,t:"FSM Validator"},{x:76,y:176,t:"Stateless FSM"}] as a,i}
      <rect x={a.x} y={a.y} width="168" height="36" rx="7" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      <text x="160" y={a.y+23} textAnchor="middle" fill="currentColor" fontSize="12">{a.t}</text>
      {#if i<3}
        <path d={`M160 ${a.y+36} V${a.y+55} m-4 -5 l4 5 4 -5`} stroke="currentColor" strokeWidth="1.3" fill="none"/>
      {/if}
    {/each}
  </svg>
  <caption>Conceptual data flow: the current state is supplied externally and passes through the validator boundary before reaching the FSM.</caption>
</box>

The external caller can retrieve the current state and include it in `POST /state`. The Router Validator performs JSON syntax validation, while the FSM Validator checks the state and transition-input contract.

The FSM then returns its proposed next state. An external state-management component is responsible for persisting it, with appropriate revision or concurrency checks.

**The essential invariant:** The FSM does not maintain its own current state. Every transition is computed from the supplied current state and input.

If no current state is supplied when the transition contract requires it, the FSM Validator rejects the request without invoking the FSM.

---

**You**

> Ah, but we can configure the location of the current state?

**Assistant**

Yes. **We can configure the location of the current state independently of the FSM**, allowing the same stateless FSM to operate with different storage systems.

The key is to separate **state location, state retrieval, and state-transition computation**.

## Proposed state configuration

```json
{
  "state_source": {
    "adapter": "github-file",
    "repository": "BestNameYet/IssueScratch",
    "path_template": "workspaces/issue1-diagnostics/comments/{comment_id}/state.json"
  }
}
```

This is an illustrative configuration, not an implemented adapter.

The state location could instead reference a database, local file, HTTP service, or GitHub issue comment.

## Execution architecture

<box border radius="lg" padding={3}>
  <svg viewBox="0 0 340 292" width="100%">
    {#each [{x:85,y:6,w:170,h:38,t:"POST /state"},{x:85,y:66,w:170,h:38,t:"Router Validator"},{x:85,y:130,w:170,h:38,t:"FSM Validator"},{x:85,y:245,w:170,h:38,t:"Stateless FSM"},{x:223,y:184,w:110,h:40,t:"State Adapter"}] as n}
      <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="7" fill="none" stroke="currentColor" strokeWidth="1.2"/>
      <text x={n.x+n.w/2} y={n.y+n.h/2+4} fontSize="11" fill="currentColor" textAnchor="middle">{n.t}</text>
    {/each}
    <g stroke="currentColor" strokeWidth="1.4" fill="none">
      <path d="M170 44 V63 m-4 -5 l4 5 4 -5"/>
      <path d="M170 104 V127 m-4 -5 l4 5 4 -5"/>
      <path d="M210 168 V203 H220 m-5 -4 l5 4 -5 4"/>
      <path d="M223 215 H192 V242 m-4 -5 l4 5 4 -5" strokeDasharray="4 3"/>
      <path d="M154 168 V242 m-4 -5 l4 5 4 -5"/>
    </g>
    <text x="278" y="238" fontSize="10" fill="currentColor" textAnchor="middle">Configured storage</text>
    <text x="278" y="250" fontSize="10" fill="currentColor" textAnchor="middle">location</text>
  </svg>
</box>

The state adapter retrieves the current state from the configured location and provides it as a value to the transition process. The FSM remains unaware of where that value originated.

## Important design distinction

There are two valid approaches:

| Approach | State retrieval responsibility |
|---|---|
| Caller-supplied state | Caller retrieves the state and submits it with the request |
| Configured state source | A separate adapter retrieves state using configured storage bindings |

For your architecture, I recommend the **configured state-source adapter**, because it avoids requiring every caller to construct the entire state object.

However, state retrieval should not be implemented inside the deterministic FSM itself. The validator can receive the state from the adapter and check its structure, while the FSM operates purely on supplied values.

State persistence after the transition also needs a configured writer with revision checks to prevent conflicting updates.

**Result:** The FSM's executable contract stays the same:

\[
T(\text{current state},\text{validated input})\rightarrow\text{next state}
\]

Only the external configuration changes when state storage moves.

No repository changes have been made.

---

**You**

> That

**Assistant**

The configured state-source adapter is the preferred design. It keeps state retrieval and persistence separate from the stateless FSM, with storage locations defined through configuration rather than hardcoded into the execution logic.

---

**You**

> That's fine but that means the FSM has more than one endpoint

**Assistant**

Yes. If the FSM exposes state-management operations through its API, then it has more than one endpoint. However, those endpoints can delegate storage operations to the configured state adapter without making the FSM stateful.

## Proposed FSM API

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/state` | Retrieve current state from the configured state source |
| `POST` | `/transition` | Compute the next state from current state and validated input |
| `PUT` | `/state` | Persist an accepted state through the configured state adapter |
| `GET` | `/health` | Report service availability |

### Important distinction

The **FSM engine** remains a pure deterministic function:

\[
T(S,I)\rightarrow S'
\]

The **FSM-facing API** can expose retrieval, transition, and persistence as distinct operations.

These are not necessarily implemented inside the FSM engine itself.

In the architecture we've established, the Router Validator communicates with the FSM Validator, which mediates access to the FSM-facing API and any configured state adapter.

One design decision remains: whether `POST /transition` merely returns the proposed state, or whether the API also offers an explicitly requested operation that retrieves the current state, computes the transition, and persists the result.

I recommend keeping retrieval, transition, and persistence as separate operations. That preserves independent validation, avoids implicit state mutation, and allows each operation to produce its own execution receipt.

**Thus, the FSM-facing service can have multiple endpoints while the FSM computation itself remains entirely stateless.**

---

**You**

> We want to set the state via a put?

**Assistant**

Yes. **`PUT /state` is appropriate for setting or replacing the current state** at a configured storage location.

We should distinguish three operations:

| Method | Endpoint | Operation |
|---|---|---|
| `GET` | `/state` | Retrieve the current persisted state |
| `PUT` | `/state` | Replace the current persisted state |
| `POST` | `/transition` | Calculate the next state without persisting it |

### Example: `PUT /state`

```http
PUT /state
Content-Type: application/json
If-Match: "revision-42"
```

```json
{
  "index": 8,
  "status": "awaiting_input"
}
```

The configured state adapter would:

1. Identify the authorized state location.
2. Validate the proposed state against its state contract.
3. Check the expected revision to prevent overwriting concurrent changes.
4. Write the state.
5. Return a receipt identifying the stored revision.

A successful replacement could return `200 OK` with a receipt, while a revision conflict could return `412 Precondition Failed`.

### Architectural boundary

The FSM itself still does not store state. The `PUT` endpoint is exposed through the service API but delegates persistence to the configured state adapter.

**One important restriction:** `PUT /state` should not automatically execute an FSM transition. Setting state and computing a transition are separate operations with separate contracts.

This gives us explicit state retrieval, state replacement, and state computation without introducing hidden state changes.

---

**You**

> Why wouldn't we just require a file to be located in a certain location?

**Assistant**

We can, and for IssueScratch that would be substantially simpler.

Instead of exposing `GET /state` and `PUT /state`, we can establish a **filesystem contract** requiring the current state to exist at a configured, deterministic path.

For example:

```text
workspaces/issue1-diagnostics/comments/{comment_id}/state.json
```

That is already the state-file convention documented in IssueScratch.

## Revised architecture

The FSM would need only one operational endpoint:

`POST /transition`

The state file becomes a required dependency of the execution environment, rather than something managed through the API.

| Responsibility | Contract |
|---|---|
| State location | Determined by configuration |
| State format | Defined by a versioned JSON schema |
| State retrieval | Read from configured file path |
| State validation | Performed by FSM Validator |
| State transition | Computed by stateless FSM |
| State persistence | Written by a separate state-management operation |
| Missing state file | Explicit failure; no transition |
| State revision | Checked before replacement |

## Example configuration

```json
{
  "state": {
    "root": "workspaces/issue1-diagnostics/comments",
    "path_template": "{comment_id}/state.json",
    "format": "json",
    "required": true
  }
}
```

The benefit is that the API does not need to implement storage management, discovery, or state-location negotiation.

There is one operational constraint: **the configured file must be accessible to whichever execution environment reads it.** In GitHub Actions, independent jobs and containers do not automatically share a filesystem. The state file must therefore be checked out, mounted, or otherwise made available to the appropriate execution environment.

Also, reading from a file does not make the underlying state-transition computation stateful. The deterministic FSM can still receive the file's parsed contents as an argument and return the next state without storing anything itself.

**Recommendation:** Require a state file at a configured path, retain `POST /transition` as the FSM's only operational endpoint, and keep file reading and writing outside the FSM computation. No `PUT /state` endpoint is necessary.

---

**You**

> That's fine.  transition, validate....render is configured separately

**Assistant**

The API contract is now reduced to **two operational endpoints**, with rendering configured separately.

| Method | Endpoint | Responsibility |
|---|---|---|
| `POST` | `/transition` | Validate input, load current state from the configured file, execute the FSM transition, and return the result |
| `POST` | `/validate` | Execute validation tests and return the verdict without invoking the FSM |

## Execution rules

**`POST /transition`**

1. Router Validator checks JSON syntax (V01).
2. FSM Validator checks the input contract.
3. Current state is obtained from the configured state file.
4. FSM computes the transition.
5. FSM result returns through the validation boundary.
6. Router receives the result and applies its separately configured rendering behavior.

**`POST /validate`**

1. Router Validator checks JSON syntax (V01).
2. FSM Validator evaluates the input.
3. Validation results are returned without executing a transition or modifying state.

## Configuration boundaries

- **State configuration:** Defines the required state-file location and schema.
- **Validation configuration:** Defines the rules applied to FSM inputs and outputs.
- **Rendering configuration:** Defines how transition results are rendered and delivered.
- **Routing configuration:** Connects the two endpoints to their respective service operations.

The FSM remains stateless, and neither the FSM nor its validator needs to know how rendering is configured.

**This is the proposed API contract, not yet an implemented repository change.**

---

**You**

> Should transition be a get

**Assistant**

**No. `POST /transition` is the appropriate method**, even though the FSM itself is stateless and deterministic.

The distinction is between retrieving an existing resource and requesting a computation.

| Method | Intended purpose | Suitability |
|---|---|---|
| `GET` | Retrieve a resource without changing server state | Appropriate for reading current state |
| `POST` | Submit input for processing and obtain a computed result | **Recommended for transitions** |
| `PUT` | Create or replace a resource at a known URI | Appropriate for explicitly replacing persisted state |

### Why POST is preferable

A transition requires evaluating:

\[
T(S_{\text{current}},I)\rightarrow S_{\text{next}}
\]

Even if the computation does not persist state, `POST` is appropriate because:

- The transition requires a potentially complex JSON input.
- GET requests do not have reliably supported request-body semantics.
- POST provides an explicit operation boundary with a structured request and response.
- Transition processing may later generate receipts or trigger externally managed state updates.

### Final proposed API

| Method | Endpoint | Behavior |
|---|---|---|
| `POST` | `/transition` | Validate input, obtain configured current state, compute and return transition result |
| `POST` | `/validate` | Validate input only; never execute FSM |
| `GET` | `/health` | Optional service health check |

The state file remains at its configured location, and rendering remains separately configured.

**One important contract decision:** `POST /transition` should not itself persist the next state unless explicitly specified. Otherwise, the operation would combine computation and state mutation, which we have been separating.

So I recommend retaining **POST for both `/transition` and `/validate`**, with their different execution permissions clearly defined.

---

**You**

> Oh yes, we still may want to get the state so that only the FSM deals with it

**Assistant**

Yes. We should expose **`GET /state`** so the FSM subsystem is the exclusive owner of state access and management.

The router and validators should not independently retrieve, interpret, or modify the persisted state.

## Revised FSM API

| Method | Endpoint | Responsibility |
|---|---|---|
| `GET` | `/state` | Retrieve current state from the configured file |
| `POST` | `/transition` | Validate input, read current state, compute the next state |
| `POST` | `/validate` | Validate a candidate input without executing a transition |
| `GET` | `/health` | Optional health check |

## State ownership contract

The FSM subsystem owns:

- The configured state-file location.
- Reading and interpreting current state.
- Determining valid transitions using current state and validated input.
- Producing the resulting state.

The FSM's **transition function remains stateless**: it computes its result from supplied values. The surrounding FSM service can manage file access without introducing hidden state into that computation.

## Communication boundary

The external caller accesses state through `GET /state`, with requests passing through the Router Validator and the appropriate FSM-facing service interface.

For `/transition`, the validator supplies the accepted input, and the FSM subsystem retrieves the current state internally.

Rendering remains an independent, separately configured operation after the transition response returns through the router.

**One remaining distinction:** If the FSM is also responsible for persisting newly accepted states, that must be an explicit part of its transition contract. Otherwise, it only computes and returns proposed state changes, and another component must write them.

This preserves a single authoritative state owner without requiring the router to understand the state file's structure or location.

---

**You**

> So transition will involve a response back to the router that must have a shep.

**Assistant**

Yes. The transition response must have a **fixed, versioned shape** so the Router Validator can deterministically validate it before the router passes it to the separately configured renderer.

The response contract should describe the outcome of the transition without specifying how the result is rendered.

## Proposed transition response contract v1

<CodeBlock language="json" editable>
{
  "contract": "fsm.transition-response.v1",
  "request_id": "req-001",
  "status": "accepted",
  "transition": {
    "from": 8,
    "to": 9
  },
  "state": {
    "index": 9,
    "status": "awaiting_input"
  },
  "errors": []
}
</CodeBlock>

## Required fields

| Field | Type | Requirement |
|---|---|---|
| `contract` | String | Must equal `fsm.transition-response.v1` |
| `request_id` | String | Correlates response with request |
| `status` | String | `accepted`, `rejected`, or `failed` |
| `transition` | Object or null | Describes the transition when accepted |
| `state` | JSON value or null | Resulting state, with its own separately defined schema |
| `errors` | Array | Structured errors; empty on acceptance |

The `state` field can contain a complex object without forcing the router to understand its internal structure.

## Conditional validation rules

| Status | Transition | State | Errors |
|---|---|---|---|
| `accepted` | Required | Resulting state required | Empty |
| `rejected` | `null` | `null` | At least one input rejection |
| `failed` | `null` | `null` | At least one execution error |

The contract deliberately distinguishes a rejected input from an FSM execution failure.

## Return path

<box border radius="lg" padding={3} gap={2}>
  <svg viewBox="0 0 320 184" width="100%">
    {#each [{y:5,t:"FSM produces response"},{y:52,t:"FSM Validator checks result"},{y:99,t:"Router Validator checks envelope"},{y:146,t:"Router receives verified response"}] as n,i}
      <rect x="31" y={n.y} width="258" height="31" rx="6" stroke="currentColor" fill="none" strokeWidth="1.2"/>
      <text x="160" y={n.y+20} fill="currentColor" fontSize="11" textAnchor="middle">{n.t}</text>
      {#if i<3}
        <path d={`M160 ${n.y+31} v14 m-4 -5 l4 5 4 -5`} fill="none" stroke="currentColor" strokeWidth="1.2"/>
      {/if}
    {/each}
  </svg>
</box>

The FSM Validator checks the state and transition invariants. The Router Validator checks the standardized response envelope, including its version, required fields, status, and correlation identifier.

**The critical contract boundary:** The router must never interpret the internal meaning of `state`. It only accepts a response that conforms to the declared transition-response schema and then applies the configured rendering operation.

One additional requirement should be explicitly decided: whether `accepted` means the new state was merely **computed** or was also **successfully persisted**. Those are different claims, and the response must not conflate them.

No repository changes have been made.

---

**You**

> It an

**Assistant**

Could you complete that thought? Are you referring to the transition response's structure?

---

**You**

> it can't be that simple unless the render owns the actual procedure text

**Assistant**

Correct. The transition response I proposed was insufficient because it contained only **state information**, not the information required to construct the next procedural instruction.

There are two possible architectures:

1. **Renderer-owned procedure:** The renderer retrieves and interprets the canonical procedure document.
2. **FSM-owned procedure selection:** The FSM identifies the next procedure and returns its resolved rendering instructions. The renderer only formats them.

I recommend the second approach because it preserves our separation of responsibilities.

## Revised responsibility boundaries

| Component | Responsibility |
|---|---|
| FSM | Determines the next state and identifies the applicable canonical procedure |
| FSM Validator | Validates transition inputs, outputs, and procedure references |
| Router Validator | Validates the response envelope |
| Router | Routes the response to the renderer |
| Renderer | Produces the presentation from supplied instructions and bindings |

The **canonical procedure document remains the source of truth**, rather than duplicating its content inside the renderer.

## Revised transition response

<CodeBlock language="json" editable>
{
  "contract": "fsm.transition-response.v1",
  "request_id": "req-001",
  "status": "accepted",
  "transition": {
    "from": 8,
    "to": 9
  },
  "state": {
    "index": 9,
    "status": "awaiting_input"
  },
  "render": {
    "procedure_ref": "canonical-procedure.v1",
    "index": 9,
    "template_ref": "index-9",
    "bindings": {
      "current_index": 9
    }
  },
  "errors": []
}
</CodeBlock>

This is a conceptual contract, not an existing IssueScratch response schema. The actual procedure identifiers must come from the canonical document rather than being invented as permanent references.

## The remaining question: who resolves the procedure?

Returning only `template_ref` still requires the renderer to look up a template and resolve its content.

If the renderer must remain strictly presentation-only, then the FSM subsystem should instead return a **fully materialized render specification**, containing the actual procedure instructions and bound values.

That suggests this stronger division:

\[
\text{FSM + canonical procedure}
\rightarrow
\text{resolved instruction specification}
\]

\[
\text{Renderer + resolved instruction specification}
\rightarrow
\text{rendered output}
\]

The renderer would not choose procedures, interpret opcodes, or determine the next state. It would receive the exact instruction content to display, together with a declared presentation format.

**My recommendation:** Make the transition response contain both the resulting state and a fully resolved, versioned render specification. The FSM subsystem determines *what must be presented*; the renderer determines only *how to present it*.

That also means the transition-response validator must verify the render specification's required fields, source references, and consistency with the resulting state.

No repository changes have been made.

---

**You**

> Perfect then the FSM moves iterates along the procedure projection and returns a response.

**Assistant**

The **FSM is a deterministic iterator over the canonical procedure projection**. Each accepted transition advances the FSM and returns the fully resolved instructions for the next procedural step.

The responsibilities are now:

| Component | Responsibility |
|---|---|
| Router Validator | Validate the HTTP request and JSON syntax |
| FSM Validator | Validate input and FSM output contracts |
| FSM | Advance the procedure index, resolve the next projection, and return its instructions |
| Router | Coordinate service communication |
| Renderer | Format the supplied instructions without interpreting the procedure |

## FSM transition contract

\[
T(S,I,P)\rightarrow(S',R)
\]

Where:

- \(S\) = current state, obtained from the configured state file.
- \(I\) = validated input.
- \(P\) = canonical procedure projection.
- \(S'\) = resulting state.
- \(R\) = fully resolved instruction specification for rendering.

The FSM response must contain two distinct outputs:

1. **State result:** New index, transition status, and state information.
2. **Instruction result:** The actual procedural text, required inputs, expected outputs, completion criteria, and resolved bindings for the next step.

The renderer receives the instruction result without needing access to the canonical procedure.

One important invariant: **the FSM must not advance merely because an HTTP request was received.** Advancement requires an accepted input and a valid transition.

This preserves the intended architecture: the procedure defines the work, the FSM determines the next prescribed step, and the renderer presents that step without independently deciding what should happen.

---

**You**

> But we already have procedure projection rules.

**Assistant**

Correct. We already established the procedure projection rules in IssueScratch. We should **reuse them, not define another projection mechanism inside the FSM**.

The existing artifacts are:

- [Projection procedure](https://github.com/BestNameYet/IssueScratch/blob/main/docs/index-projection-procedure.json) — defines the opcode-based projection algorithm.
- [Projection implementation](https://github.com/BestNameYet/IssueScratch/blob/main/src/index-projection.js) — executes that algorithm.
- [Canonical procedure library](https://github.com/BestNameYet/IssueScratch/blob/main/src/types/issuescratch.procedure-library.v1.json) — supplies the authoritative procedural definitions.

## Corrected FSM responsibility

The FSM should:

1. Read the current state from its configured location.
2. Receive the validated input.
3. Evaluate whether the transition is permitted.
4. Determine the next procedure index.
5. Invoke the **existing projection implementation** for that index.
6. Return the resulting state and resolved projection to the Router Validator.

The FSM should not recreate projection rules, author procedural text, or implement its own rendering logic.

The computation is:

\[
T(S,I,P)\rightarrow(S',\operatorname{Project}(P,S'))
\]

Here, `Project` is the existing deterministic projection operation, not a new FSM algorithm.

**The remaining integration requirement** is to specify how the existing projection function's output is embedded in the FSM transition response, without modifying the projection's established contract.

That gives us one authoritative projection mechanism, one deterministic FSM, and one independent renderer.

---

**You**

> But that means the shape of the FSM retutn can be decided now

**Assistant**

Yes. **The FSM return contract can now be defined deterministically**, because the existing procedure projection rules already establish what the next instruction must contain.

We do not need to invent another rendering schema. We need a fixed response envelope that contains the output of the existing projection implementation.

The response should contain three parts:

1. **Transition outcome:** Whether the FSM advanced, rejected the transition, or encountered an execution failure.
2. **State:** The resulting state and its index.
3. **Projection:** The resolved procedural instructions generated by the existing projection rules.

**Assistant**

Yes. **The FSM return contract can now be defined deterministically**, because the existing procedure projection rules already establish what the next instruction must contain.

We do not need to invent another rendering schema. We need a fixed response envelope that contains the output of the existing projection implementation.

The response should contain three parts:

1. **Transition outcome:** Whether the FSM advanced, rejected the transition, or encountered an execution failure.
2. **State:** The resulting state and its index.
3. **Projection:** The resolved procedural instructions generated by the existing projection rules.

## Proposed FSM return shape

The existing projection function returns a document with the schema `issuescratch.dynamic-index-projection.v1`, consisting of `shared`, `shared_semantic_criteria`, `definitions`, and `index_projections`.

Therefore the response envelope can be:

<CodeBlock language="json" editable>
{
  "contract": "fsm.transition-response.v1",
  "transition": {
    "status": "valid",
    "action": "advance",
    "advanced": true,
    "from_index": 8,
    "to_index": 9
  },
  "state": {
    "schema": "existing-state-schema",
    "progression": {}
  },
  "projection": {
    "schema": "issuescratch.dynamic-index-projection.v1",
    "shared": {},
    "shared_semantic_criteria": [],
    "definitions": {},
    "index_projections": []
  }
}
</CodeBlock>

The empty objects and arrays above are placeholders indicating the structure, not a valid completed projection.

| Response field | Source |
|---|---|
| `transition` | Existing `stateless-fsm.js` transition function |
| `state` | Existing FSM resulting-state object |
| `projection` | Existing `createProjection()` implementation |

There is one important implementation detail: the existing projection function generates a projection collection for the procedure, rather than a standalone fully materialized instruction for one index. The response contract must preserve that structure and identify the applicable next index. The renderer or an existing projection-resolution operation can then resolve the selected definition and shared content mechanically, without inventing instructions.

**What is established versus unfinished:** The transition and projection component shapes already exist in the repository. Combining them into the proposed response envelope, validating that envelope, and connecting it to rendering are integration work still to be completed.

The next specification can therefore be the **JSON Schema for `fsm.transition-response.v1`**, using the actual existing FSM and projection definitions rather than creating any new procedural semantics.

**Assistant**

## Proposed FSM return shape

The existing projection function returns a document with the schema `issuescratch.dynamic-index-projection.v1`, consisting of `shared`, `shared_semantic_criteria`, `definitions`, and `index_projections`.

Therefore the response envelope can be:

<CodeBlock language="json" editable>
{
  "contract": "fsm.transition-response.v1",
  "transition": {
    "status": "valid",
    "action": "advance",
    "advanced": true,
    "from_index": 8,
    "to_index": 9
  },
  "state": {
    "schema": "existing-state-schema",
    "progression": {}
  },
  "projection": {
    "schema": "issuescratch.dynamic-index-projection.v1",
    "shared": {},
    "shared_semantic_criteria": [],
    "definitions": {},
    "index_projections": []
  }
}
</CodeBlock>

The empty objects and arrays above are placeholders indicating the structure, not a valid completed projection.

| Response field | Source |
|---|---|
| `transition` | Existing `stateless-fsm.js` transition function |
| `state` | Existing FSM resulting-state object |
| `projection` | Existing `createProjection()` implementation |

There is one important implementation detail: the existing projection function generates a projection collection for the procedure, rather than a standalone fully materialized instruction for one index. The response contract must preserve that structure and identify the applicable next index. The renderer or an existing projection-resolution operation can then resolve the selected definition and shared content mechanically, without inventing instructions.

**What is established versus unfinished:** The transition and projection component shapes already exist in the repository. Combining them into the proposed response envelope, validating that envelope, and connecting it to rendering are integration work still to be completed.

The next specification can therefore be the **JSON Schema for `fsm.transition-response.v1`**, using the actual existing FSM and projection definitions rather than creating any new procedural semantics.

---

**You**

> Well this needs to be another configurable resposne.

**Assistant**

Agreed. **The FSM response must be configurable**, just as its input validation and state location are configurable.

We should not hardcode the IssueScratch projection structure into the FSM's return contract.

Instead, establish a fixed **response-generation interface** that uses a configurable response specification to determine what the FSM returns.

## Proposed configuration architecture

| Component | Responsibility |
|---|---|
| FSM | Computes the deterministic state transition |
| Response configuration | Defines the output structure and field bindings |
| Projection engine | Produces procedural projections using existing rules |
| Response assembler | Constructs the configured response |
| FSM Validator | Validates the assembled response against its configured output schema |
| Router | Receives the validated response without interpreting its contents |
| Renderer | Renders the response according to separate presentation configuration |

## Example response configuration

<CodeBlock language="json" editable>
{
  "contract": "fsm.response-configuration.v1",
  "response": {
    "fields": {
      "transition": {
        "source": "transition_result"
      },
      "state": {
        "source": "resulting_state"
      },
      "projection": {
        "source": "procedure_projection"
      }
    }
  }
}
</CodeBlock>

This configuration defines *which results appear in the response and where they are placed*, without containing actual state or procedural text.

A different FSM application could replace the configuration with:

<CodeBlock language="json" editable>
{
  "contract": "fsm.response-configuration.v1",
  "response": {
    "fields": {
      "next": {
        "source": "resulting_state"
      },
      "instructions": {
        "source": "procedure_projection"
      }
    }
  }
}
</CodeBlock>

The same response assembler would handle either configuration.

## Contract requirements

The response specification itself must have a validated shape, just like the input ruleset.

It should define:

1. A fixed configuration version.
2. An output field mapping.
3. An allowed vocabulary of source bindings.
4. Rules for required and optional fields.
5. A response schema against which the generated output is validated.
6. Deterministic failure behavior for missing bindings, conflicting fields, or invalid output.

The response assembler must never invent missing values or rewrite procedural text.

### Architectural principle

\[
\operatorname{Assemble}(C,T,S,P)\rightarrow R
\]

Where:

- \(C\) = configurable response contract.
- \(T\) = transition result.
- \(S\) = resulting state.
- \(P\) = procedure projection.
- \(R\) = assembled response.

**The response assembler's mechanics remain fixed; the response shape is supplied by configuration.**

This also preserves the existing projection rules: they determine procedural content, while the response configuration determines how that content is packaged for the router.

No repository changes have been made.

---

**You**

> Let's generate that and its enevelope for the router

**Assistant**

# Configurable FSM Response and Router Envelope — v1

We'll define two separate contracts:

1. **FSM Response Configuration** — determines which execution results are included, their names, their structure, and how their values are resolved.
2. **Router Response Envelope** — provides a fixed communication structure for transporting the generated response through the Router Validator to the router.

The existing IssueScratch procedure projection remains authoritative. Neither contract redefines its projection rules.

## 1. FSM response configuration

<CodeBlock language="json" editable>
{
  "contract": "fsm.response-config.v1",
  "response_id": "issuescratch.transition.v1",
  "assembly": {
    "fields": [
      {
        "name": "transition",
        "source": "transition_result.transition",
        "required": true
      },
      {
        "name": "state",
        "source": "transition_result.state",
        "required": true
      },
      {
        "name": "projection",
        "source": "projection_result",
        "required": true
      },
      {
        "name": "next_index",
        "source": "transition_result.state.progression.next_index",
        "required": true
      }
    ],
    "additional_fields": false,
    "missing_required_source": "fail"
  },
  "validation": {
    "schema_id": "issuescratch.transition-response.v1",
    "on_failure": "execution_error"
  }
}
</CodeBlock>

Every `source` must be resolved through a declared, read-only binding. Source names are references, not executable JavaScript expressions.

The `projection_result` is produced using the existing projection procedure. The assembler copies it unchanged.

The corresponding response schema must validate the actual assembled field types and conditional requirements, including a nullable `next_index` for terminal states.

**Assistant**

# Configurable FSM Response and Router Envelope — v1

We'll define two separate contracts:

1. **FSM Response Configuration** — determines which execution results are included, their names, their structure, and how their values are resolved.
2. **Router Response Envelope** — provides a fixed communication structure for transporting the generated response through the Router Validator to the router.

The existing IssueScratch procedure projection remains authoritative. Neither contract redefines its projection rules.

## 1. FSM response configuration

<CodeBlock language="json" editable>
{
  "contract": "fsm.response-config.v1",
  "response_id": "issuescratch.transition.v1",
  "assembly": {
    "fields": [
      {
        "name": "transition",
        "source": "transition_result.transition",
        "required": true
      },
      {
        "name": "state",
        "source": "transition_result.state",
        "required": true
      },
      {
        "name": "projection",
        "source": "projection_result",
        "required": true
      },
      {
        "name": "next_index",
        "source": "transition_result.state.progression.next_index",
        "required": true
      }
    ],
    "additional_fields": false,
    "missing_required_source": "fail"
  },
  "validation": {
    "schema_id": "issuescratch.transition-response.v1",
    "on_failure": "execution_error"
  }
}
</CodeBlock>

Every `source` must be resolved through a declared, read-only binding. Source names are references, not executable JavaScript expressions.

The `projection_result` is produced using the existing projection procedure. The assembler copies it unchanged.

The corresponding response schema must validate the actual assembled field types and conditional requirements, including a nullable `next_index` for terminal states.

## 2. Router response envelope

The envelope must have a fixed shape regardless of how the FSM response is configured.

<CodeBlock language="json" editable>
{
  "contract": "router.response-envelope.v1",
  "request_id": "req-001",
  "endpoint": "/transition",
  "outcome": "success",
  "response_id": "issuescratch.transition.v1",
  "payload": {
    "transition": {
      "status": "valid",
      "action": "advance",
      "advanced": true,
      "from_index": 8,
      "to_index": 9
    },
    "state": {
      "schema": "configured-state-schema",
      "progression": {
        "accepted_entries": 9,
        "next_index": 9,
        "complete": false
      }
    },
    "projection": {
      "schema": "issuescratch.dynamic-index-projection.v1",
      "shared": {},
      "shared_semantic_criteria": [],
      "definitions": {},
      "index_projections": []
    },
    "next_index": 9
  },
  "error": null
}
</CodeBlock>

This is an illustrative envelope, not a real transition result. The projection content and state fields are abbreviated.

The two contracts have distinct scopes:

| Field | Validator requirement |
|---|---|
| `contract` | Exact supported envelope version |
| `request_id` | Nonempty string matching the request |
| `endpoint` | Registered endpoint identifier |
| `outcome` | `success`, `rejected`, or `error` |
| `response_id` | Registered response configuration ID, or `null` on failure |
| `payload` | Response matching its selected configured schema, or `null` |
| `error` | `null` on success; structured error on failure |

## 3. Router envelope's JSON Schema

This schema validates the fixed envelope without hardcoding the configurable payload.

<CodeBlock language="json" editable>
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "router.response-envelope.v1",
  "type": "object",
  "required": [
    "contract",
    "request_id",
    "endpoint",
    "outcome",
    "response_id",
    "payload",
    "error"
  ],
  "properties": {
    "contract": {
      "const": "router.response-envelope.v1"
    },
    "request_id": {
      "type": "string",
      "minLength": 1
    },
    "endpoint": {
      "type": "string",
      "minLength": 1
    },
    "outcome": {
      "enum": ["success", "rejected", "error"]
    },
    "response_id": {
      "type": ["string", "null"]
    },
    "payload": true,
    "error": {
      "type": ["object", "null"]
    }
  },
  "oneOf": [
    {
      "properties": {
        "outcome": {"const": "success"},
        "response_id": {"type": "string"},
        "error": {"type": "null"}
      }
    },
    {
      "properties": {
        "outcome": {"enum": ["rejected", "error"]},
        "payload": {"type": "null"},
        "error": {
          "type": "object",
          "required": ["code", "message"],
          "properties": {
            "code": {"type": "string", "minLength": 1},
            "message": {"type": "string"}
          }
        }
      }
    }
  ],
  "additionalProperties": false
}
</CodeBlock>

The `payload: true` rule accepts any JSON value. A second validation pass uses the registered `response_id` to select the configurable payload schema. The Router Validator should also check that `endpoint` and `request_id` match the original request.

## 4. Assembly and response sequence

<box border radius="lg" padding={3} gap={2}>
  <list marker="number" gap={2}>
    <list-item>FSM computes the transition and obtains the existing procedural projection.</list-item>
    <list-item>Response assembler uses the configured field mappings to construct the payload.</list-item>
    <list-item>FSM Validator validates the payload using its selected response schema.</list-item>
    <list-item>FSM Validator wraps the result in the fixed router envelope and returns it to Router Validator.</list-item>
    <list-item>Router Validator checks the envelope, request correlation, and configured payload schema.</list-item>
    <list-item>Router receives the validated response and invokes its separately configured renderer when appropriate.</list-item>
  </list>
</box>

## 5. Contract invariants

- The envelope shape remains fixed.
- The payload shape can change through configuration.
- The response assembler cannot invent fields or values.
- The canonical projection is not altered or paraphrased.
- Unknown response configurations fail closed.
- Failed payload validation cannot produce a successful envelope.
- A transition's `advanced` status must reflect the FSM result, not the presence of a successful HTTP response.
- The router does not interpret state or procedural content.
- Rendering remains a separate configured operation.

**The resulting interface is:**

\[
\operatorname{Assemble}(C,T,P)\rightarrow R
\]

\[
\operatorname{Envelope}(R,M)\rightarrow E
\]

Where \(C\) is response configuration, \(T\) is the FSM transition result, \(P\) is the existing procedure projection, \(R\) is the assembled payload, \(M\) is verified request metadata, and \(E\) is the router response envelope.

These are proposed v1 specifications. No repository files have been changed or tests run.

**Assistant**

## 2. Router response envelope

The envelope must have a fixed shape regardless of how the FSM response is configured.

<CodeBlock language="json" editable>
{
  "contract": "router.response-envelope.v1",
  "request_id": "req-001",
  "endpoint": "/transition",
  "outcome": "success",
  "response_id": "issuescratch.transition.v1",
  "payload": {
    "transition": {
      "status": "valid",
      "action": "advance",
      "advanced": true,
      "from_index": 8,
      "to_index": 9
    },
    "state": {
      "schema": "configured-state-schema",
      "progression": {
        "accepted_entries": 9,
        "next_index": 9,
        "complete": false
      }
    },
    "projection": {
      "schema": "issuescratch.dynamic-index-projection.v1",
      "shared": {},
      "shared_semantic_criteria": [],
      "definitions": {},
      "index_projections": []
    },
    "next_index": 9
  },
  "error": null
}
</CodeBlock>

This is an illustrative envelope, not a real transition result. The projection content and state fields are abbreviated.

The two contracts have distinct scopes:

| Field | Validator requirement |
|---|---|
| `contract` | Exact supported envelope version |
| `request_id` | Nonempty string matching the request |
| `endpoint` | Registered endpoint identifier |
| `outcome` | `success`, `rejected`, or `error` |
| `response_id` | Registered response configuration ID, or `null` on failure |
| `payload` | Response matching its selected configured schema, or `null` |
| `error` | `null` on success; structured error on failure |

## 3. Router envelope's JSON Schema

This schema validates the fixed envelope without hardcoding the configurable payload.

<CodeBlock language="json" editable>
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "router.response-envelope.v1",
  "type": "object",
  "required": [
    "contract",
    "request_id",
    "endpoint",
    "outcome",
    "response_id",
    "payload",
    "error"
  ],
  "properties": {
    "contract": {
      "const": "router.response-envelope.v1"
    },
    "request_id": {
      "type": "string",
      "minLength": 1
    },
    "endpoint": {
      "type": "string",
      "minLength": 1
    },
    "outcome": {
      "enum": ["success", "rejected", "error"]
    },
    "response_id": {
      "type": ["string", "null"]
    },
    "payload": true,
    "error": {
      "type": ["object", "null"]
    }
  },
  "oneOf": [
    {
      "properties": {
        "outcome": {"const": "success"},
        "response_id": {"type": "string"},
        "error": {"type": "null"}
      }
    },
    {
      "properties": {
        "outcome": {"enum": ["rejected", "error"]},
        "payload": {"type": "null"},
        "error": {
          "type": "object",
          "required": ["code", "message"],
          "properties": {
            "code": {"type": "string", "minLength": 1},
            "message": {"type": "string"}
          }
        }
      }
    }
  ],
  "additionalProperties": false
}
</CodeBlock>

The `payload: true` rule accepts any JSON value. A second validation pass uses the registered `response_id` to select the configurable payload schema. The Router Validator should also check that `endpoint` and `request_id` match the original request.

## 4. Assembly and response sequence

<box border radius="lg" padding={3} gap={2}>
  <list marker="number" gap={2}>
    <list-item>FSM computes the transition and obtains the existing procedural projection.</list-item>
    <list-item>Response assembler uses the configured field mappings to construct the payload.</list-item>
    <list-item>FSM Validator validates the payload using its selected response schema.</list-item>
    <list-item>FSM Validator wraps the result in the fixed router envelope and returns it to Router Validator.</list-item>
    <list-item>Router Validator checks the envelope, request correlation, and configured payload schema.</list-item>
    <list-item>Router receives the validated response and invokes its separately configured renderer when appropriate.</list-item>
  </list>
</box>

## 5. Contract invariants

- The envelope shape remains fixed.
- The payload shape can change through configuration.
- The response assembler cannot invent fields or values.
- The canonical projection is not altered or paraphrased.
- Unknown response configurations fail closed.
- Failed payload validation cannot produce a successful envelope.
- A transition's `advanced` status must reflect the FSM result, not the presence of a successful HTTP response.
- The router does not interpret state or procedural content.
- Rendering remains a separate configured operation.

**The resulting interface is:**

\[
\operatorname{Assemble}(C,T,P)\rightarrow R
\]

\[
\operatorname{Envelope}(R,M)\rightarrow E
\]

Where \(C\) is response configuration, \(T\) is the FSM transition result, \(P\) is the existing procedure projection, \(R\) is the assembled payload, \(M\) is verified request metadata, and \(E\) is the router response envelope.

These are proposed v1 specifications. No repository files have been changed or tests run.

---

**You**

> Don't abbreivate create the ruleset that creates them and validate it against the current contracts for projections

**Assistant · Commentary**

> I’ll use the existing projection contract as the source of truth, create the complete response-assembly ruleset and router envelope contract, then validate their field bindings against the current projection implementation. I’ll keep this to contract artifacts and validation, without changing runtime routing.

**Assistant · Commentary**

> The current projection implementation returns a complete projection collection, not a single index’s expanded text. I’ll preserve that output intact in the response ruleset and validate its bindings, rather than inventing or abbreviating projection fields.

**Assistant**

Created the **configurable FSM response-assembly ruleset** and the **router response-envelope schema**, using the existing IssueScratch projection contract rather than an abbreviated projection model.

## Generated contracts

<box gap={3}>
  <row align="center" gap={3}>
    <icon name="file-json" size="xl" color="secondary"/>
    <box flex="1" gap={1}>
      **[FSM Response Ruleset v1](sandbox:/mnt/data/issuescratch_contract/fsm-response-ruleset.v1.json)**

      <text color="secondary" size="sm">Five deterministic assembly operations, source bindings, required output fields, and failure invariants.</text>
    </box>
  </row>
  <divider color="subtle"/>
  <row align="center" gap={3}>
    <icon name="file-json" size="xl" color="secondary"/>
    <box flex="1" gap={1}>
      **[Router Response Envelope Schema](sandbox:/mnt/data/issuescratch_contract/router-response-envelope.schema.json)**

      <text color="secondary" size="sm">JSON Schema Draft 2020-12 defining successful responses, rejected requests, and execution errors.</text>
    </box>
  </row>
  <divider color="subtle"/>
  <row align="center" gap={3}>
    <icon name="file-code" size="xl" color="secondary"/>
    <box flex="1" gap={1}>
      **[Contract Validation Script](sandbox:/mnt/data/issuescratch_contract/validate_contract.py)**

      <text color="secondary" size="sm">Reproducible schema and contract-consistency tests.</text>
    </box>
  </row>
</box>

## Validation against current IssueScratch contracts

I retrieved and inspected the live versions of `src/index-projection.js`, `src/stateless-fsm.js`, `docs/index-projection-procedure.json`, and the canonical procedure library.

<box gap={2}>
  <row align="center" justify="between">
    **Static source-contract checks**
    <badge color="success">9 / 9 passed</badge>
  </row>
  <row align="center" justify="between">
    **Schema and fixture tests**
    <badge color="success">Passed</badge>
  </row>
</box>

The checks confirmed:

- The projection output has all five existing fields: `schema`, `shared`, `shared_semantic_criteria`, `definitions`, and `index_projections`.
- The existing FSM returns `state` and `transition`.
- The canonical library contains 19 index contracts and the required shared definitions.
- The response ruleset's destination fields match the envelope schema.
- Malformed projection structures and inconsistent error envelopes are rejected by the schema tests.

The ruleset copies the **entire projection result**, rather than replacing it with a summary, hardcoded instruction text, or a single index-specific approximation.

## Important verification boundary

These results establish **static compatibility and schema validation**, not end-to-end runtime integration. The assembled payload was tested with synthetic fixtures; no real FSM transition was executed through the new response assembler, and no actual projection content was generated in that test.

The files were created as downloadable artifacts. **They have not been committed to IssueScratch**, and the current router and FSM services have not been modified.

The next implementation step is to connect the response assembler to the existing transition and projection functions and verify an actual, complete projection returned through the Router Validator.

---

**You**

> Okay, this response payload hits the router validator...therefore lets establish the acceptable envelopes

**Assistant**

# Router Validator — Acceptable Envelope Contract v1

The Router Validator must accept response envelopes from the FSM Validator and other configured services **without requiring knowledge of their internal payload structures**.

We should establish one fixed envelope contract with a limited number of permitted variants, each defined by its own deterministic rules.

## 1. Accepted envelope types

I recommend four variants:

| Envelope type | Purpose | Payload |
|---|---|---|
| `result` | Successful service execution | Required |
| `rejection` | Input failed validation | Optional, for structured validation details |
| `error` | Internal processing or configuration failure | No successful result payload |
| `diagnostic` | Structured diagnostic report | Required |

A `result` does not necessarily mean the FSM advanced. It means the requested service executed successfully and produced a valid result.

## 2. Fixed envelope structure

<CodeBlock language="json" editable>
{
  "contract": "router.envelope.v1",
  "request_id": "req-001",
  "source": "fsm-validator",
  "endpoint": "/transition",
  "type": "result",
  "payload_contract": "issuescratch.transition-response.v1",
  "payload": {},
  "error": null
}
</CodeBlock>

The `payload` is intentionally opaque here. Its exact contents are determined by the configured payload contract.

## 3. Required fields and validation

| Field | Type | Validation rule |
|---|---|---|
| `contract` | String | Exact supported envelope version |
| `request_id` | String | Must match the originating request |
| `source` | String | Must match the configured service identity |
| `endpoint` | String | Must match the registered request endpoint |
| `type` | Enum | `result`, `rejection`, `error`, `diagnostic` |
| `payload_contract` | String or null | Must identify an authorized, registered payload schema when a payload is present |
| `payload` | Any JSON value or null | Validated against selected configured schema |
| `error` | Object or null | Must satisfy the error contract when present |

The envelope validator checks structure and correlation. The separately configured payload validator checks the contents of `payload`.

## 4. Conditional acceptance

| Type | Payload requirement | Error requirement | Router behavior |
|---|---|---|---|
| `result` | Required, any JSON type | Must be `null` | Continue to configured renderer |
| `rejection` | Optional, schema-governed | Required | Return input-error result |
| `error` | Must be `null` | Required | Send to diagnostic channel |
| `diagnostic` | Required | Must be `null` | Send to diagnostic channel |

A successful envelope with an invalid payload schema must not be accepted as a successful response.

## 5. Rules for the Router Validator

The Router Validator must perform the following deterministic checks:

1. Validate JSON syntax.
2. Validate the envelope's exact fields and field types.
3. Validate its envelope variant and conditional requirements.
4. Verify `request_id`, `source`, and `endpoint` against the pending request and trusted route configuration.
5. Resolve `payload_contract` from the authorized ruleset registry.
6. Apply the configured payload schema, when required.
7. Return an acceptance verdict or a structured validation failure.

The router must not infer the source identity merely from a self-declared `source` field. That field must agree with the service actually invoked.

## 6. Important refinement

The existing `router.response-envelope.v1` proposed previously used:

`outcome: success | rejected | error`

The new `router.envelope.v1` design introduces four message types and different field names. **These should not coexist as competing authoritative contracts.**

I recommend adopting `router.envelope.v1` as the canonical common envelope, then making the FSM response configuration produce its `payload` and `payload_contract`.

This creates the desired boundary:

\[
\text{Service result}
\rightarrow
\text{Configured envelope}
\rightarrow
\text{Router Validator}
\rightarrow
\text{Router}
\]

The router's validator can accept future service response types without modifying router code, provided their envelope variant and payload schema are explicitly registered.

This is a proposed contract definition. It has not yet been applied to the IssueScratch repository or validated against the existing response configuration.

---

**You**

> How will the router validate source?

**Assistant**

The Router Validator should validate `source` against the **router's own execution record**, not against a source identifier supplied in the response.

A response's `source` field is merely a claim. It cannot establish its own authenticity.

## 1. Source validation procedure

When the router dispatches a request, it already knows:

- The endpoint requested.
- The service selected by trusted routing configuration.
- The request identifier.
- The upstream connection to which it sent the request.

The Router Validator should compare the response against this trusted context.

| Check | Expected behavior |
|---|---|
| Source identity | Must equal the service selected by the router |
| Request correlation | `request_id` must match the originating request |
| Endpoint association | Response must correspond to the requested endpoint |
| Connection origin | Response must arrive through the connection established to the selected upstream |
| Payload contract | Must match a schema authorized for that service and endpoint |

## 2. Example

The router has this configuration:

<CodeBlock language="json" editable>
{
  "routes": {
    "/transition": {
      "method": "POST",
      "service": "fsm-validator",
      "response_contract": "fsm.transition-response.v1"
    }
  }
}
</CodeBlock>

The Router Validator receives a response:

<CodeBlock language="json" editable>
{
  "contract": "router.envelope.v1",
  "request_id": "req-001",
  "source": "fsm-validator",
  "endpoint": "/transition",
  "type": "result",
  "payload_contract": "fsm.transition-response.v1",
  "payload": {},
  "error": null
}
</CodeBlock>

It must compare `source` with the service identity established by the trusted route configuration and dispatch context.

Importantly, the example `payload` is only a placeholder. The response would still have to pass its configured payload schema.

## 3. Do we need `source` in the envelope?

**Not necessarily.** Because the router already knows which upstream it contacted, including `source` in the response duplicates information available from the dispatch context.

I recommend separating the two concepts:

- **Transport source:** Established by the router's trusted dispatch context.
- **Declared source:** Optional metadata supplied by the upstream service.

For a minimal and deterministic architecture, the Router Validator can omit `source` from the required response envelope and use the transport source instead.

It can then attach the verified service identity to its internal validation receipt.

This also avoids requiring each service to know or populate its own routing identity.

## 4. Security limitation

Matching a response to the expected upstream connection establishes **routing provenance**, not cryptographic identity.

If services communicate over an environment where connections can be impersonated, stronger authentication is required, such as mutually authenticated TLS or signed service responses.

For services running on the same trusted GitHub Actions runner, the router can generally rely on its configured local service connections, subject to the runner's isolation and trust assumptions.

**Recommendation:** Remove `source` as a required field from `router.envelope.v1`. Let the Router Validator derive provenance from the route configuration and actual upstream connection, and record it in the validation receipt rather than requiring the responding service to assert it.

---

**You**

> How will this be done?

**Assistant**

The router will establish source identity **when it dispatches the request**, then pass that identity to the Router Validator as trusted execution context when the response arrives.

The response does not need to identify its own source.

## 1. Execution sequence

<box border radius="lg" padding={3} gap={2}>
  <svg viewBox="0 0 340 272" width="100%">
    {#each [{x:18,y:8,w:304,h:39,t:"1. Router selects configured destination"},{x:18,y:65,w:304,h:39,t:"2. Router records dispatch context"},{x:18,y:122,w:304,h:39,t:"3. Upstream service returns response"},{x:18,y:179,w:304,h:39,t:"4. Router Validator compares context"},{x:18,y:236,w:304,h:32,t:"5. Accept or reject response"}] as n,i}
      <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="6" stroke="currentColor" fill="none" strokeWidth="1.2"/>
      <text x={n.x+n.w/2} y={n.y+n.h/2+4} fontSize="11" fill="currentColor" textAnchor="middle">{n.t}</text>
      {#if i<4}
        <path d={`M170 ${n.y+n.h} v16 m-4 -5 l4 5 4 -5`} stroke="currentColor" strokeWidth="1.3" fill="none"/>
      {/if}
    {/each}
  </svg>
</box>

For example, when the router receives `POST /transition`, its configuration identifies `fsm-validator` as the authorized service.

The router records that selection for the lifetime of the request.

## 2. Internal dispatch context

This context is generated by the router, not received from the caller or downstream service.

```json
{
  "request_id": "req-001",
  "endpoint": "/transition",
  "method": "POST",
  "expected_service": "fsm-validator",
  "expected_response_contract": "fsm.transition-response.v1"
}
```

The context remains internal to that request's execution. It does not need to be stored persistently.

## 3. Response validation

When the selected upstream responds, the router passes two inputs to its validator:

```javascript
validateResponse(response, dispatchContext)
```

The Router Validator then checks that the response came through the request associated with the configured service, that its envelope satisfies the registered response contract, and that any correlation fields agree.

A simplified Node.js example:

<CodeBlock language="javascript" editable>
async function dispatch(route, payload, validateResponse) {
  const context = {
    request_id: crypto.randomUUID(),
    endpoint: route.path,
    method: route.method,
    expected_service: route.service,
    expected_response_contract: route.response_contract
  };

  const response = await callConfiguredService(
    route.service,
    payload
  );

  return validateResponse(response, context);
}
</CodeBlock>

The key is that `callConfiguredService()` returns the response associated with the exact upstream request created by this invocation. The Router Validator does not select the response's origin from a field in the response body.

## 4. How does this prevent spoofing?

There are two separate guarantees.

**Correlation guarantee:** The router knows which configured destination it called and which response belongs to that invocation. A response body cannot arbitrarily change that association.

**Authentication guarantee:** The router must also trust that its configured destination is genuinely the intended service. Local process isolation, network controls, or authenticated connections provide that assurance. A matching request ID or a successful TCP connection alone does not.

For the proposed IssueScratch architecture, the service mapping can be held in `config/stateless-services.json`, with the Router Validator receiving trusted route context directly from the dispatcher.

## 5. What changes in the envelope?

We can remove the redundant `source` field.

The envelope becomes:

```json
{
  "contract": "router.envelope.v1",
  "request_id": "req-001",
  "endpoint": "/transition",
  "type": "result",
  "payload_contract": "issuescratch.transition-response.v1",
  "payload": {},
  "error": null
}
```

The router generates the source information in its own validation receipt, rather than requiring the upstream to declare it.

**Result:** Source verification is based on the actual dispatch context and trusted service mapping. The Router Validator verifies the response against that context, while the router remains stateless between requests.

No repository changes have been made.

---

**You**

> For servers running insdie the runner how would this be done practically?

**Assistant**

For servers running inside the **same GitHub Actions runner**, the simplest practical approach is to use local HTTP connections, fixed service ports, and an in-memory dispatch context.

You do not need a database, persistent request ledger, signed response envelope, or separate source-identification service.

## 1. Local service configuration

For IssueScratch, the existing configuration already establishes these addresses:

| Component | Address | Port |
|---|---|---|
| Router | `127.0.0.1` | `8787` |
| FSM | `127.0.0.1` | `8788` |
| Renderer | `127.0.0.1` | `8789` |
| FSM Validator | `127.0.0.1` | `8790` |

These addresses work when the services share the runner's network namespace. If each service runs in a separate container, Docker networking must be configured appropriately.

The Router Validator can be a Node.js module running inside the router process. It does not need its own HTTP server.

**Assistant**

For servers running inside the **same GitHub Actions runner**, the simplest practical approach is to use local HTTP connections, fixed service ports, and an in-memory dispatch context.

You do not need a database, persistent request ledger, signed response envelope, or separate source-identification service.

## 1. Local service configuration

For IssueScratch, the existing configuration already establishes these addresses:

| Component | Address | Port |
|---|---|---|
| Router | `127.0.0.1` | `8787` |
| FSM | `127.0.0.1` | `8788` |
| Renderer | `127.0.0.1` | `8789` |
| FSM Validator | `127.0.0.1` | `8790` |

These addresses work when the services share the runner's network namespace. If each service runs in a separate container, Docker networking must be configured appropriately.

The Router Validator can be a Node.js module running inside the router process. It does not need its own HTTP server.

## 2. How source identification works in practice

Suppose the router receives:

```http
POST /transition
Content-Type: application/json
```

The trusted configuration maps `/transition` to the FSM Validator at `127.0.0.1:8790`.

The router creates an outgoing HTTP request to that address. When Node.js receives the response through that specific request, it already knows which configured service was contacted.

**We do not need to extract a `source` field from the JSON response.**

Here is a simplified implementation:

<CodeBlock language="javascript" editable>
const services = {
  "fsm-validator": "http://127.0.0.1:8790"
};

async function dispatch(route, payload) {
  const serviceId = route.service;
  const target = new URL(
    route.upstreamPath,
    services[serviceId]
  );

  const response = await fetch(target, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000)
  });

  const body = await response.text();

  const dispatchContext = {
    expectedService: serviceId,
    endpoint: route.path,
    upstreamStatus: response.status
  };

  return routerValidator.validateResponse(
    body,
    dispatchContext
  );
}
</CodeBlock>

The validator compares the response envelope against the expected contract for `fsm-validator`. The `expectedService` comes from trusted route configuration, not from the response body.

The server can still return a request ID for correlation, but the identity of the responding upstream is already associated with the outstanding HTTP request.

## 3. How to start the servers

For processes running directly on the same runner, start them within the same workflow job:

```bash
node src/fsm-server.js &
node src/renderer-server.js &
node src/validation-server.js &
node src/stateless-router-server.js &
```

The workflow must check that the servers are ready before sending requests, and it must terminate the processes when the job finishes.

If using separate GitHub Actions service containers instead, the connectivity arrangement differs:

- A job running directly on the runner uses published localhost ports.
- A job running inside a container accesses its service containers using their configured hostnames, such as `http://validation:8790`.

This distinction is documented by GitHub. <Cite refs={["turn946018search0","turn946018search2"]}/>

## 4. What security does localhost provide?

Loopback communication prevents ordinary remote hosts from connecting directly to services bound to `127.0.0.1`.

It does **not** prove the process listening on port `8790` is the expected validator. Another process with access to the same network namespace could bind that port first.

For the GitHub Actions design, I recommend:

- Start all services from the checked-out, trusted repository revision.
- Bind HTTP servers to `127.0.0.1` when running directly on the runner.
- Verify startup and health before dispatching requests.
- Fail if a required port is occupied.
- Treat the configured service-to-port mapping as authoritative.
- Restrict untrusted code from running in the same environment as these services.

If untrusted code must execute alongside the servers, stronger isolation or authenticated service communication would be necessary.

## 5. What does the Router Validator actually receive?

Only two essential inputs are needed:

```javascript
validateResponse(responseBody, dispatchContext)
```

The first is untrusted service data. The second is trusted metadata generated by the router.

The validator checks the response envelope, the registered payload contract, and its consistency with the dispatch context.

It does not need to authenticate a self-reported source name or query GitHub to determine which service responded.

**My recommendation for IssueScratch:** Use local HTTP request association plus trusted route configuration. Keep source identity outside the response envelope, and record it in the Router Validator's execution receipt.

This provides deterministic source attribution within the trusted runner environment without adding another protocol or service.

No repository changes have been made.

**Assistant**

## 2. How source identification works in practice

Suppose the router receives:

```http
POST /transition
Content-Type: application/json
```

The trusted configuration maps `/transition` to the FSM Validator at `127.0.0.1:8790`.

The router creates an outgoing HTTP request to that address. When Node.js receives the response through that specific request, it already knows which configured service was contacted.

**We do not need to extract a `source` field from the JSON response.**

Here is a simplified implementation:

<CodeBlock language="javascript" editable>
const services = {
  "fsm-validator": "http://127.0.0.1:8790"
};

async function dispatch(route, payload) {
  const serviceId = route.service;
  const target = new URL(
    route.upstreamPath,
    services[serviceId]
  );

  const response = await fetch(target, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000)
  });

  const body = await response.text();

  const dispatchContext = {
    expectedService: serviceId,
    endpoint: route.path,
    upstreamStatus: response.status
  };

  return routerValidator.validateResponse(
    body,
    dispatchContext
  );
}
</CodeBlock>

The validator compares the response envelope against the expected contract for `fsm-validator`. The `expectedService` comes from trusted route configuration, not from the response body.

The server can still return a request ID for correlation, but the identity of the responding upstream is already associated with the outstanding HTTP request.

## 3. How to start the servers

For processes running directly on the same runner, start them within the same workflow job:

```bash
node src/fsm-server.js &
node src/renderer-server.js &
node src/validation-server.js &
node src/stateless-router-server.js &
```

The workflow must check that the servers are ready before sending requests, and it must terminate the processes when the job finishes.

If using separate GitHub Actions service containers instead, the connectivity arrangement differs:

- A job running directly on the runner uses published localhost ports.
- A job running inside a container accesses its service containers using their configured hostnames, such as `http://validation:8790`.

This distinction is documented by GitHub. <Cite refs={["turn946018search0","turn946018search2"]}/>

## 4. What security does localhost provide?

Loopback communication prevents ordinary remote hosts from connecting directly to services bound to `127.0.0.1`.

It does **not** prove the process listening on port `8790` is the expected validator. Another process with access to the same network namespace could bind that port first.

For the GitHub Actions design, I recommend:

- Start all services from the checked-out, trusted repository revision.
- Bind HTTP servers to `127.0.0.1` when running directly on the runner.
- Verify startup and health before dispatching requests.
- Fail if a required port is occupied.
- Treat the configured service-to-port mapping as authoritative.
- Restrict untrusted code from running in the same environment as these services.

If untrusted code must execute alongside the servers, stronger isolation or authenticated service communication would be necessary.

## 5. What does the Router Validator actually receive?

Only two essential inputs are needed:

```javascript
validateResponse(responseBody, dispatchContext)
```

The first is untrusted service data. The second is trusted metadata generated by the router.

The validator checks the response envelope, the registered payload contract, and its consistency with the dispatch context.

It does not need to authenticate a self-reported source name or query GitHub to determine which service responded.

**My recommendation for IssueScratch:** Use local HTTP request association plus trusted route configuration. Keep source identity outside the response envelope, and record it in the Router Validator's execution receipt.

This provides deterministic source attribution within the trusted runner environment without adding another protocol or service.

No repository changes have been made.

---

**You**

> Well I'm not too worried about security, but we need identity naively

**Assistant**

Then we should use **simple, configuration-based service identity**, without introducing authentication or cryptographic verification.

Each service receives a fixed identifier from the runner's configuration and includes that identifier in its response envelope.

## Proposed service identities

| Service | Identifier | Local port |
|---|---|---|
| Router | `router` | 8787 |
| FSM Validator | `fsm-validator` | 8790 |
| FSM | `fsm` | 8788 |
| Renderer | `renderer` | 8789 |

## Response envelope

<CodeBlock language="json" editable>
{
  "contract": "router.envelope.v1",
  "request_id": "req-001",
  "source": "fsm-validator",
  "endpoint": "/transition",
  "type": "result",
  "payload_contract": "issuescratch.transition-response.v1",
  "payload": {},
  "error": null
}
</CodeBlock>

The `source` field is required. Each service populates it automatically from its configuration, not from user-supplied input.

## Naive identity validation

When the Router Validator receives the response, it performs three checks:

1. `source` is a registered service identifier.
2. `source` matches the service configured for the endpoint.
3. `request_id` matches the originating request.

For example, if `/transition` is configured to communicate with `fsm-validator`, a response claiming `source: "renderer"` is rejected.

This provides **deterministic identification and correlation**, not proof of authenticity.

### Important implementation detail

The FSM communicates with the FSM Validator, and the FSM Validator communicates with the Router Validator. Therefore, the final envelope returned to the router identifies `fsm-validator` as its source.

The FSM's own identity can be retained in internal execution metadata if needed, without introducing another required field into the router envelope.

**Recommendation:** Restore `source` as a mandatory string in `router.envelope.v1`, populate it from each service's fixed configuration, and validate it against the endpoint registry. This is sufficient for the straightforward identity mechanism you want.

---

**You**

> If you have the port why the source too

**Assistant**

You don't need both. **The configured port already provides sufficient service identification for this architecture.**

The router knows which port it contacted, and the response is associated with that outgoing HTTP request.

For example:

| Port | Service |
|---|---|
| 8788 | FSM |
| 8789 | Renderer |
| 8790 | FSM Validator |

The Router Validator can identify the responding service through the router's configured endpoint-to-port mapping.

Therefore:

- Remove `source` from the response envelope.
- Retain `request_id` for request correlation.
- Use the configured port and associated HTTP request to establish service identity.
- Reject responses that do not match the expected envelope and payload contract.

**The response envelope should contain only information the router cannot already determine from its own execution context.**

One qualification: a port identifies the configured destination, not cryptographically the process listening on it. For the naive identity model we've chosen, that distinction is acceptable.

---

**You**

> Great.  The listerner at the issue will route to the validator port which will seem to it to be teh router port

**Assistant**

Yes. The **Issue Listener will use the Router Validator as the public entry point**, while the router itself remains behind that validation boundary.

The listener does not need to know that the validator and router are separate components.

## Proposed endpoint configuration

| Component | Internal port | Accessible to |
|---|---|---|
| Router Validator | `8787` | Issue Listener |
| Router | `8786` | Router Validator |
| FSM Validator | `8790` | Router Validator |
| FSM | `8788` | FSM Validator |
| Renderer | `8789` | Router |

<box border radius="lg" padding={3} gap={2}>
  <svg viewBox="0 0 340 260" width="100%">
    {#each [{x:8,y:15,w:104,h:39,t:"Issue Listener"},{x:138,y:15,w:192,h:39,t:"Router Validator :8787"},{x:138,y:96,w:192,h:39,t:"Internal Router :8786"},{x:138,y:178,w:192,h:39,t:"FSM Validator :8790"}] as n}
      <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="7" fill="none" stroke="currentColor" strokeWidth="1.2"/>
      <text x={n.x+n.w/2} y={n.y+24} fontSize="11" textAnchor="middle" fill="currentColor">{n.t}</text>
    {/each}
    <g stroke="currentColor" fill="none" strokeWidth="1.4">
      <path d="M112 35 H135 M131 31 L136 35 L131 39"/>
      <path d="M234 54 V93 M230 89 L234 95 L238 89"/>
      <path d="M234 135 V175 M230 171 L234 177 L238 171"/>
    </g>
    <text x="125" y="70" fontSize="10" fill="currentColor" textAnchor="middle">V01 boundary</text>
    <text x="234" y="241" fontSize="10" textAnchor="middle" fill="currentColor">Downstream FSM and rendering paths</text>
  </svg>
</box>

The Issue Listener sends requests to:

`http://127.0.0.1:8787/transition`

The Router Validator checks JSON syntax, then forwards accepted requests to the internal router on port `8786`.

Responses return through the same boundary.

**The listener sees one API address.** It does not know the internal router's port or the downstream service topology.

The port assignments above are a proposed reconfiguration; the current repository still assigns `8787` directly to the router.

This gives us a single entry point without making the router itself responsible for input validation.

---

**You**

> Great.  So the validator essentually validates correct envelopes

**Assistant**

Yes. The **Router Validator is an envelope validator**. Its responsibility is to ensure that incoming requests and returning responses conform to their configured communication contracts.

It does not validate the substantive meaning of the payload.

## Router Validator responsibilities

| Validation | Purpose |
|---|---|
| JSON syntax | Confirm the message is valid JSON |
| Envelope shape | Verify required fields and types |
| Endpoint | Verify the requested API service exists |
| Contract version | Verify the envelope uses a supported contract |
| Request correlation | Match a response to its originating request |
| Payload contract reference | Verify the declared contract is registered for the endpoint |

The actual payload remains opaque to the Router Validator. Its structure is validated downstream by the appropriate service.

## Processing

<box border radius="lg" padding={3} gap={2}>
  <svg viewBox="0 0 320 186" width="100%">
    {#each [{y:5,t:"Issue Listener"},{y:57,t:"Router Validator :8787"},{y:109,t:"Internal Router :8786"}] as n,i}
      <rect x="62" y={n.y} width="196" height="36" rx="7" fill="none" stroke="currentColor" strokeWidth="1.2"/>
      <text x="160" y={n.y+23} textAnchor="middle" fontSize="12" fill="currentColor">{n.t}</text>
      {#if i<2}
        <path d={`M150 ${n.y+36} v14 l-4 -5 m4 5 l4 -5`} stroke="currentColor" strokeWidth="1.3" fill="none"/>
        <path d={`M170 ${n.y+52} v-14 l-4 5 m4 -5 l4 5`} stroke="currentColor" strokeDasharray="3 3" strokeWidth="1.3" fill="none"/>
      {/if}
    {/each}
    <text x="160" y="169" textAnchor="middle" fontSize="10" fill="currentColor">Requests and responses cross the same boundary</text>
  </svg>
</box>

**The resulting separation is:**

- **Router Validator:** Is this a correctly formed message for the requested service?
- **Router:** Where should this message go?
- **FSM Validator:** Is this payload structurally valid for the current procedural operation?
- **FSM:** What is the next state and corresponding procedure projection?
- **Renderer:** How should the returned projection be presented?

One important distinction: verifying that a payload contract identifier is registered is not the same as evaluating the payload against that contract. The latter remains downstream.

This makes the Router Validator reusable for additional services without requiring changes to its execution logic—only new registered envelope contracts.

---

**You**

> So let's go ahead a define the correct envelopes in a configurable way and write the validation script

**Assistant · Commentary**

> I’ll define a versioned envelope registry, write a validator that selects rules by endpoint and direction, and test accepted and rejected requests and responses. I’ll preserve the existing runtime architecture and avoid changing the service wiring.

**Assistant**

Implemented the **configurable Router Envelope Validator v1** as a Node.js module, with a separate JSON ruleset. No changes were made to the existing router, FSM, or projection implementation.

<box gap={2}>
  <row align="center" justify="between">
    <text weight="medium">Validation tests</text>
    <badge color="success">19 / 19 passed</badge>
  </row>
  <text color="secondary" size="sm">All 19 local tests passed, including valid messages, malformed JSON, contract mismatches, incorrect request IDs, unknown fields, and invalid configuration.</text>
</box>

## Generated files

<box gap={3}>
  <row align="start" gap={3}>
    <icon name="file-json" color="secondary" size="lg"/>
    <box flex="1" gap={1}>
      **[Router envelope ruleset](sandbox:/mnt/data/issuescratch_contract/router-envelope-rules.v1.json)**

      <text color="secondary" size="sm">Defines envelope fields, data types, variants, endpoints, allowed payload contracts, and correlation requirements.</text>
    </box>
  </row>
  <divider color="subtle"/>
  <row align="start" gap={3}>
    <icon name="file-code" color="secondary" size="lg"/>
    <box flex="1" gap={1}>
      **[Node.js envelope validator](sandbox:/mnt/data/issuescratch_contract/router-envelope-validator.js)**

      <text color="secondary" size="sm">Loads the configured ruleset, validates incoming and outgoing envelopes, and returns structured validation results.</text>
    </box>
  </row>
  <divider color="subtle"/>
  <row align="start" gap={3}>
    <icon name="file-check" color="secondary" size="lg"/>
    <box flex="1" gap={1}>
      **[Automated test suite](sandbox:/mnt/data/issuescratch_contract/router-envelope-validator.test.js)**

      <text color="secondary" size="sm">19 Node.js tests covering accepted and rejected envelope combinations.</text>
    </box>
  </row>
</box>

## Accepted envelope contract

Every POST request and service response uses the same six-field structure.

<CodeBlock language="json">
{
  "contract": "router.envelope.v1",
  "request_id": "request-001",
  "type": "result",
  "payload_contract": "issuescratch.transition-input.v1",
  "payload": {
    "example": "Application-defined input"
  },
  "error": null
}
</CodeBlock>

| Field | Requirement |
|---|---|
| `contract` | Exact version identifier |
| `request_id` | Nonempty correlation identifier |
| `type` | Registered envelope variant |
| `payload_contract` | Configured contract identifier or null |
| `payload` | Any JSON value permitted by the variant |
| `error` | Structured error or null |

Service identity is deliberately absent. The router derives it from its configured port and dispatch context.

## Configurable endpoints

| Endpoint | Input contract | Output contract |
|---|---|---|
| `POST /transition` | `issuescratch.transition-input.v1` | `issuescratch.transition-response.v1` |
| `POST /validate` | `issuescratch.validation-input.v1` | `issuescratch.validation-result.v1` |

These identifiers are configuration declarations, not claims that matching application-payload schemas have already been implemented.

The `/validate` endpoint remains test-only and cannot execute FSM transitions through the envelope validator.

## Validation boundary

The script validates JSON syntax, envelope structure, endpoint registration, permitted response type, contract identifiers, and request correlation. It **does not inspect the application payload's internal structure**, execute the FSM, or invoke the renderer.

That preserves the distinction between the Router Validator and FSM Validator.

### Remaining integration work

The generated contract and validator are locally tested but **not yet committed to IssueScratch or connected to its HTTP server**. The current project still needs the router-boundary wiring, trusted request-context construction, and runtime service integration.

The module is ready for that integration without redefining the existing projection rules.

---

**You**

> Then lets define what the validator does with errors, that send an enveloped error message through the router that is rendered somewhere.

**Assistant**

# Router Validator — Error Handling Contract v1

The validator should **convert every validation failure into a standardized error envelope**, send it through the router, and have the router deliver it to a configured rendering destination.

The validator detects and describes the error. The router determines where the error goes. The renderer determines how it appears.

## 1. Error routing architecture

<box border radius="lg" padding={3} gap={2}>
  <svg viewBox="0 0 340 244" width="100%">
    {#each [{x:90,y:5,w:160,h:38,t:"Router Validator"},{x:90,y:76,w:160,h:38,t:"Internal Router"},{x:8,y:161,w:150,h:44,t:"Input Error Renderer"},{x:183,y:161,w:150,h:44,t:"Diagnostic Renderer"}] as n}
      <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="7" fill="none" stroke="currentColor" strokeWidth="1.3"/>
      <text x={n.x+n.w/2} y={n.y+n.h/2+4} fontSize="11" fill="currentColor" textAnchor="middle">{n.t}</text>
    {/each}
    <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none">
      <path d="M170 43 V73 m-4 -5 l4 5 4 -5"/>
      <path d="M170 114 V136 H83 V158 m-4 -5 l4 5 4 -5"/>
      <path d="M170 114 V136 H258 V158 m-4 -5 l4 5 4 -5"/>
    </g>
    <text x="75" y="226" fontSize="10" textAnchor="middle" fill="currentColor">Correctable input failures</text>
    <text x="265" y="226" fontSize="10" textAnchor="middle" fill="currentColor">Internal system failures</text>
  </svg>
</box>

The two destinations are logical destinations. They can use the same renderer implementation with different configuration; separate renderer servers are not required.

## 2. Standard error envelope

<CodeBlock language="json" editable>
{
  "contract": "router.envelope.v1",
  "request_id": "request-001",
  "type": "error",
  "payload_contract": null,
  "payload": null,
  "error": {
    "code": "INVALID_ENVELOPE",
    "category": "input",
    "message": "The request envelope does not satisfy its contract.",
    "details": [
      {
        "path": "/request_id",
        "rule": "required",
        "message": "Required field is missing."
      }
    ]
  }
}
</CodeBlock>

The `request_id` is assigned by the entry boundary before parsing or validating the submitted envelope, so even malformed submissions can receive a correlated error response.

The error envelope itself must be assembled by trusted code, rather than copying untrusted fields from a rejected request.

**Assistant**

# Router Validator — Error Handling Contract v1

The validator should **convert every validation failure into a standardized error envelope**, send it through the router, and have the router deliver it to a configured rendering destination.

The validator detects and describes the error. The router determines where the error goes. The renderer determines how it appears.

## 1. Error routing architecture

<box border radius="lg" padding={3} gap={2}>
  <svg viewBox="0 0 340 244" width="100%">
    {#each [{x:90,y:5,w:160,h:38,t:"Router Validator"},{x:90,y:76,w:160,h:38,t:"Internal Router"},{x:8,y:161,w:150,h:44,t:"Input Error Renderer"},{x:183,y:161,w:150,h:44,t:"Diagnostic Renderer"}] as n}
      <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="7" fill="none" stroke="currentColor" strokeWidth="1.3"/>
      <text x={n.x+n.w/2} y={n.y+n.h/2+4} fontSize="11" fill="currentColor" textAnchor="middle">{n.t}</text>
    {/each}
    <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none">
      <path d="M170 43 V73 m-4 -5 l4 5 4 -5"/>
      <path d="M170 114 V136 H83 V158 m-4 -5 l4 5 4 -5"/>
      <path d="M170 114 V136 H258 V158 m-4 -5 l4 5 4 -5"/>
    </g>
    <text x="75" y="226" fontSize="10" textAnchor="middle" fill="currentColor">Correctable input failures</text>
    <text x="265" y="226" fontSize="10" textAnchor="middle" fill="currentColor">Internal system failures</text>
  </svg>
</box>

The two destinations are logical destinations. They can use the same renderer implementation with different configuration; separate renderer servers are not required.

## 2. Standard error envelope

<CodeBlock language="json" editable>
{
  "contract": "router.envelope.v1",
  "request_id": "request-001",
  "type": "error",
  "payload_contract": null,
  "payload": null,
  "error": {
    "code": "INVALID_ENVELOPE",
    "category": "input",
    "message": "The request envelope does not satisfy its contract.",
    "details": [
      {
        "path": "/request_id",
        "rule": "required",
        "message": "Required field is missing."
      }
    ]
  }
}
</CodeBlock>

The `request_id` is assigned by the entry boundary before parsing or validating the submitted envelope, so even malformed submissions can receive a correlated error response.

The error envelope itself must be assembled by trusted code, rather than copying untrusted fields from a rejected request.

## 3. Error classification and destinations

| Error category | Examples | Configured destination |
|---|---|---|
| `input` | Malformed JSON, missing envelope fields, unsupported input contract | Input-error renderer |
| `protocol` | Incorrect response contract, request correlation mismatch | Diagnostic renderer |
| `configuration` | Missing ruleset, invalid route configuration | Diagnostic renderer |
| `execution` | Validator exception, timeout, failed downstream service | Diagnostic renderer |

A rejected request must never continue to its original destination. The validator returns a standardized error instead.

## 4. Configurable error routing rules

<CodeBlock language="json" editable>
{
  "contract": "router.error-routing.v1",
  "routes": {
    "input": {
      "destination": "renderer",
      "profile": "input-error",
      "delivery": "request-response"
    },
    "protocol": {
      "destination": "renderer",
      "profile": "diagnostic",
      "delivery": "diagnostic-channel"
    },
    "configuration": {
      "destination": "renderer",
      "profile": "diagnostic",
      "delivery": "diagnostic-channel"
    },
    "execution": {
      "destination": "renderer",
      "profile": "diagnostic",
      "delivery": "diagnostic-channel"
    }
  },
  "fallback": {
    "destination": "diagnostic-stderr",
    "format": "json"
  }
}
</CodeBlock>

This configuration defines logical destinations. A separate deployment configuration determines whether `diagnostic-channel` means a GitHub Issue comment, a repository file, an Actions log, or another output.

## 5. Execution rules

<list marker="number" gap={2}>
  <list-item>**Detect:** The validator identifies a failed deterministic rule or internal validation failure.</list-item>
  <list-item>**Classify:** Assign an error code and category from a configured error catalog.</list-item>
  <list-item>**Envelope:** Construct a new `router.envelope.v1` message from trusted values.</list-item>
  <list-item>**Return:** Deliver the error to the router instead of forwarding the rejected original payload.</list-item>
  <list-item>**Route:** The router selects the destination according to the error-routing configuration.</list-item>
  <list-item>**Render:** The selected renderer transforms the structured error into the configured presentation.</list-item>
  <list-item>**Deliver:** A configured output adapter publishes the rendered error and returns or records a delivery receipt.</list-item>
</list>

## 6. Required failure safeguards

There is one critical complication: **the Router Validator might reject the error envelope itself**, or the renderer might fail while rendering that error.

To prevent recursive failure loops, we should establish these invariants:

- Error envelopes generated internally use a fixed, independently validated schema.
- Error handling never retries the rejected application operation.
- Error envelopes do not trigger another application validation cycle.
- Rendering failures fall back to a minimal structured diagnostic written to the runner's standard error stream.
- Every error retains its original request correlation and error code.
- An error is not reported as successfully delivered unless the configured output adapter confirms delivery.

The error message can therefore be rendered without allowing an unlimited sequence of errors reporting errors.

## 7. Resulting contract

The entire failure pathway is:

\[
\text{Validation failure}
\rightarrow
\text{Error envelope}
\rightarrow
\text{Router}
\rightarrow
\text{Configured renderer}
\rightarrow
\text{Configured destination}
\]

**Recommendation:** Use the existing `router.envelope.v1` structure, extend its error object with `category` and `details`, and introduce `router.error-routing.v1` as a separate configuration document.

The validator must **report errors, not decide where they are published**. Destination selection remains the router's responsibility, while output delivery remains the responsibility of the configured adapter.

This is the proposed error-handling contract. It has not yet been incorporated into the Node.js validator or committed to IssueScratch.

**Assistant**

## 3. Error classification and destinations

| Error category | Examples | Configured destination |
|---|---|---|
| `input` | Malformed JSON, missing envelope fields, unsupported input contract | Input-error renderer |
| `protocol` | Incorrect response contract, request correlation mismatch | Diagnostic renderer |
| `configuration` | Missing ruleset, invalid route configuration | Diagnostic renderer |
| `execution` | Validator exception, timeout, failed downstream service | Diagnostic renderer |

A rejected request must never continue to its original destination. The validator returns a standardized error instead.

## 4. Configurable error routing rules

<CodeBlock language="json" editable>
{
  "contract": "router.error-routing.v1",
  "routes": {
    "input": {
      "destination": "renderer",
      "profile": "input-error",
      "delivery": "request-response"
    },
    "protocol": {
      "destination": "renderer",
      "profile": "diagnostic",
      "delivery": "diagnostic-channel"
    },
    "configuration": {
      "destination": "renderer",
      "profile": "diagnostic",
      "delivery": "diagnostic-channel"
    },
    "execution": {
      "destination": "renderer",
      "profile": "diagnostic",
      "delivery": "diagnostic-channel"
    }
  },
  "fallback": {
    "destination": "diagnostic-stderr",
    "format": "json"
  }
}
</CodeBlock>

This configuration defines logical destinations. A separate deployment configuration determines whether `diagnostic-channel` means a GitHub Issue comment, a repository file, an Actions log, or another output.

## 5. Execution rules

<list marker="number" gap={2}>
  <list-item>**Detect:** The validator identifies a failed deterministic rule or internal validation failure.</list-item>
  <list-item>**Classify:** Assign an error code and category from a configured error catalog.</list-item>
  <list-item>**Envelope:** Construct a new `router.envelope.v1` message from trusted values.</list-item>
  <list-item>**Return:** Deliver the error to the router instead of forwarding the rejected original payload.</list-item>
  <list-item>**Route:** The router selects the destination according to the error-routing configuration.</list-item>
  <list-item>**Render:** The selected renderer transforms the structured error into the configured presentation.</list-item>
  <list-item>**Deliver:** A configured output adapter publishes the rendered error and returns or records a delivery receipt.</list-item>
</list>

## 6. Required failure safeguards

There is one critical complication: **the Router Validator might reject the error envelope itself**, or the renderer might fail while rendering that error.

To prevent recursive failure loops, we should establish these invariants:

- Error envelopes generated internally use a fixed, independently validated schema.
- Error handling never retries the rejected application operation.
- Error envelopes do not trigger another application validation cycle.
- Rendering failures fall back to a minimal structured diagnostic written to the runner's standard error stream.
- Every error retains its original request correlation and error code.
- An error is not reported as successfully delivered unless the configured output adapter confirms delivery.

The error message can therefore be rendered without allowing an unlimited sequence of errors reporting errors.

## 7. Resulting contract

The entire failure pathway is:

\[
\text{Validation failure}
\rightarrow
\text{Error envelope}
\rightarrow
\text{Router}
\rightarrow
\text{Configured renderer}
\rightarrow
\text{Configured destination}
\]

**Recommendation:** Use the existing `router.envelope.v1` structure, extend its error object with `category` and `details`, and introduce `router.error-routing.v1` as a separate configuration document.

The validator must **report errors, not decide where they are published**. Destination selection remains the router's responsibility, while output delivery remains the responsibility of the configured adapter.

This is the proposed error-handling contract. It has not yet been incorporated into the Node.js validator or committed to IssueScratch.

---

**You**

> Well actually no.

**Assistant**

Which part should change: the validator's error envelope, the routing of errors, or the rendering destination?

---

**You**

> Is the error is in input from the agent, its rendered back down that channel, if the error is from the FSM, it should...well, hmm...should it be rendered in the FSM server error log.

**Assistant**

Yes. I recommend **routing errors according to where they originate and who can correct them**, rather than sending every error to the same renderer.

The FSM server's error log is the appropriate destination for internal FSM failures. However, the router should also receive a minimal structured failure response so it knows the operation did not complete.

## Proposed error-routing contract

| Error origin | Primary destination | Response to caller |
|---|---|---|
| Agent submits malformed JSON | Agent's original communication channel | Specific correction instructions |
| Agent input fails FSM validation | Agent's original communication channel | Validation errors and required corrections |
| FSM produces an invalid transition | FSM server error log | Minimal execution-failure envelope |
| FSM encounters an internal exception | FSM server error log | Minimal execution-failure envelope |
| FSM cannot read its state file | FSM server error log | Minimal execution-failure envelope |
| Router Validator encounters an internal failure | Router Validator error log | Minimal execution-failure envelope |
| Router cannot contact a downstream service | Router error log | Minimal transport-failure envelope |

## FSM error reporting

For example, if the FSM generates an invalid transition, the detailed diagnostic belongs in its server log:

```json
{
  "event": "fsm.execution_error",
  "request_id": "req-001",
  "code": "INVALID_TRANSITION",
  "details": {
    "from_index": 8,
    "proposed_index": 11,
    "expected_index": 9
  }
}
```

The FSM Validator can reject that transition, arrange for the diagnostic to be logged by the FSM subsystem, and return a minimal error envelope:

```json
{
  "contract": "router.envelope.v1",
  "request_id": "req-001",
  "type": "error",
  "payload_contract": null,
  "payload": null,
  "error": {
    "code": "FSM_EXECUTION_FAILED",
    "message": "The state transition could not be completed."
  }
}
```

The router forwards the failure status without presenting internal diagnostics as instructions for the agent to correct.

## Important distinction

The originating service should own its diagnostic record. If the FSM crashes before logging the failure, the FSM Validator should record the observed failure in its own log rather than falsely attributing a log entry to the FSM.

The logs may be implemented using structured JSON written to `stderr`, which GitHub Actions captures in the job log. That avoids introducing additional storage or error-rendering services.

**Recommended rule:** Agent-correctable input errors are rendered back to the agent. Internal FSM errors are logged at the FSM boundary and return only a minimal failure envelope through the router. Neither category should advance the FSM state.

---

**You**

> The FSM is always going to be responding based on a router POST, so maybe the error shouldn't be handled in the FSM, the router will have to render it to the FSM error log

**Assistant**

Yes. That gives us a cleaner division of responsibilities: **the FSM reports the error, but the router is responsible for routing and rendering it to the configured FSM error log.**

The FSM does not need its own logging implementation.

## Revised error-handling architecture

| Component | Responsibility |
|---|---|
| FSM | Returns a structured success or failure result |
| FSM Validator | Checks the FSM response against its configured contract |
| Router Validator | Checks the response envelope |
| Router | Selects the error destination |
| Renderer | Formats the error according to the selected rendering profile |
| Output adapter | Writes the rendered error to the configured destination |

## Error routing rules

| Error origin | Destination |
|---|---|
| Agent input syntax error | Original agent communication channel |
| Agent input fails procedural validation | Original agent communication channel |
| FSM transition failure | FSM error log |
| FSM output contract violation | FSM error log |
| FSM state-file failure | FSM error log |
| Router or Router Validator failure | Router error log |

## Example error response

The FSM Validator returns this envelope to the Router Validator:

<CodeBlock language="json" editable>
{
  "contract": "router.envelope.v1",
  "request_id": "req-001",
  "type": "error",
  "payload_contract": null,
  "payload": null,
  "error": {
    "code": "INVALID_TRANSITION",
    "origin": "fsm",
    "message": "The requested state transition failed.",
    "details": {
      "current_index": 8,
      "attempted_index": 9
    }
  }
}
</CodeBlock>

The router uses the error origin to select its configured destination. This is a proposed extension to the current envelope's error object.

## Configurable error destinations

<CodeBlock language="json" editable>
{
  "contract": "router.error-routing.v1",
  "destinations": {
    "agent_input": {
      "renderer_profile": "agent-validation-error",
      "output": "request-origin-channel"
    },
    "fsm": {
      "renderer_profile": "fsm-error",
      "output": "fsm-error-log"
    },
    "router": {
      "renderer_profile": "router-error",
      "output": "router-error-log"
    }
  }
}
</CodeBlock>

These are logical destination names. The actual files, streams, or issue-comment destinations remain separately configurable.

## Execution invariant

The router must not allow an error response to initiate another FSM transition.

\[
\text{FSM failure}
\rightarrow
\text{Validator}
\rightarrow
\text{Router}
\rightarrow
\text{Renderer}
\rightarrow
\text{FSM error log}
\]

The FSM error log is a **destination**, not necessarily a logging function executed by the FSM.

One important qualification: if the FSM becomes unreachable or crashes before returning an envelope, the router or FSM Validator must create an error record based on the failed request. The FSM cannot report an error when it produces no response.

**This keeps the FSM focused entirely on deterministic state computation, while the router owns error routing and the renderer owns error presentation.**

---

**You**

> I'm talking about FSM to router not the other way.

**Assistant**

Understood. You're specifying **how the router handles errors contained in responses originating from the FSM**, not how requests or validation failures are sent toward the FSM.

The return path is:

**FSM → FSM Validator → Router Validator → Router → Configured Renderer → FSM Error Log**

The contract should be:

1. The FSM returns a structured response indicating either success or failure.
2. The FSM Validator checks that response against the configured FSM output contract.
3. The Router Validator validates the response envelope.
4. The router inspects the validated envelope type.
5. On success, the router invokes the normal configured rendering procedure.
6. On an FSM error, the router invokes the configured error renderer and directs its output to the FSM error log.

**The FSM does not choose the rendering destination, render its errors, or write to the error log.** It only returns structured results.

The critical distinction is that the router receives the FSM's response through its validators and then decides how to handle that response according to configuration.

This means we can define **one configurable FSM response contract with distinct success and failure variants**, rather than introducing a separate FSM error-reporting API.

---

**You**

> The return path doesn't go throiugh the FSM validator

**Assistant**

Correct. The **FSM response bypasses the FSM Validator** and goes directly to the Router Validator.

The return path is:

**FSM → Router Validator → Router → Configured Renderer → Destination**

The Router Validator checks the returned envelope against its configured response contract.

- **Successful response:** Router sends the projection to the normal renderer.
- **FSM error response:** Router sends the error to the renderer configured for the FSM error log.
- **Malformed FSM response:** Router Validator reports a response-contract violation for routing to the FSM error log.

The FSM Validator handles **inputs to the FSM only**, not outputs from it.

The Router Validator is therefore the common validation boundary for responses returning from the FSM, and the router determines their rendering destinations.

No repository changes have been made.

---

**You**

> So if the error is caught it, thr rouer validator routes the error to teh FSM error render path

**Assistant**

Yes. **If the Router Validator detects an error in the FSM's response, it routes that error to the configured FSM error-rendering path.**

The sequence is:

**FSM → Router Validator → FSM Error Renderer → FSM Error Log**

The Router Validator performs three operations:

1. **Detect:** Identify the response-envelope or contract violation.
2. **Construct:** Generate a structured error envelope containing the error code, details, and request correlation.
3. **Route:** Send the error envelope to the configured FSM error-rendering path.

The FSM Error Renderer formats the diagnostic and writes it to the configured FSM error log through the output adapter.

**Important invariant:** A rejected FSM response must never proceed through the normal rendering path or advance persisted state.

This also means the Router Validator needs a configurable `on_error` destination associated with the FSM response contract. That destination is invoked only when validation fails.

No repository changes have been made.

---

**You**

> If theres an error to the FSM, its caight in the FSM validator which responds to the router and thats rendered in the input error render, which is back at the issue

**Assistant**

Correct. This establishes **two distinct error paths**, based on which validator detects the error.

| Error detected by | Error rendering path | Final destination |
|---|---|---|
| FSM Validator (invalid agent input) | Input Error Renderer | Original GitHub Issue |
| Router Validator (invalid FSM response) | FSM Error Renderer | FSM Error Log |

## 1. Input error path

**Issue Listener → Router Validator → Router → FSM Validator → Router → Input Error Renderer → Original Issue**

The FSM Validator rejects invalid input before it reaches the FSM. The router receives the validation error and returns a rendered correction message to the agent through the original issue channel.

## 2. FSM response error path

**FSM → Router Validator → FSM Error Renderer → FSM Error Log**

The Router Validator detects an invalid FSM response, constructs the error envelope, and directs it to the configured FSM error-rendering path.

## 3. Successful transition path

**FSM → Router Validator → Router → Normal Renderer → Original Issue**

The valid FSM response contains the resulting state and configured procedure projection.

### Governing invariants

- Input errors do not reach the FSM.
- FSM response errors do not get rendered as agent-input corrections.
- Error destinations are determined by configurable routing rules.
- Rejected responses cannot advance persisted state.
- Each rendering path uses its own configured output destination.

**This gives us three rendering outcomes: normal procedural output, agent-input correction, and internal FSM diagnostics.**

---

**You**

> Therefore we can create the validator ruleset for the FSM validator if it hasn't already be set.

**Assistant · Commentary**

> I’ll check whether the existing IssueScratch input-validation procedure already defines the FSM Validator ruleset, then create only the missing contract artifact and verify it against the current implementation.

**Assistant · Commentary**

> The FSM input-validation procedure already exists and defines V01–V09. What is missing is a dedicated configurable ruleset for the FSM Validator under the new routing boundaries. I’ll derive that ruleset from the existing procedure, keeping V01 at the Router Validator.

**Assistant**

The FSM input-validation rules already exist in IssueScratch. I verified the current specification and created a dedicated configurable ruleset for the architecture we've established.

[Download FSM Validator Ruleset v1](sandbox:/mnt/data/issuescratch_contract/fsm-validator-ruleset.v1.json)

## Ruleset contents

The ruleset references the existing canonical procedure rather than duplicating its per-index requirements.

| Rule | Validation |
|---|---|
| V02 | Root is a JSON array |
| V03 | Each entry has the required scratchpad wrapper |
| V04 | Submission identity matches expected context |
| V05 | Exactly one entry is added at the expected index |
| V06 | Previously accepted entries remain unchanged |
| V07 | Current index contract resolves uniquely |
| V08 | Scratchpad satisfies its structural contract |
| V09 | Operation-specific structural fields are valid |

**V01 is excluded** because JSON syntax validation belongs to the Router Validator.

### Endpoint behavior

| Endpoint | Valid input | Invalid input |
|---|---|---|
| `POST /transition` | Permit FSM execution | Return error for rendering to the original issue |
| `POST /validate` | Return validation verdict only | Return validation errors; never invoke FSM |

The FSM Validator does not validate FSM responses, modify state, or render errors.

## Verification

<row align="center" gap={2}>
  <icon name="check-circle" color="success"/>
  **Ruleset structural checks passed**
</row>

I verified that the generated JSON parses, contains the eight unique rules V02–V09, excludes V01, prohibits state mutation, and explicitly disables FSM forwarding for `/validate`.

I also confirmed that the current canonical procedure contains 19 index contracts and the references required for index-contract resolution.

**Remaining distinction:** This is a validated configuration artifact, not yet an executable implementation of every declared rule. The existing `src/input-validator.js` implements much of the behavior, but the new ruleset is not yet wired into that executor or committed to the repository.

No existing IssueScratch files were modified.

---

**You**

> The routing should be a seperate configurable set.  Its the what to do if error or else

**Assistant**

Correct. **Validation rules and routing rules must be separate, independently configurable contracts.**

The validator determines whether the input is valid. The routing configuration determines what happens afterward.

## 1. Separation of responsibilities

| Component | Responsibility | Output |
|---|---|---|
| Validation ruleset | Defines what constitutes valid input | Validation criteria |
| Validation executor | Evaluates input against those criteria | `accepted`, `rejected`, or `execution_error` |
| Routing ruleset | Maps validation outcomes to actions | Destination and action |
| Router | Executes the selected routing action | Dispatched response |

The validator must not contain forwarding instructions, rendering destinations, or endpoint-specific execution behavior.

## 2. Validation result contract

The validator returns a standard result, independently of its caller:

<CodeBlock language="json" editable>
{
  "contract": "validation.result.v1",
  "status": "rejected",
  "errors": [
    {
      "code": "INVALID_FIELD",
      "pointer": "/8/scratchpad",
      "message": "Required field is missing."
    }
  ]
}
</CodeBlock>

The validator does not determine what to do with this result.

## 3. Separate configurable routing ruleset

<CodeBlock language="json" editable>
{
  "contract": "router.outcome-routing.v1",
  "endpoints": {
    "/transition": {
      "accepted": {
        "action": "forward",
        "destination": "fsm"
      },
      "rejected": {
        "action": "render",
        "profile": "agent-input-error",
        "destination": "request-origin"
      },
      "execution_error": {
        "action": "render",
        "profile": "validator-diagnostic",
        "destination": "validator-error-log"
      }
    },
    "/validate": {
      "accepted": {
        "action": "return",
        "destination": "request-origin"
      },
      "rejected": {
        "action": "return",
        "destination": "request-origin"
      },
      "execution_error": {
        "action": "return",
        "destination": "request-origin"
      }
    }
  }
}
</CodeBlock>

The destinations are logical identifiers. Another deployment configuration binds them to actual ports, files, issue comments, or output adapters.

## 4. Deterministic routing function

\[
\operatorname{Route}(E,V,C)\rightarrow A
\]

Where:

- \(E\) = requested endpoint.
- \(V\) = validation result.
- \(C\) = routing configuration.
- \(A\) = selected action.

The routing function has no authority to reinterpret validation results.

An unknown status, missing route, invalid destination, or unsupported action produces a routing-configuration error rather than an implicit success.

## 5. Important architectural consequence

The FSM Validator becomes reusable across both `/transition` and `/validate`, because it no longer knows whether its accepted input will be forwarded to an FSM or returned directly to a caller.

The same principle applies to the Router Validator: it validates envelopes, while a separate routing configuration determines what happens when an envelope passes or fails validation.

**The governing separation is:**

\[
\boxed{\text{Validate} \rightarrow \text{Verdict} \rightarrow \text{Routing Rule} \rightarrow \text{Action}}
\]

That keeps validation purely deterministic, with all subsequent behavior controlled through configuration.

This is a specification revision only. No repository files were modified.

---

**You**

> So let's create the FSM validator routing logi

**Assistant · Commentary**

> I’ll implement the routing logic as a separate configurable module, with tests for accepted, rejected, and failed validation outcomes. The validator will only return a verdict; the routing module will decide the next action.

**Assistant**

## FSM Validator Routing Logic v1 — Created

Created the separate configurable routing ruleset, a Node.js routing-decision module, and automated tests.

<row align="center" gap={2}>
  <icon name="check-circle" color="success"/>
  **14 of 14 tests passed**
</row>

## Generated files

<box gap={3}>
  <row align="center" gap={3}>
    <icon name="file-json" color="secondary" size="lg"/>
    <box flex="1" gap={1}>
      **[FSM Validator Routing Ruleset](sandbox:/mnt/data/fsm-validator-routing/fsm-validator-routing.v1.json)**

      <text color="secondary" size="sm">Configures actions, destinations, and renderer profiles for each validation outcome.</text>
    </box>
  </row>
  <divider color="subtle"/>
  <row align="center" gap={3}>
    <icon name="file-code" color="secondary" size="lg"/>
    <box flex="1" gap={1}>
      **[Node.js Routing Module](sandbox:/mnt/data/fsm-validator-routing/fsm-validator-router.js)**

      <text color="secondary" size="sm">Evaluates validation results and selects actions without making HTTP calls or changing state.</text>
    </box>
  </row>
  <divider color="subtle"/>
  <row align="center" gap={3}>
    <icon name="file-check" color="secondary" size="lg"/>
    <box flex="1" gap={1}>
      **[Automated Tests](sandbox:/mnt/data/fsm-validator-routing/fsm-validator-router.test.js)**

      <text color="secondary" size="sm">Covers both endpoints, all outcome types, invalid routing configurations, and fail-closed behavior.</text>
    </box>
  </row>
</box>

## Implemented decision table

| Validation result | `/transition` | `/validate` |
|---|---|---|
| Accepted | Forward validated input to FSM | Return validation result |
| Rejected | Render input error to original issue | Return validation result |
| Execution error | Route diagnostic to validator error log | Return validation result |

The module uses the existing IssueScratch validation-result fields: `execution_status`, `input_status`, and `accepted`.

It also enforces that `/validate` never forwards to the FSM, rejected inputs cannot proceed, and missing or inconsistent outcomes fail closed.

**Implementation boundary:** This is executable routing-selection logic, not yet an HTTP dispatcher. It returns the selected action and payload to a caller responsible for performing the forwarding, rendering, or delivery.

The files were created and tested locally. They have **not been committed to IssueScratch or connected to its service runtime**.

---

**You**

> Now we will make the render agnostic, it gets the same shape input as the router, and it doens't have spearate validation, it must meet the contract of the router validator.

**Assistant**

## Renderer Contract — Transport-Agnostic v1

The renderer should accept **the same standardized envelope as the router**, without defining another transport format or implementing a separate validation layer.

The Router Validator is the single authority for envelope validation.

| Component | Responsibility |
|---|---|
| Router Validator | Validates the standard envelope against its configured contract |
| Router | Selects renderer and destination using routing configuration |
| Renderer | Transforms the supplied payload according to rendering configuration |
| Output adapter | Delivers rendered content to the configured destination |

### Renderer input contract

The renderer receives the existing `router.envelope.v1` structure:

<CodeBlock language="json" editable>
{
  "contract": "router.envelope.v1",
  "request_id": "req-001",
  "type": "result",
  "payload_contract": "issuescratch.transition-response.v1",
  "payload": {
    "transition": {
      "status": "valid",
      "action": "advance",
      "advanced": true,
      "from_index": 8,
      "to_index": 9
    }
  },
  "error": null
}
</CodeBlock>

The abbreviated payload here illustrates the envelope only; a real request must contain the complete payload required by its registered contract.

The renderer does not independently check whether the envelope is valid. It relies on the Router Validator having performed that check.

**Assistant · Commentary**

> The current renderer still accepts `{projection, bindings}` and checks for a `projection` field itself. I’ll replace that interface in the proposed implementation with the shared `router.envelope.v1` input, use configuration to choose the rendering profile, and leave envelope acceptance entirely to the Router Validator.

**Assistant**

## Renderer Contract — Transport-Agnostic v1

The renderer should accept **the same standardized envelope as the router**, without defining another transport format or implementing a separate validation layer.

The Router Validator is the single authority for envelope validation.

| Component | Responsibility |
|---|---|
| Router Validator | Validates the standard envelope against its configured contract |
| Router | Selects renderer and destination using routing configuration |
| Renderer | Transforms the supplied payload according to rendering configuration |
| Output adapter | Delivers rendered content to the configured destination |

### Renderer input contract

The renderer receives the existing `router.envelope.v1` structure:

<CodeBlock language="json" editable>
{
  "contract": "router.envelope.v1",
  "request_id": "req-001",
  "type": "result",
  "payload_contract": "issuescratch.transition-response.v1",
  "payload": {
    "transition": {
      "status": "valid",
      "action": "advance",
      "advanced": true,
      "from_index": 8,
      "to_index": 9
    }
  },
  "error": null
}
</CodeBlock>

The abbreviated payload here illustrates the envelope only; a real request must contain the complete payload required by its registered contract.

The renderer does not independently check whether the envelope is valid. It relies on the Router Validator having performed that check.

## Agnostic Renderer v1 — Implemented locally

Created a renderer that accepts the same `router.envelope.v1` input as the router and uses a separate configuration to determine how content is presented.

<row align="center" gap={2}>
  <icon name="check-circle" color="success"/>
  **8 of 8 local tests passed**
</row>

## Generated files

<box gap={3}>
  <row align="center" gap={3}>
    <icon name="file-code" color="secondary" size="lg"/>
    <box flex="1" gap={1}>
      **[Agnostic Renderer — Node.js](sandbox:/mnt/data/agnostic-renderer/agnostic-renderer.js)**

      <text color="secondary" size="sm">Receives an envelope, selects the configured rendering profile, and returns rendered content.</text>
    </box>
  </row>
  <divider color="subtle"/>
  <row align="center" gap={3}>
    <icon name="file-json" color="secondary" size="lg"/>
    <box flex="1" gap={1}>
      **[Renderer Configuration v1](sandbox:/mnt/data/agnostic-renderer/renderer-profiles.v1.json)**

      <text color="secondary" size="sm">Defines response-contract mappings and rendering profiles without hardcoding FSM-specific content into the renderer.</text>
    </box>
  </row>
  <divider color="subtle"/>
  <row align="center" gap={3}>
    <icon name="file-check" color="secondary" size="lg"/>
    <box flex="1" gap={1}>
      **[Automated Tests](sandbox:/mnt/data/agnostic-renderer/agnostic-renderer.test.js)**

      <text color="secondary" size="sm">Covers normal projections, validation results, agent-input errors, FSM errors, and invalid rendering configuration.</text>
    </box>
  </row>
</box>

## Execution contract

| Stage | Responsibility |
|---|---|
| Router Validator | Validate envelope against the shared contract |
| Router | Select rendering destination |
| Renderer | Select configured presentation profile and transform content |
| Output adapter | Deliver content to the intended location |

The renderer does not independently validate the envelope, check FSM state, execute transition rules, or interpret procedural semantics.

### Configuration determines presentation

| Envelope contents | Rendering profile |
|---|---|
| Successful transition | `procedure` |
| Validation result | `validation_result` |
| Agent input error | `input_error` |
| FSM execution error | `fsm_error` |

The initial implementation renders selected JSON content as formatted text. More sophisticated presentation can be introduced through additional configured rendering modes without changing the envelope interface.

**Important boundary:** The renderer assumes the Router Validator has already accepted the envelope. That trust boundary must be enforced by the HTTP integration; the renderer does not independently verify it.

The files are tested local artifacts. They have not been committed to IssueScratch or connected to its existing HTTP renderer service.

**Assistant**

## Agnostic Renderer v1 — Implemented locally

Created a renderer that accepts the same `router.envelope.v1` input as the router and uses a separate configuration to determine how content is presented.

<row align="center" gap={2}>
  <icon name="check-circle" color="success"/>
  **8 of 8 local tests passed**
</row>

## Generated files

<box gap={3}>
  <row align="center" gap={3}>
    <icon name="file-code" color="secondary" size="lg"/>
    <box flex="1" gap={1}>
      **[Agnostic Renderer — Node.js](sandbox:/mnt/data/agnostic-renderer/agnostic-renderer.js)**

      <text color="secondary" size="sm">Receives an envelope, selects the configured rendering profile, and returns rendered content.</text>
    </box>
  </row>
  <divider color="subtle"/>
  <row align="center" gap={3}>
    <icon name="file-json" color="secondary" size="lg"/>
    <box flex="1" gap={1}>
      **[Renderer Configuration v1](sandbox:/mnt/data/agnostic-renderer/renderer-profiles.v1.json)**

      <text color="secondary" size="sm">Defines response-contract mappings and rendering profiles without hardcoding FSM-specific content into the renderer.</text>
    </box>
  </row>
  <divider color="subtle"/>
  <row align="center" gap={3}>
    <icon name="file-check" color="secondary" size="lg"/>
    <box flex="1" gap={1}>
      **[Automated Tests](sandbox:/mnt/data/agnostic-renderer/agnostic-renderer.test.js)**

      <text color="secondary" size="sm">Covers normal projections, validation results, agent-input errors, FSM errors, and invalid rendering configuration.</text>
    </box>
  </row>
</box>

## Execution contract

| Stage | Responsibility |
|---|---|
| Router Validator | Validate envelope against the shared contract |
| Router | Select rendering destination |
| Renderer | Select configured presentation profile and transform content |
| Output adapter | Deliver content to the intended location |

The renderer does not independently validate the envelope, check FSM state, execute transition rules, or interpret procedural semantics.

### Configuration determines presentation

| Envelope contents | Rendering profile |
|---|---|
| Successful transition | `procedure` |
| Validation result | `validation_result` |
| Agent input error | `input_error` |
| FSM execution error | `fsm_error` |

The initial implementation renders selected JSON content as formatted text. More sophisticated presentation can be introduced through additional configured rendering modes without changing the envelope interface.

**Important boundary:** The renderer assumes the Router Validator has already accepted the envelope. That trust boundary must be enforced by the HTTP integration; the renderer does not independently verify it.

The files are tested local artifacts. They have not been committed to IssueScratch or connected to its existing HTTP renderer service.

---

**You**

> the renderer must accept whatever is the output payload of the various inputs to it, moreover, has different destinations, and these must be defined in its input

**Assistant**

The renderer needs to be **payload-agnostic and destination-driven**. Its input must contain both the content to render and the destination to which the rendered result will be delivered.

This changes the earlier design: the renderer must not infer the destination from the payload type, error category, or the identity of the originating service.

The router selects the destination according to its routing rules and includes that destination in the envelope passed to the renderer.

## Revised renderer input contract

<CodeBlock language="json" editable>
{
  "contract": "router.envelope.v1",
  "request_id": "req-001",
  "type": "result",
  "payload_contract": "issuescratch.transition-response.v1",
  "payload": {
    "transition": {
      "status": "valid",
      "advanced": true
    },
    "projection": {
      "schema": "issuescratch.dynamic-index-projection.v1"
    }
  },
  "error": null,
  "render": {
    "profile": "procedure",
    "destination": {
      "adapter": "github-issue-comment",
      "target_ref": "request-origin"
    }
  }
}
</CodeBlock>

The abbreviated projection is illustrative. The actual payload remains completely intact, regardless of its size, structure, or originating service.

The `render` object is the proposed configurable extension to the shared envelope.

---

**You**

> Or must be configured before hand more likely

**Assistant**

The renderer needs to be **payload-agnostic and destination-driven**. Its input must contain both the content to render and the destination to which the rendered result will be delivered.

This changes the earlier design: the renderer must not infer the destination from the payload type, error category, or the identity of the originating service.

The router selects the destination according to its routing rules and includes that destination in the envelope passed to the renderer.

## Revised renderer input contract

<CodeBlock language="json" editable>
{
  "contract": "router.envelope.v1",
  "request_id": "req-001",
  "type": "result",
  "payload_contract": "issuescratch.transition-response.v1",
  "payload": {
    "transition": {
      "status": "valid",
      "advanced": true
    },
    "projection": {
      "schema": "issuescratch.dynamic-index-projection.v1"
    }
  },
  "error": null,
  "render": {
    "profile": "procedure",
    "destination": {
      "adapter": "github-issue-comment",
      "target_ref": "request-origin"
    }
  }
}
</CodeBlock>

The abbreviated projection is illustrative. The actual payload remains completely intact, regardless of its size, structure, or originating service.

The `render` object is the proposed configurable extension to the shared envelope.

Yes. **The rendering destinations should be configured beforehand**, rather than supplied independently with every incoming message.

That is preferable because destination selection belongs to the routing configuration, while the renderer should only execute the selected rendering operation.

## Revised responsibilities

| Component | Responsibility |
|---|---|
| Router Validator | Validates the common envelope |
| Router | Selects the destination using configured routing rules |
| Renderer | Renders arbitrary payloads using a configured profile |
| Output adapter | Delivers rendered content to the configured destination |

The renderer's input can remain the existing `router.envelope.v1`, without adding a required `render.destination` object.

## Rendering configuration

<CodeBlock language="json" editable>
{
  "contract": "renderer.configuration.v1",
  "profiles": {
    "procedure": {
      "format": "text",
      "payload_handling": "preserve",
      "destination_ref": "agent-issue"
    },
    "input_error": {
      "format": "text",
      "payload_handling": "preserve",
      "destination_ref": "agent-issue"
    },
    "fsm_error": {
      "format": "json",
      "payload_handling": "preserve",
      "destination_ref": "fsm-error-log"
    }
  },
  "destinations": {
    "agent-issue": {
      "adapter": "github-issue-comment",
      "target": "request-origin"
    },
    "fsm-error-log": {
      "adapter": "file",
      "path": "logs/fsm-errors.jsonl"
    }
  }
}
</CodeBlock>

These are proposed configuration values, not verified repository destinations.

The router would select a rendering profile, and the renderer would resolve that profile against the configuration.

### Important distinction

There are two different concerns:

- **Destination definition:** Established before execution in configuration.
- **Destination selection:** Performed at runtime using the router's routing rules.

The renderer must not independently decide where a response belongs.

This also means the same renderer can accept an FSM projection, validation error, diagnostic report, or another future payload without changing its code.

**Resulting interface:**

\[
\operatorname{Render}(E,C,P)\rightarrow O
\]

Where \(E\) is the validated envelope, \(C\) is the rendering configuration, \(P\) is the selected rendering profile, and \(O\) is the rendered output.

One correction to the earlier proposal: rendering and delivery should remain separate operations. The renderer produces the formatted result; the configured output adapter performs the actual write.

No repository files have been changed.

**Assistant**

Yes. **The rendering destinations should be configured beforehand**, rather than supplied independently with every incoming message.

That is preferable because destination selection belongs to the routing configuration, while the renderer should only execute the selected rendering operation.

## Revised responsibilities

| Component | Responsibility |
|---|---|
| Router Validator | Validates the common envelope |
| Router | Selects the destination using configured routing rules |
| Renderer | Renders arbitrary payloads using a configured profile |
| Output adapter | Delivers rendered content to the configured destination |

The renderer's input can remain the existing `router.envelope.v1`, without adding a required `render.destination` object.

## Rendering configuration

<CodeBlock language="json" editable>
{
  "contract": "renderer.configuration.v1",
  "profiles": {
    "procedure": {
      "format": "text",
      "payload_handling": "preserve",
      "destination_ref": "agent-issue"
    },
    "input_error": {
      "format": "text",
      "payload_handling": "preserve",
      "destination_ref": "agent-issue"
    },
    "fsm_error": {
      "format": "json",
      "payload_handling": "preserve",
      "destination_ref": "fsm-error-log"
    }
  },
  "destinations": {
    "agent-issue": {
      "adapter": "github-issue-comment",
      "target": "request-origin"
    },
    "fsm-error-log": {
      "adapter": "file",
      "path": "logs/fsm-errors.jsonl"
    }
  }
}
</CodeBlock>

These are proposed configuration values, not verified repository destinations.

The router would select a rendering profile, and the renderer would resolve that profile against the configuration.

### Important distinction

There are two different concerns:

- **Destination definition:** Established before execution in configuration.
- **Destination selection:** Performed at runtime using the router's routing rules.

The renderer must not independently decide where a response belongs.

This also means the same renderer can accept an FSM projection, validation error, diagnostic report, or another future payload without changing its code.

**Resulting interface:**

\[
\operatorname{Render}(E,C,P)\rightarrow O
\]

Where \(E\) is the validated envelope, \(C\) is the rendering configuration, \(P\) is the selected rendering profile, and \(O\) is the rendered output.

One correction to the earlier proposal: rendering and delivery should remain separate operations. The renderer produces the formatted result; the configured output adapter performs the actual write.

No repository files have been changed.

---

**You**

> But the inpus must define a mode, thus a FSM diagnostic or state file output must define a mode thats captured in the configurable settings for the renderer

**Assistant**

Correct. **Every input to the renderer must declare a rendering mode**, and that mode must correspond to a predefined entry in the renderer's configuration.

The mode identifies the rendering procedure and destination configuration. The payload itself remains arbitrary.

## 1. Revised renderer input envelope

<CodeBlock language="json" editable>
{
  "contract": "router.envelope.v1",
  "request_id": "req-001",
  "type": "result",
  "mode": "fsm-diagnostic",
  "payload_contract": "fsm.diagnostic.v1",
  "payload": {
    "code": "INVALID_TRANSITION",
    "current_index": 8,
    "attempted_index": 10
  },
  "error": null
}
</CodeBlock>

The `mode` is mandatory for renderer-bound envelopes. It must match a registered mode, but the renderer does not choose or infer it.

The router selects the mode from its routing rules and constructs or binds the renderer-bound envelope. The Router Validator checks that the selected mode is permitted.

## 2. Configurable renderer mode registry

<CodeBlock language="json" editable>
{
  "contract": "renderer.modes.v1",
  "modes": {
    "procedure": {
      "format": "text",
      "destination": "agent-issue"
    },
    "input-error": {
      "format": "text",
      "destination": "agent-issue"
    },
    "fsm-diagnostic": {
      "format": "jsonl",
      "destination": "fsm-error-log"
    },
    "state-file": {
      "format": "json",
      "destination": "fsm-state-file"
    }
  },
  "destinations": {
    "agent-issue": {
      "adapter": "github-issue-comment",
      "target": "request-origin"
    },
    "fsm-error-log": {
      "adapter": "file-append",
      "path": "logs/fsm-errors.jsonl"
    },
    "fsm-state-file": {
      "adapter": "file-replace",
      "path_ref": "configured-fsm-state-path"
    }
  }
}
</CodeBlock>

These paths and adapters are illustrative. The actual locations must be established by deployment configuration.

## 3. Mode-specific execution behavior

| Input mode | Rendering transformation | Destination | Write operation |
|---|---|---|---|
| `procedure` | Render resolved procedure instructions | Original agent issue | Post comment |
| `input-error` | Render validation errors | Original agent issue | Post comment |
| `fsm-diagnostic` | Serialize structured diagnostic | FSM error log | Append |
| `state-file` | Serialize complete state | Configured state file | Replace |

The `state-file` mode is important: **rendering a JSON state document and persisting it are distinct operations**. The renderer serializes the state without changing its values. The output adapter performs the file replacement, subject to state revision and write authorization checks.

## 4. Mode validation contract

Before invoking the renderer, the Router Validator must establish:

1. `mode` is present and is a string.
2. `mode` exists in the renderer mode registry.
3. The selected mode is permitted for the current route and envelope type.
4. The required `payload_contract` is compatible with the selected mode.
5. The destination and rendering format are defined in the registered configuration.

Unknown modes, incompatible payload contracts, or missing destination configuration are errors. No default mode should be silently substituted.

## 5. Final interface

\[
\operatorname{Render}(E,M,C)\rightarrow O
\]

Where:

- \(E\) = validated envelope containing the arbitrary payload.
- \(M\) = declared mode inside the envelope.
- \(C\) = predefined renderer configuration.
- \(O\) = rendered output and destination reference.

The renderer's execution mechanics do not change when new modes are added; only the configuration does, provided the required format and destination adapters are supported.

**The governing rule is: the input declares the mode; configuration defines what that mode means.** The renderer does not infer the mode from payload contents, and the payload's application-specific shape remains independent of the transport envelope.

No repository changes have been made.

---

**You**

> We will allow the validator to check the mode routed to the renderer against its config settings

**Assistant**

Agreed. The **Router Validator will validate the renderer mode against the renderer's registered configuration before allowing dispatch**.

This extends the Router Validator's envelope checks without introducing a separate validator inside the renderer.

## Validation contract

| Check | Requirement | Failure |
|---|---|---|
| Mode presence | `mode` is required for renderer-bound envelopes | `MODE_REQUIRED` |
| Mode type | Must be a string | `INVALID_MODE_TYPE` |
| Mode registration | Must exist in `renderer.modes.v1` | `UNKNOWN_MODE` |
| Mode authorization | Must be permitted for the selected route | `MODE_NOT_ALLOWED` |
| Mode configuration | Referenced format and destination must exist | `INVALID_MODE_CONFIG` |
| Payload compatibility | Payload contract must be permitted for the mode | `INCOMPATIBLE_PAYLOAD` |

## Configuration relationship

<CodeBlock language="json" editable>
{
  "contract": "router.renderer-mode-validation.v1",
  "renderer_config_ref": "renderer.modes.v1",
  "requirements": {
    "mode_required": true,
    "mode_must_be_registered": true,
    "mode_must_be_authorized_for_route": true,
    "payload_contract_must_be_compatible": true,
    "configuration_must_be_complete": true
  },
  "on_failure": {
    "action": "reject",
    "error_code": "RENDER_MODE_VALIDATION_FAILED"
  }
}
</CodeBlock>

This configuration is a proposed contract, not an implemented ruleset.

## Execution flow

1. Router selects a rendering action and assigns the configured mode.
2. Router Validator checks the renderer-bound envelope.
3. Router Validator resolves the mode in the renderer configuration.
4. If every check passes, the router dispatches to the renderer.
5. If any check fails, the validator returns a structured error; rendering is blocked.

A malformed rendering mode must not be sent back into the same renderer as an error, because that could create a recursive failure.

**The resulting boundary is precise:** The Router Validator validates the mode and its configuration references; the renderer executes the selected mode without performing independent envelope validation.

No repository changes have been made.

---

**You**

> Create the renderer settings, update the router validator

**Assistant · Commentary**

> I’ll check the current IssueScratch files and the validator artifacts, then create the renderer mode settings and update the router validator to enforce them. I’ll run the relevant tests and report what is actually saved.

**Assistant · Commentary**

> The updated validator still passes its original 19 tests. I’m adding mode-specific tests now, including unknown modes, route restrictions, payload compatibility, and incomplete renderer settings.

**Assistant**

Created the **renderer settings** and updated the **Router Validator** to check renderer modes against those settings.

<row align="center" gap={2}>
  <icon name="check-circle" color="success"/>
  **31 of 31 local tests passed**
</row>

## Generated files

<box gap={3}>
  <row align="center" gap={3}>
    <icon name="file-json" color="secondary" size="lg"/>
    <box flex="1" gap={1}>
      **[Renderer Settings v1](sandbox:/mnt/data/issuescratch_contract/renderer-modes.v1.json)**

      <text color="secondary" size="sm">Defines rendering modes, formats, destinations, and compatible payload contracts.</text>
    </box>
  </row>
  <divider color="subtle"/>
  <row align="center" gap={3}>
    <icon name="file-code" color="secondary" size="lg"/>
    <box flex="1" gap={1}>
      **[Updated Router Validator](sandbox:/mnt/data/issuescratch_contract/router-envelope-validator.js)**

      <text color="secondary" size="sm">Validates renderer-bound envelopes against the configurable mode registry.</text>
    </box>
  </row>
  <divider color="subtle"/>
  <row align="center" gap={3}>
    <icon name="file-json" color="secondary" size="lg"/>
    <box flex="1" gap={1}>
      **[Updated Router Envelope Rules](sandbox:/mnt/data/issuescratch_contract/router-envelope-rules.v1.json)**

      <text color="secondary" size="sm">Adds mode validation and endpoint-specific mode permissions.</text>
    </box>
  </row>
  <divider color="subtle"/>
  <row align="center" gap={3}>
    <icon name="file-check" color="secondary" size="lg"/>
    <box flex="1" gap={1}>
      **[Mode Validation Tests](sandbox:/mnt/data/issuescratch_contract/router-renderer-modes.test.js)**

      <text color="secondary" size="sm">11 additional tests covering accepted and rejected rendering modes.</text>
    </box>
  </row>
</box>

## Configured rendering modes

| Mode | Format | Destination |
|---|---|---|
| `procedure` | Pretty JSON | Original agent issue |
| `input-error` | Pretty JSON | Original agent issue |
| `fsm-diagnostic` | JSONL | FSM error log |
| `state-file` | JSON | Configured FSM state file |
| `validation-result` | Pretty JSON | Original agent issue |

The destinations are configuration declarations. The runtime adapters still need to be connected to perform delivery.

## Router Validator behavior

For renderer-bound messages, the updated validator checks:

- Mode is present and correctly typed.
- Mode exists in the renderer registry.
- Mode is permitted for the requested endpoint.
- Envelope type and payload contract are compatible with the mode.
- Rendering format and destination are configured.

Non-renderer-bound messages are not required to declare a mode.

Missing or invalid renderer configuration causes validation to fail closed.

## Test results

<box gap={2}>
  <row justify="between" align="center">
    <text color="secondary">Existing envelope tests</text>
    **19 passed**
  </row>
  <divider color="subtle"/>
  <row justify="between" align="center">
    <text color="secondary">New renderer-mode tests</text>
    **11 passed**
  </row>
  <divider color="subtle"/>
  <row justify="between" align="center">
    <text color="secondary">Total</text>
    **31 passed**
  </row>
</box>

The original suite contains 19 tests and the new suite contains 12, for 31 passing tests in total.

**Implementation status:** The files are created and tested locally. They have not been committed to IssueScratch or integrated into the running router service. No existing repository files were modified.

---

**You**

> Now should this be all ran in a container that the workflow just runs.

**Assistant**

**Yes. I recommend running the entire IssueScratch service architecture inside a single container started by the GitHub Actions workflow.**

This would simplify deployment, networking, configuration, and lifecycle management while preserving the separation between the router, validators, FSM, and renderer.

The critical distinction is that **one container does not mean one application or one process**. The services can remain independent Node.js processes communicating over local HTTP.

## Proposed container architecture

<box border radius="lg" padding={3} gap={2}>
  <box background="surface-secondary" radius="lg" padding={3} gap={2}>
    <row align="center" gap={2}>
      <icon name="github" size="lg"/>
      **GitHub Actions Workflow**
    </row>
    <box border={{size:1,color:"default"}} background="surface" radius="md" padding={3} gap={2}>
      <row align="center" gap={2}>
        <icon name="container" size="lg"/>
        **IssueScratch Runtime Container**
      </row>
      <box border radius="md" padding={2} gap={2} align="center">
        **Router Validator**

        <caption>Public API entry point — port 8787</caption>
      </box>
      <box align="center">
        <icon name="arrow-down-up" color="tertiary"/>
      </box>
      <box border radius="md" padding={2} gap={1}>
        <text weight="medium" textAlign="center">Internal Router — port 8786</text>
        <divider color="subtle"/>
        <grid columns={3} gap={2}>
          {#each [{t:"FSM Validator",p:"8790"},{t:"FSM",p:"8788"},{t:"Renderer",p:"8789"}] as s}
            <grid-item>
              <box background="surface-secondary" radius="sm" padding={2} align="center" gap={1}>
                <text size="xs" weight="medium" textAlign="center">{s.t}</text>
                <caption>{s.p}</caption>
              </box>
            </grid-item>
          {/each}
        </grid>
      </box>
      <box align="center">
        <icon name="arrow-down-up" color="tertiary"/>
      </box>
      <box border radius="md" padding={2} gap={1}>
        **Configured storage and output adapters**

        <caption>State files · Issue comments · Diagnostic logs</caption>
      </box>
    </box>
  </box>
  <caption>Proposed deployment, not the current implemented configuration.</caption>
</box>

**Assistant**

**Yes. I recommend running the entire IssueScratch service architecture inside a single container started by the GitHub Actions workflow.**

This would simplify deployment, networking, configuration, and lifecycle management while preserving the separation between the router, validators, FSM, and renderer.

The critical distinction is that **one container does not mean one application or one process**. The services can remain independent Node.js processes communicating over local HTTP.

## Proposed container architecture

<box border radius="lg" padding={3} gap={2}>
  <box background="surface-secondary" radius="lg" padding={3} gap={2}>
    <row align="center" gap={2}>
      <icon name="github" size="lg"/>
      **GitHub Actions Workflow**
    </row>
    <box border={{size:1,color:"default"}} background="surface" radius="md" padding={3} gap={2}>
      <row align="center" gap={2}>
        <icon name="container" size="lg"/>
        **IssueScratch Runtime Container**
      </row>
      <box border radius="md" padding={2} gap={2} align="center">
        **Router Validator**

        <caption>Public API entry point — port 8787</caption>
      </box>
      <box align="center">
        <icon name="arrow-down-up" color="tertiary"/>
      </box>
      <box border radius="md" padding={2} gap={1}>
        <text weight="medium" textAlign="center">Internal Router — port 8786</text>
        <divider color="subtle"/>
        <grid columns={3} gap={2}>
          {#each [{t:"FSM Validator",p:"8790"},{t:"FSM",p:"8788"},{t:"Renderer",p:"8789"}] as s}
            <grid-item>
              <box background="surface-secondary" radius="sm" padding={2} align="center" gap={1}>
                <text size="xs" weight="medium" textAlign="center">{s.t}</text>
                <caption>{s.p}</caption>
              </box>
            </grid-item>
          {/each}
        </grid>
      </box>
      <box align="center">
        <icon name="arrow-down-up" color="tertiary"/>
      </box>
      <box border radius="md" padding={2} gap={1}>
        **Configured storage and output adapters**

        <caption>State files · Issue comments · Diagnostic logs</caption>
      </box>
    </box>
  </box>
  <caption>Proposed deployment, not the current implemented configuration.</caption>
</box>

## 2. Why one container fits this architecture

| Concern | One-container approach |
|---|---|
| Networking | Services communicate over `127.0.0.1` |
| Identity | Configured ports identify services |
| Configuration | All services read the same mounted configuration |
| Deployment | Workflow starts one container |
| State files | Available through a mounted workspace |
| Logs | Captured by the runner or written to configured files |
| Shutdown | All services stop together |
| Testing | Entire request-to-render pipeline can be tested in one environment |

Docker supports multiple processes in one container, although it generally recommends one concern per container. For this tightly coupled, job-scoped runtime, a single container is a reasonable simplification. <Cite refs={["turn854429search0","turn854429search1"]}/>

## 3. The workflow should have minimal responsibilities

The GitHub Actions workflow would:

1. Check out the repository.
2. Start the runtime container.
3. Supply the Issue event payload to port `8787`.
4. Wait for the request to complete and collect its execution result.
5. Verify required output files and delivery receipts.
6. Stop the container and report success or failure.

The workflow should **not duplicate validation, FSM transition, projection, or rendering logic**.

## 4. Two important requirements

**Container lifecycle:** The container needs a process supervisor or entrypoint that starts the services, checks readiness, propagates failures, and shuts them down cleanly. Docker's `--init` support can help manage child processes. <Cite ref="turn854429search0"/>

**State persistence:** GitHub-hosted runners are ephemeral. State-file changes made inside a container will not automatically persist to the repository or survive subsequent workflow runs. The design must explicitly publish verified state updates before the workflow completes. <Cite refs={["turn854429search2","turn854429search3"]}/>

## 5. Recommended implementation boundary

I would package the following into one runtime image:

- Router Validator
- Router
- FSM Validator
- Stateless FSM and existing projection implementation
- Agnostic Renderer
- Versioned validation, routing, projection, and rendering configurations

The issue listener can remain in the GitHub Actions workflow as the trigger adapter, rather than becoming another continuously running server.

**My recommendation is one container per workflow execution, with separate Node.js service processes inside it and one exposed API port (`8787`).**

The existing workflow should not be switched over until the container passes an end-to-end test covering successful transitions, rejected agent input, malformed FSM responses, rendering destinations, and durable state publication.

This is a deployment recommendation; no container has been built or committed yet.

**Assistant**

## 2. Why one container fits this architecture

| Concern | One-container approach |
|---|---|
| Networking | Services communicate over `127.0.0.1` |
| Identity | Configured ports identify services |
| Configuration | All services read the same mounted configuration |
| Deployment | Workflow starts one container |
| State files | Available through a mounted workspace |
| Logs | Captured by the runner or written to configured files |
| Shutdown | All services stop together |
| Testing | Entire request-to-render pipeline can be tested in one environment |

Docker supports multiple processes in one container, although it generally recommends one concern per container. For this tightly coupled, job-scoped runtime, a single container is a reasonable simplification. <Cite refs={["turn854429search0","turn854429search1"]}/>

## 3. The workflow should have minimal responsibilities

The GitHub Actions workflow would:

1. Check out the repository.
2. Start the runtime container.
3. Supply the Issue event payload to port `8787`.
4. Wait for the request to complete and collect its execution result.
5. Verify required output files and delivery receipts.
6. Stop the container and report success or failure.

The workflow should **not duplicate validation, FSM transition, projection, or rendering logic**.

## 4. Two important requirements

**Container lifecycle:** The container needs a process supervisor or entrypoint that starts the services, checks readiness, propagates failures, and shuts them down cleanly. Docker's `--init` support can help manage child processes. <Cite ref="turn854429search0"/>

**State persistence:** GitHub-hosted runners are ephemeral. State-file changes made inside a container will not automatically persist to the repository or survive subsequent workflow runs. The design must explicitly publish verified state updates before the workflow completes. <Cite refs={["turn854429search2","turn854429search3"]}/>

## 5. Recommended implementation boundary

I would package the following into one runtime image:

- Router Validator
- Router
- FSM Validator
- Stateless FSM and existing projection implementation
- Agnostic Renderer
- Versioned validation, routing, projection, and rendering configurations

The issue listener can remain in the GitHub Actions workflow as the trigger adapter, rather than becoming another continuously running server.

**My recommendation is one container per workflow execution, with separate Node.js service processes inside it and one exposed API port (`8787`).**

The existing workflow should not be switched over until the container passes an end-to-end test covering successful transitions, rejected agent input, malformed FSM responses, rendering destinations, and durable state publication.

This is a deployment recommendation; no container has been built or committed yet.

---

**You**

> The listener will do that of course and the state files will be updated outside the container, but all the stateless processes can run inisde it

**Assistant**

Yes. That establishes a clean deployment boundary: **the container executes stateless operations; the GitHub Actions workflow manages persistent state and external I/O.**

## Final responsibility split

| Inside runtime container | Outside runtime container |
|---|---|
| Router Validator | GitHub Issue Listener |
| Router | State-file retrieval |
| FSM Validator | State-file persistence |
| Stateless FSM | GitHub Issue comment publication |
| Procedure projection engine | Persistent diagnostic-file publication |
| Renderer | Workflow execution and lifecycle management |
| Configurable validation and routing engines | Execution receipt verification |

The workflow retrieves the current state and makes it available to the container as an input, either through a mounted read-only file or a supplied JSON value.

The FSM computes the next state but does not persist it. The renderer can produce a `state-file` output, but the workflow's output adapter performs the actual write.

## Execution flow

<CodeBlock language="text">
GitHub Issue Event
       |
       v
Workflow Listener
       |
       | Supplies input and current state
       v
Stateless Runtime Container
       |
       +-- Router Validator
       +-- Router
       +-- FSM Validator
       +-- FSM
       +-- Procedure Projection
       +-- Renderer
       |
       | Returns rendered outputs and receipts
       v
Workflow Output Adapter
       |
       +-- Update state files
       +-- Publish Issue comments
       +-- Publish diagnostic logs
       +-- Verify persisted results
</CodeBlock>

### Required invariants

1. The container never directly modifies persistent repository state.
2. All state required for computation is supplied to the container.
3. All output destinations are declared in configuration.
4. The renderer produces output artifacts but does not publish them directly.
5. The workflow performs writes and verifies their completion.
6. The container can be destroyed and recreated without losing application state.

**This is the architecture I would implement:** one ephemeral container containing all stateless services, controlled by the GitHub Actions workflow, with the listener and persistence adapters outside it.

It also means the container can be tested independently by supplying input, state, and configuration fixtures and comparing its outputs against deterministic expectations.

---

**You**

> All the configuration files will be edternal

**Assistant**

Agreed. **All configuration files will reside outside the container.** The container will contain only executable, stateless Node.js services and their runtime dependencies.

The GitHub Actions workflow will supply configuration, state snapshots, and input payloads when starting the container.

## Final architecture

| Outside container | Inside container |
|---|---|
| GitHub Issue Listener | Router Validator |
| All configuration files | Router |
| Validation rulesets | FSM Validator |
| Routing rulesets | Stateless FSM |
| Renderer mode settings | Procedure projection engine |
| Current state files | Agnostic Renderer |
| State persistence | |
| Output publication and receipts | |

### Container configuration interface

The workflow mounts the external configuration directory read-only:

```bash
docker run --rm \
  -v "$PWD/config:/runtime/config:ro" \
  -p 127.0.0.1:8787:8787 \
  issuescratch-runtime
```

State snapshots and event payloads can be supplied separately through the runtime API.

### Governing invariants

1. **No configuration is embedded in the container image.**
2. All services receive their settings through external configuration references.
3. Configuration is loaded at startup, with a consistent versioned snapshot used throughout each execution.
4. Missing, conflicting, or unsupported configuration causes an explicit failure.
5. Configuration changes do not require rebuilding the container.
6. No persistent state is written inside the container.
7. The workflow remains responsible for all external writes and publication verification.

The same container image can therefore run different procedure libraries, validator rulesets, routing configurations, and rendering modes simply by changing the externally supplied configuration.

**The deployment model is now: immutable stateless runtime + external configuration + externally managed persistent state.**

---

**You**

> Now, you need a runner in the container or no to coordinate whats going on...or will the components just harmonize?

**Assistant**

**Yes. The container needs a runtime coordinator.** The components will not automatically coordinate merely because they share a container and communicate through HTTP.

However, we should distinguish between a **process supervisor** and an **execution coordinator**. They perform different functions.

## 1. Two levels of coordination

| Component | Responsibility |
|---|---|
| Process supervisor | Starts the Node.js services, monitors readiness and failures, and shuts them down |
| Runtime coordinator | Manages the request lifecycle, dispatches operations, correlates responses, and determines when execution is complete |

We already have most of the execution coordination conceptually assigned to the Router and its configurable routing rules. Therefore, I would **not introduce a second execution coordinator that duplicates the Router**.

## 2. Recommended architecture

<box border radius="lg" padding={3} gap={2}>
  <box background="surface-secondary" radius="md" padding={3} gap={2}>
    **Outside container**

    <box background="surface" border radius="md" padding={3} align="center" gap={1}>
      **GitHub Actions Listener**

      <caption>Input, external configuration, state snapshot, persistence, publication</caption>
    </box>
  </box>
  <box align="center" gap={1}>
    <icon name="arrow-down-up" color="secondary" size="lg"/>
    <caption>Request and final result</caption>
  </box>
  <box border radius="lg" padding={3} gap={3}>
    <row align="center" justify="between">
      **Stateless Runtime Container**
      <badge color="secondary">Node.js</badge>
    </row>
    <box background="surface-secondary" radius="md" padding={2} align="center" gap={1}>
      **Process Supervisor / Entrypoint**

      <caption>Service startup · readiness · shutdown</caption>
    </box>
    <box align="center">
      <icon name="arrow-down" color="secondary"/>
    </box>
    <box border radius="md" padding={3} gap={2}>
      <box background="surface-secondary" radius="md" padding={2} align="center" gap={1}>
        **Router Validator**

        <caption>Validates requests and service responses</caption>
      </box>
      <box align="center">
        <icon name="arrow-down-up" color="secondary"/>
      </box>
      <box background="surface-secondary" radius="md" padding={2} align="center" gap={1}>
        **Router**

        <caption>Config-driven dispatch and request correlation</caption>
      </box>
      <grid columns={3} gap={2}>
        {#each ["FSM Validator","Stateless FSM","Renderer"] as s}
          <grid-item>
            <box border radius="md" padding={2} minHeight="75px" align="center" justify="center">
              <text size="xs" weight="medium" textAlign="center">{s}</text>
            </box>
          </grid-item>
        {/each}
      </grid>
    </box>
  </box>
</box>

## 3. What the Router must coordinate

The Router must have deterministic handling for:

1. **Dispatch:** Select the next service using external routing configuration.
2. **Correlation:** Associate responses with the original request ID.
3. **Continuation:** Apply routing rules to each returned result.
4. **Termination:** Determine when a request has produced its complete output set.
5. **Failure:** Handle timeouts, unavailable services, invalid responses, and routing errors without creating an infinite loop.

The Router remains stateless: it can maintain temporary request-local execution context while a request is active, but cannot depend on persistent process memory between requests.

For example, a successful FSM operation may produce both a state-file output and a procedural output. The Router must ensure both are accounted for before returning the completed result to the listener. It must not persist either output itself.

## 4. What the container runner actually needs to do

A very small Node.js entrypoint is sufficient:

```text
container-entrypoint.js
    |
    +-- Load external configuration
    +-- Start Router Validator
    +-- Start Router
    +-- Start FSM Validator
    +-- Start FSM
    +-- Start Renderer
    +-- Verify service readiness
    +-- Monitor process failures
    +-- Handle shutdown
```

It does not need to understand scratchpads, FSM transitions, renderer modes, or procedure contracts.

## Recommendation

**Use one lightweight process supervisor inside the container and retain the Router as the execution coordinator.**

That avoids creating two competing orchestration systems.

One qualification is important: the Router's current proposed implementation must actually support multi-step request continuation and terminal completion. Merely forwarding an HTTP request to a service is insufficient. Those capabilities need to be implemented and tested before treating the architecture as operational.

---

**You**

> Why doesn't teh process supervsiosr just run the container from the otuside....spinning it up and shutting ti down, while the router coordiantes internally

**Assistant**

Yes. **That is a cleaner architecture.** There is no reason to introduce an independent process supervisor inside the container when the GitHub Actions workflow already controls the container lifecycle.

The responsibilities become:

| Component | Responsibility |
|---|---|
| GitHub Actions workflow | Start container, monitor execution, collect results, shut down container |
| Container entrypoint | Start the Node.js service processes |
| Router Validator | Validate incoming and returning envelopes |
| Router | Coordinate internal execution, dispatch, continuation, and completion |
| FSM Validator | Validate FSM inputs |
| FSM | Execute deterministic state transitions |
| Renderer | Render outputs according to externally configured modes |
| Workflow output adapter | Persist state and publish results |

## Execution architecture

<box border radius="lg" padding={3} gap={2}>
  <box background="surface-secondary" radius="md" padding={3} gap={2}>
    **GitHub Actions Workflow — External Controller**

    <text color="secondary" size="sm">Loads configuration and state, starts the container, supplies input, collects output, persists results, and terminates the container.</text>
  </box>
  <box align="center">
    <icon name="arrow-down-up" color="secondary"/>
  </box>
  <box border radius="lg" padding={3} gap={2}>
    **Stateless Node.js Container**

    <box background="surface-secondary" radius="md" padding={2} align="center">
      **Router Validator**
    </box>
    <box align="center">
      <icon name="arrow-down-up" color="secondary"/>
    </box>
    <box background="surface-secondary" radius="md" padding={2} align="center">
      **Router — Internal Coordinator**
    </box>
    <grid columns={3} gap={2}>
      {#each ["FSM Validator","FSM + Projection","Renderer"] as s}
        <grid-item>
          <box border radius="md" padding={2} justify="center" minHeight="72px">
            <text textAlign="center" weight="medium" size="xs">{s}</text>
          </box>
        </grid-item>
      {/each}
    </grid>
  </box>
  <box align="center">
    <icon name="arrow-down-up" color="secondary"/>
  </box>
  <box background="surface-secondary" radius="md" padding={3}>
    **Workflow — External Persistence**

    <text color="secondary" size="sm">State files, diagnostic logs, GitHub Issue comments, and verified execution receipts.</text>
  </box>
</box>

### One technical distinction

The container still needs a minimal startup command to launch its Node.js processes. That does **not** require a separate supervisory service or business-logic runner.

For example, a single Node.js entrypoint could initialize the services and start the Router's request-handling loop. Docker and the GitHub Actions workflow manage the container's lifetime.

The workflow should enforce a timeout and treat unexpected process termination as failure. The router should determine when the internal operation has completed and return a definitive result.

**Final design: external lifecycle management, internal router coordination, no redundant container supervisor.**

This also eliminates an unnecessary orchestration layer while preserving the independence of every stateless component.

---

**You**

> I thought the listerner was to do that?

**Assistant**

Yes. **The Listener is responsible for the entire external lifecycle.** I incorrectly introduced the GitHub Actions workflow as though it were a separate controller.

The Listener operates within the GitHub Actions workflow and performs these functions:

1. Receives the GitHub Issue event.
2. Retrieves external configuration and current state.
3. Starts the container.
4. Submits the request to the Router Validator.
5. Waits for the Router to complete internal execution.
6. Collects outputs and execution receipts.
7. Persists state files, diagnostics, and Issue comments.
8. Shuts down the container.

The **Router** coordinates everything inside the container: dispatch, validation paths, FSM execution, rendering, and completion.

The container only needs a startup entrypoint to initialize its services. It does not need a separate supervisor or execution runner.

The architecture is therefore:

```text
GitHub Actions
└── Listener (external lifecycle controller)
    ├── Retrieve configuration and state
    ├── Start container
    │   └── Router (internal execution coordinator)
    │       ├── Router Validator
    │       ├── FSM Validator
    │       ├── FSM
    │       └── Renderer
    ├── Collect results
    ├── Persist outputs and receipts
    └── Stop container
```

**One external controller: Listener. One internal coordinator: Router.** No additional orchestration layer is necessary.

---

**You**

> The renderer won't be able to write to the file system?

**Assistant**

**Yes, the renderer can write to the filesystem.** Docker does not prevent filesystem writes. My earlier design unnecessarily restricted the renderer to returning output for the Listener to persist.

The important distinction is **which filesystem the renderer writes to**.

| Storage location | Renderer can write? | Persists after container removal? |
|---|---|---|
| Container's internal filesystem | Yes, if permissions allow | No |
| Read-only configuration mount | No | Not applicable |
| Writable bind-mounted output directory | Yes | Yes |
| GitHub repository checkout mounted read-write | Yes, if permissions allow | Yes, on the runner; committing is separate |

## Recommended arrangement

The Listener starts the container with two external mounts:

```bash
docker run --rm \
  -v "$PWD/config:/runtime/config:ro" \
  -v "$PWD/workspaces:/runtime/workspaces:rw" \
  issuescratch-runtime
```

The renderer uses its configured mode to select the output format and destination.

For example:

- `fsm-diagnostic` → append a JSONL record to a mounted diagnostic file.
- `state-file` → write a JSON state artifact to a mounted workspace.
- `procedure` → write rendered instructions to a mounted output file, for subsequent publication to the GitHub Issue.

The Listener continues to control container startup, shutdown, and any required GitHub publication or commits.

One safeguard is essential: **the renderer should write proposed state outputs, not overwrite authoritative state directly before the Listener verifies execution success.** The Listener can then promote verified outputs to the authoritative state location.

This preserves the design:

**Listener controls lifecycle and publication. Router coordinates execution. Renderer performs configured filesystem output.**

---

**You**

> Are we asking the renderer to verfity its writes?

**Assistant**

**Yes. The renderer should verify its own writes.** That responsibility belongs to the component performing the filesystem operation.

The renderer's configured output mode should determine both the write operation and its verification requirements.

| Mode | Write operation | Verification |
|---|---|---|
| `state-file` | Atomic file replacement | Read back and compare SHA-256 hashes |
| `fsm-diagnostic` | Append JSONL record | Read back and verify the appended record |
| `procedure` | Write rendered instructions | Read back and compare content |
| `input-error` | Write rendered error | Read back and compare content |

### Required write sequence

1. Resolve the destination from external renderer configuration.
2. Serialize the payload according to its declared mode.
3. Perform the configured write.
4. Read the written content back from the filesystem.
5. Verify its integrity against the intended output.
6. Return a structured execution receipt to the Router.

Example receipt:

<CodeBlock language="json" editable>
{
  "contract": "renderer.write-receipt.v1",
  "request_id": "req-001",
  "mode": "state-file",
  "status": "verified",
  "destination_ref": "fsm-state-file",
  "bytes_written": 2048,
  "verification": {
    "method": "sha256-readback",
    "matched": true
  }
}
</CodeBlock>

A write failure, readback mismatch, or incomplete operation must produce an explicit failure receipt. It cannot be reported as successful.

For state files, atomic replacement also needs a concurrency safeguard so that two executions cannot silently overwrite one another.

**Responsibility boundary:**

- **Renderer:** Write and verify local filesystem output.
- **Router:** Receive the verification receipt and determine the next action.
- **Listener:** Manage container lifecycle and ensure required repository changes are committed and published.

The renderer verifies filesystem integrity; the Listener verifies any subsequent GitHub persistence. These are separate verification stages.

This is the agreed design requirement, not yet a verified implementation.

---

**You**

> Why would the listener commit if you have the renderer

**Assistant**

It shouldn't. I was assigning the same responsibility to two components.

**The Renderer should own output persistence, including committing files to GitHub when its configured mode requires it.** The Listener should not duplicate that work.

The revised responsibility boundaries are:

| Component | Responsibility |
|---|---|
| **Listener** | Receive events, supply configuration and inputs, start and stop the container |
| **Router** | Coordinate execution and route responses |
| **Router Validator** | Validate envelopes and renderer modes |
| **FSM Validator** | Validate inputs to the FSM |
| **FSM** | Compute state transitions |
| **Renderer** | Format, write, commit, and verify outputs according to its configured mode |

The Renderer can support multiple destination adapters:

- `filesystem` — write and verify a file.
- `github-repository` — commit the output and verify the resulting repository content.
- `github-issue` — publish a comment and verify publication.
- `diagnostic-log` — append and verify a diagnostic record.

For a repository-backed state file, successful completion requires more than writing to a mounted filesystem. The Renderer must perform the configured Git commit and verify that the intended content was persisted. Repository writes should use the documented command interface wherever that interface governs mutations.

The Router receives the Renderer’s execution receipt and determines whether the operation succeeded.

**Final separation: the Listener controls the container lifecycle; the Router controls execution; the Renderer controls output persistence and verification.**

There is no need for the Listener to commit anything the Renderer has already been assigned to persist.

---

**You**

> Great.  So create the router logic, and be sure to have its incoming input always through the router validator.

**Assistant · Commentary**

> I’ll inspect the current IssueScratch router and its repository procedures, then implement the routing logic so every inbound request passes through the Router Validator before dispatch. I’ll test the rejection and return paths as well as successful routing.

**Assistant · Commentary**

> The current repository router is still a direct HTTP forwarder, so it can bypass the Router Validator. I’ll keep the new coordinator separate from that legacy server until the full service integration is tested. The coordinator will validate both initial requests and service responses before allowing another dispatch.

---

**You**

> Do do that

---

**You**

> Just overwrite the old sustem with the new system

---

**You**

> its not a legacy system

**Assistant · Commentary**

> Understood. I’ll replace the existing router implementation in place, not create a parallel system. I’ll preserve the current file paths and integrate the Router Validator as the mandatory entry point.

**Assistant · Commentary**

> I found the active router at `src/stateless-router-server.js`. I’m replacing its direct-forwarding behavior with validated dispatch in that file, while keeping the Router Validator as a separate module. Invalid requests and invalid service responses will stop routing rather than pass through.

**Assistant**

I updated the existing IssueScratch router in place rather than creating a parallel system.

Two repository changes were committed:

- [Router Validator](https://github.com/BestNameYet/IssueScratch/blob/main/src/router-envelope-validator.js) — checks the shared `router.envelope.v1` contract and renderer-mode requirements.
- [Router](https://github.com/BestNameYet/IssueScratch/blob/main/src/stateless-router-server.js) — validates incoming envelopes before dispatch and validates service responses before returning them.

The router rejects invalid requests, unrecognized rendering modes, and mismatched response correlation IDs rather than forwarding them.

**The integration is not complete.** The attempt to update `config/stateless-services.json` was blocked, so the router and its configuration are not yet synchronized. The existing FSM, validation, and renderer services also need to support the shared envelope before the complete pipeline can work.

**Assistant**

I updated the existing IssueScratch router in place rather than creating a parallel system.

Two repository changes were committed:

- [Router Validator](https://github.com/BestNameYet/IssueScratch/blob/main/src/router-envelope-validator.js) — checks the shared `router.envelope.v1` contract and renderer-mode requirements.
- [Router](https://github.com/BestNameYet/IssueScratch/blob/main/src/stateless-router-server.js) — validates incoming envelopes before dispatch and validates service responses before returning them.

The router rejects invalid requests, unrecognized rendering modes, and mismatched response correlation IDs rather than forwarding them.

**The integration is not complete.** The attempt to update `config/stateless-services.json` was blocked, so the router and its configuration are not yet synchronized. The existing FSM, validation, and renderer services also need to support the shared envelope before the complete pipeline can work.

## Verified repository status

| Component | Status |
|---|---|
| Router Validator module | Committed and read back |
| Router implementation | Committed and read back |
| Routing configuration | Not updated |
| FSM and renderer integration | Not completed |
| Automated tests | Not run |
| End-to-end execution | Not verified |

The current router also requires downstream services to return the standardized envelope. Those services have not yet been adapted, so **the new routing path must not be considered operational**.

The configuration update was blocked by a tool safety check. I have not treated that failed operation as a successful commit.

The intended design remains unchanged: **every incoming request and every returning service response must pass through the Router Validator, with the Router coordinating all internal dispatch.**

**Assistant**

## Verified repository status

| Component | Status |
|---|---|
| Router Validator module | Committed and read back |
| Router implementation | Committed and read back |
| Routing configuration | Not updated |
| FSM and renderer integration | Not completed |
| Automated tests | Not run |
| End-to-end execution | Not verified |

The current router also requires downstream services to return the standardized envelope. Those services have not yet been adapted, so **the new routing path must not be considered operational**.

The configuration update was blocked by a tool safety check. I have not treated that failed operation as a successful commit.

The intended design remains unchanged: **every incoming request and every returning service response must pass through the Router Validator, with the Router coordinating all internal dispatch.**

---

**You**

> stop

**Assistant**

Stopped. No further operations or repository changes will be made.

---

**You**

> the router doesn't validate anything

**Assistant**

Correct. **The Router must not perform validation.** My implementation conflated coordination with validation.

The responsibilities are strictly separated:

| Component | Responsibility |
|---|---|
| **Router Validator** | Validates incoming and returning envelopes, including renderer modes against configuration |
| **Router** | Dispatches requests and coordinates responses according to routing configuration |
| **FSM Validator** | Validates inputs to the FSM |
| **FSM** | Executes state transitions |
| **Renderer** | Renders, writes, and verifies outputs according to configured modes |

The required execution paths are:

```text
Incoming request
    → Router Validator
    → Router
    → Selected service

FSM response
    → Router Validator
    → Router
    → Configured next destination
```

The Router may act on a validation verdict, but it must not independently inspect payload correctness, enforce schemas, or validate renderer modes.

**Correction required:** The implementation I committed to `src/stateless-router-server.js` incorrectly calls the validator from inside the Router. The Router Validator must instead be a separate boundary through which traffic passes before reaching the Router.

I will make no further repository changes until instructed.

---

**You**

> thats why it has a validator

**Assistant**

Exactly. **The Router Validator performs validation; the Router performs coordination and dispatch.**

The responsibilities must remain separate:

- **Router Validator:** Validates incoming and returning envelopes, including renderer modes against their configuration.
- **Router:** Uses externally configured routing rules to determine the next action, destination, and continuation.
- **FSM Validator:** Validates inputs destined for the FSM.
- **Renderer:** Executes configured rendering modes and verifies its outputs.

The Router must not duplicate, reinterpret, or independently enforce validation rules. It acts on the Router Validator's verdict.

My previous implementation violated that separation. It requires correction.

No repository changes will be made while your stop instruction remains in effect.

---

**You**

> Proceed.  But first write down the specification document include copoes off the validation schemes, configurattions, scripts, etc verbatim.

**Assistant · Commentary**

> I’ll prepare the specification document first, using verbatim copies of the current repository contracts, configurations, and implementation scripts. I’ll distinguish existing code from the intended architecture, then correct the router boundary only after the specification is saved.

**Assistant · Commentary**

> The source review confirms that the current router still imports and calls the validator directly, and the existing service configuration has not been migrated. I’m recording the exact current files in the specification before attempting that correction.

**Assistant**

## Specification saved

The specification has been committed to IssueScratch:

[Stateless Runtime Architecture Specification](https://github.com/BestNameYet/IssueScratch/blob/main/docs/stateless-runtime-architecture-specification.md)

Commit: `ece5e701df920774e794dbcfca75fbb92076de6a`

It contains the architectural requirements, identified implementation discrepancies, and verbatim snapshots of 18 repository files, including the canonical procedure library, validation procedures, routing configuration, validator, router, FSM, renderer, and relevant tests. Each copied file includes its source blob SHA for traceability.

The correction will preserve the agreed boundary: **Router Validator validates; Router coordinates and dispatches.**

**Assistant · Commentary**

> The specification is saved. I’ll now move the validation boundary out of `src/stateless-router-server.js`: the public entry service will validate envelopes, while the internal router will only dispatch according to configuration. I’ll keep the existing downstream compatibility gap explicit rather than claim the full pipeline works.

**Assistant · Commentary**

> The separation is now committed: the Router no longer imports the validator, and a dedicated Router Validator server is the configured public entry point. I’ll add regression tests for the boundary and verify the repository files. The downstream services still need envelope adaptation before an end-to-end run can pass.

**Assistant**

## Specification saved

The specification has been committed to IssueScratch:

[Stateless Runtime Architecture Specification](https://github.com/BestNameYet/IssueScratch/blob/main/docs/stateless-runtime-architecture-specification.md)

Commit: `ece5e701df920774e794dbcfca75fbb92076de6a`

It contains the architectural requirements, identified implementation discrepancies, and verbatim snapshots of 18 repository files, including the canonical procedure library, validation procedures, routing configuration, validator, router, FSM, renderer, and relevant tests. Each copied file includes its source blob SHA for traceability.

The correction will preserve the agreed boundary: **Router Validator validates; Router coordinates and dispatches.**

## Router boundary correction committed

The existing IssueScratch implementation was updated in place, following the specification.

| Repository file | Result |
|---|---|
| [Architecture specification](https://github.com/BestNameYet/IssueScratch/blob/main/docs/stateless-runtime-architecture-specification.md) | Saved with verbatim source snapshots |
| [Router Validator server](https://github.com/BestNameYet/IssueScratch/blob/main/src/router-validator-server.js) | Created as separate entry service |
| [Router](https://github.com/BestNameYet/IssueScratch/blob/main/src/stateless-router-server.js) | Replaced implementation; validator dependency removed |
| [Service configuration](https://github.com/BestNameYet/IssueScratch/blob/main/config/stateless-services.json) | Updated with separate service ports |
| [Boundary tests](https://github.com/BestNameYet/IssueScratch/blob/main/src/router-boundary.test.js) | Created and corrected |

The configured ports are now `8787` for the Router Validator and `8786` for the internal Router.

**Verification:** All five files were committed and read back successfully. The automated tests have not been executed, so their passing status is not established.

**Remaining integration work:** The FSM, FSM Validator, and Renderer still use their earlier request/response interfaces. They must be adapted to the shared envelope before the full system can pass end-to-end testing. The Router also still needs the configured continuation logic for multi-step execution.

The specification preserves the original code and configuration alongside the intended architecture, so the remaining implementation can be checked against an exact source baseline.

**Assistant**

## Router boundary correction committed

The existing IssueScratch implementation was updated in place, following the specification.

| Repository file | Result |
|---|---|
| [Architecture specification](https://github.com/BestNameYet/IssueScratch/blob/main/docs/stateless-runtime-architecture-specification.md) | Saved with verbatim source snapshots |
| [Router Validator server](https://github.com/BestNameYet/IssueScratch/blob/main/src/router-validator-server.js) | Created as separate entry service |
| [Router](https://github.com/BestNameYet/IssueScratch/blob/main/src/stateless-router-server.js) | Replaced implementation; validator dependency removed |
| [Service configuration](https://github.com/BestNameYet/IssueScratch/blob/main/config/stateless-services.json) | Updated with separate service ports |
| [Boundary tests](https://github.com/BestNameYet/IssueScratch/blob/main/src/router-boundary.test.js) | Created and corrected |

The configured ports are now `8787` for the Router Validator and `8786` for the internal Router.

**Verification:** All five files were committed and read back successfully. The automated tests have not been executed, so their passing status is not established.

**Remaining integration work:** The FSM, FSM Validator, and Renderer still use their earlier request/response interfaces. They must be adapted to the shared envelope before the full system can pass end-to-end testing. The Router also still needs the configured continuation logic for multi-step execution.

The specification preserves the original code and configuration alongside the intended architecture, so the remaining implementation can be checked against an exact source baseline.

---

**You**

> The router should use a lookup table to match service to port

**Assistant · Commentary**

> I’ll update the existing router so it resolves service names through a configurable service-to-port lookup table, rather than embedding port selection in routing logic. I’ll check the current repository instructions and add a focused regression test.

**Assistant**

The current router already resolves `route.service` through `config.services`, but that combines service identity, host, and port in one structure.

I’ll make the **service-to-port lookup explicit**. Routes will name services, and a separate external table will map those names to ports. The Router will use that table strictly for dispatch—not validation.

**Assistant**

The current router already resolves `route.service` through `config.services`, but that combines service identity, host, and port in one structure.

I’ll make the **service-to-port lookup explicit**. Routes will name services, and a separate external table will map those names to ports. The Router will use that table strictly for dispatch—not validation.

## Service-to-port lookup implemented

Updated and read back all three files in `BestNameYet/IssueScratch`.

| File | Change |
|---|---|
| [Router](https://github.com/BestNameYet/IssueScratch/blob/main/src/stateless-router-server.js) | Resolves destination ports through `service_port_lookup` |
| [Service configuration](https://github.com/BestNameYet/IssueScratch/blob/main/config/stateless-services.json) | Adds explicit service-to-port mapping |
| [Router tests](https://github.com/BestNameYet/IssueScratch/blob/main/src/router-boundary.test.js) | Adds lookup-based dispatch regression test |

### Configured lookup

<CodeBlock language="json">
{
  "service_port_lookup": {
    "router_validator": 8787,
    "router": 8786,
    "fsm": 8788,
    "renderer": 8789,
    "validation": 8790
  }
}
</CodeBlock>

The Router now follows this sequence:

`Route → Service name → Port lookup → HTTP dispatch`

It does not validate payloads, renderer modes, or response schemas. Those remain the Router Validator's responsibility.

**Verification:** All three repository changes were committed and read back. The automated tests have not yet been executed, so runtime success remains unverified.

One cleanup remains: service ports are currently also retained in the existing `services` configuration for compatibility with the service startup scripts. The new lookup is authoritative for Router dispatch, but the duplicated port values should eventually be consolidated to avoid configuration drift.

**Assistant**

## Service-to-port lookup implemented

Updated and read back all three files in `BestNameYet/IssueScratch`.

| File | Change |
|---|---|
| [Router](https://github.com/BestNameYet/IssueScratch/blob/main/src/stateless-router-server.js) | Resolves destination ports through `service_port_lookup` |
| [Service configuration](https://github.com/BestNameYet/IssueScratch/blob/main/config/stateless-services.json) | Adds explicit service-to-port mapping |
| [Router tests](https://github.com/BestNameYet/IssueScratch/blob/main/src/router-boundary.test.js) | Adds lookup-based dispatch regression test |

### Configured lookup

<CodeBlock language="json">
{
  "service_port_lookup": {
    "router_validator": 8787,
    "router": 8786,
    "fsm": 8788,
    "renderer": 8789,
    "validation": 8790
  }
}
</CodeBlock>

The Router now follows this sequence:

`Route → Service name → Port lookup → HTTP dispatch`

It does not validate payloads, renderer modes, or response schemas. Those remain the Router Validator's responsibility.

**Verification:** All three repository changes were committed and read back. The automated tests have not yet been executed, so runtime success remains unverified.

One cleanup remains: service ports are currently also retained in the existing `services` configuration for compatibility with the service startup scripts. The new lookup is authoritative for Router dispatch, but the duplicated port values should eventually be consolidated to avoid configuration drift.

---

**You**

> That can remain for now.  Conduct end to end testing, first build a list of all permutations of errors or succeses at each gate for validation, transition etc

**Assistant · Commentary**

> I’ll enumerate the reachable success, rejection, and execution-failure paths first, including which downstream gates must be skipped. Then I’ll test those paths against the current repository and distinguish implemented behavior from architectural requirements.

**Assistant**

## End-to-end test plan — IssueScratch

The test suite must cover **every reachable outcome at each gate**, not merely a successful transition. A failure at one gate must prevent unauthorized downstream execution.

The intended path is:

```text
Listener
   ↓
Router Validator (request)
   ↓ accepted
Router
   ↓
FSM Validator
   ├─ rejected → Router → Input Error Renderer → Issue
   └─ accepted
         ↓
        FSM
         ↓
Router Validator (FSM response)
   ├─ invalid → FSM Error Renderer → Diagnostic Log
   └─ valid
         ↓
       Router
         ↓
 Renderer (configured modes and destinations)
         ↓
 Verified write receipts
```

The `/validate` test endpoint stops after the FSM Validator returns its verdict; it must never execute the FSM.

### 1. Gate-by-gate permutations

| Gate | Outcome | Expected action |
|---|---|---|
| Router Validator — input | Valid | Dispatch to Router |
| | Malformed JSON | Reject; no dispatch |
| | Invalid envelope | Reject; no dispatch |
| | Invalid correlation fields | Reject; no dispatch |
| | Unknown renderer mode | Reject; no rendering |
| | Mode not permitted for route | Reject; no rendering |
| | Incompatible payload contract | Reject; no rendering |
| | Missing or conflicting configuration | Configuration failure; fail closed |
| Router | Valid service mapping | Dispatch to configured service |
| | Unknown service | Routing failure |
| | Missing or invalid port | Routing failure |
| | Unavailable service | Transport failure |
| | Timeout | Bounded failure |
| FSM Validator | Accepted | Forward to FSM or return verdict for `/validate` |
| | Rejected | Input-error rendering; do not call FSM |
| | Execution/configuration failure | Validator diagnostic route; do not call FSM |
| FSM | Transition advances | Produce next state and projection |
| | Valid non-advancing transition | Preserve state; apply configured continuation |
| | Terminal transition | Mark progression complete |
| | Throws or crashes | FSM execution-error route |
| | Invalid response envelope | Router Validator rejects response |
| Router Validator — return | Valid response | Resume Router coordination |
| | Malformed response | FSM error route |
| | Correlation mismatch | FSM error route |
| | Invalid result contract | FSM error route |
| Renderer | Registered mode and successful write | Return verified receipt |
| | Unknown or incompatible mode | Rejected by Router Validator before rendering |
| | Serialization failure | Rendering failure |
| | Destination unavailable | Write failure |
| | Partial or conflicting write | Write failure |
| | Readback/hash mismatch | Verification failure |
| | Verified file or Issue publication | Successful receipt |
| Final coordination | All required receipts complete | Report success |
| | Any mandatory receipt failed | Report failure or partial completion, not success |

### 2. Cross-gate test scenarios

For each scenario, tests must assert both the expected output and which components were **not** invoked.

| Scenario | Expected terminal result |
|---|---|
| Every gate succeeds | Complete, with verified output receipts |
| Input envelope rejected | No FSM or renderer invocation |
| FSM input rejected | Input error delivered to original issue |
| FSM input validator crashes | Diagnostic recorded; state unchanged |
| FSM returns a valid non-advancing result | No unauthorized state advancement |
| FSM produces malformed response | FSM diagnostic log, not agent correction |
| Renderer mode rejected | No write attempted |
| State-file write succeeds, diagnostic write fails | Partial failure; do not report full success |
| Write succeeds but verification fails | Persistence not verified |
| Duplicate request arrives | No unintended duplicate advancement or publication |
| Router receives an unexpected response | Fail closed |
| Routing or rendering repeatedly fails | Bounded termination; no infinite loop |

These scenarios are the logical baseline. The complete test inventory must also exercise each actual FSM validation code, each registered rendering mode, and each declared transition status.

**Assistant**

## End-to-end test plan — IssueScratch

The test suite must cover **every reachable outcome at each gate**, not merely a successful transition. A failure at one gate must prevent unauthorized downstream execution.

The intended path is:

```text
Listener
   ↓
Router Validator (request)
   ↓ accepted
Router
   ↓
FSM Validator
   ├─ rejected → Router → Input Error Renderer → Issue
   └─ accepted
         ↓
        FSM
         ↓
Router Validator (FSM response)
   ├─ invalid → FSM Error Renderer → Diagnostic Log
   └─ valid
         ↓
       Router
         ↓
 Renderer (configured modes and destinations)
         ↓
 Verified write receipts
```

The `/validate` test endpoint stops after the FSM Validator returns its verdict; it must never execute the FSM.

### 1. Gate-by-gate permutations

| Gate | Outcome | Expected action |
|---|---|---|
| Router Validator — input | Valid | Dispatch to Router |
| | Malformed JSON | Reject; no dispatch |
| | Invalid envelope | Reject; no dispatch |
| | Invalid correlation fields | Reject; no dispatch |
| | Unknown renderer mode | Reject; no rendering |
| | Mode not permitted for route | Reject; no rendering |
| | Incompatible payload contract | Reject; no rendering |
| | Missing or conflicting configuration | Configuration failure; fail closed |
| Router | Valid service mapping | Dispatch to configured service |
| | Unknown service | Routing failure |
| | Missing or invalid port | Routing failure |
| | Unavailable service | Transport failure |
| | Timeout | Bounded failure |
| FSM Validator | Accepted | Forward to FSM or return verdict for `/validate` |
| | Rejected | Input-error rendering; do not call FSM |
| | Execution/configuration failure | Validator diagnostic route; do not call FSM |
| FSM | Transition advances | Produce next state and projection |
| | Valid non-advancing transition | Preserve state; apply configured continuation |
| | Terminal transition | Mark progression complete |
| | Throws or crashes | FSM execution-error route |
| | Invalid response envelope | Router Validator rejects response |
| Router Validator — return | Valid response | Resume Router coordination |
| | Malformed response | FSM error route |
| | Correlation mismatch | FSM error route |
| | Invalid result contract | FSM error route |
| Renderer | Registered mode and successful write | Return verified receipt |
| | Unknown or incompatible mode | Rejected by Router Validator before rendering |
| | Serialization failure | Rendering failure |
| | Destination unavailable | Write failure |
| | Partial or conflicting write | Write failure |
| | Readback/hash mismatch | Verification failure |
| | Verified file or Issue publication | Successful receipt |
| Final coordination | All required receipts complete | Report success |
| | Any mandatory receipt failed | Report failure or partial completion, not success |

### 2. Cross-gate test scenarios

For each scenario, tests must assert both the expected output and which components were **not** invoked.

| Scenario | Expected terminal result |
|---|---|
| Every gate succeeds | Complete, with verified output receipts |
| Input envelope rejected | No FSM or renderer invocation |
| FSM input rejected | Input error delivered to original issue |
| FSM input validator crashes | Diagnostic recorded; state unchanged |
| FSM returns a valid non-advancing result | No unauthorized state advancement |
| FSM produces malformed response | FSM diagnostic log, not agent correction |
| Renderer mode rejected | No write attempted |
| State-file write succeeds, diagnostic write fails | Partial failure; do not report full success |
| Write succeeds but verification fails | Persistence not verified |
| Duplicate request arrives | No unintended duplicate advancement or publication |
| Router receives an unexpected response | Fail closed |
| Routing or rendering repeatedly fails | Bounded termination; no infinite loop |

These scenarios are the logical baseline. The complete test inventory must also exercise each actual FSM validation code, each registered rendering mode, and each declared transition status.

### 3. Current implementation audit

I inspected the committed Router Validator, Router, service configuration, and downstream service interfaces. Several failures are already identifiable from the source.

| Finding | Assessment | Consequence |
|---|---|---|
| Router uses `service_port_lookup` | Implemented | Dispatch ports come from configuration |
| Router Validator is the public entry service | Implemented | Incoming HTTP requests can be checked before dispatch |
| FSM Validator integrated before FSM | Missing | `/state` still targets FSM directly |
| FSM returns shared router envelope | Missing | Valid FSM responses will be rejected at the return boundary |
| Renderer accepts declared modes | Missing | Current renderer still expects `projection` and `bindings` |
| Renderer performs configured persistence and readback | Missing | No end-to-end write verification |
| Router performs configured multi-step continuation | Missing | Current implementation forwards a single request and response |
| Existing boundary tests supply lookup configuration | Inconsistent | The earlier test fixtures lack the now-required `service_port_lookup` |

The final item is an especially important regression: the new Router requires the lookup table, but the first two HTTP boundary tests still construct configurations without it.

### 4. Testing sequence

The test suite should run in this order:

1. **Configuration tests:** Service lookup, route definitions, registered modes, incompatible or missing configuration.
2. **Individual gates:** Exhaustive valid, rejected, and execution-failure cases for each validator and processor.
3. **Adjacent service integration:** Router Validator → Router; Router → FSM Validator; FSM Validator → FSM; FSM → Router Validator; Router → Renderer.
4. **Full request lifecycle:** Successful advancement, rejected input, FSM failure, and verified rendering to every configured destination.
5. **Recovery tests:** Duplicates, partial writes, interrupted execution, stale state, timeouts, and bounded retries.

For gates with multiple independent failure predicates, test each predicate individually and selected combinations. Invalid inputs that terminate at an earlier gate should not be counted as independently reaching later gates.

### Execution status

<badge color="warning">End-to-end testing blocked</badge>

**The source audit is complete, but live end-to-end tests have not been executed.** The current services do not yet implement a compatible full request lifecycle, and I could not obtain a runnable checkout in the local environment.

The first executable milestone should be a successful envelope round-trip through Router Validator → Router → test service → Router Validator. That can be tested independently before connecting the FSM and Renderer.

The complete system should remain classified as **not end-to-end verified** until the downstream interfaces are integrated and the success, rejection, and diagnostic paths produce verified receipts.

**Assistant**

### 3. Current implementation audit

I inspected the committed Router Validator, Router, service configuration, and downstream service interfaces. Several failures are already identifiable from the source.

| Finding | Assessment | Consequence |
|---|---|---|
| Router uses `service_port_lookup` | Implemented | Dispatch ports come from configuration |
| Router Validator is the public entry service | Implemented | Incoming HTTP requests can be checked before dispatch |
| FSM Validator integrated before FSM | Missing | `/state` still targets FSM directly |
| FSM returns shared router envelope | Missing | Valid FSM responses will be rejected at the return boundary |
| Renderer accepts declared modes | Missing | Current renderer still expects `projection` and `bindings` |
| Renderer performs configured persistence and readback | Missing | No end-to-end write verification |
| Router performs configured multi-step continuation | Missing | Current implementation forwards a single request and response |
| Existing boundary tests supply lookup configuration | Inconsistent | The earlier test fixtures lack the now-required `service_port_lookup` |

The final item is an especially important regression: the new Router requires the lookup table, but the first two HTTP boundary tests still construct configurations without it.

### 4. Testing sequence

The test suite should run in this order:

1. **Configuration tests:** Service lookup, route definitions, registered modes, incompatible or missing configuration.
2. **Individual gates:** Exhaustive valid, rejected, and execution-failure cases for each validator and processor.
3. **Adjacent service integration:** Router Validator → Router; Router → FSM Validator; FSM Validator → FSM; FSM → Router Validator; Router → Renderer.
4. **Full request lifecycle:** Successful advancement, rejected input, FSM failure, and verified rendering to every configured destination.
5. **Recovery tests:** Duplicates, partial writes, interrupted execution, stale state, timeouts, and bounded retries.

For gates with multiple independent failure predicates, test each predicate individually and selected combinations. Invalid inputs that terminate at an earlier gate should not be counted as independently reaching later gates.

### Execution status

<badge color="warning">End-to-end testing blocked</badge>

**The source audit is complete, but live end-to-end tests have not been executed.** The current services do not yet implement a compatible full request lifecycle, and I could not obtain a runnable checkout in the local environment.

The first executable milestone should be a successful envelope round-trip through Router Validator → Router → test service → Router Validator. That can be tested independently before connecting the FSM and Renderer.

The complete system should remain classified as **not end-to-end verified** until the downstream interfaces are integrated and the success, rejection, and diagnostic paths produce verified receipts.

---

**You**

> Has it even been containerized?

**Assistant**

**No. The IssueScratch runtime has not been containerized.**

So far, we have implemented portions of the Node.js services, routing configuration, and Router Validator boundary, but we have not:

- Created or verified a `Dockerfile`.
- Created the container entrypoint that starts the stateless services.
- Configured the Listener to start and stop the container.
- Mounted external configuration files.
- Built or tested a container image.
- Performed end-to-end testing inside a container.

**Current status:** The architecture is partially implemented, but containerization and full integration remain incomplete.

We should containerize the runtime before conducting the full end-to-end tests, since the container is the intended execution environment.

---

**You**

> perform that and store the container in container storage

**Assistant · Commentary**

> I’ll check the repository’s current container and workflow instructions, then add the image build and registry-publishing setup. I’ll verify the resulting image or workflow receipt rather than treating a Dockerfile commit as a successful container deployment.

**Assistant · Commentary**

> The Dockerfile, container entrypoint, and GHCR publishing workflow are committed. The image is configured to load its service settings and canonical procedure from outside the container. I’m checking whether GitHub Actions has actually built and published it; a committed workflow alone does not establish that an image exists in registry storage.

**Assistant**

## Containerization committed to IssueScratch

The container build and registry-publishing configuration have been created in the repository.

| Component | Status |
|---|---|
| [Dockerfile](https://github.com/BestNameYet/IssueScratch/blob/main/Dockerfile) | Committed |
| [Container entrypoint](https://github.com/BestNameYet/IssueScratch/blob/main/container-entrypoint.js) | Committed |
| [.dockerignore](https://github.com/BestNameYet/IssueScratch/blob/main/.dockerignore) | Committed |
| [Build and publish workflow](https://github.com/BestNameYet/IssueScratch/blob/main/.github/workflows/container-image.yml) | Committed |
| Router boundary test fixtures | Updated for the port lookup |
| Container image built | Not verified |
| Container image published | Not verified |

### Target container storage

<text weight="medium">GitHub Container Registry (GHCR)</text>

`ghcr.io/bestnameyet/issuescratch-runtime`

The workflow is configured to publish both `latest` and commit-specific image tags.

### Runtime architecture

The container entrypoint starts five Node.js services: Router Validator, Router, FSM Validator, FSM, and Renderer. Configuration is loaded from the external `/runtime/config` directory, including the canonical procedure library.

The image does not contain persistent state or the external configuration files.

### Remaining verification

**The image's presence in GHCR has not been confirmed.** I committed the publishing workflow but could not retrieve a successful GitHub Actions publishing receipt or image digest.

You can inspect the workflow at [IssueScratch Actions](https://github.com/BestNameYet/IssueScratch/actions/workflows/container-image.yml).

Containerization is now defined in the repository, but I cannot yet classify the container as successfully built, stored, or operational.

---

**You**

> has the listener been attached to the container

**Assistant**

**No. The Listener has not yet been connected to the container.**

The container entrypoint and GitHub Actions image-publishing workflow have been committed, but the Listener has not been updated to:

1. Start the container when an Issue event arrives.
2. Mount external configuration files.
3. Submit the event payload and state to the Router Validator on port `8787`.
4. Receive execution results and verify completion.
5. Stop and remove the container.

Additionally, the container image has not been verified as successfully built or published to GHCR.

**Current status:** Containerization is configured, but Listener integration and end-to-end execution remain incomplete.

---

**You**

> Proceed

**Assistant · Commentary**

> I’ll connect the existing Issue listener to the container lifecycle, using the repository’s current workflow and preserving its state-handling rules. I’ll check the build and test results before calling the integration operational.

**Assistant · Commentary**

> The existing Issue listener still invokes `src/workflow-router.js` directly. I’ll add a container invocation path without removing that live processing path, because the container’s downstream services still use incompatible envelopes. The integration will verify container startup and submission behavior, and report failures explicitly.

**Assistant**

## Listener–container integration committed

Created and verified two new files in `BestNameYet/IssueScratch`.

| File | Purpose |
|---|---|
| [container-listener.js](https://github.com/BestNameYet/IssueScratch/blob/main/container-listener.js) | Starts the container, mounts external configuration, checks readiness, submits the Issue payload, records the result, and stops the container |
| [container-listener.yml](https://github.com/BestNameYet/IssueScratch/blob/main/.github/workflows/container-listener.yml) | Runs the containerized listener for Issue #1 comment events |

### Implemented execution sequence

1. Receive the Issue comment event.
2. Build and start the runtime container.
3. Mount configuration files read-only.
4. Check Router Validator readiness on port `8787`.
5. Submit a standardized request envelope to `/validate`.
6. Record the HTTP result and failure information.
7. Stop and remove the container.

The Listener submits requests through the **Router Validator**, not directly to the internal Router.

### Verification status

<badge color="warning">Integration not yet operationally verified</badge>

The new files were committed and read back successfully.

However, the container's validation service still expects its earlier input format. It has not been adapted to consume the common envelope, so successful end-to-end processing is not established.

The new listener workflow is also separate from the existing Issue #1 processing workflow. This preserves the existing processing path while the container integration is tested.

**Current state:** The Listener is attached to the container lifecycle in repository code, but a successful live GitHub Actions execution and complete request-to-render cycle remain unverified.

---

**You**

> adapt it

**Assistant · Commentary**

> I’ll adapt the validation service to accept the shared router envelope and return a correlated envelope, while leaving the existing validation rules unchanged. I’ll also test the Listener → Router Validator → Router → Validation Service round trip.

---

**You**

> No, overwrite the old

**Assistant · Commentary**

> Understood. I’ll replace the existing Issue #1 workflow path rather than maintain a second listener workflow. The validation service is already updated in place; I’ll align the listener and its tests with that interface.

---

**You**

> IssueScratch will just be out of commision for this prjec

**Assistant · Commentary**

> Understood. I’ll treat IssueScratch as temporarily out of service during the migration. I’ll replace the old Issue #1 workflow with the container listener and remove the competing listener workflow, rather than preserve both execution paths.

**Assistant · Commentary**

> The old Issue #1 workflow has been replaced, and the duplicate listener workflow has been removed. I also updated the Listener to supply the saved state snapshot and expected index to validation, and to distinguish accepted, rejected, and failed results. I’ll check the resulting files and test what I can before declaring the migration complete.

**Assistant**

Understood. **IssueScratch may remain temporarily out of service while its runtime is migrated.** There is no requirement to preserve the previous execution workflow during this conversion.

I made these changes:

| Change | Status |
|---|---|
| Replace the original Issue #1 workflow with the container Listener | Committed |
| Remove the duplicate container Listener workflow | Committed |
| Adapt the validation service to the shared router envelope | Committed |
| Supply the saved state and expected index from the Listener | Committed |
| Distinguish accepted, rejected, and failed validation results | Committed |

The existing Issue #1 workflow now starts the containerized execution path instead of running the previous `workflow-router.js` pipeline.

**The migration is not yet operationally verified.** I attempted to retrieve the repository for local testing, but network resolution failed. No successful container execution or end-to-end receipt has been established.

The remaining work is to complete the FSM and Renderer envelope integration, implement the Router's multi-step coordination, and verify the complete workflow from Issue event through persisted output.

No separate compatibility workflow is being maintained.

---

**You**

> Proceed

**Assistant · Commentary**

> I’ll continue the in-place migration: check the current repository contracts, adapt the FSM and renderer to the shared envelope, and wire the Router’s continuation rules. I’ll then test the integration and report any failures separately from completed work.

**Assistant · Commentary**

> The FSM and Renderer now return the shared envelope, and the FSM response includes the full procedure projection. The Renderer can format arbitrary payloads by configured mode, but persistence adapters and multi-step Router continuation are still missing. I’ll add focused contract tests before making further changes.

**Assistant**

## Migration progress — IssueScratch

The existing repository implementation has been updated in place.

| Component | Change | Status |
|---|---|---|
| [FSM service](https://github.com/BestNameYet/IssueScratch/blob/main/src/fsm-server.js) | Returns correlated `router.envelope.v1` responses, including the complete procedure projection | Committed |
| [Renderer service](https://github.com/BestNameYet/IssueScratch/blob/main/src/renderer-server.js) | Accepts the shared envelope and returns rendered output in that envelope | Committed |
| [Renderer implementation](https://github.com/BestNameYet/IssueScratch/blob/main/src/agent-renderer.js) | Formats arbitrary payloads according to configured modes | Committed |
| [Container entrypoint](https://github.com/BestNameYet/IssueScratch/blob/main/container-entrypoint.js) | Supplies external renderer settings | Committed |
| [Envelope tests](https://github.com/BestNameYet/IssueScratch/blob/main/src/envelope-services.test.js) | Tests FSM errors, renderer payload preservation, and correlation | Committed |
| [Issue listener workflow](https://github.com/BestNameYet/IssueScratch/blob/main/.github/workflows/issue1-json-validator.yml) | Runs boundary and envelope tests before building the container | Committed |

### Remaining integration

**The full runtime is not operational yet.** Three substantial requirements remain:

1. **Router continuation:** Route an accepted FSM-validation result into the FSM, then route its response through the Router Validator.
2. **Renderer persistence:** Implement configured write, commit, and readback-verification adapters.
3. **End-to-end verification:** Demonstrate an actual Issue event producing validated, persisted outputs and execution receipts.

I also attempted to obtain a runnable repository checkout for local testing, but GitHub DNS resolution failed. The new tests have therefore been committed but **not verified as passing**.

The current changes establish compatible FSM and Renderer transport envelopes. They do not yet establish successful state advancement or verified publication through the container.

IssueScratch remains in its migration state; I am not classifying it as restored to service.

---

**You**

> Fix router routing 1at

**Assistant · Commentary**

> I’ll fix routing step 1: an accepted FSM Validator result should continue to the FSM, while a rejection must not invoke it. I’ll inspect the current routing contracts first, then update the existing Router and add a targeted test.

**Assistant · Commentary**

> The current `/validate` route stops after validation. I found that the FSM requires a canonical `validated-entry-event.v1`, not just an `accepted: true` flag. I’ll have the FSM Validator produce that event from validated data, then configure the Router to continue only when that event is present.

---

**You**

> validate should return a resposne that ultimate goes to renderer

**Assistant · Commentary**

> Correct. The FSM Validator’s response must remain part of the routed result, not disappear after an acceptance decision. I’ll preserve it through the flow: rejection goes to the Input Error Renderer; acceptance goes through the FSM and then to the Renderer, with the validation result retained in the final output.

**Assistant · Commentary**

> The validator now returns a structured result and, when acceptance permits it, a transition input. I’m keeping that validation result available for rendering. The Router’s responsibility is to select the next service and rendering mode from configuration; it will not revalidate the result itself.

---

**You**

> not for validate

**Assistant**

Understood. **Successful validation does not produce a separate rendered output.**

The routing contract is:

- **Validation accepted:** Router forwards the validated transition input to the FSM.
- **Validation rejected:** Router sends the rejection to the Input Error Renderer.
- **FSM completed:** Router sends the FSM output to the configured Renderer.
- **Validation execution failed:** Router follows the configured diagnostic path.

The validation result determines continuation; it is not included in the successful FSM output merely for reporting.

The Router coordinates these paths without performing validation itself. No additional routing changes have been committed for this correction yet.

---

**You**

> validate just says if an input would be valid...

**Assistant**

Correct. **Validate is a predicate service.** It determines whether a supplied input satisfies the applicable validation contract. It does not execute the input or determine what happens next.

The separation is:

| Component | Responsibility |
|---|---|
| **Validator** | Determines whether input is valid and returns the validation result |
| **Router** | Uses the returned result and configured routing rules to select the next destination |
| **FSM** | Executes the transition when given an authorized, validated input |
| **Renderer** | Renders the output selected by the Router |

An accepted validation result does not itself constitute a transition, a rendering instruction, or successful execution.

The earlier modification to `src/validation-server.js` incorrectly added transition-input construction to the Validator. **That belongs outside validation and needs to be corrected.**

---

**You**

> proceed

**Assistant · Commentary**

> I’ll remove transition-input construction from the Validator so it only reports validity and validation errors. I’ll leave transition preparation to the routing workflow, then verify the committed change.

**Assistant**

**The Validator correction is committed and verified by readback.**

Updated: [src/validation-server.js](https://github.com/BestNameYet/IssueScratch/blob/main/src/validation-server.js)

Commit: `b0e242d3baa98f11e6cfb3839abce133657019f5`

The Validator now returns only the validation verdict and associated status or error information:

- `accepted`
- `input_status`
- `execution_status`
- `errors`

It no longer constructs `transition_input`, selects an FSM transition, or provides rendering instructions.

**The Router remains responsible for acting on that verdict.** Accepted input may proceed to the FSM under configured routing rules; rejected input follows the configured rejection route.

The source update is verified. Automated tests have not yet been executed, and Router continuation remains incomplete.

---

**You**

> proccee

**Assistant · Commentary**

> I’ll implement the next routing step: use the Validator’s verdict to select either the FSM path or the rejection path, without putting validation logic in the Router. I’ll preserve the service-to-port lookup and test both outcomes.

---

**You**

> what stop

**Assistant**

I have stopped the current implementation work.

The operation underway was the Router continuation update: routing accepted validation results toward the FSM and rejected results toward the configured error path.

**Current status:** I inspected the repository, but made no new commits during this operation. The Router continuation remains incomplete.

No further changes will be made until you instruct me to proceed.

---

**You**

> when validate responds the router routes it to the renderer that writes it back to where it belongs based on its service routing contract

**Assistant**

Understood. **Every response from the FSM Validator goes back through the Router and is routed to the Renderer according to the Validator service's routing contract.**

The correct sequence is:

```text
Incoming input
    ↓
Router Validator
    ↓
Router
    ↓
FSM Validator
    ↓
Router Validator (response validation)
    ↓
Router
    ↓
Renderer
    ↓
Configured destination
    ↓
Verified write receipt
```

The responsibilities are:

| Component | Responsibility |
|---|---|
| **FSM Validator** | Determines whether the supplied input is valid and returns its verdict |
| **Router Validator** | Validates the returned service envelope |
| **Router** | Looks up the Validator's response-routing contract and forwards its output |
| **Renderer** | Uses the configured mode and destination to write the output |
| **Renderer receipt** | Confirms whether the write succeeded and was verified |

**The validation result does not automatically trigger an FSM transition.** Validation and transition are separate service operations.

The Validator does not select the Renderer, destination, or write operation. Those are determined by external routing and rendering configuration.

This corrects my earlier interpretation that accepted validation should immediately continue into the FSM.

No repository changes have been made for this clarification.

---

**You**

> I'm talking about for the endpoint validate

**Assistant**

Understood. This routing rule applies **specifically to the `/validate` endpoint**, not to every Validator response in every workflow.

```text
POST /validate
    ↓
Router Validator
    ↓
Router
    ↓
Validation Service
    ↓
Router Validator (response)
    ↓
Router
    ↓
Renderer
    ↓
Destination defined by /validate routing contract
    ↓
Verified write receipt
```

The `/validate` endpoint performs validation only. Whether the input is valid or invalid, its result is routed to the Renderer for publication at the destination specified by the endpoint's service-routing contract.

**No FSM transition occurs as part of `/validate`.**

This is the endpoint-specific behavior the Router must implement.

---

**You**

> duh, transition has the normal behaivor...error response back to router and there to renderer...or valid forward send to FSM where FSM sends to router.

**Assistant**

Correct. There are **two distinct endpoint routing contracts**.

### `/validate` — Validation only

```text
Router → Validator
              ↓
            Router
              ↓
           Renderer
              ↓
    Configured destination
```

Both valid and invalid validation results go to the Renderer. No FSM execution.

### `/transition` — Validation followed by conditional execution

```text
Router → Validator
              ↓
            Router
              │
       ┌──────┴──────┐
       │             │
     Invalid        Valid
       │             │
       ↓             ↓
    Renderer        FSM
       │             │
       ↓             ↓
  Destination       Router
                     │
                     ↓
                  Renderer
                     │
                     ↓
                Destination
```

Every service response passes through the **Router Validator** before returning to the Router.

The Router uses externally configured service-routing contracts to select destinations. The Validator determines validity; the FSM performs transitions; the Renderer writes outputs and returns verification receipts.

**There is no automatic transition on `/validate`. The conditional FSM execution applies only to `/transition`.**

This is the routing behavior to implement.

---

**You**

> and by router I mean rotuer validator

**Assistant**

Understood. **Every reference to a service response returning to the Router means it first returns to the Router Validator.**

The routing paths are:

**`/validate`**
```text
Router Validator → Router → Validator
                                 ↓
                          Router Validator
                                 ↓
                               Router
                                 ↓
                              Renderer
                                 ↓
                         Configured destination
```

**`/transition`**
```text
Router Validator → Router → Validator
                                 ↓
                          Router Validator
                                 ↓
                               Router
                                 │
                        ┌────────┴────────┐
                        │                 │
                      Invalid           Valid
                        │                 │
                     Renderer            FSM
                        │                 │
                  Destination      Router Validator
                                          │
                                        Router
                                          │
                                       Renderer
                                          │
                                     Destination
```

The **Router Validator validates envelopes**; the **Router performs dispatch and continuation** using externally configured routing contracts.

No service response bypasses the Router Validator, including responses from the FSM and Renderer.

---

**You**

> Proceed

**Assistant · Commentary**

> I’ll implement the two endpoint contracts in the existing runtime: `/validate` renders its verdict; `/transition` renders rejection or continues accepted input to the FSM. Every service response will pass through the Router Validator before the Router selects the next destination. I’ll verify the code changes and run focused tests where execution is available.

**Assistant · Commentary**

> I found a key dependency: the Router Validator currently checks only the initial request and final reply. For the requested sequence, it also needs to check each intermediate service response before the Router continues. I’m addressing that boundary as part of the routing change, rather than allowing a direct Validator → FSM shortcut.

---

**You**

> Listen, these outside devices post to the router validator...

**Assistant**

Correct. **Every external device submits its request to the Router Validator, never directly to the Router.**

```text
External devices / Listener
           ↓
     Router Validator
           ↓
         Router
           ↓
    Selected service
           ↓
     Router Validator
           ↓
         Router
           ↓
    Next configured service
```

The Router Validator is the **single ingress and return-validation boundary**.

The Router is an internal coordinator. It uses the service-routing contracts and service-to-port lookup table to dispatch requests. It performs no validation.

This applies to both `/validate` and `/transition`. Their different continuation behaviors are determined by their routing contracts, not by the external device.

The latest routing code was committed, but this clarification has not yet been verified against the running container.

---

**You**

> The only special case I guess is the FSM validator response since it goes back to the router which called it...

**Assistant**

Correct. The **FSM Validator response is a continuation of the Router's existing request**, not a new external request.

The distinction is:

- **External devices:** Submit requests to the Router Validator, which validates them before forwarding them to the Router.
- **FSM Validator:** Returns its verdict to the Router that invoked it.
- **Router:** Uses that verdict and the endpoint's routing contract to determine the next service.
- **Other services:** Return responses through the Router Validator before the Router continues processing.

For `/transition`:

```text
External Device
      ↓
Router Validator
      ↓
    Router
      ↓
FSM Validator
      ↓
    Router
      ├── Invalid → Renderer
      │
      └── Valid → FSM
                    ↓
             Router Validator
                    ↓
                  Router
                    ↓
                 Renderer
```

The FSM Validator therefore has a special return path because it is acting as the Router's internal decision gate.

**Its verdict does not require a second pass through the Router Validator**, provided that exception is explicitly defined in the routing contract.

No repository changes have been made in response to this clarification.

---

**You**

> No its going to send it to the renderer always

**Assistant**

Correct. **The FSM Validator always sends its response back to the calling Router, which always routes that response to the Renderer.** This applies whether validation succeeds, rejects the input, or encounters an execution error.

```text
Router
   ↓
FSM Validator
   ↓
Router
   ↓
Renderer
   ↓
Configured destination
```

For `/transition`, a valid verdict can also authorize the Router to proceed to the FSM under the endpoint's routing contract. That does **not** replace rendering the validation response.

The Renderer uses the configured mode and destination. The Validator does not select either.

My previous interpretation incorrectly treated the valid verdict as a reason to bypass the Renderer.

---

**You**

> the renderer has the service-render location contract

**Assistant**

Correct. **The Renderer owns the service-render location contract.** The Router does not determine where output is written.

The responsibilities are:

| Component | Responsibility |
|---|---|
| **FSM Validator** | Returns its validation verdict to the calling Router |
| **Router** | Forwards the Validator's response to the Renderer |
| **Renderer** | Looks up the originating service's render-location contract |
| **Renderer** | Formats, writes, and verifies the output at the configured destination |
| **Router** | Receives the Renderer’s write-verification receipt |

The flow is:

```text
FSM Validator
      ↓
    Router
      ↓
   Renderer
      ↓
Service-render location lookup
      ↓
Configured destination
      ↓
Write and readback verification
      ↓
    Router
```

**The distinction is between routing and publication:**

- The Router's service-routing contract determines *which service receives a response next*.
- The Renderer's service-render location contract determines *where and how that response is written*.

This applies to valid, invalid, and error responses from the FSM Validator.

---

**You**

> Proceed

**Assistant · Commentary**

> I’ll update the existing runtime so every FSM Validator verdict is passed to the Renderer, and the Renderer—not the Router—resolves the service-render location contract. I’ll check the current files, make the in-place changes, and verify what the tests establish.

---

**You**

> Now the Validator does set its return routing mode, and thats what the renderer uses

**Assistant · Commentary**

> That changes the contract: the Validator sets the return routing mode, and the Renderer uses that declared mode to resolve its destination. I’ll correct the configuration and Renderer changes I just committed, then update the Router to preserve the Validator’s mode rather than choose one.

---

**You**

> It should never choose one

**Assistant · Commentary**

> Agreed. The Renderer must never choose a mode. It must consume the mode explicitly declared by the responding service and use that mode’s configured render-location contract. I’ll correct the Router so it preserves that mode unchanged.

---

**You**

> It would have to decipher the different message types then from teh services instead of services essentially choosing stdout or stderr

**Assistant**

Yes. The services should return **structured messages**, rather than choosing between `stdout` and `stderr` as their routing mechanism.

The Renderer interprets the declared message type and rendering mode using its configuration.

| Field | Purpose |
|---|---|
| `type` | Identifies the outcome: `result`, `rejection`, or `error` |
| `mode` | Identifies the service-declared rendering contract |
| `payload_contract` | Identifies the structure of the returned data |
| `payload` | Contains the result or diagnostic data |
| `error` | Contains structured failure information |
| `request_id` | Preserves correlation with the original request |

For example, a Validator can return `type: "rejection"` with `mode: "input-error"`. The Renderer looks up `input-error` and applies its configured formatting, destination, and write operation.

**Neither the Router nor the Renderer chooses the mode.** The originating service declares it. The Router Validator checks that the declaration is valid, and the Renderer executes the corresponding contract.

`stdout` and `stderr` remain available for container diagnostics, but they are not the application-level routing protocol.

The latest commits already move the FSM and Router toward this arrangement. Full message-contract validation, persistence, and end-to-end execution still require verification.

---

**You**

> That was an analogu

**Assistant**

Understood. `stdout` and `stderr` were an analogy for different output categories, not a proposed implementation.

Your point was that **the Renderer must distinguish service responses by their declared message types and apply the corresponding rendering contracts**, rather than treating every response identically.

The service identifies the response type, the Router Validator checks its validity, the Router forwards it, and the Renderer applies the configured output behavior.

I interpreted your analogy too literally.

---

**You**

> Not really becasue the service responses include a mode that will decide how theyre rendered based on aa preexisitng contract the renderer is already configured for

**Assistant**

Correct. The service response includes an explicit **`mode`**, which references a preexisting rendering contract.

The Renderer does not need to infer the mode from the service identity, message type, or payload contents.

The contract is:

1. **Service:** Returns its response with a declared `mode`.
2. **Router Validator:** Validates the response envelope, including the declared mode.
3. **Router:** Forwards the response to the Renderer without changing its mode.
4. **Renderer:** Looks up the declared mode in its existing configuration and executes the associated formatting, destination, and write behavior.

The distinction is that **`mode` is a contract reference, not something the Renderer computes**.

The Renderer only needs to resolve and execute that contract.

---

**You**

> Procced

**Assistant · Commentary**

> I’ll align the runtime with that contract: each service declares `mode`, the Router Validator checks it, the Router preserves it, and the Renderer uses it as a lookup key. I’ll inspect the current implementation, correct any remaining mismatches, and verify the changes.

**Assistant · Commentary**

> The mode-contract correction is committed. The Router Validator now rejects missing or unknown modes on service responses, and the Renderer uses the declared mode without deriving one from the response type. I’ve added focused tests; I’m checking execution results next.

**Assistant**

## Implementation committed — IssueScratch

Updated the runtime to enforce the **service-declared rendering mode** contract.

| Component | Verified change |
|---|---|
| Validator | Returns an explicit `mode` in its response |
| FSM | Declares `procedure` or `fsm-diagnostic` in its response |
| Router Validator | Rejects service responses with missing or unconfigured modes |
| Router | Preserves the service-declared mode when forwarding to the Renderer |
| Renderer | Resolves the declared mode against its existing configuration |

The Router and Renderer do not independently select a mode.

### Commits

- [Mode validation — `0147297`](https://github.com/BestNameYet/IssueScratch/commit/0147297c1dba548ff16e507c3feae3b3af4ce77d)
- [Mode-contract tests — `69cc1e1`](https://github.com/BestNameYet/IssueScratch/commit/69cc1e17d235168e19c7a90463f3450ce3f97f7f)
- [GitHub Actions test workflow — `9538528`](https://github.com/BestNameYet/IssueScratch/commit/9538528c98634df3c12ca88efb0e5d8dfd09e59d)

### Verification status

The committed files were read back and inspected. The new tests cover declared modes, missing modes, unknown modes, and rendering-contract lookup.

**Automated execution is not yet verified.** No workflow run was returned for the latest commit.

The Renderer currently formats output and identifies its destination, but actual destination writes and readback verification remain unimplemented. Therefore, end-to-end execution is not yet established.

---

**You**

> When the Validator rejects the responses where does it router the error

**Assistant**

Currently, **the Router Validator returns the rejection to its caller as an HTTP error. It does not route that rejection to the Renderer.**

There are two cases in the existing implementation:

| Rejection point | Current behavior |
|---|---|
| Incoming request fails Router Validator | Returns HTTP `422` directly to the external caller |
| Service response fails Router Validator | Returns HTTP `502` with `INVALID_UPSTREAM_ENVELOPE`, or rejects the internal `/check` request, causing the Router to return `502` |

**This is a gap in the architecture.**

Under the intended design, a Router Validator rejection should be represented as a structured error response with a declared rendering mode, then routed to the Renderer through the appropriate internal path.

The Renderer would use that mode to look up the configured destination, write the diagnostic, and return a verification receipt.

At present, **that rejection-to-Renderer path is not implemented**.

---

**You**

> Yah thats not a gap, you forgot what its supposed to do

**Assistant**

You're correct. I conflated two separate rejection mechanisms.

The **Router Validator is the boundary that determines whether a message is permitted to reach the Router**.

- **Invalid incoming request:** The Router Validator rejects it and returns the error to the originating caller.
- **Invalid service response:** The Router Validator rejects the response and reports the failure to the calling Router.
- **Valid service response:** The Router Validator passes it to the Router, which forwards it according to the service-routing contract.

The Renderer processes accepted, contract-compliant service messages using their declared `mode`.

**A Router Validator rejection is not automatically a rendering request.** My proposed rejection-to-Renderer path was incorrect.

---

**You**

> YEs it is

**Assistant**

Correct. **A Router Validator rejection must be routed to the Renderer**, not returned directly to the originating caller as the final disposition.

The intended flow is:

```text
Incoming request or service response
                ↓
         Router Validator
                ↓
         Validation fails
                ↓
      Structured rejection
                ↓
              Router
                ↓
             Renderer
                ↓
     Configured error destination
                ↓
       Write verification
```

The Router Validator produces the rejection with its prescribed rendering mode. The Router forwards it without changing that mode, and the Renderer applies the preconfigured rendering contract.

This applies to both invalid incoming requests and invalid service responses. **The rejected message itself is never executed or forwarded to its intended service.**

The current implementation's direct HTTP `422` and `502` rejection paths do not satisfy this behavior.

---

**You**

> The router validator has an error mode that goes to the renderer and must go somewhere like any other service...for servieces it goes to an error log, for listener from the input its written back to the comment

**Assistant**

Correct. The **Router Validator is itself a service with a configured error-rendering contract**. Its errors must be rendered and delivered, just like the outputs of other services.

The destination depends on the origin of the rejected message.

| Rejected message origin | Router Validator mode | Renderer destination |
|---|---|---|
| Listener / external input | Input-validation error mode | Original GitHub Issue comment |
| Internal service response | Service-validation error mode | Error log |

### Routing

```text
                  Router Validator
                         │
                  Validation fails
                         │
                 Structured error
                         │
                       Router
                         │
                      Renderer
                         │
              Mode contract lookup
                         │
              ┌──────────┴──────────┐
              │                     │
        Listener input       Service response
              │                     │
              ↓                     ↓
       Original comment          Error log
```

The Router Validator declares the appropriate error mode based on whether it is validating an external input or an internal service response. The Router forwards that declaration unchanged, and the Renderer looks up the existing rendering contract.

**Neither the Router nor the Renderer decides which error destination to use.** The Router Validator selects its error mode; the Renderer resolves that mode to its configured location.

The current implementation does not yet implement these two Router Validator error paths correctly.

---

**You**

> Proceeed

**Assistant · Commentary**

> I’ll implement the Router Validator’s two rejection modes: listener-input errors addressed to the originating comment, and internal service-response errors addressed to the error log. I’ll preserve the existing service-declared mode contract and check the resulting code and tests.

**Assistant · Commentary**

> Both error modes are now configured, and Router Validator rejections have an internal route to the Renderer. I found one remaining inconsistency: Renderer receipts need to retain a valid mode so the Router Validator can check them without rejecting the receipt itself. I’m correcting that before final verification.

---

**You**

> Echo the complete design spec to UI

**Assistant · Commentary**

> I’ll stop the implementation changes and present the design specification here. I’ll distinguish the intended architecture from the current code, including the Router Validator’s origin-specific error modes.

**Assistant**

# IssueScratch — Complete Stateless Runtime Design Specification

<text color="secondary" size="sm">Consolidated architecture contract • November 1, 2026</text>

This is the complete **runtime architecture specification as established in our discussion**, including the latest corrections to Router Validator error routing and Renderer modes. It is not a verbatim reproduction of the repository's 320,928-character historical specification, which also contains archived source-code snapshots.

The full repository document is available at [Stateless Runtime Architecture Specification](https://github.com/BestNameYet/IssueScratch/blob/main/docs/stateless-runtime-architecture-specification.md). That document predates several of the routing corrections below.

## 1. Architectural objective

Replace the existing GitHub API-dependent IssueScratch execution workflow with a stateless, containerized Node.js runtime.

The system must preserve deterministic processing, externally maintained state, existing canonical procedures, validation boundaries, source identities, structured error handling, rendering contracts, and verifiable persistence.

**The fundamental separation is between lifecycle control, routing, validation, execution, rendering, and persistence.**

No component may assume responsibilities assigned to another component simply because those responsibilities are convenient to combine.

## 2. Overall architecture

<box border radius="xl" padding={3} gap={2}>
  <box background="surface-secondary" radius="lg" padding={3} align="center" gap={1}>
    **External devices and GitHub Listener**

    <text color="secondary" size="xs" textAlign="center">Submit requests, supply external state and configuration</text>
  </box>
  <row justify="center"><icon name="arrow-down" color="secondary" size="lg"/></row>
  <box border={{size:2,color:"strong"}} radius="lg" padding={3} align="center" gap={1}>
    **Router Validator**

    <text color="secondary" size="xs" textAlign="center">Single external ingress boundary and service-response validation</text>
  </box>
  <row justify="center"><icon name="arrow-down" color="secondary" size="lg"/></row>
  <box background="surface-secondary" radius="lg" padding={3} align="center" gap={1}>
    **Router**

    <text color="secondary" size="xs" textAlign="center">Configured dispatch, continuation and correlation</text>
  </box>
  <row justify="center"><icon name="arrow-down" color="secondary" size="lg"/></row>
  <grid columns={3} gap={2}>
    {#each [{n:"FSM Validator",d:"Input validity"},{n:"FSM",d:"State transition"},{n:"Renderer",d:"Configured writes"}] as item}
      <grid-item>
        <box border radius="md" padding={2} align="center" gap={1} minHeight="80px" justify="center">
          <text weight="medium" size="sm" textAlign="center">{item.n}</text>
          <caption textAlign="center">{item.d}</caption>
        </box>
      </grid-item>
    {/each}
  </grid>
  <row justify="center"><icon name="arrow-down-up" color="secondary" size="lg"/></row>
  <box border radius="lg" padding={3} align="center" gap={1}>
    **External state and destination adapters**

    <text color="secondary" size="xs" textAlign="center">GitHub comments, state files, diagnostic logs, publication receipts</text>
  </box>
</box>

All external input enters through the Router Validator. Service responses re-enter the Router's continuation logic through their prescribed validation boundary, with the FSM Validator's immediate return to its calling Router handled as the explicitly discussed internal case.

## 3. Component responsibilities

| Component | Required responsibilities | Prohibited responsibilities |
|---|---|---|
| **Listener** | GitHub event intake, container start/stop, external context provision, collecting completion receipts | Input acceptance logic, FSM execution, rendering decisions |
| **Router Validator** | Envelope validation, response-mode validation, structured routing errors | Executing FSM transitions or deriving rendering destinations |
| **Router** | Service lookup, dispatch, continuation, request correlation, delivery to Renderer | Schema validation, changing declared modes, writing outputs |
| **FSM Validator** | Determine whether a candidate input is valid | Mutating state, constructing transitions, rendering |
| **FSM** | Execute deterministic transitions from supplied state and validated input | Persistent writes, GitHub access, renderer selection |
| **Renderer** | Resolve an explicitly declared mode to an existing rendering contract, format, write, verify | Choosing or inferring response modes |
| **External persistence** | Store state, revision history, diagnostics, output artifacts and receipts | Independently determining procedural validity |

## 4. Unified service message contract

Services exchange versioned JSON envelopes.

A service response has the following conceptual structure:

<CodeBlock language="json" editable={false}>
{
  "contract": "router.envelope.v1",
  "request_id": "request-correlation-id",
  "type": "result",
  "payload_contract": "service-specific-contract.v1",
  "mode": "configured-render-mode",
  "payload": {},
  "error": null
}
</CodeBlock>

The required distinctions are:

- `type` identifies the response outcome.
- `payload_contract` identifies the content structure.
- `mode` is the explicit rendering-contract reference declared by the originating service.
- `request_id` maintains correlation.
- `payload` contains service output.
- `error` contains structured error details, where applicable.

**The Router must not assign a mode. The Renderer must not derive one from `type`, the service name, or payload contents.**

The Router Validator checks whether the declared mode exists and whether its use satisfies the configured contract.

## 5. `/validate` endpoint

The `/validate` endpoint performs validation without an FSM transition.

<CodeBlock language="text">
External requester
    ↓
Router Validator
    ↓
Router
    ↓
FSM Validator
    ↓
Router
    ↓
Renderer
    ↓
Mode-based destination lookup
    ↓
Write and verification receipt
</CodeBlock>

A valid result, rejected input, or Validator execution error is still a service response to be rendered.

The FSM Validator explicitly declares the rendering mode appropriate to that response.

The `/validate` route **never independently initiates an FSM state transition**.

## 6. `/transition` endpoint

The `/transition` endpoint applies the normal validation-then-transition procedure.

<CodeBlock language="text">
External requester
    ↓
Router Validator
    ↓
Router
    ↓
FSM Validator
    ↓
Router
    ↓
Renderer ← Always receives Validator response
    ↓
Validation rendering receipt
    │
    ├── Invalid or error
    │       ↓
    │     No FSM execution
    │
    └── Valid
            ↓
           FSM
            ↓
      Router Validator
            ↓
          Router
            ↓
         Renderer
            ↓
    State/output destination
            ↓
    Verified write receipt
</CodeBlock>

The critical requirement is that **validity controls whether the FSM may execute, not whether the Validator response is rendered**.

Valid, invalid and error outcomes from the FSM Validator all follow the Renderer path.

A validated result must not be converted into an FSM transition inside the Validator. Transition-input preparation belongs to the orchestration layer outside that Validator and must follow the canonical input contract.

## 7. Router Validator error contract

The Router Validator is itself a service capable of producing structured error messages with explicitly declared rendering modes.

Its errors are not terminal HTTP messages without publication. They are routed for rendering like other service outputs.

<box border radius="lg" padding={3} gap={3}>
  <box gap={1} align="center">
    **Router Validator**

    <text color="secondary" size="xs">Rejects an envelope and declares an error mode</text>
  </box>
  <row justify="center"><icon name="arrow-down" color="secondary"/></row>
  <grid columns={2} gap={3}>
    <grid-item>
      <box background="surface-secondary" radius="lg" padding={3} gap={2} align="center">
        **Listener-originated input**

        <text size="xs" weight="medium">`router-input-error`</text>
        <icon name="arrow-down" color="secondary"/>
        **Router → Renderer**
        <icon name="arrow-down" color="secondary"/>
        <text size="sm" textAlign="center">Original GitHub Issue comment</text>
      </box>
    </grid-item>
    <grid-item>
      <box background="surface-secondary" radius="lg" padding={3} gap={2} align="center">
        **Internal service response**

        <text size="xs" weight="medium">`router-service-error`</text>
        <icon name="arrow-down" color="secondary"/>
        **Router → Renderer**
        <icon name="arrow-down" color="secondary"/>
        <text size="sm" textAlign="center">Service error log</text>
      </box>
    </grid-item>
  </grid>
</box>

### 7.1 Listener-originated input errors

The Router Validator assigns its configured input-error mode when an incoming listener request fails boundary validation.

The response must retain sufficient origin information to identify the correct source comment. The Renderer resolves the declared mode and writes the error to that comment according to its publication contract.

### 7.2 Service-response errors

When an internal service returns a malformed or invalid response, the Router Validator emits its configured service-error mode.

The Renderer writes the diagnostic to the configured service error log.

This failure must not be confused with a normal rejection by the FSM Validator: a normal rejection is a valid service response, while a Router Validator rejection indicates a boundary-contract failure.

### 7.3 Error recursion

If the rendering of a Router Validator error itself fails, the system must fail closed, preserve diagnostics, and terminate the operation without entering an unlimited Validator–Router–Renderer cycle.

## 8. Renderer contract

The Renderer receives both a service-produced message and an existing external rendering configuration.

The mode is a lookup key, not a request for the Renderer to decide what to do semantically.

For example, the currently configured registry includes:

| Declared mode | Format | Destination |
|---|---|---|
| `procedure` | JSON | Agent Issue |
| `input-error` | JSON | Agent Issue |
| `validation-result` | JSON | Agent Issue |
| `fsm-diagnostic` | JSONL | FSM log |
| `state-file` | JSON | State file |
| `router-input-error` | JSON | Agent Issue |
| `router-service-error` | JSONL | FSM log |

These are configuration entries, not universal hardcoded conditions. The Renderer must operate from the supplied configuration.

### Renderer execution sequence

1. Read the service-declared `mode`.
2. Resolve that mode against the externally provided rendering registry.
3. Resolve the configured destination adapter and location.
4. Serialize the supplied data according to the declared format.
5. Execute the configured write operation.
6. Read back or otherwise independently verify the written result.
7. Return a structured receipt containing the observed outcome.

A successfully formatted payload is **not** equivalent to a successful publication.

The Renderer must distinguish failures in lookup, serialization, writing and verification, and must not claim that output was published when only formatting succeeded.

## 9. Router contract

The Router is an internal dispatcher, not the system's input validator.

It maintains a service-to-port lookup and externally defined route declarations. Conceptually:

<CodeBlock language="json" editable={false}>
{
  "service_port_lookup": {
    "router_validator": 8787,
    "router": 8786,
    "fsm": 8788,
    "renderer": 8789,
    "validation": 8790
  }
}
</CodeBlock>

The Router must preserve the service-provided `request_id`, outcome and `mode`. It may consult configured continuation rules to determine the next service, but must not reclassify the output or change its rendering mode.

Service calls must be bounded by timeouts and return explicit execution receipts.

No silent fallback to an alternative execution mechanism is permitted.

## 10. FSM and deterministic state

The FSM is a stateless transition service.

For each invocation it receives:

- The externally supplied current state.
- A validated transition event conforming to the canonical event contract.
- The relevant canonical procedure.

It computes and returns the resulting state, transition data and complete projection.

The FSM itself does not persist anything. Two invocations with identical inputs and procedures must yield identical logical transition outputs.

The system must preserve source revision identities, progression indices, accepted-prefix integrity, deterministic contract selection and the complete opcode/JSON projection.

Transition operations must never run on input rejected by the FSM Validator.

## 11. External state and configuration

The container is ephemeral and must not be considered an authoritative store.

The following are supplied or retained outside the container:

| External artifact | Purpose |
|---|---|
| Canonical procedure library | Sole static procedure authority |
| Service and port configuration | Routing declarations |
| Renderer mode registry | Mode-to-destination contracts |
| Current comment state | Deterministic transition starting point |
| Source comment and revision | Input provenance |
| Diagnostic history | Error analysis |
| Published output | Durable execution result |
| Write verification receipts | Proof of publication |

The canonical source remains `src/types/issuescratch.procedure-library.v1.json`, referenced by `AGENTS.md`.

Legacy records, previous Issue #1 comments, old execution receipts and historical procedure snapshots must not be rewritten to simulate success.

## 12. Listener and container lifecycle

The GitHub Listener is responsible for lifecycle operations:

<CodeBlock language="text">
GitHub Issue event
      ↓
Listener receives event
      ↓
Resolve source identity and external context
      ↓
Provision container configuration and state
      ↓
Start ephemeral Node.js container
      ↓
Submit request to Router Validator
      ↓
Execute configured service routing
      ↓
Collect rendering and execution receipts
      ↓
Confirm required outputs are verified
      ↓
Terminate container
</CodeBlock>

The Listener must not bypass the Router Validator by posting directly to the Router.

The container must not retain authoritative state between invocations. It may maintain request-local execution context for the duration of one operation.

## 13. Execution and failure invariants

A conforming implementation must satisfy all of the following:

- Every external request enters through the Router Validator.
- The Router Validator has distinct error rendering modes for listener inputs and internal service responses.
- The Router Validator's rejected input never reaches its prohibited destination service.
- The FSM Validator always returns its verdict to the calling Router for rendering.
- The `/validate` route performs no FSM transition.
- The `/transition` route continues to the FSM only following valid input.
- Every originating service declares its response rendering mode.
- The Router never changes that mode.
- The Renderer never infers, substitutes, or independently chooses a mode.
- The Renderer resolves the existing mode contract and performs the required write.
- A successful write requires a verifiable receipt.
- All request IDs and source identities remain correlated.
- Errors cannot cause unbounded recursive routing.
- Canonical procedures and historical evidence remain unchanged.

## 14. Required verification

End-to-end acceptance requires evidence for all of these scenarios:

| Scenario | Expected result |
|---|---|
| Valid `/validate` input | Validator verdict rendered; no transition |
| Invalid `/validate` input | Validator rejection rendered; no transition |
| Valid `/transition` input | Validator verdict rendered, FSM runs, FSM output rendered |
| Invalid `/transition` input | Validator rejection rendered, FSM does not run |
| Invalid listener envelope | Router Validator error rendered to originating comment |
| Invalid service response | Router Validator error rendered to service error log |
| Unknown service-declared mode | Rejected by Router Validator |
| Renderer destination unavailable | Explicit failure receipt, no false success |
| FSM execution exception | FSM diagnostic response rendered |
| Repeated identical input | Deterministic handling without accidental duplicate progression |
| Container termination | No loss of authoritative persisted state |

The implementation must also be exercised through the actual GitHub Actions Listener and container runtime rather than relying solely on isolated unit tests.

## 15. Current implementation status

The repository currently contains the core services, versioned envelopes, service-port lookup, the two Router Validator error modes and code for forwarding error envelopes to the Renderer.

However, the latest code readback also shows that the Renderer currently returns `write_status: "not_implemented"` and `verified: false`. Consequently, **destination writes and independent readback are not yet implemented**.

The current Router Validator error dispatch is newly committed, but no successful end-to-end execution receipt has been established. Nor has the full operational behavior of error routing been verified.

The architecture above is therefore the **target contract**, not a claim that the runtime already meets it.

---

**Authoritative source documents**

[Existing architecture specification](https://github.com/BestNameYet/IssueScratch/blob/main/docs/stateless-runtime-architecture-specification.md) · [Current service configuration](https://github.com/BestNameYet/IssueScratch/blob/main/config/stateless-services.json) · [Agent instructions](https://github.com/BestNameYet/IssueScratch/blob/main/AGENTS.md)

The historical specification includes verbatim source snapshots and has not yet been reconciled with every correction made in this conversation.

---

If you want, I can:

- Explain how the Router Validator error modes operate
- Describe the /transition endpoint sequence and its critical requirements
- Outline the Renderer’s responsibilities and constraints in outputting service messages
