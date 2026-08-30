export async function upsertDiscoveryIssue({ github, owner, repo, title, marker, body }) {
  if (!marker.startsWith('<!--') || !marker.endsWith('-->')) throw new Error('Issue marker must be an HTML comment');
  const renderedBody = `${marker}\n${String(body).slice(0, 60_000)}`;
  const issues = await github.paginate(github.rest.issues.listForRepo, {
    owner,
    repo,
    state: 'all',
    per_page: 100,
  });
  const existing = issues.find((issue) => !issue.pull_request
    && issue.title === title
    && String(issue.body ?? '').includes(marker));
  if (!existing) {
    const created = await github.rest.issues.create({ owner, repo, title, body: renderedBody });
    return { action: 'created', issueNumber: created.data.number };
  }
  if (existing.body === renderedBody && existing.state === 'open') {
    return { action: 'unchanged', issueNumber: existing.number };
  }
  await github.rest.issues.update({
    owner,
    repo,
    issue_number: existing.number,
    title,
    body: renderedBody,
    state: 'open',
  });
  return { action: 'updated', issueNumber: existing.number };
}

export async function syncThresholdIssue({ github, owner, repo, title, marker, body, active }) {
  if (active) return upsertDiscoveryIssue({ github, owner, repo, title, marker, body });
  const issues = await github.paginate(github.rest.issues.listForRepo, { owner, repo, state: 'all', per_page: 100 });
  const existing = issues.find((issue) => !issue.pull_request && issue.title === title && String(issue.body ?? '').includes(marker));
  if (!existing || existing.state === 'closed') return { action: 'absent', issueNumber: existing?.number ?? null };
  await github.rest.issues.update({
    owner,
    repo,
    issue_number: existing.number,
    title,
    body: `${marker}\n${String(body).slice(0, 60_000)}`,
    state: 'closed',
    state_reason: 'completed',
  });
  return { action: 'closed', issueNumber: existing.number };
}
