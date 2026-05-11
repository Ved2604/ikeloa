import type * as Monaco from "monaco-editor";

export const DOCKERFILE_LANGUAGE_ID = "dockerfile-enhanced";

export const registerDockerfile = (monaco: typeof Monaco): void => {
  monaco.languages.register({
    id: DOCKERFILE_LANGUAGE_ID,
    extensions: ["Dockerfile", ".dockerfile"],
    filenames: ["Dockerfile", "Dockerfile.dev", "Dockerfile.prod"],
    aliases: ["Dockerfile", "dockerfile"],
  });

  monaco.languages.setMonarchTokensProvider(DOCKERFILE_LANGUAGE_ID, {
    // All Dockerfile instructions
    instructions: [
      "FROM",
      "RUN",
      "CMD",
      "LABEL",
      "EXPOSE",
      "ENV",
      "ADD",
      "COPY",
      "ENTRYPOINT",
      "VOLUME",
      "USER",
      "WORKDIR",
      "ARG",
      "ONBUILD",
      "STOPSIGNAL",
      "HEALTHCHECK",
      "SHELL",
      "MAINTAINER",
      "AS",
    ],

    tokenizer: {
      root: [
        // Comments
        [/#.*$/, "comment"],

        // Instructions at start of line
        [
          /^(FROM|RUN|CMD|LABEL|EXPOSE|ENV|ADD|COPY|ENTRYPOINT|VOLUME|USER|WORKDIR|ARG|ONBUILD|STOPSIGNAL|HEALTHCHECK|SHELL|MAINTAINER)/,
          "keyword",
        ],

        // AS keyword in multi-stage builds
        [/\bAS\b/, "keyword.control"],

        // Strings
        [/"([^"\\]|\\.)*"/, "string"],
        [/'([^'\\]|\\.)*'/, "string"],

        // Variables like $VAR or ${VAR}
        [/\$\{[^}]+\}/, "variable"],
        [/\$[A-Za-z_][A-Za-z0-9_]*/, "variable"],

        // Image tags like ubuntu:20.04
        [/[a-zA-Z0-9._/-]+:[a-zA-Z0-9._-]+/, "type"],

        // Numbers
        [/\b\d+\b/, "number"],

        // Flags like --no-cache --from=builder
        [/--[a-zA-Z-]+=?/, "attribute"],
      ],
    },
  });

  // Autocomplete for Dockerfile instructions
  monaco.languages.registerCompletionItemProvider(DOCKERFILE_LANGUAGE_ID, {
    provideCompletionItems: (_model, _position) => {
      const suggestions = [
        {
          label: "FROM",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "FROM ${1:image}:${2:tag}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Sets the base image for subsequent instructions",
          range: undefined as unknown as Monaco.IRange,
        },
        {
          label: "RUN",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "RUN ${1:command}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Executes commands in a new layer",
          range: undefined as unknown as Monaco.IRange,
        },
        {
          label: "COPY",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "COPY ${1:src} ${2:dest}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Copies files from build context into the container",
          range: undefined as unknown as Monaco.IRange,
        },
        {
          label: "ENV",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "ENV ${1:KEY}=${2:value}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Sets an environment variable",
          range: undefined as unknown as Monaco.IRange,
        },
        {
          label: "EXPOSE",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "EXPOSE ${1:port}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Documents which ports the container listens on",
          range: undefined as unknown as Monaco.IRange,
        },
        {
          label: "WORKDIR",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "WORKDIR ${1:/path}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation:
            "Sets the working directory for subsequent instructions",
          range: undefined as unknown as Monaco.IRange,
        },
        {
          label: "ARG",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "ARG ${1:name}=${2:default}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Defines a build-time variable",
          range: undefined as unknown as Monaco.IRange,
        },
        {
          label: "HEALTHCHECK",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText:
            "HEALTHCHECK --interval=${1:30s} --timeout=${2:3s} CMD ${3:command}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Tells Docker how to test if the container is healthy",
          range: undefined as unknown as Monaco.IRange,
        },
        {
          label: "multi-stage build",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            "FROM ${1:builder-image} AS builder",
            "WORKDIR /app",
            "COPY . .",
            "RUN ${2:build-command}",
            "",
            "FROM ${3:runtime-image}",
            "WORKDIR /app",
            "COPY --from=builder /app/${4:output} .",
            'CMD ["${5:executable}"]',
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Multi-stage build template",
          range: undefined as unknown as Monaco.IRange,
        },
      ];
      return { suggestions };
    },
  });
};
