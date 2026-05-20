// Zero-dependency markdown renderer for editorial's reader-side legal
// pages (Commit 2.10). Mirrors the operator-chosen renderer in
// apps/ops-console/lib/markdown.tsx (Commit 2.7) — same subset (# ## ###
// headings, blank-line paragraphs, - / * bullets, 1. ordered lists, ```
// fenced code, simple |…| GFM tables, inline **bold** *italic* `code`
// [text](url)) and the same `safeHref` scheme allowlist (untrusted MDX
// content must not be able to inject `javascript:` / `data:` links).
//
// Output is React elements (never `dangerouslySetInnerHTML`) so all text
// is auto-escaped — no XSS surface. Visual styling lives in
// `app/globals.css` under `.legal-prose` (uses `--bec-*` tokens so legal
// pages match the resolved site's archetype).
//
// Editorial keeps its own copy rather than depending on @bec/ops-console
// (different security boundaries: ops-console is operator-only, editorial
// is public). A future shared-package extraction can dedupe; for now the
// drift cost is low and the duplication keeps each app's lib self-
// contained.

import { Fragment, type ReactNode } from "react";

const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

/**
 * Allowlist link schemes — untrusted markdown could carry `javascript:`
 * or `data:` URLs. Permits http(s), mailto, and site-relative (/, #);
 * everything else falls through to plain text (label rendered verbatim).
 */
function safeHref(raw: string): string | null {
  const v = raw.trim();
  if (v.startsWith("/") || v.startsWith("#")) return v;
  try {
    const u = new URL(v);
    return ["http:", "https:", "mailto:"].includes(u.protocol) ? v : null;
  } catch {
    return null;
  }
}

function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const parts = text.split(INLINE);
  parts.forEach((p, i) => {
    if (!p) return;
    if (p.startsWith("**") && p.endsWith("**")) {
      out.push(<strong key={i}>{p.slice(2, -2)}</strong>);
    } else if (p.startsWith("*") && p.endsWith("*")) {
      out.push(<em key={i}>{p.slice(1, -1)}</em>);
    } else if (p.startsWith("`") && p.endsWith("`")) {
      out.push(<code key={i}>{p.slice(1, -1)}</code>);
    } else {
      const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(p);
      const label = m?.[1];
      const href = m?.[2] ? safeHref(m[2]) : null;
      if (label && href) {
        out.push(
          <a key={i} href={href} rel="noreferrer">
            {label}
          </a>,
        );
      } else {
        out.push(<Fragment key={i}>{p}</Fragment>);
      }
    }
  });
  return out;
}

/** Render one GFM-style pipe table from its source lines. */
function renderTable(lines: string[], key: number): ReactNode {
  const cells = (row: string): string[] => {
    const trimmed = row.trim().replace(/^\|/, "").replace(/\|$/, "");
    return trimmed.split("|").map((c) => c.trim());
  };
  const headerRow = lines[0] ?? "";
  const bodyRows = lines.slice(2); // skip the separator row
  return (
    <table key={key}>
      <thead>
        <tr>
          {cells(headerRow).map((c, i) => (
            <th key={i}>{renderInline(c)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {bodyRows.map((row, r) => (
          <tr key={r}>
            {cells(row).map((c, i) => (
              <td key={i}>{renderInline(c)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function renderMarkdown(src: string): ReactNode {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let para: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let code: string[] | null = null;
  let table: string[] | null = null;
  let key = 0;

  const flushPara = () => {
    if (para.length) {
      blocks.push(<p key={key++}>{renderInline(para.join(" "))}</p>);
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      const items = list.items.map((it, i) => (
        <li key={i}>{renderInline(it)}</li>
      ));
      blocks.push(
        list.ordered ? (
          <ol key={key++}>{items}</ol>
        ) : (
          <ul key={key++}>{items}</ul>
        ),
      );
      list = null;
    }
  };
  const flushTable = () => {
    if (table) {
      blocks.push(renderTable(table, key++));
      table = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line.startsWith("```")) {
      if (code) {
        blocks.push(
          <pre key={key++}>
            <code>{code.join("\n")}</code>
          </pre>,
        );
        code = null;
      } else {
        flushPara();
        flushList();
        flushTable();
        code = [];
      }
      continue;
    }
    if (code) {
      code.push(raw);
      continue;
    }

    // GFM pipe-table detection: a row starting with `|`, followed (eventually)
    // by a separator row of dashes — we keep accumulating consecutive rows
    // and flush when a non-table line appears.
    if (line.startsWith("|")) {
      flushPara();
      flushList();
      if (!table) table = [];
      table.push(line);
      continue;
    } else if (table) {
      flushTable();
    }

    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      flushPara();
      flushList();
      const level = (h[1] ?? "#").length;
      const content = renderInline(h[2] ?? "");
      blocks.push(
        level === 1 ? (
          <h1 key={key++}>{content}</h1>
        ) : level === 2 ? (
          <h2 key={key++}>{content}</h2>
        ) : (
          <h3 key={key++}>{content}</h3>
        ),
      );
      continue;
    }

    const ul = /^[-*]\s+(.*)$/.exec(line);
    const ol = /^\d+\.\s+(.*)$/.exec(line);
    if (ul || ol) {
      flushPara();
      const ordered = Boolean(ol);
      const item = (ul ? ul[1] : ol![1]) ?? "";
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push(item);
      continue;
    }

    if (line.trim() === "") {
      flushPara();
      flushList();
      continue;
    }
    para.push(line);
  }
  flushPara();
  flushList();
  flushTable();
  if (code) {
    blocks.push(
      <pre key={key++}>
        <code>{code.join("\n")}</code>
      </pre>,
    );
  }
  return <>{blocks}</>;
}
