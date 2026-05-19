"use server";

// Editorial composer server actions (Commit 2.7). Authenticated OPERATOR
// surface (NextAuth session, not the agent key). Save = draft edit; Publish =
// the atomic status→published + ADR-020 feedback write (lib/article-
// transitions.ts). ADR-022: a hero image may not be set without alt text —
// enforced here on BOTH save and publish (the "required alt-text gate").

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { publishArticle } from "@/lib/article-transitions";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ActionResult = { ok: true } | { ok: false; error: string };

export interface ArticlePatch {
  title: string;
  subtitle: string | null;
  bodyMdx: string;
  categoryId: string | null;
  isSponsored: boolean;
  heroImageId: string | null;
  businesses: { id: string; rank: number }[];
}

/** ADR-022 gate: a set hero image must have non-empty alt text. */
async function heroAltOk(
  db: import("@bec/db").Database,
  heroImageId: string | null,
): Promise<boolean> {
  if (!heroImageId) return true;
  const { schema, eq } = await import("@bec/db");
  const [img] = await db
    .select({ altText: schema.images.altText })
    .from(schema.images)
    .where(eq(schema.images.id, heroImageId));
  return Boolean(img && img.altText.trim().length > 0);
}

export async function saveArticle(
  id: string,
  patch: ArticlePatch,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.email) return { ok: false, error: "unauthorized" };
  if (!UUID.test(id)) return { ok: false, error: "invalid_id" };
  if (!patch.title.trim()) return { ok: false, error: "title_required" };
  if (!patch.bodyMdx.trim()) return { ok: false, error: "body_required" };

  const { getDb, schema, eq } = await import("@bec/db");
  const db = getDb();

  if (!(await heroAltOk(db, patch.heroImageId))) {
    return { ok: false, error: "hero_image_missing_alt" };
  }

  // A UUID-valid but absent id must not silently "succeed".
  const updated = await db
    .update(schema.articles)
    .set({
      title: patch.title,
      subtitle: patch.subtitle,
      bodyMdx: patch.bodyMdx,
      categoryId: patch.categoryId,
      isSponsored: patch.isSponsored,
      heroImageId: patch.heroImageId,
      updatedAt: new Date(),
    })
    .where(eq(schema.articles.id, id))
    .returning({ id: schema.articles.id });
  if (updated.length === 0) return { ok: false, error: "not_found" };

  // Replace the article↔business links (draft edit — low stakes; the
  // publish path is the atomic one). Delete-then-insert the provided set.
  await db
    .delete(schema.articleBusinesses)
    .where(eq(schema.articleBusinesses.articleId, id));
  if (patch.businesses.length) {
    await db.insert(schema.articleBusinesses).values(
      patch.businesses.map((b) => ({
        articleId: id,
        businessId: b.id,
        rank: b.rank,
      })),
    );
  }

  revalidatePath(`/editorial/${id}`);
  revalidatePath("/editorial");
  return { ok: true };
}

export async function publishArticleAction(
  id: string,
  finalBodyMdx: string,
  editsSummary?: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.email) return { ok: false, error: "unauthorized" };
  if (!UUID.test(id)) return { ok: false, error: "invalid_id" };
  if (!finalBodyMdx.trim()) return { ok: false, error: "body_required" };

  const { getDb, schema, eq } = await import("@bec/db");
  const db = getDb();

  // ADR-022 gate also applies at publish (the article may carry a hero set
  // by another path / earlier save).
  const [art] = await db
    .select({ heroImageId: schema.articles.heroImageId })
    .from(schema.articles)
    .where(eq(schema.articles.id, id));
  if (!art) return { ok: false, error: "not_found" };
  if (!(await heroAltOk(db, art.heroImageId))) {
    return { ok: false, error: "hero_image_missing_alt" };
  }

  const { published } = await publishArticle({
    db,
    id,
    finalBodyMdx,
    editsSummary: editsSummary?.trim() ? editsSummary.trim() : null,
  });
  if (!published) {
    // 0 rows moved → already published or not in a publishable state.
    return { ok: false, error: "not_publishable" };
  }

  revalidatePath(`/editorial/${id}`);
  revalidatePath("/editorial");
  return { ok: true };
}
