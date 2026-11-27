// ========================================================
// SHARED KATEX MATH & MARKDOWN RENDERER (AI CHAT, POMODORO, ADVISOR, NOTES)
// ========================================================

const TOKEN_START = "\uE000";
const TOKEN_END = "\uE001";
const KATEX_CACHE = new Map();
const MAX_CACHE_ENTRIES = 500;

export function escHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeLatexSource(raw) {
  let s = String(raw ?? "").trim();
  if (!s) return "";

  // Convert literal unicode math symbols occasionally generated inside LaTeX blocks
  // into valid TeX commands so KaTeX renders them uniformly.
  s = s
    .replace(/⇒/g, "\\Rightarrow ")
    .replace(/⇔/g, "\\Leftrightarrow ")
    .replace(/→/g, "\\to ")
    .replace(/←/g, "\\leftarrow ")
    .replace(/≤/g, "\\le ")
    .replace(/≥/g, "\\ge ")
    .replace(/≠/g, "\\ne ")
    .replace(/≈/g, "\\approx ")
    .replace(/±/g, "\\pm ")
    .replace(/∞/g, "\\infty ")
    .replace(/∈/g, "\\in ")
    .replace(/∉/g, "\\notin ")
    .replace(/∪/g, "\\cup ")
    .replace(/∩/g, "\\cap ")
    .replace(/∅/g, "\\emptyset ")
    .replace(/∀/g, "\\forall ")
    .replace(/∃/g, "\\exists ")
    .replace(/∂/g, "\\partial ");

  return s;
}

/**
 * Fallback lightweight formatter when KaTeX is not loaded (e.g. headless Node tests).
 */
export function fallbackRenderMathFormula(latex) {
  if (!latex) return "";
  let s = escHtml(String(latex).trim());

  s = s.replace(/\\left\s*([(\[{|])/g, "$1").replace(/\\right\s*([)\]}|])/g, "$1");

  let prev;
  do {
    prev = s;
    s = s.replace(/\\(?:frac|dfrac|tfrac)\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, (_, num, den) => {
      return `<span class="math-frac"><span class="frac-num">${num}</span><span class="frac-den">${den}</span></span>`;
    });
  } while (s !== prev);

  s = s
    .replace(/\\partial/g, "∂")
    .replace(/\\lim_\s*\{([^{}]+)\}/g, "lim<sub>$1</sub>")
    .replace(/\\lim\b/g, "lim")
    .replace(/\\Rightarrow\b/g, " ⇒ ")
    .replace(/\\Leftrightarrow\b/g, " ⇔ ")
    .replace(/\\(to|rightarrow)\b/g, " → ")
    .replace(/\\leftarrow\b/g, " ← ")
    .replace(/\\infty\b/g, "∞")
    .replace(/\\(ne|neq)\b/g, " ≠ ")
    .replace(/\\(le|leq)\b/g, " ≤ ")
    .replace(/\\(ge|geq)\b/g, " ≥ ")
    .replace(/\\in\b/g, " ∈ ")
    .replace(/\\notin\b/g, " ∉ ")
    .replace(/\\pm\b/g, " ± ")
    .replace(/\\times\b/g, " × ")
    .replace(/\\cdot\b/g, " · ")
    .replace(/\\approx\b/g, " ≈ ")
    .replace(/\\iiint\b/g, " ∭ ")
    .replace(/\\iint\b/g, " ∬ ")
    .replace(/\\int\b/g, " ∫ ")
    .replace(/\\sum\b/g, " ∑ ")
    .replace(/\\prod\b/g, " ∏ ")
    .replace(/\\sqrt\s*\{([^{}]+)\}/g, '√<span style="text-decoration:overline;">$1</span>')
    .replace(/\\(alpha|beta|gamma|delta|Delta|theta|lambda|pi|sigma|omega|mu)\b/g, (_, g) => ({
      alpha: "α", beta: "β", gamma: "γ", delta: "δ", Delta: "Δ",
      theta: "θ", lambda: "λ", pi: "π", sigma: "σ", omega: "ω", mu: "μ"
    }[g] || g))
    .replace(/\\(sin|cos|tan|cot|ln|log|exp|max|min)\b/g, "$1")
    .replace(/\\,/g, " ")
    .replace(/\\([{}])/g, "$1")
    .replace(/\^\s*\{([^{}]+)\}/g, "<sup>$1</sup>")
    .replace(/\^([0-9a-zA-Z+-]+)/g, "<sup>$1</sup>")
    .replace(/_\s*\{([^{}]+)\}/g, "<sub>$1</sub>")
    .replace(/_([0-9a-zA-Z+-]+)/g, "<sub>$1</sub>");

  return s;
}

