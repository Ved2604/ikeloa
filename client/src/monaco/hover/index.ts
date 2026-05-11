import type * as Monaco from "monaco-editor";
import { getKeywordExplanation, isKnownKeyword } from "./keywords";
import { fetchLLMExplanation, buildContextFromModel } from "./llmHover";

export const registerHoverProvider = (monaco: typeof Monaco): void => {
  // Register once for ALL languages using wildcard
  monaco.languages.registerHoverProvider("*", {
    provideHover: async (
      model: Monaco.editor.ITextModel,
      position: Monaco.Position,
      token: Monaco.CancellationToken,
    ): Promise<Monaco.languages.Hover | null> => {
      const wordInfo = model.getWordAtPosition(position);
      if (!wordInfo) return null;

      const word = wordInfo.word;
      if (!word || word.length < 2) return null;

      const range = new monaco.Range(
        position.lineNumber,
        wordInfo.startColumn,
        position.lineNumber,
        wordInfo.endColumn,
      );

      // Static keyword — instant, no API call
      if (isKnownKeyword(word)) {
        const explanation = getKeywordExplanation(word)!;

        const contents: Monaco.IMarkdownString[] = [
          {
            value: `**${word}**  \n${explanation.summary}`,
            isTrusted: true,
          },
        ];

        if (explanation.detail) {
          contents.push({
            value: explanation.detail,
            isTrusted: true,
          });
        }

        if (explanation.example) {
          contents.push({
            value: `\`\`\`\n${explanation.example}\n\`\`\``,
            isTrusted: true,
          });
        }

        return { contents, range };
      }

      // Unknown word — LLM
      if (token.isCancellationRequested) return null;

      const modelContent = model.getValue();
      const language = model.getLanguageId();
      const context = buildContextFromModel(
        modelContent,
        position.lineNumber,
        language,
      );

      try {
        const explanation = await fetchLLMExplanation(word, context, language);
        if (token.isCancellationRequested) return null;

        return {
          contents: [
            {
              value: `**${word}**  \n${explanation}`,
              isTrusted: true,
            },
            {
              value: `_✨ AI-powered explanation_`,
              isTrusted: true,
            },
          ],
          range,
        };
      } catch {
        return null;
      }
    },
  });

  console.log("[HoverProvider] Registered for all languages");
};
