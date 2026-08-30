## Connector registration

- Connector ID:
- Vendor / service:
- Official homepage:
- Public MCP configuration documentation:
- Authentication mode: `none` / `bearer` / `api-key` / `oauth2-pkce`
- Logo source:

## Checklist

- [ ] I added exactly one `connectors/<connector-id>.json` file and its filename matches `id`.
- [ ] The Connector ID and every `serverName` are globally unique.
- [ ] All service, documentation, and icon URLs use HTTPS.
- [ ] This change contains no Token, API Key, password, Cookie, Client Secret, or private endpoint.
- [ ] `featured` is `false`; I understand featured placement is maintained separately.
- [ ] Prompts contain no personal information, customer data, or restricted content.
- [ ] I provided official sources for the MCP endpoint, authentication method, and logo.
- [ ] A maintainer added `candidates/records/<connector-id>.json` with approved human review and a redacted real runtime acceptance report.
- [ ] I ran `npm ci --legacy-peer-deps && npm run check` locally.

## Notes for reviewers

Describe endpoint limitations, required subscriptions, regions, account permissions, or other facts users should know.
