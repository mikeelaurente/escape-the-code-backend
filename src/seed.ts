import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from './db';
import * as schema from './db/schema';

// /*
//   Seed: "Code Quest: The Sparkling City of JS"
//   Audience: Elementary students
//   Scope: JS basics only (no OOP)
//   Structure: 4 Chapters × 3 Sections each = 12 Sections total
//   Each Section: 3 Challenges (easy, medium, hard)
//   Each Challenge: ≥3 tests, ≥3 hints
// */

// async function main() {
//   return db().transaction(async (tx) => {
//     console.log('Starting seed transaction');
//     // clear all tables
//     console.log('Clearing existing data...');
//     await tx.delete(schema.creditUsage);
//     await tx.delete(schema.userAchievements);
//     await tx.delete(schema.achievements);
//     await tx.delete(schema.userCredits);
//     await tx.delete(schema.challengeHints);
//     await tx.delete(schema.challenges);
//     await tx.delete(schema.sections);
//     await tx.delete(schema.chapters);
//     await tx.delete(schema.storyProgress);
//     await tx.delete(schema.stories);
//     await tx.delete(schema.users);

//     console.log('Existing data cleared.');

//     // seed users
//     console.log('Seeding users and related data...');
//     const emails = ['test@gmail.com', 'test2@gmail.com', 'test3@gmail.com'];
//     for (let email of emails) {
//       const user: typeof schema.users.$inferInsert = {
//         email,
//         hashedPassword: 'password',
//         firstName: 'first',
//         lastName: 'last',
//       };
//       await tx.insert(schema.users).values(user);

//       const createdUser = await tx.query.users.findFirst({
//         where: eq(schema.users.email, email),
//       });

//       const studentCredit: typeof schema.userCredits.$inferInsert = {
//         userId: createdUser?.id,
//         value: 100,
//       };

//       await tx.insert(schema.userCredits).values(studentCredit);
//     }

//     // ===== STORY =====
//     await tx.insert(schema.stories).values({
//       title: 'Code Quest: The Sparkling City of JS',
//       description:
//         'Join Zia and Pax as they explore the Sparkling City of JS. Learn JavaScript basics by solving tiny puzzles to light bridges, open doors, and help friendly bots. No OOP—just the building blocks!',
//       rewardOptions: {
//         easy: 20,
//         medium: 30,
//         hard: 50,
//       },
//     });

//     const story = await tx.query.stories.findFirst({
//       where: eq(schema.stories.title, 'Code Quest: The Sparkling City of JS'),
//     });

//     // ===== CONTENT DESIGN =====
//     type Challenge = {
//       title: string;
//       description: string;
//       difficulty: 'easy' | 'medium' | 'hard';
//       tests: Array<{ input: any; expect: any }>;
//       rewardPoints: number;
//       moduleType: 'javascript';
//       hints: string[];
//     };

//     type Section = {
//       title: string;
//       description: string;
//       content: string;
//       challenges: Challenge[];
//     };

//     type Chapter = {
//       title: string;
//       description: string;
//       sections: Section[];
//     };

//     const REWARD = { easy: 10, medium: 20, hard: 30 };
//     const COMMON_REWARD_OPTIONS = { easy: 20, medium: 30, hard: 50 };

//     // Helper: stringify tests into expectedOutput
//     const testsJson = (tests: Array<{ input: any; expect: any }>) =>
//       JSON.stringify(tests);

