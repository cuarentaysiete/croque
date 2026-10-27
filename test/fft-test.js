#!/usr/bin/env node
/*
 * Croque — FFT engine test.
 *
 * Validates the pure-JS Cooley–Tukey engine embedded in index.html, without
 * a browser, canvas or any dependency. Run with:
 *
 *     node test/fft-test.js
 *
 * Exits non-zero if any check fails. The engine is extracted from index.html
 * by function name (brace-matched), so the test always exercises the exact
 * code that ships in the app.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.error("FAIL: <script> block not found in index.html"); process.exit(1); }
const script = m[1];

// Extract a top-level function declaration by name, brace-matched, so this
// does not depend on section-comment wording.
function extractFn(name) {
  const start = script.indexOf("function " + name + "(");
  if (start < 0) throw new Error("function " + name + "() not found in index.html");
  const open = script.indexOf("{", start);
  let depth = 0;
  for (let j = open; j < script.length; j++) {
    if (script[j] === "{") depth++;
    else if (script[j] === "}") { if (--depth === 0) return script.slice(start, j + 1); }
  }
  throw new Error("unbalanced braces in " + name + "()");
}

const engine =
  "let N, twRe, twIm, rev, workRe, workIm;\n" +
  extractFn("halfShift") + "\n" +
  extractFn("prepFFT") + "\n" +
  extractFn("fft1D") + "\n" +
  extractFn("fft2D") + "\n";

// Deterministic LCG so the "random" image is reproducible across runs.
const testBody = `
let failures = 0, checks = 0;
function report(name, ok, detail) {
  checks++;
  console.log((ok ? "ok   " : "FAIL ") + name + (detail ? "  — " + detail : ""));
  if (!ok) failures++;
}

// Deterministic pseudo-random in [0, 1).
let seed = 1;
function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }

// ---- 1) Forward FFT vs naive O(N^2) DFT (float32 input) ----
N = 16; prepFFT();
const n = N;
const x = new Float32Array(n * n), xi = new Float32Array(n * n);
for (let i = 0; i < n * n; i++) x[i] = rnd() * 255;
const xc = new Float32Array(x);
fft2D(x, xi, false);
let maxErr = 0;
for (let y = 0; y < n; y++) for (let xp = 0; xp < n; xp++) {
  let cr = 0, ci = 0;
  for (let yy = 0; yy < n; yy++) for (let xx = 0; xx < n; xx++) {
    const a = -2 * Math.PI * (xp * xx / n + y * yy / n);
    cr += xc[yy * n + xx] * Math.cos(a);
    ci += xc[yy * n + xx] * Math.sin(a);
  }
  const i = y * n + xp;
  maxErr = Math.max(maxErr, Math.hypot(x[i] - cr, xi[i] - ci));
}
// Tolerance is relative to the transform's own magnitude scale.
report("forward FFT matches naive DFT", maxErr < 0.02, "maxErr=" + maxErr.toExponential(2));

// ---- 2) Inverse round-trip: IFFT(FFT(x)) == x (includes 1/N^2 scaling) ----
x.set(xc); xi.fill(0);
fft2D(x, xi, false);
fft2D(x, xi, true);
let rt = 0;
for (let i = 0; i < n * n; i++) rt = Math.max(rt, Math.abs(x[i] - xc[i]) + Math.abs(xi[i]));
report("IFFT(FFT(x)) == x (round-trip + 1/N^2 scale)", rt < 1e-3, "maxErr=" + rt.toExponential(2));

// ---- 3) Hermitian symmetry: centered spectrum of a real image is conjugate-symmetric ----
const re = new Float32Array(xc), im = new Float32Array(n * n);
fft2D(re, im, false);
const rc = new Float32Array(n * n), ic = new Float32Array(n * n);
halfShift(re, im, rc, ic);
let herm = 0;
for (let y = 0; y < n; y++) for (let xp = 0; xp < n; xp++) {
  const j = ((n - y) % n) * n + ((n - xp) % n);
  herm = Math.max(herm, Math.abs(rc[j] - rc[y * n + xp]) + Math.abs(ic[j] + ic[y * n + xp]));
}
report("centered spectrum is Hermitian (F(-u,-v)=F*(u,v))", herm < 1e-2, "maxErr=" + herm.toExponential(2));

// ---- 4) Real output: IFFT of a Hermitian spectrum has ~zero imaginary part ----
halfShift(rc, ic, workRe, workIm);
fft2D(workRe, workIm, true);
let imMax = 0;
for (let i = 0; i < n * n; i++) imMax = Math.max(imMax, Math.abs(workIm[i]));
// float32: an imaginary part this small (vs a 0..255 real image) is real.
report("IFFT of Hermitian spectrum is real", imMax < 1e-3, "|Im|max=" + imMax.toExponential(2));

// ---- 5) Throughput at app scale (informational; lenient bound for CI) ----
N = 512; prepFFT();
const big = new Float32Array(N * N), bi = new Float32Array(N * N);
for (let i = 0; i < big.length; i++) big[i] = rnd() * 255;
const t0 = Date.now();
fft2D(big, bi, false);
const fwd = Date.now() - t0;
const t1 = Date.now();
fft2D(big, bi, true);
const inv = Date.now() - t1;
console.log("info  512x512: forward " + fwd + " ms, inverse " + inv + " ms");
report("512x512 forward+inverse under 2s (CI safety bound)", fwd + inv < 2000, fwd + inv + " ms");

console.log("");
console.log(failures === 0 ? "ALL " + checks + " CHECKS PASSED" : failures + "/" + checks + " CHECKS FAILED");
process.exit(failures === 0 ? 0 : 1);
`;

try {
  vm.runInNewContext(engine + testBody, { console, Date, Math, Float32Array, Uint32Array, process }, { timeout: 30000 });
} catch (e) {
  console.error("FAIL: exception during test — " + e.message);
  process.exit(1);
}
