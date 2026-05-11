import type * as Monaco from "monaco-editor";
import { registerDockerfile, DOCKERFILE_LANGUAGE_ID } from "./dockerfile";
import { registerDotenv, DOTENV_LANGUAGE_ID } from "./dotenv";
import { registerToml, TOML_LANGUAGE_ID } from "./toml";
import { registerRequirements, REQUIREMENTS_LANGUAGE_ID } from "./requirements";

export const registerAllLanguages = (monaco: typeof Monaco): void => {
  registerDockerfile(monaco);
  registerDotenv(monaco);
  registerToml(monaco);
  registerRequirements(monaco);

  console.log("[Languages] Registered custom languages:", [
    DOCKERFILE_LANGUAGE_ID,
    DOTENV_LANGUAGE_ID,
    TOML_LANGUAGE_ID,
    REQUIREMENTS_LANGUAGE_ID,
  ]);
};

// Extended language detection — maps file extensions and names to language IDs
// Covers both built-in Monaco languages and our custom ones
export const detectLanguage = (fileName: string): string => {
  const name = fileName.toLowerCase();
  const ext = name.split(".").pop() ?? "";

  // Custom languages we defined
  if (
    name === "dockerfile" ||
    name.startsWith("dockerfile.") ||
    ext === "dockerfile"
  ) {
    return DOCKERFILE_LANGUAGE_ID;
  }
  if (name === ".env" || name.startsWith(".env.") || ext === "env") {
    return DOTENV_LANGUAGE_ID;
  }
  if (ext === "toml") {
    return TOML_LANGUAGE_ID;
  }
  if (
    name === "requirements.txt" ||
    (name.startsWith("requirements") && ext === "txt")
  ) {
    return REQUIREMENTS_LANGUAGE_ID;
  }

  // Built-in Monaco languages
  const builtInMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    json: "json",
    md: "markdown",
    css: "css",
    scss: "scss",
    less: "less",
    html: "html",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
    sh: "shell",
    bash: "shell",
    zsh: "shell",
    go: "go",
    rs: "rust",
    java: "java",
    c: "c",
    cpp: "cpp",
    cs: "csharp",
    php: "php",
    rb: "ruby",
    swift: "swift",
    kt: "kotlin",
    sql: "sql",
    graphql: "graphql",
    gql: "graphql",
    r: "r",
    txt: "plaintext",
  };

  return builtInMap[ext] ?? "plaintext";
};
