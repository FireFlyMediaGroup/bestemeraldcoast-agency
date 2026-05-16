# Banned Phrases (ADR-034)

Living list of phrases and tics that read as algorithmic. Any occurrence is a
**0** in the "AI markers" dimension of `copy-quality.md`. For outreach, a 0 in
AI markers is an automatic fail (no banned words allowed at all). The operator
extends this list whenever a new tic surfaces — keep it append-friendly.

## Banned openers (outreach)

- "I noticed your website..."
- "I came across your business..."
- "Hope this email finds you well..."
- "I wanted to reach out..."
- **Em-dash openers** — starting a sentence/message with an em-dash clause is a
  known LLM tic.
- Any formulaic "My name is X and I…" salesperson preamble.

## Banned words / phrases (all copy)

- streamline
- leverage
- unlock
- synergy
- robust
- harness
- delve
- navigate the complexities
- "in today's [adjective] world"
- "it's worth noting"
- "in conclusion"

## Editorial-specific addenda

- No "five reasons why" tropes unless it is genuinely a listicle.
- No "in this article we'll explore" meta-narration.
- No "stay tuned" or "what are your thoughts?" engagement-bait closers.

## How agents use this

Diagnoser / Editor self-check and Checker scan the produced copy against this
file before the AI-markers score is assigned. A match is not "rephrase one
word" — it signals the copy is drifting into brochure voice; revise the
sentence, then re-score.
