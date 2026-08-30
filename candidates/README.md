# Candidate records

`schema/candidate.schema.json` defines the review record used by the data MCP discovery pipeline. Generated discovery output is evidence for maintainers; it is not a Connector descriptor and cannot publish, merge, or delist anything.

The first automated stage reads the public Official MCP Registry, copies only allowlisted fields, classifies data services, compares stable identities with the current catalog, and assigns an explainable score. It intentionally records license, public probe, human review, and runtime acceptance as unknown or not-run until later evidence is collected.

Deduplication has two levels:

- `strong`: exact Connector ID, Official Registry/server name, canonical HTTPS endpoint, or package identifier. A strong match is classified as `duplicate` and must be reconciled.
- `weak`: similar terminal name/title or the same endpoint host. It is only a review hint and never suppresses a candidate.

Score weights are authority 25, protocol/auth accessibility 25, maintenance/license/security 20, runtime quality 15, market gap 10, and documentation/safety boundary 5. Scores at 80+ may be selected only after public reachability, authentication, and license/service-terms evidence are also verified; 65–79 are watchlist and lower scores are deferred, subject to the non-data, lifecycle, failed-probe, and strong-duplicate gates. Automated selection never substitutes for official-document review or real runtime acceptance.

Run a reproducible local discovery from a captured Official Registry response:

```bash
npm run candidates:discover -- --input test/fixtures/official-registry.json --output candidate-output
```

Run against the live public API:

```bash
npm run candidates:discover -- --output candidate-output
```

Add bounded, credential-free public probing for the highest-scoring remote candidates:

```bash
npm run candidates:discover -- --output candidate-output --probe --max-probes 25
npm run candidates:monthly -- --input candidate-output/candidate-report.json --output candidate-output/monthly-batch.md --size 10
```

The probe resolves only public DNS addresses, pins the HTTPS connection to an audited address, refuses redirects, never sends authorization headers, caps response bytes and time, and never executes stdio packages. A single failed probe only defers a new candidate for investigation; it never modifies or removes an existing connector.

The scheduled workflow uses a fixed marker to create or update one daily watchlist issue and one monthly review-batch issue. Repeated runs do not create new issues, and the workflow has no path that writes `connectors/`, opens a descriptor PR, merges, publishes, or delists.

`candidate-output/` is ignored. A maintainer may copy a reviewed candidate to `candidates/records/<connector-id>.json` only after adding official license/authentication evidence and completing the review fields. A future descriptor PR must still pass real runtime acceptance and human review.