//     // ===== DEFINE CHAPTERS =====
//     const chapters: Chapter[] = [
//       {
//         title: 'Chapter 1 — Welcome to Codeville!',
//         description:
//           'Zia and Pax land at the gates of Codeville. To enter, they must speak with the Console Keeper and learn how messages and numbers work.',
//         sections: [
//           {
//             title: 'S1.1 — Say Hello, Console!',
//             description: 'First steps with console.log and comments.',
//             content:
//               `Zia and Pax meet the Console Keeper. He says, “If you can say hello in JavaScript, I’ll open the gate!”\n\n +
//               \n- Use \console.log('Hello')\` to print messages.\n- Comments help humans read your code: \n// this is a note\`.\n- Strings are words wrapped in quotes.\n\n +
//               \n\n\n\js\n// This prints a friendly hello\nconsole.log('Hello, Codeville!');`,
//             challenges: [
//               {
//                 title: 'S1.1 Challenge (Easy) — Hello, Codeville!',
//                 description:
//                   'Print exactly: Hello, Codeville! (use console.log).',
//                 difficulty: 'easy',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.easy,
//                 tests: [
//                   { input: '', expect: 'Hello, Codeville!' },
//                   { input: null, expect: 'Hello, Codeville!' },
//                   { input: undefined, expect: 'Hello, Codeville!' },
//                 ],
//                 hints: [
//                   'Use console.log with a string in quotes.',
//                   'Make sure the text matches exactly (capital letters and punctuation).',
//                   'No input needed—just print the message.',
//                 ],
//               },
//               {
//                 title: 'S1.1 Challenge (Medium) — Greet the Visitor',
//                 description:
//                   'Input is a name. Print: Hello, <name>! (e.g., input: "Zia" → "Hello, Zia!")',
//                 difficulty: 'medium',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.medium,
//                 tests: [
//                   { input: 'Zia', expect: 'Hello, Zia!' },
//                   { input: 'Pax', expect: 'Hello, Pax!' },
//                   { input: 'Buddy', expect: 'Hello, Buddy!' },
//                 ],
//                 hints: [
//                   'Read the input string and add it after "Hello, ".',
//                   'Remember to add the exclamation point!',
//                   'Use string concatenation with + or template strings.',
//                 ],
//               },
//               {
//                 title: 'S1.1 Challenge (Hard) — Reverse the Password',
//                 description:
//                   'Input is two words separated by a space (e.g., "magic door"). Print them reversed: "door magic".',
//                 difficulty: 'hard',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.hard,
//                 tests: [
//                   { input: 'magic door', expect: 'door magic' },
//                   { input: 'hello world', expect: 'world hello' },
//                   { input: 'red balloon', expect: 'balloon red' },
//                 ],
//                 hints: [
//                   'Split the string by space into an array.',
//                   'Reverse the order of the two words.',
//                   'Join them back with a single space.',
//                 ],
//               },
//             ],
//           },
//           {
//             title: 'S1.2 — Number Nook',
//             description: 'Meet numbers and do simple math.',
//             content:
//               Story: The Number Gnomes love puzzles! They show Zia and Pax how numbers can be added and compared.\n\n +
//               Lesson:\n- Numbers don’t need quotes.\n- Operators: +, -, *, /, %\n- Order matters: parentheses first.\n\n +
//               Example:\n\`\`\js\nconsole.log(2 + 3); // 5\nconsole.log((2 + 3) * 4); // 20\n\`\`\`\n`,
//             challenges: [
//               {
//                 title: 'S1.2 Challenge (Easy) — Add Two',
//                 description:
//                   'Input is two numbers a and b. Print a + b.',
//                 difficulty: 'easy',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.easy,
//                 tests: [
//                   { input: [2, 3], expect: 5 },
//                   { input: [10, 5], expect: 15 },
//                   { input: [0, 7], expect: 7 },
//                 ],
//                 hints: [
//                   'Add the two numbers.',
//                   'No strings—keep them as numbers.',
//                   'Print the result with console.log.',
//                 ],
//               },
//               {
//                 title: 'S1.2 Challenge (Medium) — Average of Three',
//                 description:
//                   'Input is three numbers. Print their average.',
//                 difficulty: 'medium',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.medium,
//                 tests: [
//                   { input: [3, 3, 3], expect: 3 },
//                   { input: [2, 4, 6], expect: 4 },
//                   { input: [10, 0, 5], expect: 5 },
//                 ],
//                 hints: [
//                   'Add all three numbers.',
//                   'Divide by 3.',
//                   'Be careful with parentheses.',
//                 ],
//               },
//               {
//                 title: 'S1.2 Challenge (Hard) — Celsius to Fahrenheit',
//                 description:
//                   'Input is a number C (Celsius). Print F using F = C * 9/5 + 32.',
//                 difficulty: 'hard',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.hard,
//                 tests: [
//                   { input: 0, expect: 32 },
//                   { input: 100, expect: 212 },
//                   { input: -40, expect: -40 },
//                 ],
//                 hints: [
//                   'Multiply by 9, then divide by 5.',
//                   'Add 32 at the end.',
//                   'Mind negative numbers—they work too!',
//                 ],
//               },
//             ],
//           },
//           {
//             title: 'S1.3 — String Street',
//             description: 'Play with letters and words.',
//             content:
//               Story: On String Street, signs are made of letters. Zia learns how to measure and change words.\n\n +
//               Lesson:\n- "abc".length → 3\n- Join words with + or \`\${}\.\n- Upper/lower case with \`.toUpperCase()\` / \`.toLowerCase()\`.\n\n` +
//               Example:\n\`\`\js\nconst name = 'Zia';\nconsole.log(name.length); // 3\nconsole.log(name.toUpperCase()); // ZIA\n\`\`\`\n`,
//             challenges: [
//               {
//                 title: 'S1.3 Challenge (Easy) — Count Letters',
//                 description:
//                   'Input is a word. Print how many letters it has.',
//                 difficulty: 'easy',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.easy,
//                 tests: [
//                   { input: 'cat', expect: 3 },
//                   { input: 'robot', expect: 5 },
//                   { input: 'A', expect: 1 },
//                 ],
//                 hints: [
//                   'Use the .length property.',
//                   'The input is a string (word).',
//                   'Just print the number (no extra text).',
//                 ],
//               },
//               {
//                 title: 'S1.3 Challenge (Medium) — First and Last',
//                 description:
//                   'Input is a word. Print "<first>-<last>" (e.g., "hello" → "h-o").',
//                 difficulty: 'medium',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.medium,
//                 tests: [
//                   { input: 'hello', expect: 'h-o' },
//                   { input: 'Pax', expect: 'P-x' },
//                   { input: 'Z', expect: 'Z-Z' },
//                 ],
//                 hints: [
//                   'First letter is at index 0.',
//                   'Last letter is at index word.length - 1.',
//                   'Use a dash between them.',
//                 ],
//               },
//               {
//                 title: 'S1.3 Challenge (Hard) — Case Shout',
//                 description:
//                   'Input is a word. Print it in ALL CAPS.',
//                 difficulty: 'hard',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.hard,
//                 tests: [
//                   { input: 'hello', expect: 'HELLO' },
//                   { input: 'Zia', expect: 'ZIA' },
//                   { input: 'code', expect: 'CODE' },
//                 ],
//                 hints: [
//                   'Use .toUpperCase().',
//                   'The input is already a string.',
//                   'Print exactly the changed word.',
//                 ],
//               },
//             ],
//           },
//         ],
//       },
//       {
//         title: 'Chapter 2 — The Meadow of Variables',
//         description:
//           'The Meadow has growing labels called variables. Zia and Pax learn to store and change values with let and const.',
//         sections: [
//           {
//             title: 'S2.1 — Let and Const',
//             description: 'Create boxes to hold values.',
//             content:
//               Story: The Meadow Keeper hands out boxes. Some boxes can change (let). Some boxes must stay the same (const).\n\n +
//               Lesson:\n- \let\` for values that may change.\n- \`const\` for values that never change.\n- Names should be clear and friendly: \`let apples = 3;\`\n\n` +
//               Example:\n\`\`\js\nconst schoolName = 'Codeville Elementary';\nlet score = 0;\nscore = score + 10;\n\`\`\`\n`,
//             challenges: [
//               {
//                 title: 'S2.1 Challenge (Easy) — Apple Counter',
//                 description:
//                   'Start with let apples = 5. Add 2. Print the new number.',
//                 difficulty: 'easy',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.easy,
//                 tests: [
//                   { input: '', expect: 7 },
//                   { input: null, expect: 7 },
//                   { input: undefined, expect: 7 },
//                 ],
//                 hints: [
//                   'Declare with let so it can change.',
//                   'Add 2 to apples.',
//                   'Print the final number.',
//                 ],
//               },
//               {
//                 title: 'S2.1 Challenge (Medium) — Favorite Animal',
//                 description:
//                   'Use const to store a favorite animal string, then print it.',
//                 difficulty: 'medium',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.medium,
//                 tests: [
//                   { input: '', expect: 'penguin' },
//                   { input: null, expect: 'penguin' },
//                   { input: undefined, expect: 'penguin' },
//                 ],
//                 hints: [
//                   'Pick any animal, e.g., "penguin".',
//                   'Use const since it won’t change.',
//                   'Print just the animal word.',
//                 ],
//               },
//               {
//                 title: 'S2.1 Challenge (Hard) — Swap Snacks',
//                 description:
//                   'You have two let variables: snackA = "cookie", snackB = "chips". Swap their values, then print "cookie chips" → should become "chips cookie".',
//                 difficulty: 'hard',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.hard,
//                 tests: [
//                   { input: '', expect: 'chips cookie' },
//                   { input: null, expect: 'chips cookie' },
//                   { input: undefined, expect: 'chips cookie' },
//                 ],
//                 hints: [
//                   'Use a temporary variable to hold one value.',
//                   'Then replace the first, then the second.',
//                   'Print snackA + " " + snackB at the end.',
//                 ],
//               },
//             ],
//           },
//           {
//             title: 'S2.2 — Types for Tiny Explorers',
//             description: 'Numbers, strings, and booleans.',
//             content:
//               Story: A friendly Type Troll helps identify what’s inside each box.\n\n +
//               Lesson:\n- number: 3, 10.5\n- string: "hi", 'abc'\n- boolean: true/false\n- typeof tells the type: \typeof 7 // "number"\`\n\n`,
//             challenges: [
//               {
//                 title: 'S2.2 Challenge (Easy) — Type Check: Number',
//                 description:
//                   'Input is a value. If it’s a number, print "number". Otherwise print "not number".',
//                 difficulty: 'easy',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.easy,
//                 tests: [
//                   { input: 7, expect: 'number' },
//                   { input: '7', expect: 'not number' },
//                   { input: true, expect: 'not number' },
//                 ],
//                 hints: [
//                   'Use typeof.',
//                   'Compare to the string "number".',
//                   'Print exactly "number" or "not number".',
//                 ],
//               },
//               {
//                 title: 'S2.2 Challenge (Medium) — Make a Boolean',
//                 description:
//                   'Input is a number n. Print true if n is greater than 10, else false.',
//                 difficulty: 'medium',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.medium,
//                 tests: [
//                   { input: 11, expect: true },
//                   { input: 10, expect: false },
//                   { input: 3, expect: false },
//                 ],
//                 hints: [
//                   'Use > to compare.',
//                   'Return or print boolean true/false, not strings.',
//                   'Edge case: n = 10 should be false.',
//                 ],
//               },
//               {
//                 title: 'S2.2 Challenge (Hard) — String to Number',
//                 description:
//                   'Input is a string like "12". Convert it to a number and add 3. Print the result.',
//                 difficulty: 'hard',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.hard,
//                 tests: [
//                   { input: '12', expect: 15 },
//                   { input: '0', expect: 3 },
//                   { input: '7', expect: 10 },
//                 ],
//                 hints: [
//                   'Use Number(...) or parseInt(...).',
//                   'Add 3 after converting.',
//                   'Don’t add strings—convert first!',
//                 ],
//               },
//             ],
//           },
//           {
//             title: 'S2.3 — Reading Inputs Carefully',
//             description: 'Clean and prepare values.',
//             content:
//               Story: The Gate Printer is picky—values must be clean!\n\n +
//               Lesson:\n- Trim spaces with .trim().\n- Convert types before math.\n- Keep an eye on unexpected inputs.\n,
//             challenges: [
//               {
//                 title: 'S2.3 Challenge (Easy) — Tidy Name',
//                 description:
//                   'Input is a name with spaces, e.g., "  Zia  ". Print it without extra spaces: "Zia".',
//                 difficulty: 'easy',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.easy,
//                 tests: [
//                   { input: '  Zia  ', expect: 'Zia' },
//                   { input: ' Pax ', expect: 'Pax' },
//                   { input: 'Buddy', expect: 'Buddy' },
//                 ],
//                 hints: [
//                   'Use .trim().',
//                   'Trim removes spaces at the start and end.',
//                   'Print the cleaned string.',
//                 ],
//               },
//               {
//                 title: 'S2.3 Challenge (Medium) — Add Clean Numbers',
//                 description:
//                   'Input is two strings with spaces, like " 3 " and " 4 ". Convert and add to print 7.',
//                 difficulty: 'medium',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.medium,
//                 tests: [
//                   { input: [' 3 ', ' 4 '], expect: 7 },
//                   { input: ['10', '  5'], expect: 15 },
//                   { input: ['0 ', '0'], expect: 0 },
//                 ],
//                 hints: [
//                   'First trim both inputs.',
//                   'Then convert to numbers.',
//                   'Finally add and print.',
//                 ],
//               },
//               {
//                 title: 'S2.3 Challenge (Hard) — First Word Only',
//                 description:
//                   'Input is a sentence. Print only the first word.',
//                 difficulty: 'hard',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.hard,
//                 tests: [
//                   { input: 'Hello world from JS', expect: 'Hello' },
//                   { input: 'Zia explores', expect: 'Zia' },
//                   { input: 'Code!', expect: 'Code!' },
//                 ],
//                 hints: [
//                   'Split by spaces into an array.',
//                   'The first word is at index 0.',
//                   'Print just that word.',
//                 ],
//               },
//             ],
//           },
//         ],
//       },
//       {
//         title: 'Chapter 3 — The Forking Forest (Decisions)',
//         description:
//           'Paths split and choices matter! Ifs and elses help Zia and Pax make decisions.',
//         sections: [
//           {
//             title: 'S3.1 — If This, Else That',
//             description: 'Use if/else to choose a path.',
//             content:
//               Story: Two bridges: one for tall travelers, one for everyone else.\n\n +
//               Lesson:\n- if (condition) { ... } else { ... }\n- Comparison: >, <, >=, <=, ===, !==\n\n,
//             challenges: [
//               {
//                 title: 'S3.1 Challenge (Easy) — Is Adult?',
//                 description:
//                   'Input is age. Print "adult" if age >= 18, else "kid".',
//                 difficulty: 'easy',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.easy,
//                 tests: [
//                   { input: 18, expect: 'adult' },
//                   { input: 7, expect: 'kid' },
//                   { input: 30, expect: 'adult' },
//                 ],
//                 hints: [
//                   'Use >= for 18 and up.',
//                   'If not adult, print kid.',
//                   'Be exact with the words.',
//                 ],
//               },
//               {
//                 title: 'S3.1 Challenge (Medium) — Even or Odd',
//                 description:
//                   'Input is a number n. Print "even" if n % 2 === 0 else "odd".',
//                 difficulty: 'medium',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.medium,
//                 tests: [
//                   { input: 4, expect: 'even' },
//                   { input: 7, expect: 'odd' },
//                   { input: 0, expect: 'even' },
//                 ],
//                 hints: [
//                   'Use the % operator.',
//                   'n % 2 gives remainder after dividing by 2.',
//                   '0 means even.',
//                 ],
//               },
//               {
//                 title: 'S3.1 Challenge (Hard) — Three-Way Sign',
//                 description:
//                   'Input is a number n. Print "positive", "negative", or "zero".',
//                 difficulty: 'hard',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.hard,
//                 tests: [
//                   { input: 5, expect: 'positive' },
//                   { input: -2, expect: 'negative' },
//                   { input: 0, expect: 'zero' },
//                 ],
//                 hints: [
//                   'First check zero or use an else-if ladder.',
//                   'n > 0 means positive.',
//                   'n < 0 means negative.',
//                 ],
//               },
//             ],
//           },
//           {
//             title: 'S3.2 — AND & OR: Teamwork',
//             description: 'Use logical operators to combine ideas.',
//             content:
//               Story: Two switches control a light. Sometimes both must be ON.\n\n +
//               Lesson:\n- AND: \`&&\ (both are true)\n- OR: \`||\` (at least one is true)\n- NOT: \`!\`\n\n`,
//             challenges: [
//               {
//                 title: 'S3.2 Challenge (Easy) — Both True',
//                 description:
//                   'Input is two booleans. Print true only if both are true, else false.',
//                 difficulty: 'easy',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.easy,
//                 tests: [
//                   { input: [true, true], expect: true },
//                   { input: [true, false], expect: false },
//                   { input: [false, false], expect: false },
//                 ],
//                 hints: [
//                   'Use &&.',
//                   'Both must be true.',
//                   'Return/print a boolean, not a string.',
//                 ],
//               },
//               {
//                 title: 'S3.2 Challenge (Medium) — Door Pass',
//                 description:
//                   'Input is two numbers: height and age. Print true if height >= 120 OR age >= 12, else false.',
//                 difficulty: 'medium',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.medium,
//                 tests: [
//                   { input: [130, 8], expect: true },
//                   { input: [110, 12], expect: true },
//                   { input: [110, 10], expect: false },
//                 ],
//                 hints: [
//                   'Use || for OR.',
//                   'Check height first, then age.',
//                   'Return a boolean.',
//                 ],
//               },
//               {
//                 title: 'S3.2 Challenge (Hard) — Safety Helmet',
//                 description:
//                   'Input is two booleans: hasHelmet, isCareful. Print "safe" if hasHelmet && isCareful, else "unsafe".',
//                 difficulty: 'hard',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.hard,
//                 tests: [
//                   { input: [true, true], expect: 'safe' },
//                   { input: [true, false], expect: 'unsafe' },
//                   { input: [false, true], expect: 'unsafe' },
//                 ],
//                 hints: [
//                   'Use && to require both.',
//                   'Map true to "safe", false to "unsafe".',
//                   'Be exact with the words.',
//                 ],
//               },
//             ],
//           },
//           {
//             title: 'S3.3 — Mini Score Keeper',
//             description: 'Compare numbers to give prizes.',
//             content:
//               Story: The Forest Fair hands out ribbons based on scores.\n\n +
//               Lesson:\n- Chain comparisons with else-if.\n- Order your checks carefully!\n\n,
//             challenges: [
//               {
//                 title: 'S3.3 Challenge (Easy) — Pass or Try Again',
//                 description:
//                   'Input is score. Print "pass" if score >= 50 else "try again".',
//                 difficulty: 'easy',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.easy,
//                 tests: [
//                   { input: 50, expect: 'pass' },
//                   { input: 49, expect: 'try again' },
//                   { input: 80, expect: 'pass' },
//                 ],
//                 hints: [
//                   'Use >= 50 for passing.',
//                   'Else print "try again".',
//                   'No extra text.',
//                 ],
//               },
//               {
//                 title: 'S3.3 Challenge (Medium) — Ribbon Color',
//                 description:
//                   'Input is score. 80+ → "gold", 60–79 → "silver", else "bronze".',
//                 difficulty: 'medium',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.medium,
//                 tests: [
//                   { input: 85, expect: 'gold' },
//                   { input: 70, expect: 'silver' },
//                   { input: 40, expect: 'bronze' },
//                 ],
//                 hints: [
//                   'Check gold first (highest).',
//                   'Then silver range.',
//                   'Else bronze.',
//                 ],
//               },
//               {
//                 title: 'S3.3 Challenge (Hard) — Nearest Ten',
//                 description:
//                   'Input is a number n. Print the nearest multiple of 10 (e.g., 14 → 10, 16 → 20, 15 → 20).',
//                 difficulty: 'hard',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.hard,
//                 tests: [
//                   { input: 14, expect: 10 },
//                   { input: 16, expect: 20 },
//                   { input: 25, expect: 30 },
//                 ],
//                 hints: [
//                   'Find remainder with n % 10.',
//                   'If remainder < 5, round down.',
//                   'Else round up to next 10.',
//                 ],
//               },
//             ],
//           },
//         ],
//       },
//       {
//         title: 'Chapter 4 — Loops, Arrays, and Little Functions',
//         description:
//           'Zia and Pax meet Robot Helpers who love repeating tasks and making lists.',
//         sections: [
//           {
//             title: 'S4.1 — Array Alley',
//             description: 'Make and read lists.',
//             content:
//               Story: In Array Alley, items line up in order.\n\n +
//               Lesson:\n- Arrays: \const nums = [1,2,3]\`\n- Access with index: nums[0]\n- Length: nums.length\n\n`,
//             challenges: [
//               {
//                 title: 'S4.1 Challenge (Easy) — First Item',
//                 description:
//                   'Input is an array. Print the first item.',
//                 difficulty: 'easy',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.easy,
//                 tests: [
//                   { input: [1, 2, 3], expect: 1 },
//                   { input: ['a', 'b'], expect: 'a' },
//                   { input: [7], expect: 7 },
//                 ],
//                 hints: [
//                   'Index 0 is the first item.',
//                   'Print exactly that value.',
//                   'Arrays can hold numbers or strings.',
//                 ],
//               },
//               {
//                 title: 'S4.1 Challenge (Medium) — Last Item',
//                 description:
//                   'Input is an array. Print the last item.',
//                 difficulty: 'medium',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.medium,
//                 tests: [
//                   { input: [1, 2, 3], expect: 3 },
//                   { input: ['cat', 'dog'], expect: 'dog' },
//                   { input: [9, 8, 7, 6], expect: 6 },
//                 ],
//                 hints: [
//                   'Use length - 1 for last index.',
//                   'Careful if there’s only one item.',
//                   'Print the value, not the index.',
//                 ],
//               },
//               {
//                 title: 'S4.1 Challenge (Hard) — Sum of Three',
//                 description:
//                   'Input is an array of exactly three numbers. Print their sum.',
//                 difficulty: 'hard',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.hard,
//                 tests: [
//                   { input: [1, 2, 3], expect: 6 },
//                   { input: [10, 0, -5], expect: 5 },
//                   { input: [7, 7, 7], expect: 21 },
//                 ],
//                 hints: [
//                   'Access by index 0,1,2.',
//                   'Add them carefully.',
//                   'Print the total.',
//                 ],
//               },
//             ],
//           },
//           {
//             title: 'S4.2 — For-Loop Bridge',
//             description: 'Repeat steps with for loops.',
//             content:
//               Story: A long bridge needs repeating steps to cross.\n\n +
//               Lesson:\n- \for (let i=0; i<times; i++) { ... }\`\n- Great for counting and visiting array items.\n\n`,
//             challenges: [
//               {
//                 title: 'S4.2 Challenge (Easy) — Count to N',
//                 description:
//                   'Input is a number n. Print numbers 1..n on one line separated by spaces.',
//                 difficulty: 'easy',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.easy,
//                 tests: [
//                   { input: 3, expect: '1 2 3' },
//                   { input: 1, expect: '1' },
//                   { input: 5, expect: '1 2 3 4 5' },
//                 ],
//                 hints: [
//                   'Start i at 1.',
//                   'Stop when i <= n.',
//                   'Collect into a string and print once.',
//                 ],
//               },
//               {
//                 title: 'S4.2 Challenge (Medium) — Double Each',
//                 description:
//                   'Input is an array of numbers. Print a space-separated line where each number is doubled.',
//                 difficulty: 'medium',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.medium,
//                 tests: [
//                   { input: [1, 2, 3], expect: '2 4 6' },
//                   { input: [5], expect: '10' },
//                   { input: [0, -1], expect: '0 -2' },
//                 ],
//                 hints: [
//                   'Loop across array indices.',
//                   'Multiply each by 2.',
//                   'Join with spaces at the end.',
//                 ],
//               },
//               {
//                 title: 'S4.2 Challenge (Hard) — Count Evens',
//                 description:
//                   'Input is an array of numbers. Print how many are even.',
//                 difficulty: 'hard',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.hard,
//                 tests: [
//                   { input: [1, 2, 3, 4], expect: 2 },
//                   { input: [0, 5, 7], expect: 1 },
//                   { input: [2, 2, 2, 2], expect: 4 },
//                 ],
//                 hints: [
//                   'Use a counter variable.',
//                   'Check n % 2 === 0.',
//                   'Print the final count.',
//                 ],
//               },
//             ],
//           },
//           {
//             title: 'S4.3 — Friendly Functions',
//             description: 'Pack steps into a helper that returns a result.',
//             content:
//               Story: Robot Helpers love tiny tools called functions.\n\n +
//               Lesson:\n- \function add(a,b){ return a+b; }\`\n- Call it: \`add(2,3)\` → 5\n- Functions can accept inputs and give outputs.\n\n`,
//             challenges: [
//               {
//                 title: 'S4.3 Challenge (Easy) — Say Hi Function',
//                 description:
//                   'Write a function sayHi(name) that returns "Hi, <name>!". Print the result for the input name.',
//                 difficulty: 'easy',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.easy,
//                 tests: [
//                   { input: 'Zia', expect: 'Hi, Zia!' },
//                   { input: 'Pax', expect: 'Hi, Pax!' },
//                   { input: 'Kit', expect: 'Hi, Kit!' },
//                 ],
//                 hints: [
//                   'Define a function with one parameter.',
//                   'Return, then print the returned value.',
//                   'Mind punctuation and spaces.',
//                 ],
//               },
//               {
//                 title: 'S4.3 Challenge (Medium) — Max of Two',
//                 description:
//                   'Write a function max2(a,b) that returns the larger number. Print the result.',
//                 difficulty: 'medium',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.medium,
//                 tests: [
//                   { input: [3, 9], expect: 9 },
//                   { input: [10, 10], expect: 10 },
//                   { input: [-5, 0], expect: 0 },
//                 ],
//                 hints: [
//                   'Use if/else to compare.',
//                   'If equal, either is fine to return.',
//                   'Return a number, not a string.',
//                 ],
//               },
//               {
//                 title: 'S4.3 Challenge (Hard) — Sum Array Function',
//                 description:
//                   'Write a function sumArr(arr) that returns the sum of all numbers in arr. Print the sum.',
//                 difficulty: 'hard',
//                 moduleType: 'javascript',
//                 rewardPoints: REWARD.hard,
//                 tests: [
//                   { input: [1, 2, 3], expect: 6 },
//                   { input: [0, 0, 0], expect: 0 },
//                   { input: [10, -5, 2], expect: 7 },
//                 ],
//                 hints: [
//                   'Start with total = 0.',
//                   'Loop through arr and add each number.',
//                   'Return total and then print it.',
//                 ],
//               },
//             ],
//           },
//         ],
//       },
//     ];

