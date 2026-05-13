# /ralph-next

Advance the Ralph loop by one step.

## Behavior
- Inspect current task status.
- Determine the next unfinished task in the master plan.
- Check whether ADR changes are required.
- Output the next file or action to work on.
- If the task is complete, move to the next task; otherwise continue the current task.

## Response Format
- Current step.
- Next step.
- Required files.
- Required validation.
- Any handoff notes.
