// Static keyword explanations — no LLM needed for these
// Covers common keywords across Python, JavaScript, TypeScript, and config files

export interface KeywordExplanation {
  summary: string;
  detail?: string;
  example?: string;
}

const KEYWORD_MAP: Record<string, KeywordExplanation> = {
  // Python keywords
  def: {
    summary: "Defines a new function in Python",
    detail:
      "Used to declare a function with a name, optional parameters, and a body.",
    example: 'def greet(name):\n    return f"Hello, {name}"',
  },
  class: {
    summary: "Defines a new class in Python or JavaScript",
    detail: "Creates a new type with attributes and methods.",
    example:
      "class Animal:\n    def __init__(self, name):\n        self.name = name",
  },
  import: {
    summary: "Imports a module or package",
    detail: "Brings external code into the current file so you can use it.",
    example: "import numpy as np",
  },
  from: {
    summary: "Imports specific items from a module",
    detail:
      "Used with import to bring specific functions or classes into scope.",
    example: "from pathlib import Path",
  },
  return: {
    summary: "Returns a value from a function",
    detail:
      "Exits the current function and optionally sends a value back to the caller.",
    example: "def add(a, b):\n    return a + b",
  },
  if: {
    summary: "Conditional statement",
    detail: "Executes a block of code only if a condition is true.",
    example: 'if x > 0:\n    print("positive")',
  },
  elif: {
    summary: "Else-if conditional branch",
    detail: "Checks another condition if the previous if or elif was false.",
    example:
      'if x > 0:\n    print("positive")\nelif x < 0:\n    print("negative")',
  },
  else: {
    summary: "Fallback branch of a conditional",
    detail: "Executes when all preceding if and elif conditions are false.",
    example:
      'if x > 0:\n    print("positive")\nelse:\n    print("non-positive")',
  },
  for: {
    summary: "Iterates over a sequence",
    detail: "Loops through each item in a list, range, or any iterable.",
    example: "for item in my_list:\n    print(item)",
  },
  while: {
    summary: "Loops while a condition is true",
    detail: "Keeps executing a block as long as the condition remains true.",
    example: "while count < 10:\n    count += 1",
  },
  try: {
    summary: "Begins an error-handling block",
    detail: "Wraps code that might raise an exception.",
    example:
      'try:\n    result = 1 / x\nexcept ZeroDivisionError:\n    print("Cannot divide by zero")',
  },
  except: {
    summary: "Catches an exception",
    detail: "Handles specific errors that occur in a try block.",
    example: 'except ValueError as e:\n    print(f"Error: {e}")',
  },
  finally: {
    summary: "Always executes after try/except",
    detail:
      "Runs regardless of whether an exception occurred — used for cleanup.",
    example: "finally:\n    file.close()",
  },
  with: {
    summary: "Context manager — auto cleanup",
    detail: "Ensures resources like files or connections are properly closed.",
    example: 'with open("file.txt") as f:\n    content = f.read()',
  },
  lambda: {
    summary: "Creates an anonymous inline function",
    detail: "A shorthand for simple functions that can be written in one line.",
    example: "double = lambda x: x * 2",
  },
  yield: {
    summary: "Produces a value from a generator",
    detail:
      "Pauses the function and returns a value, resuming on next iteration.",
    example: "def count_up(n):\n    for i in range(n):\n        yield i",
  },
  async: {
    summary: "Marks a function as asynchronous",
    detail: "Allows the function to use await and run concurrently.",
    example: "async def fetch_data():\n    await asyncio.sleep(1)",
  },
  await: {
    summary: "Waits for an async operation to complete",
    detail: "Pauses execution until the awaited coroutine finishes.",
    example: "result = await fetch_data()",
  },
  pass: {
    summary: "Does nothing — a placeholder",
    detail:
      "Used when a statement is required syntactically but you have nothing to do.",
    example: "def todo():\n    pass",
  },
  None: {
    summary: "Represents the absence of a value",
    detail:
      "Python's equivalent of null. Indicates no value or a missing result.",
    example: 'result = None\nif result is None:\n    print("No result")',
  },
  True: {
    summary: "Boolean true value",
    detail: "One of Python's two boolean literals.",
    example: "is_valid = True",
  },
  False: {
    summary: "Boolean false value",
    detail: "One of Python's two boolean literals.",
    example: "is_valid = False",
  },
  self: {
    summary: "Refers to the current instance of a class",
    detail:
      "The first parameter of instance methods — gives access to the object's attributes.",
    example:
      'class Dog:\n    def bark(self):\n        print(f"{self.name} says woof")',
  },

  // JavaScript / TypeScript keywords
  const: {
    summary: "Declares a constant variable",
    detail:
      "The binding cannot be reassigned after declaration. The value itself may still be mutable.",
    example: "const PI = 3.14159",
  },
  let: {
    summary: "Declares a block-scoped variable",
    detail:
      "Can be reassigned. Scoped to the nearest block — if, for, function.",
    example: "let count = 0\ncount += 1",
  },
  var: {
    summary: "Declares a function-scoped variable (legacy)",
    detail:
      "Hoisted to the top of its function scope. Prefer const or let in modern code.",
    example: 'var name = "legacy"',
  },
  function: {
    summary: "Declares a named function",
    detail: "Creates a reusable block of code that can be called by name.",
    example: "function add(a, b) {\n    return a + b\n}",
  },
  arrow: {
    summary: "Arrow function syntax",
    detail: "A concise way to write functions. Does not bind its own this.",
    example: "const add = (a, b) => a + b",
  },
  typeof: {
    summary: "Returns the type of a value as a string",
    detail:
      'Returns "string", "number", "boolean", "object", "undefined", or "function".',
    example: 'typeof 42 // "number"\ntypeof "hello" // "string"',
  },
  instanceof: {
    summary: "Checks if an object is an instance of a class",
    detail: "Returns true if the object was created by the given constructor.",
    example: "dog instanceof Animal // true",
  },
  interface: {
    summary: "Defines a TypeScript interface",
    detail:
      "Describes the shape of an object — what properties and methods it must have.",
    example: "interface User {\n    id: string\n    name: string\n}",
  },
  type: {
    summary: "Defines a TypeScript type alias",
    detail:
      "Creates a name for any type — primitive, union, intersection, or object.",
    example: "type ID = string | number",
  },
  enum: {
    summary: "Defines a set of named constants",
    detail: "Groups related values under a single name.",
    example: "enum Direction {\n    Up,\n    Down,\n    Left,\n    Right\n}",
  },
  extends: {
    summary: "Inherits from a parent class or extends a type",
    detail:
      "In classes, inherits properties and methods. In TypeScript, constrains generics.",
    example:
      'class Dog extends Animal {\n    bark() { console.log("woof") }\n}',
  },
  implements: {
    summary: "Declares that a class implements an interface",
    detail:
      "TypeScript checks that the class has all required properties and methods.",
    example:
      "class User implements IUser {\n    id: string\n    name: string\n}",
  },
  export: {
    summary: "Makes a value available to other modules",
    detail: "Allows other files to import this function, class, or variable.",
    example: "export const PI = 3.14\nexport default function main() {}",
  },
  default: {
    summary: "Marks the default export of a module",
    detail:
      "Each module can have one default export, imported without curly braces.",
    example: "export default function App() {}",
  },
  null: {
    summary: "Represents an intentionally absent value",
    detail: 'Explicitly set to indicate "no value". Different from undefined.',
    example: "const user = null",
  },
  undefined: {
    summary: "A variable that has been declared but not assigned",
    detail: "The default value of uninitialized variables.",
    example: "let x\nconsole.log(x) // undefined",
  },
  promise: {
    summary: "Represents an eventual value from an async operation",
    detail: "Has three states: pending, fulfilled, or rejected.",
    example:
      'const p = new Promise((resolve, reject) => {\n    resolve("done")\n})',
  },

  // Dockerfile instructions
  FROM: {
    summary: "Sets the base image for the Docker build",
    detail:
      "Every Dockerfile must start with FROM. Defines the starting point.",
    example: "FROM node:18-alpine",
  },
  RUN: {
    summary: "Executes a command during the build",
    detail:
      "Creates a new layer in the image. Use && to chain commands in one layer.",
    example: "RUN apt-get update && apt-get install -y curl",
  },
  COPY: {
    summary: "Copies files from the build context into the image",
    detail: "Preferred over ADD for simple file copying.",
    example: "COPY package.json .",
  },
  EXPOSE: {
    summary: "Documents which port the container listens on",
    detail: "Does not actually publish the port — use -p flag when running.",
    example: "EXPOSE 8080",
  },
  CMD: {
    summary: "Default command to run when the container starts",
    detail: "Can be overridden at runtime. Only the last CMD takes effect.",
    example: 'CMD ["node", "server.js"]',
  },
  ENTRYPOINT: {
    summary: "Configures the container to run as an executable",
    detail:
      "Unlike CMD, cannot be easily overridden. Use for the main process.",
    example: 'ENTRYPOINT ["python", "app.py"]',
  },
  ENV: {
    summary: "Sets an environment variable in the image",
    detail: "Available during build and at runtime.",
    example: "ENV NODE_ENV=production",
  },
  ARG: {
    summary: "Defines a build-time variable",
    detail:
      "Only available during the build, not at runtime. Pass with --build-arg.",
    example: "ARG VERSION=latest",
  },
  WORKDIR: {
    summary: "Sets the working directory for subsequent instructions",
    detail: "Creates the directory if it does not exist.",
    example: "WORKDIR /app",
  },

  // Common config values
  true: {
    summary: "Boolean true",
    detail: "Represents a positive or enabled state.",
    example: "enabled = true",
  },
  false: {
    summary: "Boolean false",
    detail: "Represents a negative or disabled state.",
    example: "enabled = false",
  },
};

export const getKeywordExplanation = (
  word: string,
): KeywordExplanation | null => {
  return KEYWORD_MAP[word] ?? null;
};

export const isKnownKeyword = (word: string): boolean => {
  return word in KEYWORD_MAP;
};
