# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues. Use the `gh` CLI for all
operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a
  heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`, filtering comments
  by `jq` and also fetching labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`
  with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`.
- **Apply or remove labels**: `gh issue edit <number> --add-label "..."` or
  `--remove-label "..."`.
- **Close**: `gh issue close <number> --comment "..."`.

Infer the repo from `git remote -v`; `gh` does this automatically inside the
clone.

## Pull requests as a triage surface

**PRs as a request surface: no.** Set this to `yes` if external pull requests
should enter the triage queue.

When enabled, use the `gh pr` equivalents. List external pull requests with
`gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments`,
then keep only `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE` author
associations. GitHub shares one number space across issues and pull requests;
resolve a bare `#42` with `gh pr view 42`, then fall back to
`gh issue view 42`.

## Skill operations

- When a skill says **publish to the issue tracker**, create a GitHub issue.
- When a skill says **fetch the relevant ticket**, run
  `gh issue view <number> --comments`.

## Wayfinding operations

Used by `/wayfinder`. A map is one issue with child issues as tickets.

- **Map**: an issue labelled `wayfinder:map`, holding Notes,
  Decisions-so-far, and Fog. Create it with
  `gh issue create --label wayfinder:map`.
- **Child ticket**: link an issue as a GitHub sub-issue through `gh api`. If
  sub-issues are unavailable, add it to a task list in the map body and put
  `Part of #<map>` at the top of the child body. Label it
  `wayfinder:<type>` where type is `research`, `prototype`, `grilling`, or
  `task`.
- **Blocking**: use GitHub's native issue dependencies. Add an edge with
  `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`,
  where the database ID comes from
  `gh api repos/<owner>/<repo>/issues/<n> --jq .id`. If dependencies are
  unavailable, use a `Blocked by: #<n>` line in the child body.
- **Frontier query**: list the map's open children, then drop assigned tickets
  and tickets with open blockers. First in map order wins.
- **Claim**: `gh issue edit <n> --add-assignee @me`; this is the session's first
  write.
- **Resolve**: comment with the answer, close the child, then append its
  context pointer and link to the map's Decisions-so-far.
