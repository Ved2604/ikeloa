import type * as Monaco from "monaco-editor";

export const REQUIREMENTS_LANGUAGE_ID = "requirements";

export const registerRequirements = (monaco: typeof Monaco): void => {
  monaco.languages.register({
    id: REQUIREMENTS_LANGUAGE_ID,
    extensions: [".txt"],
    filenames: [
      "requirements.txt",
      "requirements-dev.txt",
      "requirements-prod.txt",
      "requirements-test.txt",
    ],
    aliases: ["Requirements", "pip requirements"],
  });

  monaco.languages.setMonarchTokensProvider(REQUIREMENTS_LANGUAGE_ID, {
    tokenizer: {
      root: [
        // Comments
        [/#.*$/, "comment"],

        // Options like -r, -c, -e, --index-url
        [/^-[a-zA-Z]/, "keyword"],
        [/^--[a-zA-Z-]+/, "keyword"],

        // Git or URL dependencies
        [/^(git\+|https?:\/\/).*/, "string.link"],

        // Package name
        [/^[A-Za-z0-9]([A-Za-z0-9._-]*)/, "type"],

        // Extras like [security] [dev]
        [/\[[^\]]+\]/, "annotation"],

        // Version specifiers == != <= >= ~ ^
        [/(==|!=|<=|>=|~=|\^|>|<)/, "operator"],

        // Version numbers
        [/\d+(\.\d+)*(\.\*)?/, "number"],

        // Semicolons for environment markers
        [/;/, "delimiter"],

        // Environment markers like python_version, sys_platform
        [
          /\b(python_version|python_full_version|os_name|sys_platform|platform_machine|platform_python_implementation|platform_release|platform_system|platform_version|implementation_name|implementation_version|extra)\b/,
          "variable",
        ],
      ],
    },
  });

  // Autocomplete for common packages
  monaco.languages.registerCompletionItemProvider(REQUIREMENTS_LANGUAGE_ID, {
    triggerCharacters: [],
    provideCompletionItems: (_model, _position) => {
      const commonPackages = [
        { name: "numpy", description: "Numerical computing" },
        { name: "pandas", description: "Data analysis and manipulation" },
        { name: "matplotlib", description: "Plotting and visualization" },
        { name: "scipy", description: "Scientific computing" },
        { name: "scikit-learn", description: "Machine learning" },
        {
          name: "tensorflow",
          description: "Deep learning framework by Google",
        },
        { name: "torch", description: "Deep learning framework by Meta" },
        { name: "fastapi", description: "Modern web framework for APIs" },
        { name: "flask", description: "Lightweight web framework" },
        { name: "django", description: "Full-featured web framework" },
        { name: "sqlalchemy", description: "SQL toolkit and ORM" },
        {
          name: "pydantic",
          description: "Data validation using Python type hints",
        },
        { name: "requests", description: "HTTP library" },
        { name: "httpx", description: "Async HTTP client" },
        { name: "pytest", description: "Testing framework" },
        { name: "black", description: "Code formatter" },
        { name: "mypy", description: "Static type checker" },
        { name: "pillow", description: "Image processing" },
        { name: "opencv-python", description: "Computer vision" },
        { name: "jupyter", description: "Interactive notebooks" },
        { name: "ipython", description: "Enhanced Python shell" },
        { name: "celery", description: "Distributed task queue" },
        { name: "redis", description: "Redis client" },
        { name: "boto3", description: "AWS SDK for Python" },
        { name: "anthropic", description: "Anthropic API client" },
        { name: "openai", description: "OpenAI API client" },
      ];

      const suggestions = commonPackages.map((pkg) => ({
        label: pkg.name,
        kind: monaco.languages.CompletionItemKind.Module,
        insertText: `${pkg.name}==$\{1:version\}`,
        insertTextRules:
          monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: pkg.description,
        range: undefined as unknown as Monaco.IRange,
      }));

      return { suggestions };
    },
  });
};
