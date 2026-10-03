# Domain docs

How the engineering skills consume this repository's domain documentation.

## Before exploring

Read these when they exist:

- `CONTEXT.md` at the repository root.
- `docs/adr/` entries relevant to the area being changed.

If either is absent, proceed silently. Do not propose creating it upfront;
`/domain-modeling` creates domain documentation when terminology or decisions
are actually resolved.

## Layout

This is a single-context repository:

```text
/
├── CONTEXT.md
├── docs/adr/
└── src/
```

## Vocabulary

Use terminology defined in `CONTEXT.md` in issue titles, tests, specifications,
and implementation notes. If a needed concept is missing, reconsider whether
the term belongs to this domain or note the gap for `/domain-modeling`.

## ADR conflicts

If proposed work contradicts an existing ADR, surface the conflict explicitly
instead of silently overriding the decision.
