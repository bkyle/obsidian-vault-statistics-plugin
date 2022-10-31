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

  test("/", () => {
    expect(markdown_tokenize("foo/bar")).toStrictEqual(["foo", "bar"]);
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
    expect(markdown_tokenize("foo?")).toStrictEqual(["foo"]);
    expect(markdown_tokenize("foo!")).toStrictEqual(["foo"]);
  });

  test("callouts", () => {
    expect(markdown_tokenize("[!foo]")).toStrictEqual(["foo"]);
    expect(markdown_tokenize("[!foo bar]")).toStrictEqual(["foo", "bar"]);
  });

  test("wiki links", () => {
    expect(markdown_tokenize("[[foo")).toStrictEqual(["foo"]);
    expect(markdown_tokenize("foo]]")).toStrictEqual(["foo"]);
    expect(markdown_tokenize("[[foo]]")).toStrictEqual(["foo"]);
  });

  test("combinations", () => {
    expect(markdown_tokenize("_**foo**_:]],:`.`")).toStrictEqual(["foo"]);
  });

  test("CJK tokens", () => {
    expect(markdown_tokenize("中文/Chinese")).toStrictEqual(["中", "文", "Chinese"]);
    expect(markdown_tokenize("日本语/Japanese")).toStrictEqual(["日", "本", "语", "Japanese"]);
    expect(markdown_tokenize("한글/Korean")).toStrictEqual(["한", "글", "Korean"]);
  });
});

describe("integration tests", () => {
  test("sentences", () => {
    expect(markdown_tokenize("Lorem ipsum dolor sit amet, consectetur adipiscing elit.")).
      toStrictEqual([
        "Lorem",
        "ipsum",
        "dolor",
        "sit",
        "amet",
        "consectetur",
        "adipiscing",
        "elit",
      ]);
  });

  test("paragraphs", () => {
    expect(markdown_tokenize("Lorem ipsum dolor sit amet, consectetur adipiscing elit. \
Curabitur facilisis iaculis turpis eu viverra. Donec rhoncus sit amet velit vel euismod. \
Aenean eros orci, tincidunt a odio sed, pellentesque mattis magna. Praesent id turpis \
placerat, scelerisque sapien pharetra, suscipit erat. Quisque sed consectetur diam, \
fermentum volutpat dolor. Suspendisse et dictum tellus, in laoreet nisi. Sed nec porta \
felis. Morbi ultrices metus non metus facilisis mollis. Proin id finibus velit, in \
blandit nulla. Vivamus id posuere dui.")).
      toStrictEqual([
        "Lorem",
        "ipsum",
        "dolor",
        "sit",
        "amet",
        "consectetur",
        "adipiscing",
        "elit",
        "Curabitur",
        "facilisis",
        "iaculis",
        "turpis",
        "eu",
        "viverra",
        "Donec",
        "rhoncus",
        "sit",
        "amet",
        "velit",
        "vel",
        "euismod",
        "Aenean",
        "eros",
        "orci",
        "tincidunt",
        "a",
        "odio",
        "sed",
        "pellentesque",
        "mattis",
        "magna",
        "Praesent",
        "id",
        "turpis",
        "placerat",
        "scelerisque",
        "sapien",
        "pharetra",
        "suscipit",
        "erat",
        "Quisque",
        "sed",
        "consectetur",
        "diam",
        "fermentum",
        "volutpat",
        "dolor",
        "Suspendisse",
        "et",
        "dictum",
        "tellus",
        "in",
        "laoreet",
        "nisi",
        "Sed",
        "nec",
        "porta",
        "felis",
        "Morbi",
        "ultrices",
        "metus",
        "non",
        "metus",
        "facilisis",
        "mollis",
        "Proin",
        "id",
        "finibus",
        "velit",
        "in",
        "blandit",
        "nulla",
        "Vivamus",
        "id",
        "posuere",
        "dui",
      ]);
  });

  test("callouts", () => {
    expect(markdown_tokenize("> [!Lorem]\
> Ipsum, dolor sit amet.")).
    toStrictEqual([
      "Lorem",
      "Ipsum",
      "dolor",
      "sit",
      "amet",
    ]);
  });
});
