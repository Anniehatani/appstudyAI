/**
 * 🧮 MÁY TÍNH KHOA HỌC FX-580 — CỬA SỔ NỔI TRONG PHÒNG HỌC POMODORO
 * =============================================================================
 * - Cửa sổ nổi ngay trong phòng Pomodoro: kéo thả, thu nhỏ, mở rộng, đổi kích thước, tắt
 * - Bộ phân tích biểu thức an toàn 100% (không dùng eval / new Function)
 * - Chức năng như Casio fx-580: + − × ÷ ^ %, ngoặc, sin/cos/tan + nghịch đảo,
 *   log/ln/10^x/e^x, căn bậc 2/3, giai thừa, nPr/nCr, trị tuyệt đối, mod,
 *   hằng số π/e, Ans, biến nhớ M, chế độ góc DEG/RAD, lịch sử phép tính.
 * - Vị trí / kích thước / lịch sử / biến nhớ được ghi nhớ qua localStorage.
 */

const CALC_PREFS_KEY = "pomo_fx580_calc_prefs_v1";
const CALC_MIN_WIDTH = 318;
const CALC_MIN_HEIGHT = 372;
const CALC_DEFAULT_WIDTH = 398;
const CALC_DEFAULT_HEIGHT = 604;
const CALC_HISTORY_LIMIT = 24;
const CALC_MAX_EXPRESSION_LENGTH = 400;
const DEG_TO_RAD = Math.PI / 180;

// ========================================================
// 1. BỘ PHÂN TÍCH BIỂU THỨC AN TOÀN (TOKENIZER + PARSER)
// ========================================================
function normalizeCalcSource(rawExpression) {
  return String(rawExpression == null ? "" : rawExpression)
    .replace(/[×·]/g, "*")
    .replace(/÷/g, "/")
    .replace(/[−–—]/g, "-")
    .replace(/π/g, "pi")
    .replace(/√/g, "sqrt(")
    .replace(/∛/g, "cbrt(")
    .replace(/，/g, ",")
    .trim();
}

function tokenizeCalcSource(source) {
  const tokens = [];
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    const numberMatch = /^(?:\d+(?:\.\d*)?|\.\d+)/.exec(source.slice(index));
    if (numberMatch) {
      tokens.push({ type: "number", value: Number(numberMatch[0]) });
      index += numberMatch[0].length;
      continue;
    }
    const nameMatch = /^[A-Za-z_]+/.exec(source.slice(index));
    if (nameMatch) {
      tokens.push({ type: "name", value: nameMatch[0].toLowerCase() });
      index += nameMatch[0].length;
      continue;
    }
    if ("+-*/^%!(),".includes(char)) {
      tokens.push({ type: "op", value: char });
      index += 1;
      continue;
    }
    throw new Error(`Ký tự “${char}” chưa được hỗ trợ`);
  }
  return tokens;
}

function angleToRadians(value, angleMode) {
  return angleMode === "DEG" ? value * DEG_TO_RAD : value;
}

function radiansToAngle(value, angleMode) {
  return angleMode === "DEG" ? value / DEG_TO_RAD : value;
}

function snapTrigValue(value) {
  return Math.abs(value) < 1e-12 ? 0 : value;
}

function calcFactorial(value) {
  if (!Number.isInteger(value) || value < 0 || value > 170) throw new Error("Math ERROR");
  let result = 1;
  for (let i = 2; i <= value; i += 1) result *= i;
  return result;
}

function assertIntegerPair(name, first, second) {
  if (!Number.isInteger(first) || !Number.isInteger(second) || first < 0 || second < 0) {
    throw new Error(`Math ERROR (${name.toUpperCase()} cần số nguyên không âm)`);
  }
}

function applyCalcFunction(name, args, context) {
  const arg = (position) => {
    const value = args[position];
    if (!Number.isFinite(value)) throw new Error("Math ERROR");
    return value;
  };

  switch (name) {
    case "sin":
      return snapTrigValue(Math.sin(angleToRadians(arg(0), context.angle)));
    case "cos":
      return snapTrigValue(Math.cos(angleToRadians(arg(0), context.angle)));
    case "tan": {
      const value = arg(0);
      if (context.angle === "DEG") {
        const normalized = ((value % 180) + 180) % 180;
        if (Math.abs(normalized - 90) < 1e-9) throw new Error("Math ERROR");
      }
      return snapTrigValue(Math.tan(angleToRadians(value, context.angle)));
    }
    case "asin": {
      const value = arg(0);
      if (value < -1 || value > 1) throw new Error("Math ERROR");
      return radiansToAngle(Math.asin(value), context.angle);
    }
    case "acos": {
      const value = arg(0);
      if (value < -1 || value > 1) throw new Error("Math ERROR");
      return radiansToAngle(Math.acos(value), context.angle);
    }
    case "atan":
      return radiansToAngle(Math.atan(arg(0)), context.angle);
    case "sinh":
      return Math.sinh(arg(0));
    case "cosh":
      return Math.cosh(arg(0));
    case "tanh":
      return Math.tanh(arg(0));
    case "log": {
      const value = arg(0);
      if (value <= 0) throw new Error("Math ERROR");
      return Math.log10(value);
    }
    case "ln": {
      const value = arg(0);
      if (value <= 0) throw new Error("Math ERROR");
      return Math.log(value);
    }
    case "log2": {
      const value = arg(0);
      if (value <= 0) throw new Error("Math ERROR");
      return Math.log2(value);
    }
    case "exp":
      return Math.exp(arg(0));
    case "sqrt": {
      const value = arg(0);
      if (value < 0) throw new Error("Math ERROR");
      return Math.sqrt(value);
    }
    case "cbrt":
      return Math.cbrt(arg(0));
    case "abs":
      return Math.abs(arg(0));
    case "floor":
      return Math.floor(arg(0));
    case "ceil":
      return Math.ceil(arg(0));
    case "round": {
      const digits = args.length > 1 ? arg(1) : 0;
      if (!Number.isInteger(digits) || digits < 0 || digits > 12) throw new Error("Math ERROR");
      const factor = Math.pow(10, digits);
      return Math.round(arg(0) * factor) / factor;
    }
    case "sign":
      return Math.sign(arg(0));
    case "fact":
      return calcFactorial(arg(0));
    case "mod": {
      if (args.length < 2) throw new Error("Hàm MOD cần 2 tham số");
      const divisor = arg(1);
      if (divisor === 0) throw new Error("Math ERROR");
      return arg(0) % divisor;
    }
    case "ncr": {
      if (args.length < 2) throw new Error("Hàm nCr cần 2 tham số");
      const n = arg(0);
      const r = arg(1);
      assertIntegerPair("nCr", n, r);
      if (r > n || n > 170) throw new Error("Math ERROR");
      const take = Math.min(r, n - r);
      let result = 1;
      for (let i = 1; i <= take; i += 1) result = (result * (n - take + i)) / i;
      return result;
    }
    case "npr": {
      if (args.length < 2) throw new Error("Hàm nPr cần 2 tham số");
      const n = arg(0);
      const r = arg(1);
      assertIntegerPair("nPr", n, r);
      if (r > n || n > 170) throw new Error("Math ERROR");
      let result = 1;
      for (let i = 0; i < r; i += 1) result *= n - i;
      return result;
    }
    default:
      throw new Error(`Không hiểu hàm “${name}”`);
  }
}

