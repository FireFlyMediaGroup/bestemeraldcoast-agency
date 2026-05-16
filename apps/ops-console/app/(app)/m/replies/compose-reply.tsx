"use client";

// Compose action that opens a modal bottom sheet (Apple HIG — master plan
// Commit 1.7: "modal sheets for compose"). The send path is a later-commit
// concern; this wires the HIG-mandated sheet pattern with a disabled draft
// form so the interaction is real and reviewable now.

import { useState } from "react";

import { Button } from "@bec/ui";

import { Sheet } from "../_components/sheet";

export function ComposeReply() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="primary"
        size="md"
        className="min-h-[44px] w-full"
        onClick={() => setOpen(true)}
      >
        Compose reply
      </Button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Compose reply">
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => e.preventDefault()}
        >
          <textarea
            rows={5}
            disabled
            placeholder="Reply composition is wired in a later Phase 1 commit."
            className="w-full resize-none rounded-(--radius-md) border border-border bg-muted px-3 py-2 text-sm text-muted-fg"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled
            className="min-h-[44px] w-full"
          >
            Send
          </Button>
        </form>
      </Sheet>
    </>
  );
}