export function renderLatex(latex, displayMode = false) {
  const normalized = normalizeLatexSource(latex);
  if (!normalized) return "";

  const katexLib = typeof globalThis !== "undefined" ? globalThis.katex : null;
  const cacheKey = `${katexLib ? "K" : "F"}:${displayMode ? "B" : "I"}:${normalized}`;
  if (KATEX_CACHE.has(cacheKey)) {
    return KATEX_CACHE.get(cacheKey);
  }

  let rendered = "";
  if (katexLib && typeof katexLib.renderToString === "function") {
    try {
      rendered = katexLib.renderToString(normalized, {
        displayMode: Boolean(displayMode),
        throwOnError: false,
        strict: false,
        trust: false
      });
    } catch {
      rendered = fallbackRenderMathFormula(normalized);
    }
  } else {
    rendered = fallbackRenderMathFormula(normalized);
  }

  if (KATEX_CACHE.size >= MAX_CACHE_ENTRIES) {
    const firstKey = KATEX_CACHE.keys().next().value;
    if (firstKey !== undefined) KATEX_CACHE.delete(firstKey);
  }
  KATEX_CACHE.set(cacheKey, rendered);
  return rendered;
}

function looksLikeCurrencySpan(inner) {
  const trimmed = inner.trim();
  if (!trimmed) return true;
  // Pure currency like "$50 và $100" or "$50 - $100": starts with a number followed by text/dash and trailing space, no TeX commands or math ops
  if (/^\d+(?:[.,]\d+)?(?:\s+[a-zA-ZÀ-ỹ\-]+|\s*[-–]\s*)\s*$/.test(inner) && !/[\\=^_*/<>|{}]/.test(inner)) {
    return true;
  }
  // Reject "$50 và " when matched across two prices
  if (/^\d+(?:[.,]\d+)?\s+/.test(inner) && /\s$/.test(inner) && !/[\\=^_*/<>|{}]/.test(inner)) {
    return true;
  }
  return false;
}

function looksLikeBareLatex(candidate) {
  const s = candidate.trim();
  if (!s) return false;
  return /\\(?:frac|dfrac|tfrac|sqrt|iiint|iint|int|sum|prod|lim|partial|infty|Rightarrow|Leftrightarrow|rightarrow|leftarrow|to|le|leq|ge|geq|ne|neq|approx|pm|times|cdot|in|notin|subset|cup|cap|vec|bar|hat|overline|begin)\b/.test(s);
}