export function evaluateCalcExpression(rawExpression, context = {}) {
  const source = normalizeCalcSource(rawExpression);
  if (!source) throw new Error("Nhập phép tính trước nhé");
  if (source.length > CALC_MAX_EXPRESSION_LENGTH) throw new Error("Biểu thức quá dài, hãy rút gọn");

  const tokens = tokenizeCalcSource(source);
  const ctx = {
    angle: context.angle === "RAD" ? "RAD" : "DEG",
    ans: Number(context.ans) || 0,
    memory: Number(context.memory) || 0
  };

  let cursor = 0;
  const peek = () => tokens[cursor];
  const take = () => tokens[cursor++];
  const isOperator = (value) => {
    const token = peek();
    return Boolean(token) && token.type === "op" && token.value === value;
  };
  const consumeClose = () => {
    if (isOperator(")")) cursor += 1;
  };

  const parseAddSub = () => {
    let value = parseMulDiv();
    while (true) {
      const token = peek();
      if (!token || token.type !== "op" || (token.value !== "+" && token.value !== "-")) break;
      cursor += 1;
      const right = parseMulDiv();
      value = token.value === "+" ? value + right : value - right;
    }
    return value;
  };

  const parseMulDiv = () => {
    let value = parseImplicit();
    while (true) {
      const token = peek();
      if (!token || token.type !== "op" || (token.value !== "*" && token.value !== "/")) break;
      cursor += 1;
      const right = parseImplicit();
      value = token.value === "*" ? value * right : value / right;
    }
    return value;
  };

  const parseImplicit = () => {
    let value = parseUnary();
    while (canStartImplicitFactor()) value *= parseUnary();
    return value;
  };

  const canStartImplicitFactor = () => {
    const token = peek();
    if (!token) return false;
    if (token.type === "number" || token.type === "name") return true;
    return token.type === "op" && token.value === "(";
  };

  const parseUnary = () => {
    if (isOperator("-")) {
      cursor += 1;
      return -parseUnary();
    }
    if (isOperator("+")) {
      cursor += 1;
      return parseUnary();
    }
    return parsePower();
  };

  const parsePower = () => {
    const base = parsePostfix();
    if (isOperator("^")) {
      cursor += 1;
      return Math.pow(base, parseUnary());
    }
    return base;
  };

  const parsePostfix = () => {
    let value = parsePrimary();
    while (true) {
      if (isOperator("!")) {
        cursor += 1;
        value = calcFactorial(value);
      } else if (isOperator("%")) {
        cursor += 1;
        value /= 100;
      } else {
        break;
      }
    }
    return value;
  };

  const parsePrimary = () => {
    const token = take();
    if (!token) throw new Error("Biểu thức chưa hoàn chỉnh");
    if (token.type === "number") return token.value;
    if (token.type === "op" && token.value === "(") {
      const value = parseAddSub();
      consumeClose();
      return value;
    }
    if (token.type === "name") {
      const name = token.value;
      if (name === "pi") return Math.PI;
      if (name === "e") return Math.E;
      if (name === "ans") return ctx.ans;
      if (name === "m") return ctx.memory;

      if (isOperator("(")) cursor += 1;
      const args = [];
      if (!isOperator(")")) {
        args.push(parseAddSub());
        while (isOperator(",")) {
          cursor += 1;
          if (isOperator(")")) throw new Error("Thiếu tham số cho hàm");
          args.push(parseAddSub());
        }
      }
      consumeClose();
      return applyCalcFunction(name, args, ctx);
    }
    throw new Error(`Không hiểu ký hiệu “${token.value}”`);
  };

  const result = parseAddSub();
  if (cursor < tokens.length) throw new Error("Biểu thức còn phần chưa tính được");
  if (!Number.isFinite(result)) throw new Error("Math ERROR");
  return result;
}

function trimTrailingZeros(text) {
  if (!text.includes(".")) return text;
  return text
    .replace(/(\.\d*?[1-9])0+(?=$|e)/i, "$1")
    .replace(/\.0+(?=$|e)/i, "");
}

