import type * as Monaco from "monaco-editor";

export const DOTENV_LANGUAGE_ID = "dotenv";

export const registerDotenv = (monaco: typeof Monaco): void => {
  monaco.languages.register({
    id: DOTENV_LANGUAGE_ID,
    extensions: [
      ".env",
      ".env.local",
      ".env.development",
      ".env.production",
      ".env.test",
    ],
    filenames: [".env", ".env.local", ".env.development", ".env.production"],
    aliases: ["Environment Variables", "dotenv"],
  });

  monaco.languages.setMonarchTokensProvider(DOTENV_LANGUAGE_ID, {
    tokenizer: {
      root: [
        // Comments
        [/#.*$/, "comment"],

        // Export keyword
        [/^export\s+/, "keyword"],

        // Key part before =
        [/^[A-Za-z_][A-Za-z0-9_]*(?==)/, "variable"],

        // Equals sign
        [/=/, "operator"],

        // Quoted string values
        [/"([^"\\]|\\.)*"/, "string"],
        [/'([^'\\]|\\.)*'/, "string"],

        // Special values
        [/\b(true|false|null|undefined)\b/, "keyword.constant"],

        // URLs
        [/https?:\/\/[^\s]+/, "string.link"],

        // Numbers
        [/\b\d+\b/, "number"],

        // Unquoted values — everything after = until end of line
        [/[^#\n]+/, "string"],
      ],
    },
  });

  // Autocomplete common env variable names
  monaco.languages.registerCompletionItemProvider(DOTENV_LANGUAGE_ID, {
    provideCompletionItems: (_model, _position) => {
      const suggestions = [
        {
          label: "DATABASE_URL",
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText:
            "DATABASE_URL=${1:postgresql://user:password@localhost:5432/dbname}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Database connection URL",
          range: undefined as unknown as Monaco.IRange,
        },
        {
          label: "PORT",
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText: "PORT=${1:3000}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Port the server listens on",
          range: undefined as unknown as Monaco.IRange,
        },
        {
          label: "NODE_ENV",
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText: "NODE_ENV=${1|development,production,test|}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Node.js environment",
          range: undefined as unknown as Monaco.IRange,
        },
        {
          label: "API_KEY",
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText: "API_KEY=${1:your-api-key}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "API key for external service",
          range: undefined as unknown as Monaco.IRange,
        },
        {
          label: "SECRET_KEY",
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText: "SECRET_KEY=${1:your-secret-key}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Secret key for encryption or signing",
          range: undefined as unknown as Monaco.IRange,
        },
        {
          label: "JWT_SECRET",
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText: "JWT_SECRET=${1:your-jwt-secret}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Secret used to sign JWT tokens",
          range: undefined as unknown as Monaco.IRange,
        },
        {
          label: "REDIS_URL",
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText: "REDIS_URL=${1:redis://localhost:6379}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Redis connection URL",
          range: undefined as unknown as Monaco.IRange,
        },
        {
          label: "AWS_ACCESS_KEY_ID",
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText: "AWS_ACCESS_KEY_ID=${1:your-access-key}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "AWS access key ID",
          range: undefined as unknown as Monaco.IRange,
        },
        {
          label: "AWS_SECRET_ACCESS_KEY",
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText: "AWS_SECRET_ACCESS_KEY=${1:your-secret-key}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "AWS secret access key",
          range: undefined as unknown as Monaco.IRange,
        },
        {
          label: "CORS_ORIGIN",
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText: "CORS_ORIGIN=${1:http://localhost:3000}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Allowed CORS origin",
          range: undefined as unknown as Monaco.IRange,
        },
      ];
      return { suggestions };
    },
  });
};
