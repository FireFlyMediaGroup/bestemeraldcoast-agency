import { Placeholder } from "../_components/placeholder";

import { ComposeReply } from "./compose-reply";

export const dynamic = "force-dynamic";

export default function MobileReplies() {
  return (
    <Placeholder
      title="Replies"
      blurb="Inbound reply triage lands in a later Phase 1 commit."
    >
      <ComposeReply />
    </Placeholder>
  );
}