export function formatCalcResult(value) {
  if (!Number.isFinite(value)) throw new Error("Math ERROR");
  const safeValue = Object.is(value, -0) ? 0 : value;
  const magnitude = Math.abs(safeValue);
  if (safeValue !== 0 && (magnitude >= 1e10 || magnitude < 1e-9)) {
    const [mantissa, exponent] = safeValue.toExponential(9).split("e");
    return `${trimTrailingZeros(mantissa)}×10^${Number(exponent)}`;
  }
  return trimTrailingZeros(String(Number(safeValue.toPrecision(10))));
}

// ========================================================
// 2. TRẠNG THÁI CỬA SỔ + GHI NHỚ TÙY CHỌN
// ========================================================
function readCalcPrefs() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CALC_PREFS_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

const savedCalcPrefs = readCalcPrefs();
const savedCalcHistory = Array.isArray(savedCalcPrefs.history)
  ? savedCalcPrefs.history
      .filter((item) => item && typeof item.expr === "string" && typeof item.result === "string")
      .slice(0, CALC_HISTORY_LIMIT)
  : [];

const calcState = {
  open: savedCalcPrefs.open === true,
  minimized: savedCalcPrefs.minimized === true,
  maximized: savedCalcPrefs.maximized === true,
  showHistory: false,
  x: toFiniteNumber(savedCalcPrefs.x),
  y: toFiniteNumber(savedCalcPrefs.y),
  width: toFiniteNumber(savedCalcPrefs.width) || CALC_DEFAULT_WIDTH,
  height: toFiniteNumber(savedCalcPrefs.height) || CALC_DEFAULT_HEIGHT,
  angle: savedCalcPrefs.angle === "RAD" ? "RAD" : "DEG",
  memory: toFiniteNumber(savedCalcPrefs.memory) || 0,
  ans: toFiniteNumber(savedCalcPrefs.ans) || 0,
  history: savedCalcHistory,
  shift: false,
  justEvaluated: false,
  lastResultText: "0",
  lastResultError: false
};

function persistCalcPrefs() {
  try {
    localStorage.setItem(CALC_PREFS_KEY, JSON.stringify({
      open: calcState.open,
      minimized: calcState.minimized,
      maximized: calcState.maximized,
      x: calcState.x,
      y: calcState.y,
      width: calcState.width,
      height: calcState.height,
      angle: calcState.angle,
      memory: calcState.memory,
      ans: calcState.ans,
      history: calcState.history.slice(0, CALC_HISTORY_LIMIT)
    }));
  } catch {}
}

// ========================================================
// 3. GIAO DIỆN BÀN PHÍM FX-580
// ========================================================
const CALC_KEY_ROWS = [
  [
    { key: "shift", label: "SHIFT", cls: "is-shift", title: "Bật/tắt chức năng phụ (SHIFT)" },
    { key: "angle", label: "DEG", id: "pomo-calc-angle-key", cls: "is-mode", title: "Chuyển đơn vị góc DEG / RAD" },
    { key: "clear", label: "AC", cls: "is-accent", title: "Xóa toàn bộ biểu thức" },
    { key: "del", label: "DEL", cls: "is-accent", title: "Xóa ký tự trước con trỏ" },
    { key: "insert", value: "%", shiftValue: "mod(", label: "%", shiftLabel: "mod", cls: "is-fn", title: "Phần trăm · SHIFT: mod(a,b)" }
  ],
  [
    { key: "insert", value: "sin(", shiftValue: "asin(", label: "sin", shiftLabel: "sin⁻¹", cls: "is-fn", title: "sin · SHIFT: sin⁻¹" },
    { key: "insert", value: "cos(", shiftValue: "acos(", label: "cos", shiftLabel: "cos⁻¹", cls: "is-fn", title: "cos · SHIFT: cos⁻¹" },
    { key: "insert", value: "tan(", shiftValue: "atan(", label: "tan", shiftLabel: "tan⁻¹", cls: "is-fn", title: "tan · SHIFT: tan⁻¹" },
    { key: "insert", value: "(", label: "(", cls: "is-op", title: "Mở ngoặc" },
    { key: "insert", value: ")", label: ")", cls: "is-op", title: "Đóng ngoặc" }
  ],
  [
    { key: "insert", value: "^2", shiftValue: "^3", label: "x²", shiftLabel: "x³", cls: "is-fn", title: "Bình phương · SHIFT: lập phương" },
    { key: "insert", value: "^", label: "xʸ", cls: "is-fn", title: "Lũy thừa" },
    { key: "insert", value: "√(", shiftValue: "∛(", label: "√", shiftLabel: "∛", cls: "is-fn", title: "Căn bậc 2 · SHIFT: căn bậc 3" },
    { key: "insert", value: "log(", shiftValue: "10^(", label: "log", shiftLabel: "10ˣ", cls: "is-fn", title: "log cơ số 10 · SHIFT: 10 mũ x" },
    { key: "insert", value: "ln(", shiftValue: "e^(", label: "ln", shiftLabel: "eˣ", cls: "is-fn", title: "logarit tự nhiên · SHIFT: e mũ x" }
  ],
  [
    { key: "insert", value: "1/(", shiftValue: "abs(", label: "1/x", shiftLabel: "Abs", cls: "is-fn", title: "Nghịch đảo · SHIFT: trị tuyệt đối" },
    { key: "insert", value: "!", label: "x!", cls: "is-fn", title: "Giai thừa" },
    { key: "insert", value: "ncr(", shiftValue: "npr(", label: "nCr", shiftLabel: "nPr", cls: "is-fn", title: "Tổ hợp · SHIFT: chỉnh hợp" },
    { key: "insert", value: "π", label: "π", cls: "is-fn", title: "Hằng số π" },
    { key: "insert", value: "e", label: "e", cls: "is-fn", title: "Hằng số e" }
  ],
  [
    { key: "insert", value: "10^(", label: "10ˣ", cls: "is-fn", title: "10 mũ x" },
    { key: "insert", value: "e^(", label: "eˣ", cls: "is-fn", title: "e mũ x" },
    { key: "insert", value: "abs(", label: "Abs", cls: "is-fn", title: "Trị tuyệt đối" },
    { key: "insert", value: "mod(", label: "mod", cls: "is-fn", title: "Phép chia lấy dư mod(a,b)" },
    { key: "insert", value: "*10^(", label: "EXP", cls: "is-fn", title: "Nhân với 10 mũ x" }
  ],
  [
    { key: "insert", value: "7", label: "7", cls: "is-digit" },
    { key: "insert", value: "8", label: "8", cls: "is-digit" },
    { key: "insert", value: "9", label: "9", cls: "is-digit" },
    { key: "insert", value: "÷", label: "÷", cls: "is-op" },
    { key: "insert", value: "Ans", label: "Ans", cls: "is-fn", title: "Kết quả vừa tính" }
  ],
  [
    { key: "insert", value: "4", label: "4", cls: "is-digit" },
    { key: "insert", value: "5", label: "5", cls: "is-digit" },
    { key: "insert", value: "6", label: "6", cls: "is-digit" },
    { key: "insert", value: "×", label: "×", cls: "is-op" },
    { key: "mem-plus", shiftKey: "mem-minus", label: "M+", shiftLabel: "M−", cls: "is-fn", title: "Cộng vào biến nhớ M · SHIFT: trừ" }
  ],
  [
    { key: "insert", value: "1", label: "1", cls: "is-digit" },
    { key: "insert", value: "2", label: "2", cls: "is-digit" },
    { key: "insert", value: "3", label: "3", cls: "is-digit" },
    { key: "insert", value: "-", label: "−", cls: "is-op" },
    { key: "mem-recall", label: "MR", cls: "is-fn", title: "Gọi giá trị biến nhớ M" }
  ],
  [
    { key: "insert", value: "0", label: "0", cls: "is-digit" },
    { key: "insert", value: ".", label: ".", cls: "is-digit" },
    { key: "insert", value: "(-", label: "(−)", cls: "is-fn", title: "Nhập số âm" },
    { key: "insert", value: "+", label: "+", cls: "is-op" },
    { key: "equals", label: "=", cls: "is-equals", title: "Tính kết quả (Enter)" }
  ]
];

function escapeCalcHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (char) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]
  ));
}

function renderCalcKey(spec) {
  const hasAlt = Boolean(spec.shiftLabel || spec.shiftValue || spec.shiftKey);
  const attributes = [
    "type=\"button\"",
    `class="pomo-calc-key ${spec.cls || ""}${hasAlt ? " has-alt" : ""}"`,
    `data-calc-key="${spec.key}"`
  ];
  if (spec.value != null) attributes.push(`data-calc-value="${escapeCalcHtml(spec.value)}"`);
  if (spec.shiftValue != null) attributes.push(`data-calc-shift-value="${escapeCalcHtml(spec.shiftValue)}"`);
  if (spec.shiftKey != null) attributes.push(`data-calc-shift-key="${escapeCalcHtml(spec.shiftKey)}"`);
  if (spec.id) attributes.push(`id="${spec.id}"`);
  if (spec.title) attributes.push(`title="${escapeCalcHtml(spec.title)}"`);
  const label = spec.shiftLabel
    ? `<span class="calc-key-main">${spec.label}</span><span class="calc-key-alt">${spec.shiftLabel}</span>`
    : spec.label;
  return `<button ${attributes.join(" ")}>${label}</button>`;
}

function renderCalcWindowHtml() {
  return `
    <header class="pomo-calc-titlebar" data-calc-drag>
      <div class="pomo-calc-brand">
        <span class="pomo-calc-brand-icon">🧮</span>
        <span class="pomo-calc-brand-copy">
          <strong>fx-580</strong>
          <small>Máy tính khoa học</small>
        </span>
      </div>
      <div class="pomo-calc-win-actions">
        <button type="button" class="pomo-calc-winbtn" data-calc-action="history" title="Lịch sử phép tính">🕘</button>
        <button type="button" class="pomo-calc-winbtn" data-calc-action="minimize" title="Thu nhỏ cửa sổ">−</button>
        <button type="button" class="pomo-calc-winbtn" data-calc-action="maximize" title="Mở rộng cửa sổ">□</button>
        <button type="button" class="pomo-calc-winbtn is-close" data-calc-action="close" title="Đóng máy tính">✕</button>
      </div>
    </header>
    <div class="pomo-calc-body">
      <section class="pomo-calc-screen" aria-label="Màn hình máy tính">
        <div class="pomo-calc-screen-top">
          <span class="pomo-calc-chip is-angle" id="pomo-calc-angle-chip">${calcState.angle}</span>
          <span class="pomo-calc-chip is-shift" id="pomo-calc-shift-chip">SHIFT</span>
          <span class="pomo-calc-chip is-memory" id="pomo-calc-mem-chip" title="Biến nhớ M đang trống">M</span>
          <span class="pomo-calc-copy-hint" id="pomo-calc-copy-hint"></span>
        </div>
        <input class="pomo-calc-input" id="pomo-calc-expression" type="text" inputmode="none"
               autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
               aria-label="Biểu thức cần tính" placeholder="Nhập phép tính…">
        <div class="pomo-calc-result-row">
          <span class="pomo-calc-eq-sign">=</span>
          <output class="pomo-calc-result" id="pomo-calc-result" aria-live="polite">0</output>
          <button type="button" class="pomo-calc-copy-btn" data-calc-action="copy" title="Sao chép kết quả">⧉</button>
        </div>
      </section>
      <div class="pomo-calc-history" id="pomo-calc-history"></div>
      <div class="pomo-calc-keys" role="group" aria-label="Bàn phím máy tính">
        ${CALC_KEY_ROWS.map((row) => row.map(renderCalcKey).join("")).join("")}
      </div>
      <div class="pomo-calc-footnote">SHIFT đổi chức năng · Enter = tính · Kéo thanh tiêu đề để di chuyển · Góc ◢ để đổi kích thước</div>
    </div>
    <div class="pomo-calc-resize-handle" data-calc-resize title="Kéo để thay đổi kích thước cửa sổ"></div>
  `;
}

