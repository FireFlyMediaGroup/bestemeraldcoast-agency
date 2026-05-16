# Copy Quality Rubric (ADR-034)

Canonical scoring rubric for all agent-produced copy. Used by **Checker** to
gate outreach, by **Editor** for article self-check, and by **Diagnoser** to
self-score the diagnosis text before writing it back. This file is the single
source of truth — agents reference it, they do not re-implement it.

Six dimensions, each scored **0–2**.

| Dimension | 0 (fail) | 1 (passable) | 2 (good) |
|---|---|---|---|
| **Specificity** | Generic, swappable to any business | One specific local detail | Two+ specific, verified details |
| **Length discipline** | 100+ words (outreach) / 1500+ words (article without need) | Within target | Tight, every sentence earns its place |
| **Voice match** | Reads like a brochure or LinkedIn post | Mostly natural | Sounds like a person from the corridor |
| **AI markers** | Contains banned words (see `banned-phrases.md`) | One slip | Zero banned words, no formulaic openers |
| **Local accuracy** | Wrong city/landmark/detail | All details correct, none unique | Correct + an inside-baseball detail |
| **CTA clarity** | None or ambiguous | Clear but generic | Clear, low-friction, time-bound |

## Pass threshold

- **Total ≥ 9/12 with no `0` in any dimension.**
- **Outreach must additionally pass:** under **70 words**, **zero** in the AI-markers
  dimension (no banned words at all), and at least **one** local-specific reference.

## Notes

- The banned-phrase list lives in `banned-phrases.md` (sibling file) and is a
  living document — the operator extends it as new LLM tics surface.
- Some legitimate prose may be false-positive blocked; ops-console has a manual
  override. Agents must not loosen the rubric to pass — they revise the copy.
- "A person from the corridor" = the Emerald Coast / Gulf Coast voice: plain,
  specific, unhurried, never corporate.