const VARIANT_CLASSES = {
  chat: {
    strong: "chat-strong",
    mathBlock: "ai-math-block",
    mathInline: "ai-math-inline",
    inlineCode: "chat-inline-code",
    codeBlock: "chat-code-block",
    hr: "chat-hr",
    heading: "chat-heading",
    stepBlock: "chat-step-block",
    callout: "chat-callout",
    listRow: "chat-list-row",
    listNum: "chat-list-num",
    listBody: "chat-list-content",
    bulletRow: "chat-bullet-row",
    bulletDot: "chat-bullet-dot",
    para: "chat-para",
    tableWrap: "advisor-table-wrap",
    table: "advisor-markdown-table"
  },
  pomo: {
    strong: "pomo-ai-strong",
    mathBlock: "pomo-math-block",
    mathInline: "pomo-math-inline",
    inlineCode: "pomo-ai-code",
    codeBlock: "chat-code-block",
    hr: "chat-hr",
    heading: "chat-heading",
    stepBlock: "pomo-ai-step-block",
    callout: "pomo-ai-callout",
    listRow: "pomo-ai-list-row",
    listNum: "pomo-ai-list-num",
    listBody: "pomo-ai-list-body",
    bulletList: "pomo-ai-bullet-list",
    para: "pomo-ai-para",
    tableWrap: "advisor-table-wrap",
    table: "advisor-markdown-table"
  },
  advisor: {
    strong: "chat-strong",
    mathBlock: "ai-math-block",
    mathInline: "ai-math-inline",
    inlineCode: "chat-inline-code",
    codeBlock: "chat-code-block",
    hr: "chat-hr",
    heading: "advisor-h",
    stepBlock: "chat-step-block",
    callout: "advisor-callout",
    listRow: "advisor-list-item",
    listNum: "advisor-num",
    listBody: "advisor-list-body",
    bulletRow: "advisor-bullet-item",
    bulletDot: "advisor-bullet",
    bulletGlyph: "💡",
    para: "advisor-p",
    tableWrap: "advisor-table-wrap",
    table: "advisor-markdown-table"
  }
};

