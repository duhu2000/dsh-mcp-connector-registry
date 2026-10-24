# DataSinking PR #49 — scoped Bearer Desktop acceptance and maintainer approval

## Explicit human listing approval (recorded 2026-10-24T06:40:45Z)

Maintainer `duhu2000` explicitly confirmed in the user conversation:
“批准此限定范围上架并记录我的维护者确认”. Codex records that actual human
confirmation here; it is not an assistant-generated human review or approval
inferred from the earlier Key-entry confirmation.

The approval question stated the scope: official Bearer Desktop access, six
tools discovered and three successful read-only calls, with official terms and
Key configuration aligned. It explicitly excluded all-tools, paid-tier and
financial-data-accuracy verification. The maintainer approved listing within
those limits, conditional on final exact-head CI, without bypassing gates.
Other platforms and post-merge market-card installation are not certified by
this approval. The timestamp above is the dossier recording time.

## 2026-10-24 authorized Desktop acceptance

The user confirmed they entered their authorized Key locally and connected.
Codex inspected the native macOS DSH Desktop UI (connector version 0.2.79), not
an exported credential file or raw request headers. The UI showed a `bearer`
connection to `https://api.datasink.ing/mcp`, scoped only to the dedicated
acceptance workspace, and six discovered tools. Its local test server name was
`registry-datasinking-key-test`. The draft's endpoint, transport and auth mode
were matched; this was a manual unpublished test connection, not a market-card
install or post-merge market regression.

New isolated conversation started at `2026-10-24T14:29:12+08:00`; completion and
cleanup were checked by `2026-10-24T06:32:26Z`. Three actual business calls were
observed in the native tool trace, with no other tool rows:

| Tool | Non-secret parameters | Observed output |
| --- | --- | --- |
| `list_reports` | `{"symbol":"600519.SS","doc_type":"annual","size":1}` | one item, document id 3, period 2025-12-31, source cninfo, empty adjunct_url |
| `list_sections` | `{"document_id":3}` | 10 headings; Important Notice heading present; server reports chars=1556 and estimated_tokens=1020 for this section |
| `get_section` | `{"document_id":3,"section":"重要提示"}` | matching report/period/source/section metadata, non-empty readable content with block markers |

The observed tool prefix was `mcp__registry-datasinking-key-test__`. No
authentication, permission or quota error was shown. The final answer did not
invent a missing original-filing link. This is not verification of financial
figures against the underlying filing. The 1556-character count above is vendor
metadata, not an independent body measurement. No new raw-response hash is
claimed: native AX output is truncated; the old hashes below are historical only.

The temporary connection was disabled in Desktop after acceptance; checked
`已停用`, disabled status, checkbox=0. The local credential/configuration and
test conversation were retained for user-controlled reuse, not deleted or
exported. Other connections were not modified.

Limits: no `get_report`, bulk download, account registration, purchase, pricing
upgrade or other-platform testing. No credential was read, logged or sent in
chat. A successful Bearer-configured client flow does not prove server-side Key
enforcement or a particular paid tier: those are **not independently proven**;
no invalid-Key experiment or anonymous fallback was performed. All six tools
were discovered but only the three listed tools were exercised.

Runtime acceptance is now pass for this scoped path. A score of 82 reflects the
documented access path and observed runtime evidence, not itself a human approval.
The separate explicit maintainer confirmation above now supplies human listing
approval; the runtime inspector and the human approver remain distinguished.

## 2026-10-24 route decision

The user explicitly approved implementing the official Bearer API Key route and
will enter an authorized Key locally in DSH. The descriptor now requires Bearer;
there is no anonymous fallback. This implementation approval is not listing approval.
[Official MCP setup](https://datasink.ing/docs/mcp), [terms](https://datasink.ing/terms)
and [pricing](https://datasink.ing/pricing) were rechecked: Key-based evaluation
is documented, subject to account, rate and rolling/shared limits. Standalone
redistribution/resale and authentication/limit bypass are prohibited. No account
registration or purchase is authorized by this report.

At the route-change commit the candidate runtime status was reset to **not-run**; historical
anonymous success below does not prove the user's Key was sent, accepted or charged.
Current server version remains unverified; 0.2.17 is the historical observation.

Planned minimal acceptance (completed above): user enters the Key in the local masked credential field;
verify connection and tool list; read at most one public report's list, section list
and one short section through DSH. Stop on authentication/permission/rate errors.
Never retry anonymously or obtain another Key; no bulk/full-report downloads.
Record only non-secret parameters, result status, metadata and evidence summary.
Do not read or export credential storage, raw headers, Key values or session tokens.

## Historical evidence (unchanged)

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

1. Current proposed market card: `auth.mode=bearer`; a local masked API Key field
   is required. No credential value is stored in the public descriptor.
2. Isolated acceptance connection: use DSH's Add Connection form, HTTPS endpoint
   `https://api.datasink.ing/mcp`, and Bearer authentication. Enter the Key only
   in the local credential field. Never place it in the URL, prompt or PR.
   This documented configuration path has now passed the scoped Desktop test above;
   server-side credential enforcement and paid-tier entitlements were not tested.

## Remaining release gates

- Scoped Bearer Desktop acceptance and explicit human approval are recorded above;
  historical anonymous results do not substitute for either.
- Final exact-head CI must pass, with no unresolved safety feedback or conflict.
  Any required workflow-run authorization is separate from listing approval.
- Merge must lock the reviewed head. Main CI, catalog rebuild and market/CDN
  consistency must be checked afterwards; merge alone is not proof of rollout.

The candidate record now records declared terms and scoped runtime acceptance
for the Key route and the genuine human confirmation, while retaining the final
CI gate. Approval fields were changed only after explicit maintainer confirmation,
not simply to make CI pass.
