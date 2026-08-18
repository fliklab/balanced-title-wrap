import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the title wrapping preview", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Balance Wrap Lab/);
  assert.match(html, /제목 줄바꿈을 눈으로 조율하세요/);
  assert.match(html, /글자 크기/);
  assert.match(html, /제목 영역 폭/);
  assert.match(html, /문장부호 우선 균형/);
  assert.match(html, /코드 보기/);
  assert.doesNotMatch(html, /codex-preview/);
});
