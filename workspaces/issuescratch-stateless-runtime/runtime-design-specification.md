# IssueScratch — Complete Stateless Runtime Design Specification

**Status:** Consolidated intended architecture, 2026-11-01. This is a design contract, not evidence of completed implementation or integration tests.

**Origin:** Consolidation of the IssueScratch runtime design discussion. Historical source archive: https://github.com/BestNameYet/IssueScratch/blob/main/docs/stateless-runtime-architecture-specification.md (an earlier 320,928-character snapshot which predates later corrections).

## 1. Objective

Replace GitHub API-dependent IssueScratch execution with a stateless, containerized Node.js runtime, preserving deterministic ordering and state transitions, externally stored configuration and state, canonical procedures, request/source correlation, strong validation boundaries, error handling, render contracts and verifiable persistence. Separate lifecycle control, routing, validation, execution, rendering and persistence; no convenience-driven combination of components.

## 2. Architecture and boundaries

```text
External devices / GitHub Listener
      |
      v
Router Validator (single external ingress)
      |
      v
Router (internal dispatch / continuation)
      |                      ^ response-validation boundary
      +--> FSM Validator ----+
      +--> FSM ----------> Router Validator --> Router
      +--> Renderer -----> Router Validator --> Router
      |
External state/config and configured persistent destinations
```

Every external request enters through the Router Validator, never directly through the Router. Service returns use the prescribed boundary, with the specifically agreed internal FSM Validator verdict returning to its calling Router before unconditional rendering. The Router Validator is also a service and publishes its own error outputs via the Router and Renderer.

## 3. Responsibility partition

| Component | Required responsibilities | Must not do |
| --- | --- | --- |
| GitHub Listener | Event intake, provision configuration/state, launch/terminate ephemeral container, submit to Router Validator, collect receipts | Validate FSM submissions, execute transitions, choose render mode |
| Router Validator | Validate shared envelope, origin/correlation and declared mode; reject malformed requests/service responses; generate its own typed error with an error mode | FSM execution, selecting render destinations |
| Router | Look up ports/routes, dispatch calls, correlate requests, apply endpoint continuation contracts, forward service-declared modes unchanged | Validate schemas, infer/change modes, persist results |
| FSM Validator | Decide input acceptance/rejection and return explicit result and rendering mode | Prepare transition input, advance state, select destination, render |
| FSM | Deterministic state transition and complete projection from supplied state and validated event | Persistent write, GitHub access, choosing renderer modes for other services |
| Renderer | Look up explicit service-declared mode in preexisting external mode registry; format, write, read back and produce verified receipt | Infer/choose the mode from service, type, payload or semantics |
| External storage/adapters | Persist comment output, state, log, artifacts and receipts | Decide acceptance/procedure |

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

```text
External requester -> Router Validator -> Router -> FSM Validator
                                               |
                                               v
                                             Router
                                               |
                                               v
                                            Renderer
                                               |
                                               v
                          mode-defined destination and verified write
```

All Validator outcomes (accepted, rejected, execution error) are rendered. Validator verdicts do not themselves construct transitions or advance state. **/validate does not invoke FSM.** Its response mode is declared by the Validator and passed intact.

## 6. /transition endpoint

```text
External requester -> Router Validator -> Router -> FSM Validator
                                               |
                                               v
                                             Router
                                               |
                                               v
                                            Renderer  (always renders verdict)
                                               |
                                         write receipt
                                               |
                                      +--------+-------+
                                      |                |
                                 invalid/error       valid
                                      |                |
                                   stop              FSM
                                                       |
                                                       v
                                               Router Validator
                                                       |
                                                       v
                                                     Router
                                                       |
                                                       v
                                                    Renderer
                                                       |
                                                       v
                                             destination + receipt
```

Both acceptance and rejection from the FSM Validator are always sent by its calling Router to Renderer. Validity additionally governs whether /transition may continue to FSM. Transition input must be prepared outside FSM Validator according to its canonical input contract. An invalid or failed validation never executes an FSM transition. FSM output also carries a service-declared mode and returns through Router Validator before Router continues.

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

## 9. Router service lookup and continuation

The configured service-to-port lookup currently identifies Router Validator 8787, Router 8786, FSM 8788, Renderer 8789 and Validation 8790 on internal loopback. The Router relies on external route and continuation contracts for /validate, /transition and rendering; it must not hardcode destinations or decide modes. Calls are bounded and correlated. Route and service replies must preserve request_id and originating mode. No silent bypass of Router Validator or alternative execution mechanism.

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

1. All external ingress is through Router Validator.
2. Router Validator declares distinct listener-input and service-response error modes.
3. Invalid ingress or service messages never reach the intended destination.
4. FSM Validator always returns to its calling Router, which always forwards verdicts to Renderer.
5. /validate never executes FSM.
6. /transition runs FSM only on valid input, after rendering the Validator result.
7. Originating services declare the literal output mode.
8. Router preserves modes unchanged and never performs schema validation.
9. Renderer resolves, never invents, the mode.
10. Rendering includes an actual write and independently verified receipt.
11. Correlation and source identity remain intact.
12. Errors are bounded; no recursive error-loop.
13. FSM is deterministic and stateless.
14. No canonical procedure or historical record is silently rewritten.

## 14. Acceptance tests

| Test | Expected proof |
| --- | --- |
| Valid /validate | Validator result rendered; no FSM |
| Invalid /validate | Validator rejection rendered; no FSM |
| Valid /transition | Validator result rendered; FSM executed; FSM result rendered |
| Invalid /transition | Rejection rendered; no FSM execution |
| Invalid external envelope | Router Validator error on originating Issue comment |
| Invalid internal service response | Router Validator error in service log |
| Missing/unknown service-declared mode | Router Validator rejects; configured error path |
| Renderer write unavailable | Explicit failure receipt, never false success |
| FSM exception | Diagnostic rendering and no false transition |
| Repeated identical input | Deterministic, duplicate-safe handling |
| Container shutdown | State and receipts remain durable |

Run focused unit tests, service-contract tests and actual GitHub Actions + Docker end-to-end tests. Verify real persistent outputs and readback rather than inferring success from successful CI start or formatting.

## 15. Implementation status at capture

Repository contains service endpoints, versioned envelopes, port lookup, service-declared modes and initial error-dispatch code. It is **not end-to-end verified**. Renderer code was observed to format and return `write_status: "not_implemented"` and `verified: false`; verified publishing and persistence have not been established. Recent Router Validator error-routing commits likewise lack verified end-to-end receipts. This document records the intended contract, not operational success.

## Source references

- Earlier archival specification: https://github.com/BestNameYet/IssueScratch/blob/main/docs/stateless-runtime-architecture-specification.md
- Runtime configuration: https://github.com/BestNameYet/IssueScratch/blob/main/config/stateless-services.json
- Canonical instructions: https://github.com/BestNameYet/IssueScratch/blob/main/AGENTS.md
- Runtime source: https://github.com/BestNameYet/IssueScratch/tree/main/src

