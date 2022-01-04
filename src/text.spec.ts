import { markdown_tokenize } from './text';


describe("base cases", () => {
  test("empty string yields empty set", () => {
    expect(markdown_tokenize("")).toStrictEqual([]);
  });

  test("single word content yields single element", () => {
    expect(markdown_tokenize("foo")).toStrictEqual(["foo"]);
  });
});

describe("word boundaries", () => {
  test("\\s", () => {
    expect(markdown_tokenize("foo bar baz")).toStrictEqual(["foo", "bar", "baz"]);
  });

  test("\\n", () => {
    expect(markdown_tokenize("foo\nbar\nbaz")).toStrictEqual(["foo", "bar", "baz"]);
  });

  test("\\r", () => {
    expect(markdown_tokenize("foo\rbar\rbaz")).toStrictEqual(["foo", "bar", "baz"]);
  });

  test("\\t", () => {
    expect(markdown_tokenize("foo\tbar\tbaz")).toStrictEqual(["foo", "bar", "baz"]);
  });

  test("\"", () => {
    expect(markdown_tokenize("foo \"bar\" baz")).toStrictEqual(["foo", "bar", "baz"]);
  });

  test("|", () => {
    expect(markdown_tokenize("foo|bar|baz")).toStrictEqual(["foo", "bar", "baz"]);
  });

  test(",", () => {
    expect(markdown_tokenize("foo,bar,baz")).toStrictEqual(["foo", "bar", "baz"]);
  });

  test("( and )", () => {
    expect(markdown_tokenize("foo(bar)baz")).toStrictEqual(["foo", "bar", "baz"]);
  });

  test("[ and ]", () => {
    expect(markdown_tokenize("foo[bar]baz")).toStrictEqual(["foo", "bar", "baz"]);
  });
});

describe("punctuation handling", () => {
  test("strips punctuation characters", () => {
    expect(markdown_tokenize("foo\nbar\nbaz")).toStrictEqual(["foo", "bar", "baz"]);
  });
});

describe("filtering", () => {
  test("non-words are removed", () => {
    expect(markdown_tokenize("!")).toStrictEqual([]);
    expect(markdown_tokenize("@")).toStrictEqual([]);
    expect(markdown_tokenize("#")).toStrictEqual([]);
    expect(markdown_tokenize("$")).toStrictEqual([]);
    expect(markdown_tokenize("%")).toStrictEqual([]);
    expect(markdown_tokenize("^")).toStrictEqual([]);
    expect(markdown_tokenize("&")).toStrictEqual([]);
    expect(markdown_tokenize("*")).toStrictEqual([]);
    expect(markdown_tokenize("(")).toStrictEqual([]);
    expect(markdown_tokenize(")")).toStrictEqual([]);
    expect(markdown_tokenize("`")).toStrictEqual([]);
  });

  test("numbers are not words", () => {
    expect(markdown_tokenize("1")).toStrictEqual([]);
    expect(markdown_tokenize("123")).toStrictEqual([]);
    expect(markdown_tokenize("1231231")).toStrictEqual([]);
  });

  test("code block headers", () => {
    expect(markdown_tokenize("```")).toStrictEqual([]);
    expect(markdown_tokenize("```java")).toStrictEqual([]);
    expect(markdown_tokenize("```perl")).toStrictEqual([]);
    expect(markdown_tokenize("```python")).toStrictEqual([]);
  })
});

describe("strip punctuation", () => {
  test("highlights", () => {
    expect(markdown_tokenize("==foo")).toStrictEqual(["foo"]);
    expect(markdown_tokenize("foo==")).toStrictEqual(["foo"]);
    expect(markdown_tokenize("==foo==")).toStrictEqual(["foo"]);
  });

  test("formatting", () => {
    expect(markdown_tokenize("*foo")).toStrictEqual(["foo"]);
    expect(markdown_tokenize("foo*")).toStrictEqual(["foo"]);
    expect(markdown_tokenize("*foo*")).toStrictEqual(["foo"]);

    expect(markdown_tokenize("**foo")).toStrictEqual(["foo"]);
    expect(markdown_tokenize("foo**")).toStrictEqual(["foo"]);
    expect(markdown_tokenize("**foo**")).toStrictEqual(["foo"]);

    expect(markdown_tokenize("__foo")).toStrictEqual(["foo"]);
    expect(markdown_tokenize("foo__")).toStrictEqual(["foo"]);
    expect(markdown_tokenize("__foo__")).toStrictEqual(["foo"]);
  });

  test("punctuation", () => {
    expect(markdown_tokenize("\"foo")).toStrictEqual(["foo"]);
    expect(markdown_tokenize("foo\"")).toStrictEqual(["foo"]);
    expect(markdown_tokenize("\"foo\"")).toStrictEqual(["foo"]);

    expect(markdown_tokenize("`foo")).toStrictEqual(["foo"]);
    expect(markdown_tokenize("foo`")).toStrictEqual(["foo"]);
    expect(markdown_tokenize("`foo`")).toStrictEqual(["foo"]);

    expect(markdown_tokenize("foo:")).toStrictEqual(["foo"]);
    expect(markdown_tokenize("foo.")).toStrictEqual(["foo"]);
    expect(markdown_tokenize("foo,")).toStrictEqual(["foo"]);
  });

  test("wiki links", () => {
    expect(markdown_tokenize("[[foo")).toStrictEqual(["foo"]);
    expect(markdown_tokenize("foo]]")).toStrictEqual(["foo"]);
    expect(markdown_tokenize("[[foo]]")).toStrictEqual(["foo"]);
  });
});
