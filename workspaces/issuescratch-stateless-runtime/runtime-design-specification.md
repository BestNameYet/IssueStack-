# IssueScratch — Complete Stateless Runtime Design Specification

**Status:** Corrected active design contract (user-confirmed flow, 2026-11-01); staged for per-change review under IssueStack job [6560092235](https://github.com/BestNameYet/IssueStack-/issues/2#issuecomment-6560092235). This is not evidence of completed implementation or passing end-to-end tests.

**Origin:** Consolidation of the IssueScratch runtime design discussion. Historical source archive: https://github.com/BestNameYet/IssueScratch/blob/main/docs/stateless-runtime-architecture-specification.md (an earlier 320,928-character snapshot which predates later corrections).

## 1. Objective

Replace GitHub API-dependent IssueScratch execution with a stateless, containerized Node.js runtime, preserving deterministic ordering and state transitions, externally stored configuration and state, canonical procedures, request/source correlation, strong validation boundaries, error handling, render contracts and verifiable persistence. Separate lifecycle control, routing, validation, execution, rendering and persistence; no convenience-driven combination of components.

## 2. Architecture and boundaries

The **accepted transition path and its return path** are fixed by the user's clarification:

```text
Listener
   |
   v
Router Validator (RV) -- validates incoming envelope only
   |
   v
Router (RO) -- forwards intact envelope / opaque payload
   |
   v
FSM Validator (FSMV) -- validates opaque payload against FSM input contract
   | accepted: direct forwarding by FSMV, not RO
   v
FSM -- executes transition and returns its enveloped response to RV
   |
   v
Router Validator (RV) -- validates returned FSM response envelope
   |
   v
Router (RO) -- forwards validated enveloped response unchanged
   |
   v
Renderer (RE) -- resolves declared mode, writes and reads back output
```

All external Listener transition requests enter through RV at `POST /transition`. RV validates the envelope; it does not validate the opaque FSM payload. RO is a dispatch-only transport for validated envelopes and does not construct FSM events, choose acceptance, or invoke an intermediate Renderer gate. **FSMV itself forwards accepted payloads to FSM.** After execution, the FSM response must return to RV (not directly to RO/RE); only a successfully envelope-validated response proceeds RV → RO → RE.

The normal successful transition invokes **no Renderer between FSMV and FSM**. Rendering is downstream of the returned FSM response. An invalid FSM payload never executes a transition. The precise rejected-payload and exceptional-return handling is governed by separately confirmed contracts; do not infer an unconfirmed new route from the successful-path diagram. RV-generated boundary errors are described in §7. `/validate` is a separate validation-only path, not Listener transition ingress.

## 3. Responsibility partition

| Component | Required responsibilities | Must not do |
| --- | --- | --- |
| GitHub Listener | Event intake, supply state/config and source identity, run container, send `POST /transition` to RV, collect verified receipts | Validate the opaque FSM payload, execute transitions, choose rendering mode |
| Router Validator (RV) | Independently validate envelopes on both inbound and FSM response paths, correlation and declared envelope fields; block malformed packets and declare typed boundary errors | Validate the opaque FSM payload, advance FSM, choose a render destination |
| Router (RO) | Look up and forward envelopes to configured services intact; dispatch only | Inspect opaque payload content, run acceptance predicates, construct/prepare FSM inputs, choose continuation by payload semantics, impose render-before-FSM gate |
| FSM Validator (FSMV) | Validate the opaque FSM input payload and **directly forward accepted payloads to FSM** | Return an accepted transition payload to RO for RO-controlled FSM execution, render or persist |
| FSM | Execute deterministic transition of validated supplied input/state; return a response envelope **to RV** | Skip RV response validation, call Renderer directly, perform persistent GitHub writes |
| Renderer (RE) | Receive envelope from RO after RV validation; resolve declared mode from configured registry, format, write, read back and return receipt | Control whether accepted validation can execute FSM, infer/change source-declared mode |
| External state/config and adapters | Supply durable state, configuration, output and readback evidence | Choose FSM acceptance or transitions |

This partition corrects earlier descriptions that gave RO continuation/acceptance decisions or required a Renderer receipt before FSM execution.

## 4. Unified envelope

```json
{
  "contract": "router.envelope.v1",
  "request_id": "request-correlation-id",
  "type": "result",
  "payload_contract": "service-specific-contract.v1",
  "mode": "configured-render-mode",
  "payload": {},
  "error": null
}
```

The type identifies outcome (result, rejection or error). payload_contract identifies content schema. request_id preserves request correlation. The source service **sets** mode, a literal key referencing a preexisting renderer configuration; the Router never alters it and the Renderer never computes it. Router Validator validates declarations against configuration. Transport stdout/stderr is unrelated to application-level routing.

## 5. /validate endpoint

`POST /validate` is a distinct **validation-only** operation. It may return an FSMV verdict for rendering according to its independently specified validation-output contract; it must **never invoke FSM or advance state**. Its existence does not authorize RO to interpret opaque payloads or perform the valid-transition continuation. The Listener's normal execution entry point is `POST /transition`, not `/validate`.

Acceptance/rejection representation and any validation-only rendering modes must be declared by the originating service rather than selected by RO. Do not import validation-only rendering semantics into the `/transition` FSMV→FSM success path.

## 6. /transition endpoint

```text
Listener --POST /transition--> RV --valid envelope--> RO
                                               |
                                      opaque package
                                               v
                                              FSMV
                             rejected/invalid | accepted
                         (do not invoke FSM)   | direct forwarding by FSMV
                                               v
                                              FSM
                                               | response envelope
                                               v
                                     RV (response validation)
                                               | valid envelope
                                               v
                                              RO
                                               | unchanged enveloped response
                                               v
                                              RE
                                               | configured write + readback
                                               v
                                           durable receipt
```

The **FSMV, not RO**, forwards a valid payload to FSM. RO does not prepare the FSM input, check an acceptance flag, or call RE to obtain publication authorization. The successful response **must** pass FSM → RV → RO → RE, preserving request ID, original source identity and source-service-declared mode. Do not silently route the FSM response directly to RE or to RO without RV validation.

An invalid or failed FSMV check stops FSM execution. Exact rejection/error publication behavior must be separately grounded in the confirmed error contract; a diagram of the successful transition does not invent a rejected-payload route. RV's malformed-ingress and invalid-service-response paths are in §7. Rendering or write verification is not part of the transition authorization predicate.

## 7. Router Validator error modes

Router Validator is a service with its own error output contract and must route its rejected envelopes through Router to Renderer instead of ending at an unpersisted HTTP 422/502.

| Origin rejected by Router Validator | Declared mode | Renderer contract destination |
| --- | --- | --- |
| Listener / external incoming request | router-input-error | Original source GitHub Issue comment |
| Internal service response | router-service-error | Service error log |

The rejected original message is never dispatched to its intended service. Router Validator creates a structured error message with the prescribed mode. Router carries it unchanged to Renderer, which resolves the configured mode and writes it. An invalid service response is different from an FSM Validator's properly formatted rejection. Preserve source comment identifiers and request correlation. Any error in rendering a boundary error must fail closed and not recurse indefinitely through the same boundary path.

## 8. Renderer modes, locations and receipts

Current intended registry:

| Mode | Format | Configured destination |
| --- | --- | --- |
| procedure | JSON | Agent Issue |
| input-error | JSON | Agent Issue |
| validation-result | JSON | Agent Issue |
| fsm-diagnostic | JSONL | FSM log |
| state-file | JSON | State file |
| router-input-error | JSON | Agent Issue / original comment |
| router-service-error | JSONL | Service error log |

These entries represent external configuration; destination adapters and paths are supplied outside the ephemeral container. The Renderer is content-agnostic and executes the exact contract identified by the service's mode. Steps: receive declared mode; look up existing registry entry; resolve adapter/location; serialize according to format; write; verify via readback or independently corroborating mechanism; return a structured receipt. Formatting success alone is **not** publication success. Reject unknown or unsupported modes, invalid destinations and failed writes; never claim verification absent evidence.

## 9. Router service lookup and transport

Configured internal port lookup identifies RV 8787, RO 8786, FSM 8788, RE 8789 and FSMV 8790. Listener transition ingress is `POST /transition` at RV. Container/host networking may expose RV on the runner's loopback interface while keeping RO, FSM, RE and FSMV internal.

RO forwards the validated envelope/package and opaque payload to FSMV; it does not interpret validation outcomes or construct the event for FSM. FSMV owns accepted-payload forwarding to FSM. FSM sends its response to RV, whose envelope check precedes RO forwarding to RE. Request IDs and modes survive every hop; mode declaration belongs to originating services. Any existing `route.response_contract` that makes RO inspect payload acceptance or requires RE before FSM is nonconforming and must be repaired. `/validate` remains separate and cannot be the Listener's normal transition path.

## 10. Deterministic FSM

The FSM receives external current state plus the canonically validated event and procedure; it returns next state, transitions and complete opcode/JSON projection, without writing persistence. Equivalent inputs must yield equivalent logical outputs. Enforce index, source revision identity, accepted-prefix integrity, procedure and event contracts. Rejection prohibits FSM execution. Source of canonical static procedures: `src/types/issuescratch.procedure-library.v1.json`, referenced by `AGENTS.md`.

## 11. Externalized configuration and state

Authoritative data stays outside the container: canonical procedure library; port/route and renderer registry; current comment state; source identities/revisions; immutable diagnostics/history; resulting outputs; verified publication receipts. The container operates on supplied data without retaining authoritative state across invocations. Historical Issue #1 comments and old receipts must remain intact.

## 12. Listener/container lifecycle

```text
GitHub Issue event
  -> Listener reads event and source identity
  -> acquires external state and config
  -> starts disposable Node.js container
  -> posts request to Router Validator
  -> awaits contracted service processing and receipts
  -> independently confirms required writes
  -> terminates container
```

Listener is a lifecycle controller, not a second validator or renderer. Container termination must not destroy authoritative state. A successful submission alone never establishes successful execution.

## 13. Mandatory invariants

1. Listener transition ingress uses RV `POST /transition`; no bypass of RV.
2. RV independently validates incoming envelope and the enveloped response returned **directly by FSM**; invalid envelopes never reach their intended next destination.
3. RO forwards accepted enveloped packages without inspecting/reconstructing opaque payloads or deciding acceptance.
4. FSMV validates the opaque payload and **directly forwards accepted payloads to FSM**.
5. Failed/rejected FSMV payloads do not execute FSM; their detailed error path is specified independently.
6. No rendering, publication receipt or Router-governed continuation is required between successful FSMV validation and FSM execution.
7. FSM returns its enveloped response **to RV**, which validates it and then passes a good envelope to RO.
8. RO forwards that validated enveloped response to RE; the FSM must not skip the return-path validation.
9. `/validate` does not execute FSM and is distinct from transition ingress.
10. Originating services declare literal rendering modes; RO never alters a mode and RE never invents it.
11. RE writes the declared output to a configured destination and independently verifies persistence.
12. RV distinguishes invalid external-Listener envelopes from invalid internal service-response envelopes under separately configured error modes.
13. Error handling is bounded, with no recursive render loop.
14. FSM remains deterministic and does not own durable persistence.
15. Source identities, correlation and immutable historical records are preserved.

## 14. Acceptance tests

| Test | Required independently observed behavior |
| --- | --- |
| Valid Listener /transition | RV inbound check → RO opaque forwarding → FSMV acceptance → direct FSMV→FSM dispatch → FSM response→RV check→RO→RE |
| Invalid incoming envelope | RV rejects before dispatch; configured originating-comment error handling tested independently |
| Invalid FSMV payload | FSM never runs; no assumptions about unconfirmed downstream rejection routing |
| Router opacity | RO does not inspect payload.accepted or prepare the FSM event; tests with deliberately opaque payloads |
| No early render | RE not called between accepted FSMV validation and FSM execution; no pre-transition write gate |
| FSM invalid response envelope | RV blocks response before RO and RE; configured service-error path evaluated without recursive loops |
| Correct response | RV validates FSM return envelope and correlation before RO forwards same enveloped response to RE |
| /validate only | Validation-only request never invokes FSM |
| Renderer write unavailable | Publication not reported verified; output remains a separate downstream concern |
| Duplicate input/replay | Deterministic processing and correct source/nonce handling |
| Container shutdown | External state and verified receipts remain durable |

Exercise unit, integration, fault and real GitHub Actions/Docker paths, and inspect actual service-hop traces and durable writes. Passing mock tests or build steps alone is not evidence of this sequence working end-to-end.

## 15. Implementation status and conformance gaps (2026-11-01)

**Design correction is not implemented by editing this specification.** At IssueScratch main `174f57c1bd77b4d5570a0c1905ae261d84282b5e`, the production Listener still uses `docker exec -i` to post `/validate`; the proposed host-local `POST /transition` transport has not been implemented. Current RO in `src/stateless-router-server.js` contains `prepare()`, interprets validation outcomes and requires a Renderer write receipt before invoking FSM. Those actions contradict the user-confirmed sequence; the C001 gate's existing test success does **not** establish specification conformance.

The current service wiring includes a separate `src/validation-server.js` service and FSM endpoint, but the explicit FSMV→FSM and FSM→RV→RO→RE topology has **not** passed a real integration test. C002 Renderer persistence remains an unapproved isolated candidate; C003 main introduced outbound Docker connectivity and a callable GitHub Issue writer with 6/6 mocked unit tests and a Docker HTTPS smoke test, but did not connect the production Renderer to GitHub persistence. The existing combined service CI still has 3 failures. Previous claimed or planned transitions are not evidence of an end-to-end verified path.

### Conformance and implementation trace

| User-confirmed invariant | Current implementation discrepancy | Required runtime repair / validation |
| --- | --- | --- |
| Listener POST to RV /transition | Listener posts /validate with docker exec | Bind/publish RV host-local port and test HTTP /transition from Actions runner |
| RV checks ingress envelope | RV has a checking boundary, but actual ingress uses wrong route | Test valid and invalid incoming envelope forwarding |
| RO is opaque forwarder | RO `prepare()` and response-contract branches inspect acceptance and construct FSM input | Remove payload-semantic processing; verify opaque bytes/structure survive forwarding |
| FSMV directly forwards accepted payload to FSM | RO currently invokes FSM as a continuation after its own acceptance interpretation | Shift actual acceptance/dispatch to FSMV; test accepted and rejected events |
| No RE before accepted transition | C001 write gate requires render receipt before FSM | Remove that gate; assert RE invocation order strictly after FSM response |
| FSM response to RV | Current RO's direct FSM call expects its response and uses RE from RO | Ensure FSM return targets RV and RV validates envelope/correlation |
| RV → RO → RE on valid response | Full return path not demonstrated | Test exact hop sequence, checked envelope and final RE receipt |
| RE uses configured mode and verified persistence | Main RE is not connected to write/readback adapter; C002 unapproved | Integrate with adapter only under runtime job; verify actual output |
| Preservation of history | Original archival snapshot and immutable reviews exist | Do not silently alter archived artifacts; cross-reference corrections |

### Review and lifecycle

This correction belongs to the separate documentation/design IssueStack job [6560092235](https://github.com/BestNameYet/IssueStack-/issues/2#issuecomment-6560092235). The revised runtime code/test work remains the outstanding predecessor job [6557693257](https://github.com/BestNameYet/IssueStack-/issues/2#issuecomment-6557693257). Historical C001/C002/C003 receipts and the original archived 320k-word discussion are retained as evidence, not promoted into authority over the newer user correction. No code repair or job completion is implied by this document.

## Source references

- Earlier archival specification: https://github.com/BestNameYet/IssueScratch/blob/main/docs/stateless-runtime-architecture-specification.md
- Runtime configuration: https://github.com/BestNameYet/IssueScratch/blob/main/config/stateless-services.json
- Canonical instructions: https://github.com/BestNameYet/IssueScratch/blob/main/AGENTS.md
- Runtime source: https://github.com/BestNameYet/IssueScratch/tree/main/src

