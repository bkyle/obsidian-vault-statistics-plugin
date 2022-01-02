
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

	public tokenize(content: string): Array<string> {
		if (content.trim() === "") {
			return [];
		} else {
			const WORD_BOUNDARY = /[ \n\r\t\"\|,\(\)\[\]]+/;
			const NON_WORDS = /^\W+$/;
			const NUMBER = /^\d+(\.\d+)?$/;
			const CODE_BLOCK_HEADER = /^```\w+$/;
			const STRIP_HIGHLIGHTS = /^(==)?(.*?)(==)?$/;
			const STRIP_FORMATTING = /^(_+|\*+)?(.*?)(_+|\*+)?$/;
			const STRIP_PUNCTUATION = /^("|`)?(.*?)(`|\.|:|"|,)?$/;
			const STRIP_WIKI_LINKS = /^(\[\[)?(.*?)(\]\])?$/;

			// TODO: Split on / in token to treat tokens such as "try/catch" as 2 words.
		    // TODO: Strip formatting symbols from the start/end of tokens (e.g. *, **, __, etc)

			let words = content.
				split(WORD_BOUNDARY).
				filter(word => !NON_WORDS.exec(word)).
				filter(word => !NUMBER.exec(word)).
				filter(word => !CODE_BLOCK_HEADER.exec(word)).
				map(word => STRIP_HIGHLIGHTS.exec(word)[2]).
				map(word => STRIP_FORMATTING.exec(word)[2]).
				map(word => STRIP_PUNCTUATION.exec(word)[2]).
				map(word => STRIP_WIKI_LINKS.exec(word)[2]).
				filter(word => word.length > 0);

			// console.log(words);
			return words;
		}
	}
}

export const UNIT_TOKENIZER = new UnitTokenizer();
export const MARKDOWN_TOKENIZER = new MarkdownTokenizer();

export {};