//     // ===== INSERT CHAPTERS/SECTIONS/CHALLENGES/HINTS =====
//     for (const ch of chapters) {
//       await tx.insert(schema.chapters).values({
//         title: ch.title,
//         storyId: story?.id,
//         description: ch.description,
//         rewardOptions: COMMON_REWARD_OPTIONS,
//       });

//       const createdChapter = await tx.query.chapters.findFirst({
//         where: eq(schema.chapters.title, ch.title),
//       });

//       for (const sec of ch.sections) {
//         await tx.insert(schema.sections).values({
//           title: sec.title,
//           chapterId: createdChapter?.id,
//           description: sec.description,
//           rewardOptions: COMMON_REWARD_OPTIONS,
//           content: sec.content,
//         });

//         const createdSection = await tx.query.sections.findFirst({
//           where: eq(schema.sections.title, sec.title),
//         });

//         for (const challenge of sec.challenges) {
//           await tx.insert(schema.challenges).values({
//             title: challenge.title,
//             sectionID: createdSection?.id,
//             description: challenge.description,
//             difficulty: challenge.difficulty,
//             // Store tests JSON here so your judge can read them later
//             expectedOutput: testsJson(challenge.tests),
//             moduleType: challenge.moduleType,
//             rewardPoints: challenge.rewardPoints,
//           });