// ========================================================
// 4. TIỆN ÍCH DOM & TƯƠNG TÁC BÀN PHÍM
// ========================================================
function clampNumber(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getCalcRoot() {
  return document.getElementById("pomo-calc-window");
}

function getCalcInput(root = getCalcRoot()) {
  return root ? root.querySelector("#pomo-calc-expression") : null;
}

function getCalcResultEl(root) {
  return root ? root.querySelector("#pomo-calc-result") : null;
}

function setCalcResult(root, text, options = {}) {
  const output = getCalcResultEl(root);
  if (!output) return;
  const isError = Boolean(options.error);
  output.textContent = text;
  output.classList.toggle("is-error", isError);
  if (root) root.classList.toggle("has-calc-error", isError);
  calcState.lastResultText = text;
  calcState.lastResultError = isError;
}

function updateCalcChrome(root) {
  if (!root) return;
  root.classList.toggle("shift-active", Boolean(calcState.shift));
  root.classList.toggle("maximized", Boolean(calcState.maximized));
  root.classList.toggle("minimized", Boolean(calcState.minimized));
  root.classList.toggle("history-open", Boolean(calcState.showHistory));

  const angleKey = root.querySelector("#pomo-calc-angle-key");
  if (angleKey) angleKey.textContent = calcState.angle;
  const angleChip = root.querySelector("#pomo-calc-angle-chip");
  if (angleChip) angleChip.textContent = calcState.angle;

  const memoryChip = root.querySelector("#pomo-calc-mem-chip");
  if (memoryChip) {
    const hasMemory = Math.abs(calcState.memory) > 1e-15;
    let memoryLabel = "M";
    if (hasMemory) {
      memoryLabel = `M ${Number.isFinite(calcState.memory) ? formatCalcResult(calcState.memory) : "∞"}`;
    }
    memoryChip.classList.toggle("is-filled", hasMemory);
    memoryChip.textContent = memoryLabel;
    memoryChip.title = hasMemory ? `Biến nhớ M = ${memoryLabel.slice(2)}` : "Biến nhớ M đang trống";
  }

  const maximizeButton = root.querySelector("[data-calc-action=\"maximize\"]");
  if (maximizeButton) {
    maximizeButton.textContent = calcState.maximized ? "❐" : "□";
    maximizeButton.title = calcState.maximized ? "Thu hồi kích thước" : "Mở rộng cửa sổ";
  }
  const minimizeButton = root.querySelector("[data-calc-action=\"minimize\"]");
  if (minimizeButton) {
    minimizeButton.textContent = calcState.minimized ? "❐" : "−";
    minimizeButton.title = calcState.minimized ? "Mở lại cửa sổ" : "Thu nhỏ cửa sổ";
  }
}

function renderCalcHistory(root) {
  const panel = root ? root.querySelector("#pomo-calc-history") : null;
  if (!panel) return;
  if (!calcState.history.length) {
    panel.innerHTML = `<div class="pomo-calc-history-empty">Chưa có phép tính nào. Bấm <b>=</b> để lưu lịch sử nhé!</div>`;
    return;
  }
  panel.innerHTML = calcState.history.map((item, index) => `
    <button type="button" class="pomo-calc-history-item" data-calc-history-index="${index}" title="Bấm để dùng lại biểu thức này">
      <span class="calc-history-expr">${escapeCalcHtml(item.expr)}</span>
      <span class="calc-history-result">= ${escapeCalcHtml(item.result)}</span>
    </button>
  `).join("");
}

function updateCalcFromToggleState() {
  const button = document.getElementById("pomo-calc-toggle-btn");
  if (button) button.classList.toggle("active", Boolean(calcState.open));
}

function insertCalcToken(root, token) {
  const input = getCalcInput(root);
  if (!input || !token) return;

  let start = input.selectionStart == null ? input.value.length : input.selectionStart;
  let end = input.selectionEnd == null ? input.value.length : input.selectionEnd;

  if (calcState.justEvaluated) {
    if (/^[+\-*/^%!×÷]/.test(token)) {
      input.value = "Ans";
      start = 3;
      end = 3;
    } else {
      input.value = "";
      start = 0;
      end = 0;
    }
    calcState.justEvaluated = false;
  }

  input.value = input.value.slice(0, start) + token + input.value.slice(end);
  const caret = start + token.length;
  try {
    input.focus({ preventScroll: true });
  } catch {
    input.focus();
  }
  input.setSelectionRange(caret, caret);
}

const CALC_DELETE_SUFFIXES = [
  "asin(", "acos(", "atan(", "sin(", "cos(", "tan(", "sinh(", "cosh(", "tanh(",
  "sqrt(", "cbrt(", "√(", "∛(", "log2(", "log(", "ln(",
  "10^(", "e^(", "abs(", "ncr(", "npr(", "mod(", "1/("
];

function deleteCalcChar(root) {
  const input = getCalcInput(root);
  if (!input) return;
  const value = input.value;
  let start = input.selectionStart == null ? value.length : input.selectionStart;
  let end = input.selectionEnd == null ? value.length : input.selectionEnd;

  if (start !== end) {
    input.value = value.slice(0, start) + value.slice(end);
  } else if (start > 0) {
    const before = value.slice(0, start);
    const matchedSuffix = CALC_DELETE_SUFFIXES.find((suffix) => before.endsWith(suffix));
    const removeCount = matchedSuffix ? matchedSuffix.length : 1;
    input.value = value.slice(0, start - removeCount) + value.slice(start);
    start -= removeCount;
  } else {
    return;
  }

  calcState.justEvaluated = false;
  try {
    input.focus({ preventScroll: true });
  } catch {
    input.focus();
  }
  const caret = Math.max(0, Math.min(start, input.value.length));
  input.setSelectionRange(caret, caret);
}

function runCalcEvaluation(root) {
  const input = getCalcInput(root);
  if (!input) return;
  const expression = input.value.trim();
  if (!expression) {
    setCalcResult(root, "0");
    return;
  }

  try {
    const value = evaluateCalcExpression(expression, {
      angle: calcState.angle,
      ans: calcState.ans,
      memory: calcState.memory
    });
    const text = formatCalcResult(value);
    calcState.ans = value;
    calcState.justEvaluated = true;
    setCalcResult(root, text);
    const latest = calcState.history[0];
    if (!latest || latest.expr !== expression || latest.result !== text) {
      calcState.history.unshift({ expr: expression, result: text });
      if (calcState.history.length > CALC_HISTORY_LIMIT) calcState.history.length = CALC_HISTORY_LIMIT;
    }
    renderCalcHistory(root);
    updateCalcChrome(root);
    persistCalcPrefs();
    try {
      input.focus({ preventScroll: true });
    } catch {
      input.focus();
    }
    input.setSelectionRange(input.value.length, input.value.length);
  } catch (error) {
    calcState.justEvaluated = false;
    setCalcResult(root, error && error.message ? error.message : "Math ERROR", { error: true });
  }
}

function adjustCalcMemory(direction, root) {
  const input = getCalcInput(root);
  const expression = input ? input.value.trim() : "";
  let value = calcState.ans;
  if (expression) {
    try {
      value = evaluateCalcExpression(expression, {
        angle: calcState.angle,
        ans: calcState.ans,
        memory: calcState.memory
      });
    } catch {
      setCalcResult(root, "Math ERROR", { error: true });
      return;
    }
  }
  calcState.memory += direction * value;
  if (!Number.isFinite(calcState.memory)) {
    calcState.memory -= direction * value;
    setCalcResult(root, "Math ERROR", { error: true });
    return;
  }
  updateCalcChrome(root);
  persistCalcPrefs();
  if (window.showToast) {
    window.showToast(`🧮 Biến nhớ M = ${formatCalcResult(calcState.memory)}`);
  }
}

function handleCalcKey(button, root) {
  const kind = button.dataset.calcKey;
  if (!kind) return;
  const input = getCalcInput(root);
  if (!input) return;
  const shiftActive = Boolean(calcState.shift);

  switch (kind) {
    case "shift":
      calcState.shift = !calcState.shift;
      updateCalcChrome(root);
      return;
    case "angle":
      calcState.angle = calcState.angle === "DEG" ? "RAD" : "DEG";
      persistCalcPrefs();
      updateCalcChrome(root);
      return;
    case "clear":
      input.value = "";
      calcState.justEvaluated = false;
      setCalcResult(root, "0");
      try {
        input.focus({ preventScroll: true });
      } catch {
        input.focus();
      }
      input.setSelectionRange(0, 0);
      return;
    case "del":
      deleteCalcChar(root);
      return;
    case "equals":
      runCalcEvaluation(root);
      return;
    case "mem-plus":
    case "mem-minus": {
      const effective = shiftActive && button.dataset.calcShiftKey ? button.dataset.calcShiftKey : kind;
      adjustCalcMemory(effective === "mem-minus" ? -1 : 1, root);
      break;
    }
    case "mem-recall":
      insertCalcToken(root, "M");
      break;
    case "insert": {
      const token = shiftActive && button.dataset.calcShiftValue
        ? button.dataset.calcShiftValue
        : button.dataset.calcValue;
      insertCalcToken(root, token);
      break;
    }
    default:
      return;
  }

  if (shiftActive) {
    calcState.shift = false;
    updateCalcChrome(root);
  }
}

function handleCalcAction(action, root) {
  switch (action) {
    case "history":
      calcState.showHistory = !calcState.showHistory;
      updateCalcChrome(root);
      if (calcState.showHistory) renderCalcHistory(root);
      return;
    case "minimize":
      if (calcState.minimized) {
        calcState.minimized = false;
      } else {
        calcState.minimized = true;
        calcState.maximized = false;
      }
      updateCalcChrome(root);
      applyCalcGeometry(root);
      persistCalcPrefs();
      return;
    case "maximize":
      calcState.minimized = false;
      calcState.maximized = !calcState.maximized;
      updateCalcChrome(root);
      applyCalcGeometry(root);
      persistCalcPrefs();
      return;
    case "close":
      closePomodoroCalculator();
      return;
    case "copy": {
      const text = calcState.lastResultText || "";
      const hint = root ? root.querySelector("#pomo-calc-copy-hint") : null;
      const showHint = (message) => {
        if (!hint) return;
        hint.textContent = message;
        hint.classList.add("is-visible");
        setTimeout(() => hint.classList.remove("is-visible"), 1400);
      };
      if (calcState.lastResultError || !text || text === "0") {
        showHint(calcState.lastResultError ? "Không có kết quả" : "Chưa có kết quả");
        return;
      }
      const done = () => {
        showHint("Đã sao chép ✓");
        if (window.showToast) window.showToast(`⧉ Đã sao chép kết quả: ${text}`);
      };
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        navigator.clipboard.writeText(text).then(done).catch(() => showHint("Không sao chép được"));
      } else {
        showHint("Trình duyệt không hỗ trợ sao chép");
      }
      return;
    }
    default:
  }
}

