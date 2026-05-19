// Zero-dependency markdown renderer for the composer's LIVE PREVIEW only
// (Commit 2.7 — operator-chosen: no react-markdown dep). Supports the subset
// the Editor writes: # ## ### headings, blank-line paragraphs, - / * bullet
// lists, 1. ordered lists, ``` fenced code, and inline **bold** *italic*
// `code` [text](url). Output is React elements (never
// dangerouslySetInnerHTML) so all text is auto-escaped — no injection
// surface. The authoritative publish-grade render is the editorial app's job
// (Commit 2.3); this just has to be faithful enough to edit against.

import { Fragment, type ReactNode } from "react";

const INLINE =
  /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

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
      out.push(
        <code
          key={i}
          className="rounded-(--radius-sm) bg-muted px-1 py-0.5 text-sm"
        >
          {p.slice(1, -1)}
        </code>,
      );
    } else {
      const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(p);
      const label = m?.[1];
      const url = m?.[2];
      if (label && url) {
        out.push(
          <a
            key={i}
            href={url}
            className="text-primary underline"
            rel="noreferrer"
          >
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

export function renderMarkdown(src: string): ReactNode {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let para: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let code: string[] | null = null;
  let key = 0;

  const flushPara = () => {
    if (para.length) {
      blocks.push(
        <p key={key++} className="my-3 leading-relaxed">
          {renderInline(para.join(" "))}
        </p>,
      );
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
          <ol key={key++} className="my-3 list-decimal pl-6">
            {items}
          </ol>
        ) : (
          <ul key={key++} className="my-3 list-disc pl-6">
            {items}
          </ul>
        ),
      );
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line.startsWith("```")) {
      if (code) {
        blocks.push(
          <pre
            key={key++}
            className="my-3 overflow-x-auto rounded-(--radius-sm) bg-muted p-3 text-sm"
          >
            <code>{code.join("\n")}</code>
          </pre>,
        );
        code = null;
      } else {
        flushPara();
        flushList();
        code = [];
      }
      continue;
    }
    if (code) {
      code.push(raw);
      continue;
    }

    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      flushPara();
      flushList();
      const level = (h[1] ?? "#").length;
      const cls =
        level === 1
          ? "mt-6 mb-2 text-2xl font-bold"
          : level === 2
            ? "mt-5 mb-2 text-xl font-semibold"
            : "mt-4 mb-1 text-lg font-semibold";
      const content = renderInline(h[2] ?? "");
      blocks.push(
        level === 1 ? (
          <h1 key={key++} className={cls}>
            {content}
          </h1>
        ) : level === 2 ? (
          <h2 key={key++} className={cls}>
            {content}
          </h2>
        ) : (
          <h3 key={key++} className={cls}>
            {content}
          </h3>
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
  if (code) {
    blocks.push(
      <pre
        key={key++}
        className="my-3 overflow-x-auto rounded-(--radius-sm) bg-muted p-3 text-sm"
      >
        <code>{code.join("\n")}</code>
      </pre>,
    );
  }
  return <div className="prose-preview">{blocks}</div>;
}
