import assert from "node:assert/strict";
import test from "node:test";
import {
  balanceTitle,
  hasPriorityEnding,
  normalizeTitle,
} from "../dist/index.js";

const characterWidth = (value) => [...value].length;

test("keeps text on one line when it fits", () => {
  assert.deepEqual(
    balanceTitle("좋아. 그렇게 가자.", 20, characterWidth),
    ["좋아. 그렇게 가자."],
  );
});

test("balances multiple lines without splitting words", () => {
  assert.deepEqual(
    balanceTitle("마케팅에서 중요하게 생각하는 법칙은 단 하나", 14, characterWidth),
    ["마케팅에서 중요하게", "생각하는 법칙은 단 하나"],
  );
});

test("prioritizes comma and period boundaries followed by whitespace", () => {
  assert.deepEqual(
    balanceTitle("그렇지만, 우리는 중요하게 생각하는 것이 따로 있다.", 13, characterWidth),
    ["그렇지만,", "우리는 중요하게 생각하는", "것이 따로 있다."],
  );
  assert.deepEqual(
    balanceTitle("아니다. 좋은 것은 기능이 아니라 디자인이다.", 22, characterWidth),
    ["아니다.", "좋은 것은 기능이 아니라 디자인이다."],
  );
});

test("does not treat punctuation joined to following text as a boundary", () => {
  const lines = balanceTitle(
    "36.5도의 온도는 처음으로 회원가입했을 때의 기본값이다.",
    18,
    characterWidth,
  );
  assert.deepEqual(lines, ["36.5도의 온도는 처음으로", "회원가입했을 때의 기본값이다."]);
});

test("supports custom priority endings", () => {
  assert.deepEqual(
    balanceTitle("첫째; 둘째 셋째", 8, characterWidth, { priorityEndings: [";"] }),
    ["첫째;", "둘째 셋째"],
  );
});

test("normalizes whitespace and validates maxWidth", () => {
  assert.equal(normalizeTitle("  하나\n\t둘  "), "하나 둘");
  assert.equal(hasPriorityEnding("문장."), true);
  assert.throws(() => balanceTitle("제목", 0, characterWidth), RangeError);
});
