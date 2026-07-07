const TEACHER_MODE_KEY = "jmgTeacherMode";

const LOCKED_PAGES = new Set([
  "chapter3.html",
  "3map1.html",
  "3map2.html",
  "3map3.html",
  "3map4.html",
  "3map5.html",
  "chapter4.html",
  "4map1.html",
  "4map2.html",
  "4map3.html",
  "4map4.html",
  "4map5.html"
]);

const params = new URLSearchParams(window.location.search);

if (params.get("teacher") === "1") {
  localStorage.setItem(TEACHER_MODE_KEY, "1");
}

if (params.get("student") === "1" || params.get("teacher") === "0") {
  localStorage.removeItem(TEACHER_MODE_KEY);
}

export function isTeacherMode() {
  return localStorage.getItem(TEACHER_MODE_KEY) === "1";
}

export function clearTeacherMode() {
  localStorage.removeItem(TEACHER_MODE_KEY);
}

export function getStudentSafeUrl(targetUrl) {
  if (isTeacherMode()) return targetUrl;
  const target = normalizeRelativeTarget(targetUrl);
  return LOCKED_PAGES.has(targetFileName(target))
    ? `./locked.html?from=${encodeURIComponent(target)}`
    : targetUrl;
}

function currentFileName() {
  const fileName = window.location.pathname.split("/").pop();
  return fileName || "index.html";
}

function normalizeRelativeTarget(targetUrl) {
  if (!targetUrl) return "chapter2.html";
  return targetUrl.replace(/^\.\//, "");
}

function targetFileName(targetUrl) {
  return normalizeRelativeTarget(targetUrl).split(/[?#]/)[0].split("/").pop() || "index.html";
}

function safeRelativeUrl(value, fallback = "chapter2.html") {
  const target = normalizeRelativeTarget(value || fallback);
  if (target.includes(":") || target.startsWith("/") || target.startsWith("//")) {
    return `./${fallback}`;
  }
  return `./${target}`;
}

const fileName = currentFileName();

if (fileName === "locked.html" && isTeacherMode()) {
  const from = params.get("from");
  if (from) {
    window.location.replace(safeRelativeUrl(from));
  }
}

if (LOCKED_PAGES.has(fileName) && !isTeacherMode()) {
  const target = `${fileName}${window.location.search}${window.location.hash}`;
  document.documentElement.classList.add("jmg-access-redirecting");
  window.location.replace(`./locked.html?from=${encodeURIComponent(target)}`);
}