function handleCalcWindowClick(event, root) {
  const actionButton = event.target.closest("[data-calc-action]");
  if (actionButton) {
    handleCalcAction(actionButton.dataset.calcAction, root);
    return;
  }

  const historyItem = event.target.closest("[data-calc-history-index]");
  if (historyItem) {
    const item = calcState.history[Number(historyItem.dataset.calcHistoryIndex)];
    if (!item) return;
    const input = getCalcInput(root);
    if (!input) return;
    input.value = item.expr;
    calcState.justEvaluated = false;
    setCalcResult(root, item.result);
    calcState.showHistory = false;
    updateCalcChrome(root);
    try {
      input.focus({ preventScroll: true });
    } catch {
      input.focus();
    }
    input.setSelectionRange(input.value.length, input.value.length);
    return;
  }

  const keyButton = event.target.closest("[data-calc-key]");
  if (keyButton) handleCalcKey(keyButton, root);
}

// ========================================================
// 5. KÉO THẢ / ĐỔI KÍCH THƯỚC
// ========================================================
function ensureCalcGeometry() {
  const viewportWidth = Math.max(320, window.innerWidth || 1280);
  const viewportHeight = Math.max(360, window.innerHeight || 800);
  const maxWidth = Math.max(CALC_MIN_WIDTH, viewportWidth - 16);
  const maxHeight = Math.max(CALC_MIN_HEIGHT, viewportHeight - 92);

  calcState.width = clampNumber(Number(calcState.width) || CALC_DEFAULT_WIDTH, CALC_MIN_WIDTH, maxWidth);
  calcState.height = clampNumber(Number(calcState.height) || CALC_DEFAULT_HEIGHT, CALC_MIN_HEIGHT, maxHeight);

  if (calcState.x == null || calcState.y == null) {
    calcState.x = viewportWidth - calcState.width - 20;
    calcState.y = viewportHeight - calcState.height - 18;
  }
  const minX = Math.min(8, viewportWidth - calcState.width);
  const maxX = Math.max(minX, viewportWidth - calcState.width - 8);
  calcState.x = clampNumber(calcState.x, minX, maxX);
  calcState.y = clampNumber(calcState.y, 2, Math.max(2, viewportHeight - 48));
}

