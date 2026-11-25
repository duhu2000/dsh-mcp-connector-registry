// Run from the trusted PR base. Decisions and public feedback share one GitHub review.
const query = `query RegistryReviews($owner: String!, $repo: String!, $number: Int!, $cursor: String) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $number) {
      headRefOid
      reviews(last: 100, before: $cursor) {
        nodes {
          databaseId url body state submittedAt lastEditedAt
          commit { oid }
          author { __typename login }
        }
        pageInfo { hasPreviousPage startCursor }
      }
    }
  }
}`;

module.exports = async function checkMaintainerReview({ github, context, core }) {
  const { owner, repo } = context.repo;
  const { number, head } = context.payload.pull_request;
  const prUrl = `${context.serverUrl}/${owner}/${repo}/pull/${number}`;
  const candidates = [];
  const eventReview = context.payload.review;
  let eventVisible = !eventReview || eventReview.commit_id !== head.sha;
  let cursor = null;
  do {
    const { repository } = await github.graphql(query, { owner, repo, number, cursor });
    const pr = repository.pullRequest;
    if (pr.headRefOid !== head.sha) throw new Error('PR revision changed during verification.');
    for (const review of pr.reviews.nodes) {
      if (eventReview && review.databaseId === eventReview.id &&
          review.state === String(eventReview.state).toUpperCase() && review.body === eventReview.body) eventVisible = true;
      if (review.commit?.oid !== head.sha || review.author?.__typename !== 'User' ||
          !['COMMENTED', 'DISMISSED'].includes(review.state)) continue;
      const [first, ...lines] = (review.body || '').trim().split(/\r?\n/);
      // Editing a published note can remove its marker. A fresh decision supersedes it.
      if (first.startsWith('Registry verification:') || review.lastEditedAt) {
        candidates.push({ review, first, feedback: lines.join('\n').trim() });
      }
    }
    const { hasPreviousPage, startCursor } = pr.reviews.pageInfo;
    cursor = hasPreviousPage ? startCursor : null;
  } while (cursor);
  if (!eventVisible) throw new Error('The published review update is not yet visible to the gate.');

  // Pending reviews may have been created in a different order from submission.
  // Within one timestamp, a withdrawal or invalid decision takes precedence.
  function canPass({ review, first, feedback }) {
    return review.state === 'COMMENTED' && !review.lastEditedAt && first === 'Registry verification: pass' &&
      Number.isSafeInteger(review.databaseId) && review.databaseId > 0 &&
      review.url === `${prUrl}#pullrequestreview-${review.databaseId}` && feedback && !/^https?:\/\/\S+$/i.test(feedback);
  }
  candidates.sort((a, b) => Date.parse(b.review.submittedAt) - Date.parse(a.review.submittedAt) ||
    Number(Boolean(canPass(a))) - Number(Boolean(canPass(b))));
  const permissions = new Map();
  for (const decision of candidates) {
    const { review } = decision;
    const username = review.author.login;
    if (!permissions.has(username)) {
      const { data } = await github.rest.repos.getCollaboratorPermissionLevel({ owner, repo, username });
      permissions.set(username, ['write', 'maintain', 'admin'].includes(data.permission));
    }
    if (!permissions.get(username)) continue;
    if (!canPass(decision)) {
      throw new Error(`Verification withdrawn or incomplete for PR #${number} at ${head.sha}. Publish a fresh review with feedback on this PR.`);
    }
    core.info(`Maintainer verification passed for PR #${number} at ${head.sha}. Feedback: ${review.url}`);
    return;
  }
  throw new Error(`Awaiting maintainer verification for PR #${number} at ${head.sha}. Contributors do not need private credentials.`);
};