//           const createdChallenge = await tx.query.challenges.findFirst({
//             where: eq(schema.challenges.title, challenge.title),
//           });

//           // Insert at least 3 hints
//           for (let i = 0; i < challenge.hints.length; i++) {
//             await tx.insert(schema.challengeHints).values({
//               challengeId: createdChallenge?.id,
//               displayText: Hint ${i + 1},
//               hintText: challenge.hints[i],
//               cost: (i + 1) * 5, // 5, 10, 15
//             });
//           }
//         }
//       }
//     }

//     console.log('Seeding completed');
//   });
// }

// main()
//   .then(() => {
//     console.log('Seeding completed');
//   })
//   .catch((e) => {
//     console.error(e);
//   });

async function main() {
  return db().transaction(async (tx) => {
    console.log('Starting seed transaction');
    // clear all tables
    console.log('Clearing existing data...');
    await tx.delete(schema.creditUsage);
    await tx.delete(schema.userAchievements);
    await tx.delete(schema.achievements);
    await tx.delete(schema.userCredits);
    await tx.delete(schema.challengeHints);
    await tx.delete(schema.challenges);
    await tx.delete(schema.sections);
    await tx.delete(schema.chapters);
    await tx.delete(schema.storyProgress);
    await tx.delete(schema.stories);
    await tx.delete(schema.users);

    console.log('Existing data cleared.');

    // seed users
    console.log('Seeding users and related data...');

    const emails = ['test@gmail.com', 'test2@gmail.com', 'test3@gmail.com'];

    for (let email of emails) {
      const user: typeof schema.users.$inferInsert = {
        email,
        hashedPassword: 'password',
        firstName: 'first',
        lastName: 'last',
      };
      await tx.insert(schema.users).values(user);

      const createdUser = await tx.query.users.findFirst({
        where: eq(schema.users.email, email),
      });

      const studentCredit: typeof schema.userCredits.$inferInsert = {
        userId: createdUser?.id,
        value: 100,
      };

      await tx.insert(schema.userCredits).values(studentCredit);
    }

    // story 1
    await tx.insert(schema.stories).values({
      title: 'The Lost Treasure',
      description: 'An epic adventure to find the lost treasure of Eldorado.',
      rewardOptions: {
        easy: 20,
        medium: 30,
        hard: 50,
      },
    });

    const story1 = await tx.query.stories.findFirst({
      where: eq(schema.stories.title, 'The Lost Treasure'),
    });

    const chapters = [
      { title: 'S1 - Chapter 1', description: 'chapter 1' },
      { title: 'S1 - Chapter 2', description: 'chapter 2' },
      { title: 'S1 - Chapter 3', description: 'chapter 3' },
      { title: 'S1 - Chapter 4', description: 'chapter 4' },
    ];

    for (const chapter of chapters) {
      const newChapter = await tx.insert(schema.chapters).values({
        title: chapter.title,
        storyId: story1?.id,
        description: chapter.description,
        rewardOptions: {
          easy: 20,
          medium: 30,
          hard: 50,
        },
      });

      const createdChapter = await tx.query.chapters.findFirst({
        where: eq(schema.chapters.title, chapter.title),
      });

      const sections = [
        { title: `${chapter.title} - Section 1`, description: 'Section 1' },
        { title: `${chapter.title} - Section 2`, description: 'Section 2' },
        { title: `${chapter.title} - Section 3`, description: 'Section 3' },
        { title: `${chapter.title} - Section 4`, description: 'Section 4' },
        { title: `${chapter.title} - Section 5`, description: 'Section 5' },
        { title: `${chapter.title} - Section 6`, description: 'Section 6' },
      ];

      for (const section of sections) {
        const contentLoremIpsum = generateLoremIpsum(
          Math.floor(Math.random() * 3) + 2,
        );

        await tx.insert(schema.sections).values({
          title: section.title,
          chapterId: createdChapter?.id,
          description: section.description,
          rewardOptions: {
            easy: 20,
            medium: 30,
            hard: 50,
          },
          content:
            'This is the content for ' +
            section.title +
            '.\n\n' +
            contentLoremIpsum,
        });

        const createdSection = await tx.query.sections.findFirst({
          where: eq(schema.sections.title, section.title),
        });

        const challenges = [
          {
            title: `${section.title} Challenge 1 - easy`,
            description: 'Challenge 1 - easy',
            difficulty: 'easy',
            expectedOutput: 'output 1.1',
            moduleType: 'print',
            rewardPoints: 10,
          },
          {
            title: `${section.title} Challenge 2 - medium`,
            description: 'Challenge 2 - medium',
            difficulty: 'medium',
            expectedOutput: 'output 1.2',
            moduleType: 'print',
            rewardPoints: 20,
          },
          {
            title: `${section.title} Challenge 3 - hard`,
            description: 'Challenge 3 - hard',
            difficulty: 'hard',
            expectedOutput: 'output 1.3',
            moduleType: 'print',
            rewardPoints: 30,
          },
        ];

        for (const challenge of challenges) {
          await tx.insert(schema.challenges).values({
            title: challenge.title,
            sectionID: createdSection?.id,
            description: challenge.description,
            difficulty: challenge.difficulty,
            expectedOutput: challenge.expectedOutput,
            moduleType: challenge.moduleType,
            rewardPoints: challenge.rewardPoints,
          });

          const createdChallenge = await tx.query.challenges.findFirst({
            where: eq(schema.challenges.title, challenge.title),
          });

          const challegeHints = [
            {
              displayText: 'Hint 1',
              hintText: `This is a hint 1 for ${challenge.title}`,
              cost: 5,
            },
            {
              displayText: 'Hint 2',
              hintText: `This is a hint 2 for ${challenge.title}`,
              cost: 10,
            },
            {
              displayText: 'Hint 3',
              hintText: `This is a hint 3 for ${challenge.title}`,
              cost: 15,
            },
          ];

          for (const hint of challegeHints) {
            await tx.insert(schema.challengeHints).values({
              challengeId: createdChallenge?.id,
              displayText: hint.displayText,
              hintText: hint.hintText,
              cost: hint.cost,
            });
          }
        }
      }
    }
  });
}

const generateLoremIpsum = (paragraphs: number) => {
  const loremTexts = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  ];
  let result = '';
  for (let i = 0; i < paragraphs; i++) {
    result += loremTexts[i % loremTexts.length] + '\n\n';
  }
  return result.trim();
};

main()
  .then(() => {
    console.log('Seeding completed');
  })
  .catch((e) => {
    console.error(e);
  });
