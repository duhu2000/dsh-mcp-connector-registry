# Vedar MCP: read-only runtime acceptance (PR #44)

> **Current evidence: the run of 2026-11-14 on `vedar-mcp` 2.10.2** — see "[Current acceptance 2026-11-14](#current-acceptance-2026-11-14-vedar-mcp-2102)" at the end of this report.
> Everything between this note and that section is **dated historical evidence** (2.5.0 on 2026-10-19, 2.10.0 on 2026-10-30) and is kept unchanged; version numbers and tool counts there describe the server on those dates, not today.

- Checked at: 2026-10-19T05:42:43.281Z
- Reviewer (submitter): tourhabk-ui
- Endpoint: https://vedarai.ru/api/mcp
- Evidence link (public MCP manifest): https://vedarai.ru/.well-known/mcp.json
- Runner: `scripts/run-runtime-acceptance.mjs` in this repository
  (`npm run candidates:accept -- --url https://vedarai.ru/api/mcp --tool get_tours --args '{}' --reviewer tourhabk-ui`),
  MCP clientInfo `dsh-registry-runtime-acceptance` 1.0.0, protocol 2025-06-18.
  Server: `vedar-mcp` 2.5.0 (`initialize` result, unauthenticated).

## Tool discovery

- `tools/list` returned 20 tools.
- `get_tours` annotations: `readOnlyHint=true`, `destructiveHint=false`, `idempotentHint=true`.
- Five state-changing tools (`readOnlyHint=false`, verified live on 2026-10-19):

| Tool | Effect |
| --- | --- |
| `edit_trip_plan` | Persists an anonymous trip-plan draft server-side for 7 days by `plan_id`; changes shared draft state, sends nothing to a human or operator, and takes no name/phone or other personal data. |
| `create_lead` | Creates a tour-selection request; transmits the traveller's name and phone to the platform. |
| `create_booking_request` | Creates a booking request for a specific tour/date; transmits name and phone to the platform/operator. |
| `create_stay_request` | Creates a stay request; transmits name and phone to the platform/stay owner. |
| `request_charter` | Creates a whole-vehicle charter request; transmits name and phone to the platform/carrier. |

- The four request-creation tools require `consent:true` in their input schema
  (name, phone and consent are required fields). Consent is explicit prior user
  confirmation to process and transmit name/phone for that request; without
  `consent:true` the request is not created. They were **not** called in this review.
- Route/place safety answers (e.g. `safety_status`, `get_volcano_status`,
  `get_guardian_context`) identify their sources (KB GS RAS / EGS RAS, KVERT,
  MChS Kamchatka, Roshydromet, USGS, NASA FIRMS) with dates/update times.
  That information is not a safety guarantee.

## Reproducible read-only call

- Tool: `get_tours`
- Parameters (non-personal): `{}` (first catalogue page, no filters)
- Result: success (`isError` absent/false), one text content block.
  Summary: page 1 of 6, 37 tours in total, 7 tours on the page, with operator
  names and per-person prices in the returned text.
- Response SHA-256 (raw MCP response, repo runner): `e92aed563860968777c9f569ea1397d3c0e281b931d7426e41f887dd41292f46`
- Credential scan: pass. Raw response bodies, session identifiers and
  credentials are intentionally not stored.

## Boundaries

No booking, lead, stay or charter request was created, no test request of any
kind was submitted, and no real contact details or other personal data were
used. The only tool call was the read-only `get_tours` above.

## Service terms evidence

- User agreement (service terms), edition 2026-10-05: https://vedarai.ru/legal/terms
- Privacy policy (personal data, incl. name/phone processing), edition 2026-10-15: https://vedarai.ru/legal/privacy
- Public offer for partners, edition 2026-10-05: https://vedarai.ru/legal/offer

All three URLs returned HTTP 200 on 2026-10-19. The MCP service is a hosted
service, not distributed software, so a software licence is not applicable;
the service terms above are the applicable evidence.

## Addendum 2026-10-30: make_trip_plan annotation corrected (maintainer review of 2026-10-20)

- Fix: tourhabk-ui/pos#2879, merge commit `baaa91ac1e0d77fb3d0c2d8afb0688f242e05f5a`
  (merged 2026-10-30T11:48:25Z); Timeweb deploy completed 2026-10-30T12:10:01Z.
- Live check 2026-10-30 ~12:10Z, unauthenticated `initialize` + `tools/list` on
  https://vedarai.ru/api/mcp: server `vedar-mcp` 2.10.0, 23 tools.
  `make_trip_plan` annotations: `readOnlyHint=false`, `destructiveHint=false`,
  `idempotentHint=false`, `openWorldHint=true`.
- State-changing tools now (`readOnlyHint=false`), seven in total:

| Tool | Class |
| --- | --- |
| `make_trip_plan` | Anonymous draft write: saves a new trip-plan draft (7 days) when it produces days; no personal data, nothing sent to a human/operator; repeat calls create new drafts. |
| `edit_trip_plan` | Anonymous draft write: edits that draft by `plan_id`; same properties. |
| `create_lead`, `create_booking_request`, `create_stay_request`, `request_charter`, `create_car_rental_request` | Requests that transmit name/phone; require explicit prior user confirmation and `consent:true`; confirmed by a human. |

- Note: since the 2026-10-19 report the server added `create_car_rental_request`
  (car rental without driver), so there are five consent-gated request tools, not four.
- No write tool was called for this addendum; no personal data was used.
  Human maintainer review remains pending.

### Re-run 2026-10-30 on live 2.10.0

`node scripts/run-runtime-acceptance.mjs --url https://vedarai.ru/api/mcp --tool get_tours --args '{}' --reviewer tourhabk-ui`
- Checked at: 2026-10-30T12:11:12.430Z; server `vedar-mcp` 2.10.0; protocol 2025-06-18; 23 tools.
- `get_tours` `{}`: success; response SHA-256 `360d80b7e0cb5df5630607f902a754f41ad0ef0e7ebcb021630c5944f9182b4c`; credential scan pass; decision pass.
- Official MCP Registry: `ru.vedarai/mcp` 2.10.0 active, isLatest (published 2026-10-30T05:58:26Z).

## Current acceptance 2026-11-14: vedar-mcp 2.10.2

- Checked at: 2026-11-14T00:37:47.033Z
- Reviewer (submitter): tourhabk-ui
- Endpoint: https://vedarai.ru/api/mcp
- Runner: `scripts/run-runtime-acceptance.mjs` of this repository, unchanged, executed on a GitHub-hosted runner
  (`node scripts/run-runtime-acceptance.mjs --url https://vedarai.ru/api/mcp --tool get_tours --args '{}' --reviewer tourhabk-ui`),
  protocol 2025-06-18. The workflow, its pinned inputs and the run log are public:
  https://github.com/tourhabk-ui/pos/blob/main/.github/workflows/dsh-registry-acceptance.yml
  https://github.com/tourhabk-ui/pos/actions/runs/43535436125
  (registry commit `15caa8a20e1d54b654995c6ebf26819b2593c4b2`, runner script SHA-256
  `69fa231401f2e6f56b7e36b88d7e9b08d8055c9d79ab2d4636cbdc53b23da0a0`).
- Server: `vedar-mcp` 2.10.2 (`initialize` result, unauthenticated).
- `tools/list` returned 25 tools.
- `get_tours` `{}`: success; response SHA-256 `279096e777250e89041737d8b7e05208bbef89bd1a541536544a8e5a62fc94ad`; credential scan pass; decision pass.
- Official MCP Registry: `ru.vedarai/mcp` 2.10.2, status active, published 2026-11-13T15:58:32.431654Z
  (https://registry.modelcontextprotocol.io/v0.1/servers/ru.vedarai%2Fmcp/versions/2.10.2), read 2026-11-14T00:37:50.000Z.

### State-changing tools on 2026-11-14 (`readOnlyHint=false`), 9 in total

| Tool | Class |
| --- | --- |
| `make_trip_plan` | Anonymous draft write: saves a new trip-plan draft (7 days) when it produces days; no personal data, nothing sent to a human or operator; repeat calls create new drafts. |
| `edit_trip_plan` | Anonymous draft write: edits that draft by `plan_id`; same properties. |
| `create_trip_request`, `create_lead`, `create_booking_request`, `create_stay_request`, `request_charter`, `create_car_rental_request` | Requests that transmit the user's name and phone to the platform/operator/provider; `name`, `phone` and `consent` are required and `consent:true` means explicit prior user confirmation; each request is confirmed by a human and is a request, not a booking. |
| `change_request` | Changes an existing tour request by the status key returned when it was created: cancels it or moves it to another date (`destructiveHint=true`). Takes no name or phone and no consent field; call only when the user asks. If the operator has already answered, it only forwards the ask to the operator. |

Since the 2026-10-30 run the server added `create_trip_request` (a whole trip in one request: tour, stay and charter vehicle under one trip id) and
`change_request`, so there are six consent-gated request tools and one key-gated change tool; the two anonymous
draft-write tools are unchanged.

### Boundaries

The only tool call was the read-only `get_tours` above. No request of any kind was created, cancelled or moved,
and no contact details or other personal data were used. Human maintainer review remains pending.

### Service terms evidence, re-read 2026-11-14

- User agreement (service terms), edition 2026-10-05: https://vedarai.ru/legal/terms
- Privacy policy, edition 2026-10-15: https://vedarai.ru/legal/privacy
- Public offer for partners, edition 2026-10-05: https://vedarai.ru/legal/offer
- Public MCP manifest (`vedar-mcp` 2.10.2): https://vedarai.ru/.well-known/mcp.json

All four URLs returned HTTP 200 on 2026-11-14.