function applyCalcGeometry(root) {
  if (!root) return;
  if (calcState.x == null || calcState.y == null) ensureCalcGeometry();
  root.style.left = `${Math.round(calcState.x)}px`;
  root.style.top = `${Math.round(calcState.y)}px`;
  root.style.width = `${Math.round(calcState.width)}px`;
  root.style.height = `${Math.round(calcState.height)}px`;
}

function beginCalcDrag(event, root) {
  if (event.target.closest("[data-calc-action]")) return;
  if (event.button !== undefined && event.button !== 0) return;
  if (calcState.maximized || calcState.minimized) return;
  event.preventDefault();

  const rect = root.getBoundingClientRect();
  const startX = event.clientX;
  const startY = event.clientY;
  const originX = rect.left;
  const originY = rect.top;
  const handle = event.currentTarget;
  root.classList.add("is-dragging");
  try {
    handle.setPointerCapture(event.pointerId);
  } catch {}

  const onMove = (moveEvent) => {
    const viewportWidth = window.innerWidth || 1280;
    const viewportHeight = window.innerHeight || 800;
    calcState.x = clampNumber(originX + moveEvent.clientX - startX, -rect.width + 100, viewportWidth - 100);
    calcState.y = clampNumber(originY + moveEvent.clientY - startY, 2, Math.max(2, viewportHeight - 48));
    applyCalcGeometry(root);
  };

  const onEnd = () => {
    root.classList.remove("is-dragging");
    handle.removeEventListener("pointermove", onMove);
    handle.removeEventListener("pointerup", onEnd);
    handle.removeEventListener("pointercancel", onEnd);
    persistCalcPrefs();
  };

  handle.addEventListener("pointermove", onMove);
  handle.addEventListener("pointerup", onEnd);
  handle.addEventListener("pointercancel", onEnd);
}

function beginCalcResize(event, root) {
  if (event.button !== undefined && event.button !== 0) return;
  if (calcState.maximized || calcState.minimized) return;
  event.preventDefault();

  const rect = root.getBoundingClientRect();
  const startX = event.clientX;
  const startY = event.clientY;
  const originWidth = rect.width;
  const originHeight = rect.height;
  const handle = event.currentTarget;
  root.classList.add("is-resizing");
  try {
    handle.setPointerCapture(event.pointerId);
  } catch {}

  const onMove = (moveEvent) => {
    const viewportWidth = window.innerWidth || 1280;
    const viewportHeight = window.innerHeight || 800;
    const maxWidth = Math.max(CALC_MIN_WIDTH, viewportWidth - 16);
    const maxHeight = Math.max(CALC_MIN_HEIGHT, viewportHeight - 92);
    calcState.width = clampNumber(originWidth + moveEvent.clientX - startX, CALC_MIN_WIDTH, maxWidth);
    calcState.height = clampNumber(originHeight + moveEvent.clientY - startY, CALC_MIN_HEIGHT, maxHeight);
    applyCalcGeometry(root);
  };

  const onEnd = () => {
    root.classList.remove("is-resizing");
    handle.removeEventListener("pointermove", onMove);
    handle.removeEventListener("pointerup", onEnd);
    handle.removeEventListener("pointercancel", onEnd);
    ensureCalcGeometry();
    applyCalcGeometry(root);
    persistCalcPrefs();
  };

  handle.addEventListener("pointermove", onMove);
  handle.addEventListener("pointerup", onEnd);
  handle.addEventListener("pointercancel", onEnd);
}

