/**
 * ─────────────────────────────────────────────────────────────────────────────
 * pythonFoundations.js — Canonical Python Foundations Curriculum
 * 15 Deep Lessons | Premium Included Track
 * ─────────────────────────────────────────────────────────────────────────────
 */

module.exports = {
  key: "course-python-foundations",
  title: "Python Foundations",
  slug: "python-foundations",
  subtitle: "Master modern Python 3 programming from syntax fundamentals to data structures and algorithms.",
  description: "A hands-on, interactive introduction to Python programming running completely client-side in your browser via Pyodide. Learn variables, data structures, control flow, functions, error handling, and algorithmic problem solving with immediate execution feedback.",
  accessLevel: "premium",
  monetizationType: "PREMIUM_INCLUDED",
  level: "beginner",
  language: "English",
  estimatedDurationMinutes: 300,
  coverImage: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1200&q=80",
  coverImageAlt: "Python code displayed on a dark developer theme",
  learningOutcomes: [
    "Understand Python syntax, execution model, and core data types",
    "Manipulate text, numbers, lists, tuples, and dictionaries",
    "Control program flow with conditionals, while loops, and for loops",
    "Organize code cleanly with functions, scope, and error handling",
    "Build interactive command-line projects and algorithmic problem solvers"
  ],
  prerequisites: [
    "No prior programming experience required",
    "Basic computer literacy and a modern web browser"
  ],
  isFeatured: true,
  modules: [
    {
      title: "Module 1: Syntax, Variables & Control Flow",
      description: "Python execution model, printing, arithmetic, variables, data types, and branching logic.",
      order: 0,
      lessons: [
        {
          title: "1. Python Basics & The Print Function",
          description: "Understand Python execution and output text using the print() function.",
          lessonType: "coding",
          durationSeconds: 600,
          order: 0,
          isPreview: true,
          body: "Python is a high-level, interpreted programming language known for its clear, human-readable syntax.\n\nIn Python, the `print()` function is used to output text or data directly to standard output. Strings can be enclosed in single quotes (`'`) or double quotes (`\"`). Comments begin with `#`.\n\nExample:\n```python\nprint(\"Hello, World!\")\n```",
          codingBlocks: [
            {
              id: "py-01-block",
              blockType: "starter_code",
              title: "Your First Python Script",
              content: "Call print() with the message 'Ready to code in Python!'.",
              language: "python",
              starterCode: "# Write a print statement below:\n",
              instructions: "Output 'Ready to code in Python!' using print().",
              expectedOutput: "Ready to code in Python!",
              hints: [
                "Use the print() function.",
                "Enclose the text 'Ready to code in Python!' in quotes inside the parentheses."
              ],
              validationRules: [
                {
                  id: "py-print-out",
                  type: "output_contains",
                  value: "Ready to code in Python!",
                  description: "Output must contain 'Ready to code in Python!'"
                },
                {
                  id: "py-print-code",
                  type: "code_contains",
                  value: "print(",
                  description: "Must use print() function"
                }
              ],
              solutionCode: "print(\"Ready to code in Python!\")\n",
              order: 0
            }
          ],
          quizQuestions: [
            {
              id: "py-01-q1",
              question: "Which symbol is used to start a single-line comment in Python?",
              options: [
                { id: "opt-1", text: "//" },
                { id: "opt-2", text: "/*" },
                { id: "opt-3", text: "#" },
                { id: "opt-4", text: "<!--" }
              ],
              correctOptionIndex: 2,
              explanation: "In Python, the hash symbol (#) marks the start of a single-line comment."
            },
            {
              id: "py-01-q2",
              question: "What is the standard built-in function to output text to the console in Python?",
              options: [
                { id: "opt-1", text: "console.log()" },
                { id: "opt-2", text: "echo()" },
                { id: "opt-3", text: "print()" },
                { id: "opt-4", text: "System.out.println()" }
              ],
              correctOptionIndex: 2,
              explanation: "Python uses print() to send text or values to standard output."
            }
          ]
        },
        {
          title: "2. Variables & Expressions",
          description: "Declare variables and perform arithmetic calculations.",
          lessonType: "coding",
          durationSeconds: 650,
          order: 1,
          isPreview: false,
          body: "In Python, variables are created when you first assign a value to them using the assignment operator (`=`). Python uses snake_case by convention.\n\nArithmetic operators include `+`, `-`, `*`, `/` (float division), `//` (floor division), `%` (modulo), and `**` (exponentiation).",
          codingBlocks: [
            {
              id: "py-02-block",
              blockType: "starter_code",
              title: "Calculating Rectangle Area",
              content: "Assign length and width, compute area, and print the result.",
              language: "python",
              starterCode: "length = 12\nwidth = 5\n# Compute area and print it below:\n",
              instructions: "Multiply length and width to find area, store in variable area, and print area.",
              expectedOutput: "60",
              hints: [
                "Compute area = length * width.",
                "Call print(area) to display 60."
              ],
              validationRules: [
                {
                  id: "py-area-out",
                  type: "output_contains",
                  value: "60",
                  description: "Output must show 60"
                },
                {
                  id: "py-area-code",
                  type: "code_contains",
                  value: "area =",
                  description: "Must store result in area variable"
                }
              ],
              solutionCode: "length = 12\nwidth = 5\narea = length * width\nprint(area)\n",
              order: 0
            }
          ],
          quizQuestions: [
            {
              id: "py-02-q1",
              question: "Which of the following is an invalid variable name in Python?",
              options: [
                { id: "opt-1", text: "user_age" },
                { id: "opt-2", text: "_total_score" },
                { id: "opt-3", text: "2nd_player" },
                { id: "opt-4", text: "maxSpeed" }
              ],
              correctOptionIndex: 2,
              explanation: "Variable names cannot start with a numeral in Python."
            },
            {
              id: "py-02-q2",
              question: "What is the result of 17 // 5 in Python?",
              options: [
                { id: "opt-1", text: "3.4" },
                { id: "opt-2", text: "3" },
                { id: "opt-3", text: "2" },
                { id: "opt-4", text: "4" }
              ],
              correctOptionIndex: 1,
              explanation: "The // operator performs floor division, returning the integer quotient 3."
            }
          ]
        },
        {
          title: "3. Data Types: Numbers & Booleans",
          description: "Inspect and cast between int, float, bool, and str.",
          lessonType: "coding",
          durationSeconds: 700,
          order: 2,
          isPreview: false,
          body: "Python's core scalar types are `int` (integers), `float` (decimals), `bool` (`True` or `False`), and `str` (text).\n\nType conversion functions include `int()`, `float()`, `str()`, and `bool()`. Note that Boolean literals are capitalized: `True` and `False`.",
          codingBlocks: [
            {
              id: "py-03-block",
              blockType: "starter_code",
              title: "Casting & Booleans",
              content: "Cast string '99' to an integer and declare a Boolean variable.",
              language: "python",
              starterCode: "# Convert \"99\" to int and store in score\n# Set is_passing to True\n# Print both\n",
              instructions: "Set score = int('99'), is_passing = True, and print both.",
              expectedOutput: "99\nTrue",
              hints: [
                "Use int('99') to convert.",
                "Set is_passing = True with a capital T."
              ],
              validationRules: [
                {
                  id: "py-type-99",
                  type: "output_contains",
                  value: "99",
                  description: "Output must contain 99"
                },
                {
                  id: "py-type-true",
                  type: "output_contains",
                  value: "True",
                  description: "Output must contain True"
                }
              ],
              solutionCode: "score = int(\"99\")\nis_passing = True\nprint(score)\nprint(is_passing)\n",
              order: 0
            }
          ],
          quizQuestions: [
            {
              id: "py-03-q1",
              question: "How are boolean literals capitalized in Python?",
              options: [
                { id: "opt-1", text: "true and false" },
                { id: "opt-2", text: "TRUE and FALSE" },
                { id: "opt-3", text: "True and False" },
                { id: "opt-4", text: "None of the above" }
              ],
              correctOptionIndex: 2,
              explanation: "In Python, Boolean literals are capitalized: True and False."
            },
            {
              id: "py-03-q2",
              question: "What does bool(\"\") evaluate to in Python?",
              options: [
                { id: "opt-1", text: "True" },
                { id: "opt-2", text: "False" },
                { id: "opt-3", text: "None" },
                { id: "opt-4", text: "Error" }
              ],
              correctOptionIndex: 1,
              explanation: "An empty string is falsy in Python, so bool(\"\") evaluates to False."
            }
          ]
        },
        {
          title: "4. String Formatting with f-strings",
          description: "Format dynamic strings and numbers with Python 3 f-strings.",
          lessonType: "coding",
          durationSeconds: 700,
          order: 3,
          isPreview: false,
          body: "Formatted string literals (f-strings) prefix string literals with `f` and embed Python expressions in curly braces `{}`.\n\nFormatting specifiers include `{val:.2f}` to format floats to two decimal places.",
          codingBlocks: [
            {
              id: "py-04-block",
              blockType: "starter_code",
              title: "Constructing an f-string",
              content: "Format user_name and score into a summary message.",
              language: "python",
              starterCode: "user_name = \"Alex\"\nscore = 87.654\n# Create f-string: \"Learner Alex scored 87.65 points\"\n",
              instructions: "Create variable summary = f'Learner {user_name} scored {score:.2f} points' and print summary.",
              expectedOutput: "Learner Alex scored 87.65 points",
              hints: [
                "Use f'Learner {user_name} scored {score:.2f} points'.",
                "Print summary."
              ],
              validationRules: [
                {
                  id: "py-fstring-out",
                  type: "output_contains",
                  value: "Learner Alex scored 87.65 points",
                  description: "Output must contain 'Learner Alex scored 87.65 points'"
                },
                {
                  id: "py-fstring-code",
                  type: "code_contains",
                  value: "f\"",
                  description: "Must use an f-string literal"
                }
              ],
              solutionCode: "user_name = \"Alex\"\nscore = 87.654\nsummary = f\"Learner {user_name} scored {score:.2f} points\"\nprint(summary)\n",
              order: 0
            }
          ],
          quizQuestions: [
            {
              id: "py-04-q1",
              question: "What prefix designates a formatted string literal in Python?",
              options: [
                { id: "opt-1", text: "s\"...\"" },
                { id: "opt-2", text: "f\"...\"" },
                { id: "opt-3", text: "$\"...\"" },
                { id: "opt-4", text: "format\"...\"" }
              ],
              correctOptionIndex: 1,
              explanation: "F-strings start with an f or F prefix immediately before the quote mark."
            },
            {
              id: "py-04-q2",
              question: "How do you format a float pi to 3 decimal places using an f-string?",
              options: [
                { id: "opt-1", text: "f\"{pi, 3}\"" },
                { id: "opt-2", text: "f\"{pi:3}\"" },
                { id: "opt-3", text: "f\"{pi:.3f}\"" },
                { id: "opt-4", text: "f\"{pi.round(3)}\"" }
              ],
              correctOptionIndex: 2,
              explanation: "The specifier :.3f formats the value as a floating-point number with three decimal places."
            }
          ]
        },
        {
          title: "5. Conditionals & Decision Making",
          description: "Use if, elif, and else statements with logical operators.",
          lessonType: "coding",
          durationSeconds: 750,
          order: 4,
          isPreview: false,
          body: "Python uses `if`, `elif`, and `else` blocks with indentation to branch logic. Logical operators are the English words `and`, `or`, and `not`.",
          codingBlocks: [
            {
              id: "py-05-block",
              blockType: "starter_code",
              title: "Branching on Temperature",
              content: "Evaluate temp_celsius and print Hot, Pleasant, or Cold.",
              language: "python",
              starterCode: "temp_celsius = 28\n# If > 30: Hot | If >= 20: Pleasant | Else: Cold\n",
              instructions: "Write an if/elif/else block checking temp_celsius.",
              expectedOutput: "Pleasant",
              hints: [
                "Test temp_celsius > 30 first in your if statement.",
                "Use elif temp_celsius >= 20: print('Pleasant')."
              ],
              validationRules: [
                {
                  id: "py-cond-out",
                  type: "output_contains",
                  value: "Pleasant",
                  description: "Output must be 'Pleasant'"
                },
                {
                  id: "py-cond-elif",
                  type: "code_contains",
                  value: "elif",
                  description: "Must include an elif statement"
                }
              ],
              solutionCode: "temp_celsius = 28\nif temp_celsius > 30:\n    print(\"Hot\")\nelif temp_celsius >= 20:\n    print(\"Pleasant\")\nelse:\n    print(\"Cold\")\n",
              order: 0
            }
          ],
          quizQuestions: [
            {
              id: "py-05-q1",
              question: "What is the keyword for 'else if' in Python?",
              options: [
                { id: "opt-1", text: "elseif" },
                { id: "opt-2", text: "else if" },
                { id: "opt-3", text: "elif" },
                { id: "opt-4", text: "elsif" }
              ],
              correctOptionIndex: 2,
              explanation: "Python uses the keyword elif to chain alternative conditions."
            },
            {
              id: "py-05-q2",
              question: "Which logical operator returns True only if both conditions are True?",
              options: [
                { id: "opt-1", text: "&&" },
                { id: "opt-2", text: "and" },
                { id: "opt-3", text: "&" },
                { id: "opt-4", text: "all" }
              ],
              correctOptionIndex: 1,
              explanation: "Python uses English words for logical operators: and, or, not."
            }
          ]
        }
      ]
    },
    {
      title: "Module 2: Iteration, Functions & Data Structures",
      description: "Loops, function definitions, list operations, dictionaries, and string manipulation.",
      order: 1,
      lessons: [
        {
          title: "6. Loops: While & For",
          description: "Iterate with while and for loops using the range() function.",
          lessonType: "coding",
          durationSeconds: 700,
          order: 0,
          isPreview: false,
          body: "Python provides `for` loops to iterate over sequences or `range(start, stop)` and `while` loops to repeat code while a condition is True.",
          codingBlocks: [
            {
              id: "py-06-block",
              blockType: "starter_code",
              title: "Summing Numbers with range()",
              content: "Calculate the sum of numbers from 1 to 5 inclusive using a for loop.",
              language: "python",
              starterCode: "total_sum = 0\n# Loop from 1 to 5 inclusive, add to total_sum, and print total_sum\n",
              instructions: "Use for num in range(1, 6): total_sum += num, then print(total_sum).",
              expectedOutput: "15",
              hints: [
                "Remember range(1, 6) covers 1, 2, 3, 4, 5.",
                "Print total_sum after the loop."
              ],
              validationRules: [
                {
                  id: "py-loop-15",
                  type: "output_contains",
                  value: "15",
                  description: "Output must show 15"
                },
                {
                  id: "py-loop-range",
                  type: "code_contains",
                  value: "range(",
                  description: "Must use range() function"
                }
              ],
              solutionCode: "total_sum = 0\nfor num in range(1, 6):\n    total_sum += num\nprint(total_sum)\n",
              order: 0
            }
          ],
          quizQuestions: [
            {
              id: "py-06-q1",
              question: "What numbers are generated by range(1, 5)?",
              options: [
                { id: "opt-1", text: "1, 2, 3, 4, 5" },
                { id: "opt-2", text: "1, 2, 3, 4" },
                { id: "opt-3", text: "0, 1, 2, 3, 4, 5" },
                { id: "opt-4", text: "0, 1, 2, 3, 4" }
              ],
              correctOptionIndex: 1,
              explanation: "range(start, stop) starts at start and stops just before stop, generating 1, 2, 3, and 4."
            },
            {
              id: "py-06-q2",
              question: "Which statement terminates the current loop immediately?",
              options: [
                { id: "opt-1", text: "exit" },
                { id: "opt-2", text: "stop" },
                { id: "opt-3", text: "break" },
                { id: "opt-4", text: "return" }
              ],
              correctOptionIndex: 2,
              explanation: "The break statement jumps out of the innermost enclosing loop."
            }
          ]
        },
        {
          title: "7. Defining Functions",
          description: "Author reusable functions with def, parameters, and return values.",
          lessonType: "coding",
          durationSeconds: 750,
          order: 1,
          isPreview: false,
          body: "Functions are declared with the `def` keyword, followed by parameters in parentheses and an indented body. The `return` statement sends a result back.",
          codingBlocks: [
            {
              id: "py-07-block",
              blockType: "starter_code",
              title: "The is_even Function",
              content: "Define a function is_even(n) returning True if n is divisible by 2, False otherwise.",
              language: "python",
              starterCode: "# Define is_even(n) and test with 8 and 7\n",
              instructions: "Define def is_even(n): return n % 2 == 0, then print(is_even(8)) and print(is_even(7)).",
              expectedOutput: "True\nFalse",
              hints: [
                "Define the function using def is_even(n):",
                "Use the modulo operator: return n % 2 == 0."
              ],
              validationRules: [
                {
                  id: "py-func-true",
                  type: "output_contains",
                  value: "True",
                  description: "Output must include True"
                },
                {
                  id: "py-func-false",
                  type: "output_contains",
                  value: "False",
                  description: "Output must include False"
                },
                {
                  id: "py-func-def",
                  type: "code_contains",
                  value: "def is_even",
                  description: "Must define is_even function"
                }
              ],
              solutionCode: "def is_even(n):\n    return n % 2 == 0\n\nprint(is_even(8))\nprint(is_even(7))\n",
              order: 0
            }
          ],
          quizQuestions: [
            {
              id: "py-07-q1",
              question: "Which keyword defines a function in Python?",
              options: [
                { id: "opt-1", text: "function" },
                { id: "opt-2", text: "func" },
                { id: "opt-3", text: "def" },
                { id: "opt-4", text: "define" }
              ],
              correctOptionIndex: 2,
              explanation: "Python uses the def keyword to define functions."
            },
            {
              id: "py-07-q2",
              question: "What value is returned by a Python function if no return statement is executed?",
              options: [
                { id: "opt-1", text: "0" },
                { id: "opt-2", text: "False" },
                { id: "opt-3", text: "\"\"" },
                { id: "opt-4", text: "None" }
              ],
              correctOptionIndex: 3,
              explanation: "Functions return None by default if no return statement is reached."
            }
          ]
        },
        {
          title: "8. Working with Lists",
          description: "Create, index, slice, sort, and modify mutable lists.",
          lessonType: "coding",
          durationSeconds: 750,
          order: 2,
          isPreview: false,
          body: "Lists are mutable sequences defined with square brackets `[]`. Elements are accessed via zero-based indexing or negative indexing (`-1`). Methods include `append()`, `pop()`, and `sort()`.",
          codingBlocks: [
            {
              id: "py-08-block",
              blockType: "starter_code",
              title: "List Mutation & Sorting",
              content: "Append 12 to numbers, sort the list in ascending order, and print it.",
              language: "python",
              starterCode: "numbers = [4, 1, 9, 3, 7]\n# Append 12, sort, and print numbers\n",
              instructions: "Call numbers.append(12), numbers.sort(), and print(numbers).",
              expectedOutput: "[1, 3, 4, 7, 9, 12]",
              hints: [
                "Use numbers.append(12).",
                "Use numbers.sort().",
                "Print numbers."
              ],
              validationRules: [
                {
                  id: "py-list-sorted",
                  type: "output_contains",
                  value: "[1, 3, 4, 7, 9, 12]",
                  description: "Output must show [1, 3, 4, 7, 9, 12]"
                },
                {
                  id: "py-list-append",
                  type: "code_contains",
                  value: ".append(12)",
                  description: "Must call append(12)"
                }
              ],
              solutionCode: "numbers = [4, 1, 9, 3, 7]\nnumbers.append(12)\nnumbers.sort()\nprint(numbers)\n",
              order: 0
            }
          ],
          quizQuestions: [
            {
              id: "py-08-q1",
              question: "What does numbers[-1] access in a Python list?",
              options: [
                { id: "opt-1", text: "The first element" },
                { id: "opt-2", text: "The last element" },
                { id: "opt-3", text: "None" },
                { id: "opt-4", text: "SyntaxError" }
              ],
              correctOptionIndex: 1,
              explanation: "Negative indexing starts from the end, where -1 refers to the last element."
            },
            {
              id: "py-08-q2",
              question: "Which method adds an item to the end of a list in-place?",
              options: [
                { id: "opt-1", text: "push()" },
                { id: "opt-2", text: "add()" },
                { id: "opt-3", text: "append()" },
                { id: "opt-4", text: "insertEnd()" }
              ],
              correctOptionIndex: 2,
              explanation: "Python lists provide the append() method to add elements to the end."
            }
          ]
        },
        {
          title: "9. Working with Dictionaries",
          description: "Map keys to values with dictionaries and query keys safely.",
          lessonType: "coding",
          durationSeconds: 800,
          order: 3,
          isPreview: false,
          body: "Dictionaries store key-value pairs inside curly braces `{}`. Lookups use bracket notation `dict[key]` or safe retrieval with default values using `dict.get(key, default)`.",
          codingBlocks: [
            {
              id: "py-09-block",
              blockType: "starter_code",
              title: "Dictionary Modification & Safe Lookup",
              content: "Add a grade key to student, print it, and safely lookup a missing mentor key.",
              language: "python",
              starterCode: "student = {\"name\": \"Jordan\", \"course\": \"Python Foundations\"}\n# Add grade 'A', print student['grade'], and print student.get('mentor', 'None Assigned')\n",
              instructions: "Set student['grade'] = 'A', print student['grade'], and print student.get('mentor', 'None Assigned').",
              expectedOutput: "A\nNone Assigned",
              hints: [
                "Assign: student['grade'] = 'A'",
                "Safely access: student.get('mentor', 'None Assigned')"
              ],
              validationRules: [
                {
                  id: "py-dict-a",
                  type: "output_contains",
                  value: "A",
                  description: "Output must include 'A'"
                },
                {
                  id: "py-dict-none",
                  type: "output_contains",
                  value: "None Assigned",
                  description: "Output must include fallback 'None Assigned'"
                }
              ],
              solutionCode: "student = {\"name\": \"Jordan\", \"course\": \"Python Foundations\"}\nstudent[\"grade\"] = \"A\"\nprint(student[\"grade\"])\nprint(student.get(\"mentor\", \"None Assigned\"))\n",
              order: 0
            }
          ],
          quizQuestions: [
            {
              id: "py-09-q1",
              question: "What happens if you look up a non-existent key with square bracket syntax dict[key]?",
              options: [
                { id: "opt-1", text: "Returns None" },
                { id: "opt-2", text: "Returns undefined" },
                { id: "opt-3", text: "Raises a KeyError" },
                { id: "opt-4", text: "Creates the key automatically" }
              ],
              correctOptionIndex: 2,
              explanation: "Accessing an unmapped key directly with dict[key] raises a KeyError. Use dict.get() for safe fallback."
            },
            {
              id: "py-09-q2",
              question: "Which method returns key-value pairs suitable for looping through a dictionary?",
              options: [
                { id: "opt-1", text: ".entries()" },
                { id: "opt-2", text: ".pairs()" },
                { id: "opt-3", text: ".items()" },
                { id: "opt-4", text: ".to_list()" }
              ],
              correctOptionIndex: 2,
              explanation: "dict.items() yields (key, value) pairs."
            }
          ]
        },
        {
          title: "10. String Methods & Text Manipulation",
          description: "Transform and inspect strings with built-in string methods.",
          lessonType: "coding",
          durationSeconds: 750,
          order: 4,
          isPreview: false,
          body: "Python strings are immutable. Useful methods include `.upper()`, `.lower()`, `.title()`, `.strip()`, `.replace(old, new)`, and `.split(delim)`.",
          codingBlocks: [
            {
              id: "py-10-block",
              blockType: "starter_code",
              title: "Case Transformation & Replacement",
              content: "Transform sentence to title case and replace 'exciting' with 'rewarding'.",
              language: "python",
              starterCode: "sentence = \"learning python is exciting\"\n# Store title version and replaced version, then print both\n",
              instructions: "Create title_version = sentence.title(), replaced_version = sentence.replace('exciting', 'rewarding'), and print both.",
              expectedOutput: "Learning Python Is Exciting\nlearning python is rewarding",
              hints: [
                "Use sentence.title().",
                "Use sentence.replace('exciting', 'rewarding')."
              ],
              validationRules: [
                {
                  id: "py-str-title",
                  type: "output_contains",
                  value: "Learning Python Is Exciting",
                  description: "Output must contain 'Learning Python Is Exciting'"
                },
                {
                  id: "py-str-replace",
                  type: "output_contains",
                  value: "learning python is rewarding",
                  description: "Output must contain 'learning python is rewarding'"
                }
              ],
              solutionCode: "sentence = \"learning python is exciting\"\ntitle_version = sentence.title()\nreplaced_version = sentence.replace(\"exciting\", \"rewarding\")\nprint(title_version)\nprint(replaced_version)\n",
              order: 0
            }
          ],
          quizQuestions: [
            {
              id: "py-10-q1",
              question: "Are Python strings mutable or immutable?",
              options: [
                { id: "opt-1", text: "Mutable" },
                { id: "opt-2", text: "Immutable" },
                { id: "opt-3", text: "Mutable only inside functions" },
                { id: "opt-4", text: "Depends on Python version" }
              ],
              correctOptionIndex: 1,
              explanation: "Python strings are immutable. Every string method returns a new string."
            },
            {
              id: "py-10-q2",
              question: "What method joins a list of strings with a comma into 'a, b, c'?",
              options: [
                { id: "opt-1", text: "['a', 'b', 'c'].join(', ')" },
                { id: "opt-2", text: "', '.join(['a', 'b', 'c'])" },
                { id: "opt-3", text: "concat(', ', ['a', 'b', 'c'])" },
                { id: "opt-4", text: "string.join(', ', items)" }
              ],
              correctOptionIndex: 1,
              explanation: "In Python, join is called on the separator string: separator.join(iterable)."
            }
          ]
        }
      ]
    },
    {
      title: "Module 3: Robustness, Algorithms & Capstone Project",
      description: "Exception handling, standard library modules, algorithms, text adventure, and gradebook project.",
      order: 2,
      lessons: [
        {
          title: "11. Handling Errors & Exceptions",
          description: "Write defensive programs using try and except blocks.",
          lessonType: "coding",
          durationSeconds: 800,
          order: 0,
          isPreview: false,
          body: "Exceptions halt execution when unhandled. The `try` / `except` block catches specific error types such as `ValueError` or `ZeroDivisionError` gracefully.",
          codingBlocks: [
            {
              id: "py-11-block",
              blockType: "starter_code",
              title: "Safe Integer Parsing",
              content: "Write a function parse_int_or_default(value_str, default_val=0) using try/except ValueError.",
              language: "python",
              starterCode: "def parse_int_or_default(value_str, default_val=0):\n    # Wrap int(value_str) in try/except ValueError\n    pass\n\nprint(parse_int_or_default(\"42\", 0))\nprint(parse_int_or_default(\"not-a-number\", 100))\n",
              instructions: "Return int(value_str) inside try, or return default_val upon ValueError.",
              expectedOutput: "42\n100",
              hints: [
                "Inside try: return int(value_str)",
                "Inside except ValueError: return default_val"
              ],
              validationRules: [
                {
                  id: "py-err-42",
                  type: "output_contains",
                  value: "42",
                  description: "Output must include 42"
                },
                {
                  id: "py-err-100",
                  type: "output_contains",
                  value: "100",
                  description: "Output must include default 100"
                }
              ],
              solutionCode: "def parse_int_or_default(value_str, default_val=0):\n    try:\n        return int(value_str)\n    except ValueError:\n        return default_val\n\nprint(parse_int_or_default(\"42\", 0))\nprint(parse_int_or_default(\"not-a-number\", 100))\n",
              order: 0
            }
          ],
          quizQuestions: [
            {
              id: "py-11-q1",
              question: "Which block in a try/except structure is guaranteed to run regardless of whether an error occurred?",
              options: [
                { id: "opt-1", text: "else" },
                { id: "opt-2", text: "finally" },
                { id: "opt-3", text: "catch" },
                { id: "opt-4", text: "always" }
              ],
              correctOptionIndex: 1,
              explanation: "The finally block always executes when exiting a try statement."
            },
            {
              id: "py-11-q2",
              question: "Which exception is raised when int() receives a non-numeric string like 'abc'?",
              options: [
                { id: "opt-1", text: "TypeError" },
                { id: "opt-2", text: "KeyError" },
                { id: "opt-3", text: "ValueError" },
                { id: "opt-4", text: "ParseError" }
              ],
              correctOptionIndex: 2,
              explanation: "int('abc') raises a ValueError because the data type is correct (string) but the value cannot be parsed as an integer."
            }
          ]
        },
        {
          title: "12. Modules & the Standard Library Concept",
          description: "Import and use functions from Python standard library modules like math.",
          lessonType: "coding",
          durationSeconds: 700,
          order: 1,
          isPreview: false,
          body: "Python comes with 'batteries included'. Use `import math` or `from random import randint` to access built-in tools.",
          codingBlocks: [
            {
              id: "py-12-block",
              blockType: "starter_code",
              title: "Using the math Module",
              content: "Compute 2 to the 8th power and floor 7.89 using the math module.",
              language: "python",
              starterCode: "import math\n# Calculate power 2^8 and floor of 7.89, then print both\n",
              instructions: "Use math.pow(2, 8) and math.floor(7.89), then print each.",
              expectedOutput: "256.0\n7",
              hints: [
                "math.pow(2, 8) computes 2 to the 8th power.",
                "math.floor(7.89) floors to 7."
              ],
              validationRules: [
                {
                  id: "py-math-256",
                  type: "output_contains",
                  value: "256",
                  description: "Output must include 256"
                },
                {
                  id: "py-math-7",
                  type: "output_contains",
                  value: "7",
                  description: "Output must include 7"
                }
              ],
              solutionCode: "import math\npower_result = math.pow(2, 8)\nfloored_result = math.floor(7.89)\nprint(power_result)\nprint(floored_result)\n",
              order: 0
            }
          ],
          quizQuestions: [
            {
              id: "py-12-q1",
              question: "What statement allows you to import specific functions from a module into the local scope?",
              options: [
                { id: "opt-1", text: "import module.func" },
                { id: "opt-2", text: "from module import func" },
                { id: "opt-3", text: "use func from module" },
                { id: "opt-4", text: "include module(func)" }
              ],
              correctOptionIndex: 1,
              explanation: "The syntax from module import func imports symbols directly."
            },
            {
              id: "py-12-q2",
              question: "Which module provides tools like Counter and defaultdict?",
              options: [
                { id: "opt-1", text: "datastructures" },
                { id: "opt-2", text: "itertools" },
                { id: "opt-3", text: "collections" },
                { id: "opt-4", text: "containers" }
              ],
              correctOptionIndex: 2,
              explanation: "The collections module provides specialized container datatypes."
            }
          ]
        },
        {
          title: "13. Problem Solving: FizzBuzz Algorithm",
          description: "Implement classic FizzBuzz branching algorithm.",
          lessonType: "coding",
          durationSeconds: 850,
          order: 2,
          isPreview: false,
          body: "For numbers 1 to n:\n- Divisible by 3 and 5 -> 'FizzBuzz'\n- Divisible by 3 -> 'Fizz'\n- Divisible by 5 -> 'Buzz'\n- Otherwise -> number",
          codingBlocks: [
            {
              id: "py-13-block",
              blockType: "starter_code",
              title: "FizzBuzz List Builder",
              content: "Define fizzbuzz_list(n) returning a list of values up to n.",
              language: "python",
              starterCode: "def fizzbuzz_list(n):\n    results = []\n    # Iterate 1 to n, append FizzBuzz, Fizz, Buzz, or number\n    return results\n\nprint(fizzbuzz_list(6))\n",
              instructions: "Return [1, 2, 'Fizz', 4, 'Buzz', 'Fizz'] for n=6.",
              expectedOutput: "[1, 2, 'Fizz', 4, 'Buzz', 'Fizz']",
              hints: [
                "Check i % 15 == 0 first before i % 3 == 0.",
                "Use elif i % 3 == 0 and elif i % 5 == 0 for the individual cases."
              ],
              validationRules: [
                {
                  id: "py-fb-out",
                  type: "output_contains",
                  value: "[1, 2, 'Fizz', 4, 'Buzz', 'Fizz']",
                  description: "Output must match expected FizzBuzz array"
                }
              ],
              solutionCode: "def fizzbuzz_list(n):\n    results = []\n    for i in range(1, n + 1):\n        if i % 3 == 0 and i % 5 == 0:\n            results.append(\"FizzBuzz\")\n        elif i % 3 == 0:\n            results.append(\"Fizz\")\n        elif i % 5 == 0:\n            results.append(\"Buzz\")\n        else:\n            results.append(i)\n    return results\n\nprint(fizzbuzz_list(6))\n",
              order: 0
            }
          ],
          quizQuestions: [
            {
              id: "py-13-q1",
              question: "Why must the condition for divisibility by 15 be checked before 3 or 5?",
              options: [
                { id: "opt-1", text: "Because Python requires larger numbers first" },
                { id: "opt-2", text: "Because any number divisible by 15 is also divisible by 3, which would trigger prematurely" },
                { id: "opt-3", text: "To optimize memory usage" },
                { id: "opt-4", text: "Order does not matter" }
              ],
              correctOptionIndex: 1,
              explanation: "If i % 3 == 0 was evaluated first for 15, it would match and print 'Fizz' prematurely."
            },
            {
              id: "py-13-q2",
              question: "What is the remainder operator in Python?",
              options: [
                { id: "opt-1", text: "//" },
                { id: "opt-2", text: "%" },
                { id: "opt-3", text: "rem" },
                { id: "opt-4", text: "mod" }
              ],
              correctOptionIndex: 1,
              explanation: "The % operator computes remainder of integer division."
            }
          ]
        },
        {
          title: "14. Mini-Project: Text Adventure Logic",
          description: "Build state management functions for a text-based game.",
          lessonType: "project",
          durationSeconds: 900,
          order: 3,
          isPreview: false,
          body: "Build helper functions to initialize player state, pick up items, and apply damage.",
          codingBlocks: [
            {
              id: "py-14-block",
              blockType: "starter_code",
              title: "Adventure Game Functions",
              content: "Implement create_player(name), pick_up(player, item), and take_damage(player, amount).",
              language: "python",
              starterCode: "def create_player(name):\n    return {\"name\": name, \"hp\": 100, \"inventory\": []}\n\ndef pick_up(player, item):\n    # Append item to player['inventory'] and print f'Picked up {item}'\n    pass\n\ndef take_damage(player, amount):\n    # Subtract amount from hp, not dropping below 0\n    pass\n\nhero = create_player(\"Robin\")\npick_up(hero, \"magic crystal\")\ntake_damage(hero, 35)\nprint(f\"Player {hero['name']}: {hero['hp']} HP | Items: {hero['inventory']}\")\n",
              instructions: "Fill in pick_up and take_damage so hero has 65 HP and item 'magic crystal'.",
              expectedOutput: "Picked up magic crystal\nPlayer Robin: 65 HP | Items: ['magic crystal']",
              hints: [
                "player['inventory'].append(item)",
                "player['hp'] = max(0, player['hp'] - amount)"
              ],
              validationRules: [
                {
                  id: "py-adv-pickup",
                  type: "output_contains",
                  value: "Picked up magic crystal",
                  description: "Output must include 'Picked up magic crystal'"
                },
                {
                  id: "py-adv-hp",
                  type: "output_contains",
                  value: "Player Robin: 65 HP",
                  description: "Output must show 65 HP"
                }
              ],
              solutionCode: "def create_player(name):\n    return {\"name\": name, \"hp\": 100, \"inventory\": []}\n\ndef pick_up(player, item):\n    player[\"inventory\"].append(item)\n    print(f\"Picked up {item}\")\n\ndef take_damage(player, amount):\n    player[\"hp\"] = max(0, player[\"hp\"] - amount)\n\nhero = create_player(\"Robin\")\npick_up(hero, \"magic crystal\")\ntake_damage(hero, 35)\nprint(f\"Player {hero['name']}: {hero['hp']} HP | Items: {hero['inventory']}\")\n",
              order: 0
            }
          ],
          quizQuestions: [
            {
              id: "py-14-q1",
              question: "Why is passing a dictionary to a function useful for tracking game state in Python?",
              options: [
                { id: "opt-1", text: "Dictionaries are immutable" },
                { id: "opt-2", text: "Dictionaries are mutable references, so modifications inside functions persist" },
                { id: "opt-3", text: "Dictionaries execute faster than integers" },
                { id: "opt-4", text: "Python requires all games to use dictionaries" }
              ],
              correctOptionIndex: 1,
              explanation: "Dictionaries are mutable reference types, allowing functions to update state cleanly."
            },
            {
              id: "py-14-q2",
              question: "What built-in function ensures a value never drops below zero (e.g. max(0, val))?",
              options: [
                { id: "opt-1", text: "min()" },
                { id: "opt-2", text: "max()" },
                { id: "opt-3", text: "clamp()" },
                { id: "opt-4", text: "floor()" }
              ],
              correctOptionIndex: 1,
              explanation: "max(0, val) picks whichever is larger, guaranteeing the output is at least 0."
            }
          ]
        },
        {
          title: "15. Final Project: Gradebook & Statistics Tracker",
          description: "Build an object-oriented gradebook calculating student and class statistics.",
          lessonType: "project",
          durationSeconds: 1000,
          order: 4,
          isPreview: false,
          body: "Construct a Gradebook class to record scores and calculate individual and class averages.",
          codingBlocks: [
            {
              id: "py-15-block",
              blockType: "starter_code",
              title: "Gradebook Class",
              content: "Implement get_student_average and get_class_average on the Gradebook class.",
              language: "python",
              starterCode: "class Gradebook:\n    def __init__(self):\n        self.students = {}\n\n    def add_score(self, name, score):\n        if name not in self.students:\n            self.students[name] = []\n        self.students[name].append(score)\n\n    def get_student_average(self, name):\n        scores = self.students.get(name, [])\n        if not scores:\n            return 0.0\n        return sum(scores) / len(scores)\n\n    def get_class_average(self):\n        all_scores = []\n        for scores in self.students.values():\n            all_scores.extend(scores)\n        if not all_scores:\n            return 0.0\n        return sum(all_scores) / len(all_scores)\n\ngb = Gradebook()\ngb.add_score(\"Alice\", 90)\ngb.add_score(\"Alice\", 100)\ngb.add_score(\"Bob\", 70)\ngb.add_score(\"Bob\", 80)\n\nprint(f\"Alice Average: {gb.get_student_average('Alice'):.1f}\")\nprint(f\"Bob Average: {gb.get_student_average('Bob'):.1f}\")\nprint(f\"Class Average: {gb.get_class_average():.1f}\")\n",
              instructions: "Run the gradebook and verify averages.",
              expectedOutput: "Alice Average: 95.0\nBob Average: 75.0\nClass Average: 85.0",
              hints: [
                "Alice's scores are 90 and 100 (avg 95.0).",
                "Bob's scores are 70 and 80 (avg 75.0).",
                "Total scores average 85.0."
              ],
              validationRules: [
                {
                  id: "py-gb-alice",
                  type: "output_contains",
                  value: "Alice Average: 95.0",
                  description: "Output must show Alice Average: 95.0"
                },
                {
                  id: "py-gb-bob",
                  type: "output_contains",
                  value: "Bob Average: 75.0",
                  description: "Output must show Bob Average: 75.0"
                },
                {
                  id: "py-gb-class",
                  type: "output_contains",
                  value: "Class Average: 85.0",
                  description: "Output must show Class Average: 85.0"
                }
              ],
              solutionCode: "class Gradebook:\n    def __init__(self):\n        self.students = {}\n\n    def add_score(self, name, score):\n        if name not in self.students:\n            self.students[name] = []\n        self.students[name].append(score)\n\n    def get_student_average(self, name):\n        scores = self.students.get(name, [])\n        if not scores:\n            return 0.0\n        return sum(scores) / len(scores)\n\n    def get_class_average(self):\n        all_scores = []\n        for scores in self.students.values():\n            all_scores.extend(scores)\n        if not all_scores:\n            return 0.0\n        return sum(all_scores) / len(all_scores)\n\ngb = Gradebook()\ngb.add_score(\"Alice\", 90)\ngb.add_score(\"Alice\", 100)\ngb.add_score(\"Bob\", 70)\ngb.add_score(\"Bob\", 80)\n\nprint(f\"Alice Average: {gb.get_student_average('Alice'):.1f}\")\nprint(f\"Bob Average: {gb.get_student_average('Bob'):.1f}\")\nprint(f\"Class Average: {gb.get_class_average():.1f}\")\n",
              order: 0
            }
          ],
          quizQuestions: [
            {
              id: "py-15-q1",
              question: "What built-in function returns the sum of all elements in a list of numbers?",
              options: [
                { id: "opt-1", text: "total()" },
                { id: "opt-2", text: "sum()" },
                { id: "opt-3", text: "add_all()" },
                { id: "opt-4", text: "math.sum()" }
              ],
              correctOptionIndex: 1,
              explanation: "Python provides the built-in sum() function for iterables of numbers."
            },
            {
              id: "py-15-q2",
              question: "Which method adds all items from another list to an existing list in Python?",
              options: [
                { id: "opt-1", text: "push_all()" },
                { id: "opt-2", text: "extend()" },
                { id: "opt-3", text: "append_many()" },
                { id: "opt-4", text: "merge()" }
              ],
              correctOptionIndex: 1,
              explanation: "list.extend(iterable) appends all elements from the iterable to the list."
            }
          ]
        }
      ]
    }
  ]
};
