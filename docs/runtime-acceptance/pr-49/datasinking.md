# DataSinking PR #49 — anonymous protocol acceptance and open review gates

Prepared by Codex on 2026-10-21. This preserves the independent 2026-10-20
observations already recorded in [review 5586918780](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/49#pullrequestreview-5586918780).
No new provider business calls were made to prepare this report.
This is **not human approval**, DSH Desktop UI acceptance, or a verification of
financial figures against original filings.

## Observed read-only acceptance

- Endpoint: `https://api.datasink.ing/mcp`, without credentials.
- Server: DataSinking 0.2.17; protocol 2024-11-05; six tools discovered.
- Client: repository protocol/runtime runner, not DSH Desktop.
- Executor: Codex; historical result summaries and hashes below are from the
  cited review, not newly generated measurements.

| UTC timestamp (2026-10-20) | Tool and non-secret parameters | Observation | Response SHA-256 |
| --- | --- | --- | --- |
| 14:54:18 | `list_reports({"symbol":"600519.SS","doc_type":"annual","size":1})` | document_id=3; report_period=2025-12-31; source=cninfo | `c386df12757dbe34ed8299238c71dc193296e23719c5ee224a709f27db6a53f9` |
| 14:55:07 | `list_sections({"document_id":3})` | ten section headings | `054286166257a4e34098d1b64f7a1f3d47617be2793f9e6db2ce4b35b4d0049e` |
| 14:56:07 | `get_section({"document_id":3,"section":"重要提示"})` | non-empty Markdown, 1757 JavaScript string characters, matching metadata, isError=false, credential scan passed | `0a19b8050443b21958a830bcc4aaf6d55c12b222ed1d10d5b5f14c703116c4fb` |

No account was registered, Key obtained, subscription purchased, or bulk/full
report downloaded. No raw financial body, credentials or session identifiers
are retained here. The sampled original-filing URL was empty; an answer must
not invent an original link.

## Official-source check (2026-10-21)

- [MCP documentation](https://datasink.ing/docs): hosted endpoint and optional
  Authorization Bearer header configuration are documented. Prefer a local
  credential field over the vendor's query-string Key example.
- [Pricing](https://datasink.ing/pricing): keyed free/yearly plans are documented;
  the exact anonymous allowance claimed in the original PR was not found on
  this page. Do not hard-code that allowance as a verified promise.
- [Terms](https://datasink.ing/terms), dated 2026-08-25: section 3 says service
  access requires a Key. This does not clearly cover the observed anonymous
  preview. Restrictions include no standalone redistribution/resale and no
  bypass of authentication or limits; underlying filings retain their rights.
- [Privacy](https://datasink.ing/privacy), dated 2026-08-25: usage metadata is
  recorded. Do not submit personal data or secrets in query text.
- [Vendor homepage](https://datasink.ing/): identifies report text rather than
  a structured-numeric API. Card icon remains the vendor-domain URL from the PR.

## Connection paths

1. Current proposed market card: `auth.mode=none`; anonymous only. No credential
   input is shown, and acquiring a Key cannot upgrade this saved connection.
2. Separate keyed connection: use DSH's Add Connection form, HTTPS endpoint
   `https://api.datasink.ing/mcp`, and Bearer authentication. Enter the Key only
   in the local credential field. Never place it in the URL, prompt or PR.
   This is a documented configuration path, **not a tested Key-based session**.

## Still blocked before merge

- Vendor must reconcile anonymous preview with section 3 of its terms and
  publish/identify an authoritative anonymous allowance or explicitly remove
  the unsupported anonymous path. A passing public call is not a rights grant.
- If the proposal switches to mandatory Bearer, authorized-account acceptance
  is required; existing anonymous results cannot substitute for it.
- Human maintainer must assess the completed evidence, final score and exact
  descriptor. `review.decision` remains pending with no named human reviewer.
- Final exact-head CI must pass after those requirements are satisfied.

The candidate record intentionally retains service-terms and approval gates;
do not change approval fields simply to make CI pass.
