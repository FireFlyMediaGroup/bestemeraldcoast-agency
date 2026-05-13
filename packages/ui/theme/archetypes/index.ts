import type { Archetype, SiteTheme } from "../tokens.js";

import { coastal } from "./coastal.js";
import { magazine } from "./magazine.js";
import { premium } from "./premium.js";

export { coastal, magazine, premium };

export const archetypes: Record<Archetype, SiteTheme> = {
  magazine,
  coastal,
  premium,
};

export const ARCHETYPE_LIST: Archetype[] = ["magazine", "coastal", "premium"];