function bindPomodoroCalculatorEvents(root) {
  const titlebar = root.querySelector(".pomo-calc-titlebar");
  const keypad = root.querySelector(".pomo-calc-keys");
  const resizeHandle = root.querySelector(".pomo-calc-resize-handle");
  const input = getCalcInput(root);

  if (titlebar) {
    titlebar.addEventListener("pointerdown", (event) => beginCalcDrag(event, root));
    titlebar.addEventListener("dblclick", (event) => {
      if (event.target.closest("[data-calc-action]")) return;
      if (!calcState.minimized) return;
      calcState.minimized = false;
      updateCalcChrome(root);
      applyCalcGeometry(root);
      persistCalcPrefs();
    });
  }
  if (resizeHandle) resizeHandle.addEventListener("pointerdown", (event) => beginCalcResize(event, root));

  if (keypad) {
    keypad.addEventListener("pointerdown", (event) => {
      if (event.target.closest(".pomo-calc-key")) event.preventDefault();
    });
  }

  root.addEventListener("click", (event) => handleCalcWindowClick(event, root));

  if (input) {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        runCalcEvaluation(root);
      }
    });
    input.addEventListener("input", () => {
      calcState.justEvaluated = false;
    });
  }
}

// ========================================================
// 6. MOUNT / OPEN / CLOSE / ĐỒNG BỘ VỚI PHÒNG POMODORO
// ========================================================
function isInsidePomodoroRoom() {
  return Boolean(document.querySelector(".pomodoro-active-room"));
}

function mountPomodoroCalculator() {
  let root = getCalcRoot();
  if (root) return root;

  root = document.createElement("div");
  root.id = "pomo-calc-window";
  root.className = "pomo-calc-window";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-label", "Máy tính khoa học fx-580");
  root.innerHTML = renderCalcWindowHtml();
  document.body.appendChild(root);

  bindPomodoroCalculatorEvents(root);
  ensureCalcGeometry();
  applyCalcGeometry(root);
  updateCalcChrome(root);
  renderCalcHistory(root);
  setCalcResult(root, calcState.lastResultText || "0", { error: calcState.lastResultError });
  return root;
}

export function openPomodoroCalculator() {
  if (!isInsidePomodoroRoom()) return;
  calcState.open = true;
  calcState.minimized = false;
  calcState.showHistory = false;
  persistCalcPrefs();
  const root = mountPomodoroCalculator();
  updateCalcChrome(root);
  applyCalcGeometry(root);
  updateCalcFromToggleState();
  const input = getCalcInput(root);
  if (input) {
    try {
      input.focus({ preventScroll: true });
    } catch {
      input.focus();
    }
    input.setSelectionRange(input.value.length, input.value.length);
  }
}

export function closePomodoroCalculator() {
  calcState.open = false;
  calcState.minimized = false;
  calcState.maximized = false;
  calcState.showHistory = false;
  calcState.shift = false;
  const root = getCalcRoot();
  if (root) root.remove();
  persistCalcPrefs();
  updateCalcFromToggleState();
}

export function togglePomodoroCalculator() {
  if (!calcState.open) {
    openPomodoroCalculator();
    return;
  }
  const root = getCalcRoot();
  if (!root || calcState.minimized || calcState.maximized) {
    calcState.open = true;
    calcState.minimized = false;
    calcState.maximized = false;
    persistCalcPrefs();
    const mounted = mountPomodoroCalculator();
    updateCalcChrome(mounted);
    applyCalcGeometry(mounted);
    updateCalcFromToggleState();
    return;
  }
  closePomodoroCalculator();
}

export function syncPomodoroCalculatorVisibility() {
  const root = getCalcRoot();
  if (!isInsidePomodoroRoom()) {
    if (root) root.remove();
    updateCalcFromToggleState();
    return;
  }
  if (calcState.open) {
    if (!root) mountPomodoroCalculator();
  } else if (root) {
    root.remove();
  }
  updateCalcFromToggleState();
}

if (typeof window !== "undefined") {
  window.openPomodoroCalculator = openPomodoroCalculator;
  window.closePomodoroCalculator = closePomodoroCalculator;
  window.togglePomodoroCalculator = togglePomodoroCalculator;
  window.syncPomodoroCalculatorVisibility = syncPomodoroCalculatorVisibility;

  window.addEventListener("resize", () => {
    const root = getCalcRoot();
    if (!root) return;
    ensureCalcGeometry();
    applyCalcGeometry(root);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!calcState.open || !getCalcRoot()) return;
    closePomodoroCalculator();
  }, true);

  const startCalculatorObserver = () => {
    const view = document.getElementById("app-view");
    if (!view || typeof MutationObserver !== "function") return;
    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(syncPomodoroCalculatorVisibility);
    });
    observer.observe(view, { childList: true });
    syncPomodoroCalculatorVisibility();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startCalculatorObserver, { once: true });
  } else {
    startCalculatorObserver();
  }
}
