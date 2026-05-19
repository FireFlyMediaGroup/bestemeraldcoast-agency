"use client";

// Editorial composer (Commit 2.7) — markdown editor + live preview, business
// linker, image picker with the ADR-022 required-alt-text gate, category /
// sponsored controls, and the ADR-020 split publish button. HIG: single
// primary action, generous targets, works desktop + mobile (stacked grid).

import { useMemo, useState, useTransition } from "react";

import { renderMarkdown } from "@/lib/markdown";
import type { ArticleForEdit } from "@/lib/articles-data";

import {
  publishArticleAction,
  saveArticle,
  type ActionResult,
} from "./actions";

const ERR: Record<string, string> = {
  unauthorized: "Your session expired — sign in again.",
  invalid_id: "Invalid article id.",
  title_required: "A title is required.",
  body_required: "The body can't be empty.",
  hero_image_missing_alt:
    "The hero image has no alt text — pick an image with alt (ADR-022).",
  not_found: "Article not found.",
  not_publishable: "Already published (or not in a publishable state).",
};

export function Composer({ article }: { article: ArticleForEdit }) {
  const [title, setTitle] = useState(article.title);
  const [subtitle, setSubtitle] = useState(article.subtitle ?? "");
  const [bodyMdx, setBodyMdx] = useState(article.bodyMdx);
  const [categoryId, setCategoryId] = useState(article.categoryId ?? "");
  const [isSponsored, setIsSponsored] = useState(article.isSponsored);
  const [heroImageId, setHeroImageId] = useState(article.heroImageId ?? "");
  const [linked, setLinked] = useState<string[]>(
    article.businesses.filter((b) => b.linked).map((b) => b.id),
  );
  const [bizQuery, setBizQuery] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const [published, setPublished] = useState(
    article.status === "published",
  );
  const preview = useMemo(() => renderMarkdown(bodyMdx), [bodyMdx]);
  const byId = useMemo(
    () => new Map(article.businesses.map((b) => [b.id, b])),
    [article.businesses],
  );
  const available = article.businesses.filter(
    (b) =>
      !linked.includes(b.id) &&
      b.name.toLowerCase().includes(bizQuery.trim().toLowerCase()),
  );

  function patch() {
    return {
      title,
      subtitle: subtitle.trim() ? subtitle : null,
      bodyMdx,
      categoryId: categoryId || null,
      isSponsored,
      heroImageId: heroImageId || null,
      businesses: linked.map((id, i) => ({ id, rank: i + 1 })),
    };
  }
  function handle(p: Promise<ActionResult>, isPublish = false) {
    setMsg(null);
    start(async () => {
      const r = await p;
      if (r.ok) {
        setMsg(isPublish ? "Published." : "Saved.");
        if (isPublish) setPublished(true); // flip to read-only immediately
      } else {
        setMsg(ERR[r.error] ?? r.error);
      }
    });
  }

  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-2">
      {/* ---- Editor column ---- */}
      <div className="flex flex-col gap-4">
        <label className="block">
          <span className="text-sm font-medium">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-(--radius-sm) border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Subtitle</span>
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="mt-1 w-full rounded-(--radius-sm) border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Body (Markdown)</span>
          <textarea
            value={bodyMdx}
            onChange={(e) => setBodyMdx(e.target.value)}
            rows={18}
            className="mt-1 w-full rounded-(--radius-sm) border border-border bg-background px-3 py-2 font-mono text-sm"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Category</span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 w-full rounded-(--radius-sm) border border-border bg-background px-3 py-2"
            >
              <option value="">— none —</option>
              {article.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-6 inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSponsored}
              onChange={(e) => setIsSponsored(e.target.checked)}
            />
            <span className="text-sm font-medium">Sponsored (ADR-015)</span>
          </label>
        </div>

        {/* Image picker — ADR-022: an image with no alt is not selectable. */}
        <fieldset className="rounded-(--radius-sm) border border-border p-3">
          <legend className="px-1 text-sm font-medium">Hero image</legend>
          <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
            {article.images.map((img) => {
              const noAlt = img.altText.trim().length === 0;
              const sel = heroImageId === img.id;
              return (
                <button
                  key={img.id}
                  type="button"
                  disabled={noAlt}
                  onClick={() => setHeroImageId(sel ? "" : img.id)}
                  title={noAlt ? "No alt text — cannot select (ADR-022)" : img.altText}
                  className={`rounded-(--radius-sm) border p-1 text-left text-xs ${
                    sel
                      ? "border-primary ring-1 ring-primary"
                      : "border-border"
                  } ${noAlt ? "cursor-not-allowed opacity-40" : ""}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- ops-console internal preview thumbnail */}
                  <img
                    src={img.blobUrl}
                    alt={img.altText}
                    className="mb-1 h-16 w-full object-cover"
                  />
                  <span className="line-clamp-2 text-muted-fg">
                    {noAlt ? "⚠ no alt text" : img.altText}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Business linker */}
        <fieldset className="rounded-(--radius-sm) border border-border p-3">
          <legend className="px-1 text-sm font-medium">
            Featured businesses (order = rank)
          </legend>
          <ol className="mb-2 list-decimal pl-5 text-sm">
            {linked.map((id, i) => (
              <li key={id} className="flex items-center justify-between gap-2">
                <span>{byId.get(id)?.name ?? id}</span>
                <span className="flex gap-1">
                  <button
                    type="button"
                    aria-label="Move up"
                    disabled={i === 0}
                    onClick={() =>
                      setLinked((l) => {
                        const n = [...l];
                        [n[i - 1], n[i]] = [n[i]!, n[i - 1]!];
                        return n;
                      })
                    }
                    className="px-2 disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() =>
                      setLinked((l) => l.filter((x) => x !== id))
                    }
                    className="px-2 text-danger"
                  >
                    ✕
                  </button>
                </span>
              </li>
            ))}
            {linked.length === 0 ? (
              <li className="list-none text-muted-fg">None linked.</li>
            ) : null}
          </ol>
          <input
            value={bizQuery}
            onChange={(e) => setBizQuery(e.target.value)}
            placeholder="Search this site's businesses…"
            className="w-full rounded-(--radius-sm) border border-border bg-background px-3 py-1.5 text-sm"
          />
          {bizQuery.trim() ? (
            <ul className="mt-2 max-h-40 overflow-y-auto text-sm">
              {available.slice(0, 20).map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setLinked((l) => [...l, b.id]);
                      setBizQuery("");
                    }}
                    className="w-full px-2 py-1 text-left hover:bg-muted/50"
                  >
                    + {b.name}
                    {b.city ? (
                      <span className="text-muted-fg"> · {b.city}</span>
                    ) : null}
                  </button>
                </li>
              ))}
              {available.length === 0 ? (
                <li className="px-2 py-1 text-muted-fg">No match.</li>
              ) : null}
            </ul>
          ) : null}
        </fieldset>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={pending || published}
            onClick={() => handle(saveArticle(article.id, patch()))}
            className="min-h-[44px] rounded-(--radius-sm) border border-border px-4 disabled:opacity-50"
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={pending || published}
            onClick={() =>
              handle(publishArticleAction(article.id, bodyMdx), true)
            }
            className="min-h-[44px] rounded-(--radius-sm) bg-primary px-4 text-primary-fg disabled:opacity-50"
          >
            Publish
          </button>
          <button
            type="button"
            disabled={pending || published}
            onClick={() => setNoteOpen((v) => !v)}
            className="min-h-[44px] rounded-(--radius-sm) border border-primary px-4 text-primary disabled:opacity-50"
          >
            Publish + Note feedback
          </button>
          {msg ? (
            <span
              role="status"
              className={
                msg === "Saved." || msg === "Published."
                  ? "text-success"
                  : "text-danger"
              }
            >
              {msg}
            </span>
          ) : null}
          {published ? (
            <span className="text-success">Published — read-only.</span>
          ) : null}
        </div>
        {noteOpen && !published ? (
          <div className="rounded-(--radius-sm) border border-primary p-3">
            <label className="block text-sm font-medium">
              What did you change vs the Editor draft? (ADR-020)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-(--radius-sm) border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                handle(
                  publishArticleAction(article.id, bodyMdx, note),
                  true,
                )
              }
              className="mt-2 min-h-[44px] rounded-(--radius-sm) bg-primary px-4 text-primary-fg disabled:opacity-50"
            >
              Publish with note
            </button>
          </div>
        ) : null}
      </div>

      {/* ---- Live preview column ---- */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className="text-sm font-medium text-muted-fg">Live preview</p>
        <article className="mt-1 rounded-(--radius-sm) border border-border p-4">
          <h2 className="font-heading text-2xl font-bold">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-muted-fg">{subtitle}</p>
          ) : null}
          <div className="mt-3">{preview}</div>
        </article>
      </div>
    </div>
  );
}
