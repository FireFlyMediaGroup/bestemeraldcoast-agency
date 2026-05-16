// Auth.js v5 route handlers. The `handlers` export from `auth.ts` provides
// both GET and POST for the entire /api/auth/* surface (sign-in, callback,
// magic-link verification, sign-out, session).

import { handlers } from "@/auth";

export const { GET, POST } = handlers;
