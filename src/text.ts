
export interface Tokenizer {
  tokenize(content: string): Array<string>;
}

/**
 * The {@link UnitTokenizer} is a constant tokenizer that always returns an
 * empty list.
 */
class UnitTokenizer implements Tokenizer {
  public tokenize(_: string): Array<string> {
    return [];
  }
}

/**
 * {@link MarkdownTokenizer} understands how to tokenize markdown text into word
 * tokens.
 */
class MarkdownTokenizer implements Tokenizer {

  private isNonWord(token: string): boolean {
    const NON_WORDS = /^\W+$/;
    return !!NON_WORDS.exec(token);
  }

  private isNumber(token: string): boolean {
    const NUMBER = /^\d+(\.\d+)?$/;
    return !!NUMBER.exec(token);
  }

  private isCodeBlockHeader(token: string): boolean {
    const CODE_BLOCK_HEADER = /^```\w+$/;
    return !!CODE_BLOCK_HEADER.exec(token);
  }

  private stripHighlights(token: string): string {
    const STRIP_HIGHLIGHTS = /^(==)?(.*?)(==)?$/;
    const matches = STRIP_HIGHLIGHTS.exec(token);
    return matches && matches[2] || token;
  }

  private stripFormatting(token: string): string {
    const STRIP_FORMATTING = /^(_+|\*+)?(.*?)(_+|\*+)?$/;
    const matches = STRIP_FORMATTING.exec(token);
    return matches && matches[2] || token;
  }

  private stripPunctuation(token: string): string {
    const STRIP_PUNCTUATION = /^(`|\.|:|"|,|!|\?)?(.*?)(`|\.|:|"|,|!|\?)?$/;
    const matches = STRIP_PUNCTUATION.exec(token);
    return matches && matches[2] || token;
  }

  private stripWikiLinks(token: string): string {
    const STRIP_WIKI_LINKS = /^(\[\[)?(.*?)(\]\])?$/;
    const matches = STRIP_WIKI_LINKS.exec(token);
    return matches && matches[2] || token;
  }

  private stripAll(token: string): string {
    if (token === "") {
      return token;
    }

    let isFixedPoint = false;
    while (!isFixedPoint) {
      let prev = token;
      token = [token].
        map((value) => this.stripHighlights(value)).
        map((value) => this.stripFormatting(value)).
        map((value) => this.stripPunctuation(value)).
        map((value) => this.stripWikiLinks(value))[0] || token;
      isFixedPoint = isFixedPoint || prev === token;
    }
    return token;
  }

  public tokenize(content: string): Array<string> {
    if (content.trim() === "") {
      return [];
    } else {
      const WORD_BOUNDARY = /[ \n\r\t"|,()[\]/]+/;
      let words = content.
        split(WORD_BOUNDARY).
        filter(token => !this.isNonWord(token)).
        filter(token => !this.isNumber(token)).
        filter(token => !this.isCodeBlockHeader(token)).
        map(token => this.stripAll(token)).
        filter(token => token.length > 0);
      return words;
    }
  }
}

export const UNIT_TOKENIZER = new UnitTokenizer();
export const MARKDOWN_TOKENIZER = new MarkdownTokenizer();

export function unit_tokenize(_: string): Array<string> {
  return UNIT_TOKENIZER.tokenize(_);
}

export function markdown_tokenize(content: string): Array<string> {
  return MARKDOWN_TOKENIZER.tokenize(content);
}

export { };
