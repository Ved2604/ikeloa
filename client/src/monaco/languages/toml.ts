import type * as Monaco from "monaco-editor";

export const TOML_LANGUAGE_ID = "toml";

export const registerToml = (monaco: typeof Monaco): void => {
  monaco.languages.register({
    id: TOML_LANGUAGE_ID,
    extensions: [".toml"],
    filenames: ["pyproject.toml", "Cargo.toml", "config.toml"],
    aliases: ["TOML", "toml"],
  });

  monaco.languages.setMonarchTokensProvider(TOML_LANGUAGE_ID, {
    tokenizer: {
      root: [
        // Comments
        [/#.*$/, "comment"],

        // Table headers like [section] and [[array]]
        [/^\s*\[\[.*\]\]/, "type.identifier"],
        [/^\s*\[.*\]/, "type"],

        // Keys before =
        [/^[a-zA-Z_][a-zA-Z0-9_.-]*(?=\s*=)/, "variable"],
        [/^\s+[a-zA-Z_][a-zA-Z0-9_.-]*(?=\s*=)/, "variable"],

        // Equals sign
        [/=/, "operator"],

        // Booleans
        [/\b(true|false)\b/, "keyword.constant"],

        // Dates like 2023-01-01
        [/\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/, "number.float"],

        // Multi-line strings
        [/"""/, { token: "string", next: "@multilineString" }],
        [/'''/, { token: "string", next: "@multilineStringLiteral" }],

        // Regular strings
        [/"([^"\\]|\\.)*"/, "string"],
        [/'[^']*'/, "string"],

        // Numbers — float first then int
        [/[+-]?\d+\.\d+([eE][+-]?\d+)?/, "number.float"],
        [/[+-]?\d+([eE][+-]?\d+)?/, "number"],
        [/0x[0-9a-fA-F]+/, "number.hex"],

        // Brackets for arrays and inline tables
        [/[\[\]{}]/, "delimiter"],
        [/,/, "delimiter"],
      ],

      multilineString: [
        [/"""/, { token: "string", next: "@pop" }],
        [/./, "string"],
      ],

      multilineStringLiteral: [
        [/'''/, { token: "string", next: "@pop" }],
        [/./, "string"],
      ],
    },
  });

  // Autocomplete for common TOML patterns
  monaco.languages.registerCompletionItemProvider(TOML_LANGUAGE_ID, {
    provideCompletionItems: (_model, _position) => {
      const suggestions = [
        {
          label: "[tool.poetry]",
          kind: monaco.languages.CompletionItemKind.Module,
          insertText: [
            "[tool.poetry]",
            'name = "${1:project-name}"',
            'version = "${2:0.1.0}"',
            'description = "${3:}"',
            'authors = ["${4:Your Name <you@example.com>}"]',
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Poetry project configuration",
          range: undefined as unknown as Monaco.IRange,
        },
        {
          label: "[dependencies]",
          kind: monaco.languages.CompletionItemKind.Module,
          insertText: [
            "[tool.poetry.dependencies]",
            'python = "${1:^3.9}"',
            '${2:package} = "${3:^1.0.0}"',
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Poetry dependencies section",
          range: undefined as unknown as Monaco.IRange,
        },
        {
          label: "[build-system]",
          kind: monaco.languages.CompletionItemKind.Module,
          insertText: [
            "[build-system]",
            'requires = ["${1:poetry-core}"]',
            'build-backend = "${2:poetry.core.masonry.api}"',
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Build system configuration",
          range: undefined as unknown as Monaco.IRange,
        },
        {
          label: "[[package]]",
          kind: monaco.languages.CompletionItemKind.Module,
          insertText: [
            "[[package]]",
            'name = "${1:package-name}"',
            'version = "${2:1.0.0}"',
            'description = "${3:}"',
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Array of tables entry",
          range: undefined as unknown as Monaco.IRange,
        },
      ];
      return { suggestions };
    },
  });
};
