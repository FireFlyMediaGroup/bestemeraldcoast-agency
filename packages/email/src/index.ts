// @bec/email public surface. ops-console imports this dynamically from the
// agent send route (build-inert, like @bec/db / @bec/logger).

export { OutreachEmail, outreachSubject } from "./templates/outreach.js";
export { renderOutreachEmail } from "./render.js";
export { sendOutreachEmail, OutreachSendError } from "./send.js";
export type {
  OutreachArchetype,
  OutreachEmailProps,
  SendOutreachInput,
} from "./types.js";
