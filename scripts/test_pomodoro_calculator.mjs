/**
 * Kiểm thử bộ phân tích biểu thức của Máy tính khoa học FX-580 (Phòng Pomodoro).
 * Chạy: node scripts/test_pomodoro_calculator.mjs
 */
import assert from "node:assert/strict";
import { evaluateCalcExpression, formatCalcResult } from "../public/pomodoro-calculator.js";

function calc(expression, context = {}) {
  return formatCalcResult(evaluateCalcExpression(expression, context));
}

const valueCases = [
  ["2+3*4", "14"],
  ["2(3+4)", "14"],
  ["2(3+4)^2", "98"],
  ["1/2pi", "0.1591549431"],
  ["2^3^2", "512"],
  ["-2^2", "-4"],
  ["100*15%", "15"],
  ["50%", "0.5"],
  ["5!", "120"],
  ["(2+3)!", "120"],
  ["ncr(5,2)", "10"],
  ["npr(5,2)", "20"],
  ["√(9)", "3"],
  ["∛(27)", "3"],
  ["log(1000)", "3"],
  ["ln(e)", "1"],
  ["mod(17,5)", "2"],
  ["abs(-5)", "5"],
  ["round(3.14159,2)", "3.14"],
  ["(2+3", "5"],
  ["2sin(30)", "1"]
];

for (const [expression, expected] of valueCases) {
  assert.equal(calc(expression, { angle: "DEG" }), expected, `Sai kết quả: ${expression}`);
}

assert.equal(calc("sin(30)", { angle: "DEG" }), "0.5", "sin 30° phải bằng 0.5");
assert.equal(calc("sin(30)", { angle: "RAD" }), "-0.9880316241", "sin 30 rad phải tính theo radian");
assert.equal(calc("asin(0.5)", { angle: "DEG" }), "30", "asin 0.5 theo DEG phải bằng 30");
assert.equal(calc("Ans+5", { ans: 10 }), "15", "Ans phải tham chiếu kết quả trước");
assert.equal(calc("M*2", { memory: 7 }), "14", "M phải tham chiếu biến nhớ");
assert.equal(calc("123456789*987654321"), "1.219326311×10^17", "Số lớn phải hiển thị dạng khoa học");

for (const expression of ["1/0", "sqrt(-1)", "ln(0)", "tan(90)", "2^^3", "abc(2)"]) {
  assert.throws(() => evaluateCalcExpression(expression, { angle: "DEG" }), undefined, `Phải báo lỗi: ${expression}`);
}

console.log(`✅ Máy tính FX-580: ${valueCases.length + 7} kiểm tra biểu thức đều đạt.`);
