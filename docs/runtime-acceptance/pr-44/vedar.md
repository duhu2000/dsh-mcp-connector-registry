# Vedar MCP: read-only runtime acceptance (PR #44)

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