function tokenizeText(raw, cls) {
  const tokens = [];
  const pushToken = (html) => {
    const id = tokens.length;
    tokens.push(html);
    return `${TOKEN_START}${id}${TOKEN_END}`;
  };

  let text = String(raw ?? "").replace(/\r\n/g, "\n");

  // 1. Protect fenced code blocks ```lang\n...\n```
  text = text.replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const langTag = lang ? `<div class="chat-code-lang">${escHtml(lang)}</div>` : "";
    const tok = pushToken(`<pre class="${cls.codeBlock}">${langTag}<code>${escHtml(code.replace(/\n$/, ""))}</code></pre>`);
    return `\n${tok}\n`;
  });

  // 2. Protect inline code `...`
  text = text.replace(/`([^`\n]+)`/g, (_, code) => {
    return pushToken(`<code class="${cls.inlineCode}">${escHtml(code)}</code>`);
  });

  // 3. Extract Display / Block Math: $$...$$ and \[...\]
  text = text.replace(/\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]/g, (match, dollarBody, bracketBody) => {
    const formula = (dollarBody !== undefined ? dollarBody : bracketBody) || "";
    if (!formula.trim()) return match;
    const tok = pushToken(`<div class="${cls.mathBlock}">${renderLatex(formula, true)}</div>`);
    return `\n${tok}\n`;
  });

  // 4. Extract Inline Math: \(...\) and $...$
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (match, formula) => {
    if (!formula || !formula.trim()) return match;
    return pushToken(`<span class="${cls.mathInline}">${renderLatex(formula, false)}</span>`);
  });

  text = text.replace(/\$((?:[^$\n\\]|\\.)+?)\$(?!\d)/g, (match, formula) => {
    if (looksLikeCurrencySpan(formula)) return match;
    return pushToken(`<span class="${cls.mathInline}">${renderLatex(formula, false)}</span>`);
  });

  // 5. Safety net: catch unambiguous undelimited LaTeX fragments (e.g. \frac{a}{b}, \iint_D)
  // that older prompts occasionally produced without $...$.
  const braceGrp = "\\{(?:[^{}]|\\{[^{}]*\\})+\\}";
  const bareLatexRe = new RegExp(
    `(\\\\(?:frac|dfrac|tfrac)\\s*${braceGrp}\\s*${braceGrp}|\\\\sqrt\\s*${braceGrp}|\\\\(?:iiint|iint|int|sum|prod|lim)(?:_${braceGrp}|_[a-zA-Z0-9+-]+)?(?:\\^${braceGrp}|\\^[a-zA-Z0-9+-]+)?)`,
    "g"
  );
  text = text.replace(bareLatexRe, (match) => {
    if (!looksLikeBareLatex(match)) return match;
    return pushToken(`<span class="${cls.mathInline}">${renderLatex(match, false)}</span>`);
  });

  return { text, tokens };
}

function restoreTokens(html, tokens) {
  return html.replace(new RegExp(`${TOKEN_START}(\\d+)${TOKEN_END}`, "g"), (_, idx) => {
    return tokens[Number(idx)] ?? "";
  });
}

function formatInlineEscaped(escapedLine, cls, tokens) {
  let s = escapedLine;

  // Bold **...**
  s = s.replace(/\*\*([^*\n]+?)\*\*/g, `<strong class="${cls.strong}">$1</strong>`);

  // Italic *...* (avoid breaking multiplication expressions like 2*x)
  s = s.replace(/(^|[^*\w])\*([^\s*\n][^*\n]*?[^\s*\n]|[^\s*\n])\*(?!\*)/g, `$1<em>$2</em>`);

  // Highlight ==...==
  s = s.replace(/==([^=\n]+?)==/g, "<mark>$1</mark>");

  // Inline math/logic symbols outside KaTeX
  s = s.replace(/(?:¬[pqr]|[pqr]\s*(?:→|↔|∧|∨)\s*[pqr]|NOT\s*\([^)]+\)|AND\s*\([^)]+\)|OR\s*\([^)]+\))/gi, (match) => {
    return `<span class="math-token">${match}</span>`;
  });

  return restoreTokens(s, tokens);
}

export function formatInlineRichText(raw, options = {}) {
  const variant = options.variant || "chat";
  const cls = VARIANT_CLASSES[variant] || VARIANT_CLASSES.chat;
  const { text, tokens } = tokenizeText(raw, cls);
  return formatInlineEscaped(escHtml(text), cls, tokens);
}

export function renderPlainWithMath(raw, options = {}) {
  const variant = options.variant || "chat";
  const cls = VARIANT_CLASSES[variant] || VARIANT_CLASSES.chat;
  const { text, tokens } = tokenizeText(raw, cls);
  const html = escHtml(text).replace(/\n/g, "<br>");
  return restoreTokens(html, tokens);
}

export function formatAiRichText(raw, options = {}) {
  if (!raw) return "";
  const variant = options.variant || "chat";
  const cls = VARIANT_CLASSES[variant] || VARIANT_CLASSES.chat;

  const { text: tokenized, tokens } = tokenizeText(raw, cls);

  // Separate ">>" step markers onto clean lines if AI clumped them inline
  const prepared = tokenized.replace(/([^\n])\s*>>\s*/g, "$1\n\n>> ");
  const rawLines = prepared.split("\n");
  const blocks = [];
  let bulletListBuffer = null;
  let tableBuffer = [];

  const flushBulletList = () => {
    if (!bulletListBuffer) return;
    if (cls.bulletList) {
      blocks.push(`<ul class="${cls.bulletList}">${bulletListBuffer.join("")}</ul>`);
    } else {
      blocks.push(bulletListBuffer.join(""));
    }
    bulletListBuffer = null;
  };

  const flushTable = () => {
    if (tableBuffer.length >= 2 && tableBuffer[1].includes("---")) {
      const parseCells = (row) => row.split("|").slice(1, -1).map(c => c.trim());
      const headerCells = parseCells(tableBuffer[0]);
      const bodyRows = tableBuffer.slice(2);

      let tableHtml = `<div class="${cls.tableWrap}"><table class="${cls.table}"><thead><tr>`;
      for (const h of headerCells) {
        tableHtml += `<th>${formatInlineEscaped(escHtml(h), cls, tokens)}</th>`;
      }
      tableHtml += "</tr></thead><tbody>";
      for (const row of bodyRows) {
        const cells = parseCells(row);
        tableHtml += "<tr>";
        for (const cell of cells) {
          tableHtml += `<td>${formatInlineEscaped(escHtml(cell), cls, tokens)}</td>`;
        }
        tableHtml += "</tr>";
      }
      tableHtml += "</tbody></table></div>";
      blocks.push(tableHtml);
    } else {
      for (const line of tableBuffer) {
        blocks.push(`<p class="${cls.para}">${formatInlineEscaped(escHtml(line), cls, tokens)}</p>`);
      }
    }
    tableBuffer = [];
  };

  const tokenOnlyRe = new RegExp(`^${TOKEN_START}(\\d+)${TOKEN_END}$`);

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();

    if (trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.length > 2) {
      flushBulletList();
      tableBuffer.push(trimmed);
      continue;
    } else if (tableBuffer.length > 0) {
      flushTable();
    }

    if (!trimmed || trimmed === ">") {
      flushBulletList();
      continue;
    }

    // Check if the line is solely a block token (math block or code block)
    const tokenMatch = trimmed.match(tokenOnlyRe);
    if (tokenMatch) {
      const tokHtml = tokens[Number(tokenMatch[1])] || "";
      if (tokHtml.startsWith(`<div class="${cls.mathBlock}"`) || tokHtml.startsWith(`<pre class="${cls.codeBlock}"`)) {
        flushBulletList();
        blocks.push(tokHtml);
        continue;
      }
    }

    // Horizontal rule --- or ***
    if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushBulletList();
      blocks.push(`<hr class="${cls.hr}">`);
      continue;
    }

    // Headings ###, ##, #
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushBulletList();
      const level = headingMatch[1].length;
      const tag = level === 1 ? "h2" : (level === 2 ? "h3" : "h4");
      const headingClass = variant === "advisor" ? `${cls.heading}${level}` : `${cls.heading} ${cls.heading}-${level}`;
      blocks.push(`<${tag} class="${headingClass}">${formatInlineEscaped(escHtml(headingMatch[2]), cls, tokens)}</${tag}>`);
      continue;
    }

    // Step blocks (">> **Bước 1**...", "**Bước 1**:", "Bước 1:")
    if (
      trimmed.startsWith(">>") ||
      /^\*\*(?:Bước|Cách|Ví dụ|Mẹo nhớ|Ý)\s*[\d]*[^*]*\*\*/i.test(trimmed) ||
      /^(?:Bước|Cách)\s+\d+[:.-]/i.test(trimmed)
    ) {
      flushBulletList();
      const content = trimmed.replace(/^>>\s*/, "");
      blocks.push(`<div class="${cls.stepBlock}">${formatInlineEscaped(escHtml(content), cls, tokens)}</div>`);
      continue;
    }

    // Callout quote: "> ..."
    if (trimmed.startsWith("> ")) {
      flushBulletList();
      const calloutContent = trimmed.slice(2).trim();
      blocks.push(`<div class="${cls.callout}">${formatInlineEscaped(escHtml(calloutContent), cls, tokens)}</div>`);
      continue;
    }

    // Bullet item: "- ", "* ", "• ", "+ "
    const bulletMatch = trimmed.match(/^[-*•+]\s+(.*)$/);
    if (bulletMatch) {
      const bodyHtml = formatInlineEscaped(escHtml(bulletMatch[1]), cls, tokens);
      if (!bulletListBuffer) bulletListBuffer = [];
      if (cls.bulletList) {
        bulletListBuffer.push(`<li>${bodyHtml}</li>`);
      } else {
        const glyph = cls.bulletGlyph || "✦";
        bulletListBuffer.push(`<div class="${cls.bulletRow}"><span class="${cls.bulletDot}">${glyph}</span><div>${bodyHtml}</div></div>`);
      }
      continue;
    }

    flushBulletList();

    // Numbered list item: "1. ..." or "1) ..."
    const numMatch = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
    if (numMatch) {
      const bodyHtml = formatInlineEscaped(escHtml(numMatch[2]), cls, tokens);
      blocks.push(`<div class="${cls.listRow}"><span class="${cls.listNum}">${numMatch[1]}.</span><div class="${cls.listBody}">${bodyHtml}</div></div>`);
      continue;
    }

    // Standard paragraph
    const paraTag = variant === "chat" ? "div" : "p";
    blocks.push(`<${paraTag} class="${cls.para}">${formatInlineEscaped(escHtml(trimmed), cls, tokens)}</${paraTag}>`);
  }

  flushBulletList();
  if (tableBuffer.length > 0) flushTable();

  return blocks.join("");
}
