
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
    return STRIP_HIGHLIGHTS.exec(token)[2];
  }

  private stripFormatting(token: string): string {
    const STRIP_FORMATTING = /^(_+|\*+)?(.*?)(_+|\*+)?$/;
    return STRIP_FORMATTING.exec(token)[2];
  }

  private stripPunctuation(token: string): string {
    const STRIP_PUNCTUATION = /^(`|\.|:|"|,|!|\?)?(.*?)(`|\.|:|"|,|!|\?)?$/;
    return STRIP_PUNCTUATION.exec(token)[2];
  }

  private stripWikiLinks(token: string): string {
    const STRIP_WIKI_LINKS = /^(\[\[)?(.*?)(\]\])?$/;
    return STRIP_WIKI_LINKS.exec(token)[2];
  }

  private stripAll(token: string): string {
    if (token === "") {
      return token;
    }

    let isFixedPoint = false;
    while (!isFixedPoint) {
      let prev = token;
      token = [token].
        map(this.stripHighlights).
        map(this.stripFormatting).
        map(this.stripPunctuation).
        map(this.stripWikiLinks)[0];
      isFixedPoint = isFixedPoint || prev === token;
    }
    return token;
  }

  public tokenize(content: string): Array<string> {
    if (content.trim() === "") {
      return [];
    } else {
      const WORD_BOUNDARY = /[ \n\r\t\"\|,\(\)\[\]/]+/;
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
