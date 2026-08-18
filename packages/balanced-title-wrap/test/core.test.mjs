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

test("prioritizes punctuation boundaries followed by whitespace", () => {
  assert.deepEqual(
    balanceTitle("그렇지만, 우리는 중요하게 생각하는 것이 따로 있다.", 13, characterWidth),
    ["그렇지만,", "우리는 중요하게 생각하는", "것이 따로 있다."],
  );
  assert.deepEqual(
    balanceTitle("아니다. 좋은 것은 기능이 아니라 디자인이다.", 22, characterWidth),
    ["아니다.", "좋은 것은 기능이 아니라 디자인이다."],
  );
  assert.deepEqual(
    balanceTitle("정말! 우리는 함께 간다.", 11, characterWidth),
    ["정말!", "우리는 함께 간다."],
  );
  assert.deepEqual(
    balanceTitle("왜일까? 다시 생각한다.", 10, characterWidth),
    ["왜일까?", "다시 생각한다."],
  );
});

test("treats punctuation as a weighted candidate instead of a forced break", () => {
  assert.deepEqual(
    balanceTitle("첫 문장이다. 둘째 문장이다. 마지막 내용", 15, characterWidth),
    ["첫 문장이다.", "둘째 문장이다. 마지막 내용"],
  );
});

test("allows a substantially better balance to outweigh punctuation", () => {
  assert.deepEqual(
    balanceTitle("짧다. 하나 둘 셋 넷 다 라", 12, characterWidth),
    ["짧다. 하나 둘", "셋 넷 다 라"],
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
  assert.equal(hasPriorityEnding("질문?"), true);
  assert.equal(hasPriorityEnding("감탄!"), true);
  assert.throws(() => balanceTitle("제목", 0, characterWidth), RangeError);
  assert.throws(
    () => balanceTitle("하나 둘", 3, characterWidth, { priorityBreakBonus: -1 }),
    RangeError,
  );
});
