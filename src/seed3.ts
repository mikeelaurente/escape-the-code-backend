import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from './db';
import * as schema from './db/schema';

async function main() {
  return db().transaction(async (tx) => {
    console.log('Starting seed transaction');

    // Clear tables
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

    // Seed demo users + credits
    const emails = ['test@gmail.com', 'test2@gmail.com', 'test3@gmail.com'];
    for (const email of emails) {
      await tx.insert(schema.users).values({
        email,
        hashedPassword: 'password',
        firstName: 'first',
        lastName: 'last',
      });
      const u = await tx.query.users.findFirst({
        where: eq(schema.users.email, email),
      });
      await tx.insert(schema.userCredits).values({
        userId: u?.id,
        value: 100,
      });
    }

    // Story
    await tx.insert(schema.stories).values({
      title: 'Code Quest: The Sparkling City of JS',
      description:
        'Join Zia and Pax as they explore the Sparkling City of JS. Learn JavaScript basics by solving tiny puzzles to light bridges, open doors, and help friendly bots. No OOP—just the building blocks!',
      rewardOptions: { easy: 20, medium: 30, hard: 50 },
    });

    const story = await tx.query.stories.findFirst({
      where: eq(schema.stories.title, 'Code Quest: The Sparkling City of JS'),
    });

    type Challenge = {
      title: string;
      description: string; // Markdown instructions
      difficulty: 'easy' | 'medium' | 'hard';
      tests: Array<{ input: any; expect?: any; expect_print?: any }>;
      rewardPoints: number;
      moduleType: 'javascript';
      hints: string[];
    };

    type Section = {
      title: string;
      description: string;
      content: string; // Markdown lesson; only covered concepts
      challenges: Challenge[];
    };

    type Chapter = {
      title: string;
      description: string;
      sections: Section[];
    };

    const REWARD = { easy: 10, medium: 20, hard: 30 };
    const COMMON_REWARD_OPTIONS = { easy: 20, medium: 30, hard: 50 };
    const testsJson = (tests: Challenge['tests']) => JSON.stringify(tests);

    // ------------- Chapter 1 (BEGINNER SAFE, MORE EXAMPLES) -------------
    const chapter1: Chapter = {
      title: 'Chapter 1 — Welcome to Codeville!',
      description:
        'Zia and Pax arrive at Codeville. They learn to talk to the computer (printing), write tiny notes (comments), use numbers (+ − × ÷), and play with words (strings).',
      sections: [
        // S1.1 PRINTING ONLY
        {
          title: 'S1.1 — Printing Your First Message',
          description: 'Learn to say something on the screen.',
          content: `
*Story:* Zia and Pax meet the Console Keeper.

*What you learn (just this):*
- Use \`console.log('text here')\` to *show words* on the screen.

*Examples*
\`\`\`js
console.log('Hello, Codeville!');
\`\`\`
\`\`\`js
// You can use single or double quotes
console.log("I can talk to the screen!");
\`\`\`
\`\`\`js
// Emojis and symbols are fine too
console.log('Stars: ✨✨✨');
\`\`\`

*Try it ideas*
- Change the message to your favorite word.
- Add another line with a different message.
`.trim(),
          challenges: [
            {
              title: 'S1.1 Easy — Say Hello',
              description: `**Task:** Show this message exactly: *Hello, Codeville!*

*Steps*
1. Type *one line*.
2. Use \`console.log\`.
3. Put the words *inside quotes*.
4. Copy the message *exactly* (same letters and marks).

*Example*
\`\`\`js
console.log('Hello, Codeville!');
\`\`\`
`,
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              tests: [
                { input: '', expect_print: 'Hello, Codeville!' },
                { input: null, expect_print: 'Hello, Codeville!' },
                { input: 123, expect_print: 'Hello, Codeville!' },
                { input: 'anything', expect_print: 'Hello, Codeville!' },
                { input: {}, expect_print: 'Hello, Codeville!' },
              ],
              hints: [
                'Use: console.log("Hello, Codeville!");',
                'The message must match exactly. Check comma and !',
                'Ignore the input. Just print the sentence.',
              ],
            },
            {
              title: 'S1.1 Medium — Hello, Name!',
              description: `**Task:** The system gives you a *name* (like *Zia*). Show: *Hello, Zia!*

*Steps*
1. You will receive a *name*.
2. Use \`console.log\` to print \`Hello, <name>!\`.
3. Keep the *comma* and the *exclamation mark*.

*Example*
Input: \`"Zia"\` → Output shown: \`Hello, Zia!\`
`,
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              tests: [
                { input: 'Zia', expect_print: 'Hello, Zia!' },
                { input: 'Pax', expect_print: 'Hello, Pax!' },
                { input: 'Buddy', expect_print: 'Hello, Buddy!' },
                { input: 'A', expect_print: 'Hello, A!' },
                { input: '', expect_print: 'Hello, !' },
              ],
              hints: [
                'Use "Hello, " + name + "!" to make the sentence.',
                'Make sure to keep the comma and the !',
                'Print one line only.',
              ],
            },
            {
              title: 'S1.1 Hard — Happy Birthday!',
              description: `**Task:** The system gives you a *name*. Show: *Happy Birthday, <name>!*

*Steps*
1. Take the name you get.
2. Use \`console.log\` to print *exactly*: \`Happy Birthday, <name>!\`.
3. Check spaces, comma, and *!*.

*Example*
Input: \`"Mimi"\` → Output shown: \`Happy Birthday, Mimi!\`
`,
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              tests: [
                { input: 'Zia', expect_print: 'Happy Birthday, Zia!' },
                { input: 'Pax', expect_print: 'Happy Birthday, Pax!' },
                { input: 'Mimi', expect_print: 'Happy Birthday, Mimi!' },
                { input: '', expect_print: 'Happy Birthday, !' },
                { input: 'A', expect_print: 'Happy Birthday, A!' },
              ],
              hints: [
                'console.log("Happy Birthday, " + name + "!");',
                'Look closely at spaces and punctuation.',
                'Print just one line.',
              ],
            },
          ],
        },

        // S1.2 COMMENTS ONLY
        {
          title: 'S1.2 — Comments & Neat Code',
          description: 'Write tiny notes in code (the computer ignores them).',
          content: `
*Story:* The Keeper loves neat code with notes.

*What you learn (just this):*
- Single-line note: \`// this is a note\`
- Notes are *not* printed.

*Examples*
\`\`\`js
// This is a note for me.
console.log('Hi!');
\`\`\`
\`\`\`js
// Step 1: say hello
console.log('Hello');
// Step 2: say bye
console.log('Bye');
\`\`\`

*Try it ideas*
- Add your name in a note (like \`// by Zia\`).
- Keep notes short and friendly.
`.trim(),
          challenges: [
            {
              title: 'S1.2 Easy — One Note, One Hello',
              description: `**Task:** Print *Hello!*

*Steps*
1. Write *one comment line* above your code (start with \`//\`).
2. Then print *Hello!* using \`console.log\`.
3. Only *Hello!* should appear on screen (notes do not print).

*Example*
\`\`\`js
// my note
console.log('Hello!');
\`\`\`
`,
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              tests: [
                { input: '', expect_print: 'Hello!' },
                { input: null, expect_print: 'Hello!' },
                { input: 'x', expect_print: 'Hello!' },
                { input: 0, expect_print: 'Hello!' },
                { input: {}, expect_print: 'Hello!' },
              ],
              hints: [
                'First line: // your note here',
                'Second line: console.log("Hello!");',
                'Only Hello! is shown. Notes are hidden.',
              ],
            },
            {
              title: 'S1.2 Medium — Keep It Secret',
              description: `**Task:** Print *I like code*

*Steps*
1. Write a short comment line (with \`//\`).
2. On the next line, print *I like code*.
3. Screen should show only *I like code*.

*Example*
\`\`\`js
// I am learning!
console.log('I like code');
\`\`\`
`,
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              tests: [
                { input: '', expect_print: 'I like code' },
                { input: null, expect_print: 'I like code' },
                { input: 'anything', expect_print: 'I like code' },
                { input: 1, expect_print: 'I like code' },
                { input: {}, expect_print: 'I like code' },
              ],
              hints: [
                'Comment line starts with //',
                'console.log("I like code");',
                'No extra spaces or punctuation.',
              ],
            },
            {
              title: 'S1.2 Hard — Two Notes, One Line',
              description: `**Task:** Print *Ready*

*Steps*
1. Write *two* comment lines at the top.
2. On the third line, print *Ready*.
3. Only *Ready* should appear on the screen.

*Example*
\`\`\`js
// note one
// note two
console.log('Ready');
\`\`\`
`,
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              tests: [
                { input: '', expect_print: 'Ready' },
                { input: null, expect_print: 'Ready' },
                { input: 'note', expect_print: 'Ready' },
                { input: 0, expect_print: 'Ready' },
                { input: {}, expect_print: 'Ready' },
              ],
              hints: [
                'Use // for each note line.',
                'Then console.log("Ready");',
                'Notes do not print.',
              ],
            },
          ],
        },

        // S1.3 NUMBERS ADD ONLY
        {
          title: 'S1.3 — Numbers: Add',
          description: 'Add two numbers.',
          content: `
*Story:* The Number Gnomes count shiny coins.

*What you learn (just this):*
- Add numbers with \`+\`.
- Numbers do *not* need quotes.

*Examples*
\`\`\`js
console.log(2 + 3); // 5
\`\`\`
\`\`\`js
// You can add zeros and negatives
console.log(0 + 7);   // 7
console.log(-1 + 4);  // 3
\`\`\`

*Try it ideas*
- Change 2 + 3 to your favorite numbers.
- What is 100 + 200?
`.trim(),
          challenges: [
            {
              title: 'S1.3 Easy — Add 2 and 3',
              description: `**Task:** Show the answer to *2 + 3*.

*Steps*
1. Type one line.
2. Use numbers and \`+\`.
3. Print the result.

*Example*
\`\`\`js
console.log(2 + 3);
\`\`\`
`,
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              tests: [
                { input: '', expect_print: 5 },
                { input: null, expect_print: 5 },
                { input: 'x', expect_print: 5 },
                { input: 0, expect_print: 5 },
                { input: {}, expect_print: 5 },
              ],
              hints: [
                'console.log(2 + 3);',
                'No quotes for numbers.',
                'Only print the number.',
              ],
            },
            {
              title: 'S1.3 Medium — Add the Given Numbers',
              description: `**Task:** The system gives you *two numbers* (call them *a* and *b*). Show *a + b*.

*Steps*
1. Use \`a + b\`.
2. Print the sum.

*Example*
Input: \`[2, 3]\` → Output shown: \`5\`
`,
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              tests: [
                { input: [2, 3], expect_print: 5 },
                { input: [10, 5], expect_print: 15 },
                { input: [0, 7], expect_print: 7 },
                { input: [-1, 4], expect_print: 3 },
                { input: [1000, 2000], expect_print: 3000 },
              ],
              hints: [
                'Imagine the system gives you a and b.',
                'Do: console.log(a + b);',
                'Works with 0 and negative numbers too.',
              ],
            },
            {
              title: 'S1.3 Hard — Add a Number and Itself',
              description: `**Task:** The system gives you *one number* (call it *n*). Show *n + n*.

*Steps*
1. Use \`n + n\`.
2. Print the result.

*Example*
Input: \`5\` → Output shown: \`10\`
`,
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              tests: [
                { input: 1, expect_print: 2 },
                { input: 5, expect_print: 10 },
                { input: 0, expect_print: 0 },
                { input: -3, expect_print: -6 },
                { input: 10000, expect_print: 20000 },
              ],
              hints: [
                'Double the number: n + n.',
                'Print only the number.',
                'Zero stays zero, negatives work too.',
              ],
            },
          ],
        },

        // S1.4 NUMBERS SUBTRACT / MULTIPLY / DIVIDE – NO REMAINDER YET
        {
          title: 'S1.4 — Numbers: Subtract, Multiply, Divide',
          description: 'More ways to work with numbers.',
          content: `
*Story:* The bridge gears turn with math.

*What you learn (just this):*
- Subtract: \`a - b\`
- Multiply: \`a * b\`
- Divide: \`a / b\`

*Examples*
\`\`\`js
console.log(6 - 2); // 4
console.log(3 * 4); // 12
console.log(8 / 2); // 4
\`\`\`
\`\`\`js
// Be careful with dividing by zero
console.log(5 / 0); // Infinity in JS, but we will handle it safely in tasks
\`\`\`

*Try it ideas*
- Change numbers and see what happens.
- What is 10 - 10? What is 9 / 3?
`.trim(),
          challenges: [
            {
              title: 'S1.4 Easy — Times Table: 3 × 4',
              description: `**Task:** Show the answer to *3 × 4*.

*Steps*
1. Use numbers and \`*\`.
2. Print the result.

*Example*
\`\`\`js
console.log(3 * 4);
\`\`\`
`,
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              tests: [
                { input: '', expect_print: 12 },
                { input: null, expect_print: 12 },
                { input: 'x', expect_print: 12 },
                { input: 0, expect_print: 12 },
                { input: {}, expect_print: 12 },
              ],
              hints: [
                'Use * (star) for multiply.',
                'console.log(3 * 4);',
                'Print just the number.',
              ],
            },
            {
              title: 'S1.4 Medium — Safe Divide',
              description: `**Task:** The system gives you two numbers (*a*, *b*). Show *a / b*.  
If *b is 0*, print the word *"undefined"*.

*Steps*
1. If \`b === 0\` → print \`"undefined"\`.
2. Else print \`a / b\`.

*Example*
Input: \`[8, 2]\` → Output shown: \`4\`  
Input: \`[5, 0]\` → Output shown: \`undefined\`
`,
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              tests: [
                { input: [8, 2], expect_print: 4 },
                { input: [7, 2], expect_print: 3.5 },
                { input: [5, 0], expect_print: 'undefined' },
                { input: [0, 3], expect_print: 0 },
                { input: [-10, 2], expect_print: -5 },
              ],
              hints: [
                'Check b first.',
                'If b === 0 → print "undefined".',
                'Otherwise print a / b.',
              ],
            },
            {
              title: 'S1.4 Hard — Mix: Add Then Multiply',
              description: `**Task:** The system gives you numbers (*a*, *b*). Show *(a + b) * 2*.

*Steps*
1. Add \`a + b\`.
2. Multiply the answer by \`2\`.
3. Print the final number.

*Example*
Input: \`[2, 3]\` → Output shown: \`10\`
`,
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              tests: [
                { input: [2, 3], expect_print: 10 },
                { input: [0, 0], expect_print: 0 },
                { input: [-1, 4], expect_print: 6 },
                { input: [10, -5], expect_print: 10 },
                { input: [100, 1], expect_print: 202 },
              ],
              hints: [
                'Use parentheses: (a + b) * 2',
                'Add first, then multiply.',
                'Print only the final number.',
              ],
            },
          ],
        },

        // S1.5 ORDER OF OPERATIONS (introduce parentheses gently)
        {
          title: 'S1.5 — Do First Things First (Parentheses)',
          description: 'Tell math what to do first.',
          content: `
*Story:* Parentheses are magic hands that say “Do me first!”

*What you learn (just this):*
- Without parentheses, multiply/divide happen before add/subtract.
- With parentheses \`()\), you choose what happens first.

*Examples*
\`\`\`js
console.log(2 + 3 * 4);   // 14  (3*4 first)
console.log((2 + 3) * 4); // 20  (2+3 first)
\`\`\`
\`\`\`js
// More practice
console.log(1 + 2 * 3 + 4);   // 11
console.log((1 + 2) * (3 + 4)); // 21
\`\`\`

*Try it ideas*
- Move parentheses around and read the new result out loud.
`.trim(),
          challenges: [
            {
              title: 'S1.5 Easy — No Brackets',
              description: `**Task:** The system gives you (*a*, *b*, *c*). Show *a + b * c*.

*Steps*
1. Do \`b * c\` first.
2. Then add \`a\`.
3. Print the result.

*Example*
Input: \`[2, 3, 4]\` → Output shown: \`14\`
`,
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              tests: [
                { input: [2, 3, 4], expect_print: 14 },
                { input: [2, 0, 10], expect_print: 2 },
                { input: [10, 2, 3], expect_print: 16 },
                { input: [-1, 5, 2], expect_print: 9 },
                { input: [100, 1, 1], expect_print: 101 },
              ],
              hints: [
                'Multiply first, then add.',
                'No parentheses here.',
                'Print one number.',
              ],
            },
            {
              title: 'S1.5 Medium — Use Brackets',
              description: `**Task:** The system gives you (*a*, *b*, *c*). Show *(a + b) * c*.

*Steps*
1. Add \`a + b\` *inside ()*.
2. Multiply the result by \`c\`.
3. Print the number.

*Example*
Input: \`[2, 3, 4]\` → Output shown: \`20\`
`,
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              tests: [
                { input: [2, 3, 4], expect_print: 20 },
                { input: [2, 0, 10], expect_print: 20 },
                { input: [10, 2, 3], expect_print: 36 },
                { input: [-1, 5, 2], expect_print: 8 },
                { input: [100, 1, 1], expect_print: 101 },
              ],
              hints: [
                'Do (a + b) first.',
                'Then multiply by c.',
                'Use parentheses.',
              ],
            },
            {
              title: 'S1.5 Hard — Small Puzzle',
              description: `**Task:** The system gives you (*a*, *b*, *c*). Show *a * (b + c) - a*.

*Steps*
1. Add \`b + c\` inside \`()\`.
2. Multiply by \`a\`.
3. Subtract \`a\`.
4. Print the final answer.

*Example*
Input: \`[2, 3, 4]\` → Output shown: \`10\`
`,
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              tests: [
                { input: [2, 3, 4], expect_print: 10 }, // 2*(3+4)-2 = 12-2 = 10
                { input: [1, 1, 1], expect_print: 1 }, // 1*(1+1)-1 = 1
                { input: [5, 5, 0], expect_print: 20 }, // 5*(5+0)-5 = 20
                { input: [0, 10, 10], expect_print: 0 }, // 0*(10+10)-0 = 0
                { input: [-2, 3, 1], expect_print: -6 }, // -2*(3+1)-(-2) = -6
              ],
              hints: [
                'Careful with the steps and signs.',
                'Use () for b + c.',
                'Do each step slowly and print once.',
              ],
            },
          ],
        },

        // S1.6 STRINGS: QUOTES & ESCAPES
        {
          title: 'S1.6 — Words with Quotes',
          description: 'Put quotes inside words safely.',
          content: `
*Story:* Some signs need quotes inside.

*What you learn (just this):*
- Use double quotes outside: \`"It's sunny"\`
- Or escape inside: \`'It\\'s sunny'\`

*Examples*
\`\`\`js
console.log("She said, \\"Hi!\\""); // She said, "Hi!"
\`\`\`
\`\`\`js
console.log('It\\'s sunny'); // It's sunny
\`\`\`

*Try it ideas*
- Say \`"Hello"\` with quotes.
- Try a sentence with both kinds of quotes.
`.trim(),
          challenges: [
            {
              title: 'S1.6 Easy — It’s Sunny',
              description: `**Task:** Show *It's sunny*.

*Steps*
1. Use quotes correctly so the text is exact.
2. Print the sentence.

*Example*
\`\`\`js
console.log("It's sunny");
\`\`\`
`,
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              tests: [
                { input: '', expect_print: "It's sunny" },
                { input: null, expect_print: "It's sunny" },
                { input: 'x', expect_print: "It's sunny" },
                { input: 0, expect_print: "It's sunny" },
                { input: {}, expect_print: "It's sunny" },
              ],
              hints: [
                'Use double quotes outside or escape the single quote.',
                'Match the text exactly.',
                'Only print one line.',
              ],
            },
            {
              title: 'S1.6 Medium — He Said, "Hello".',
              description: `**Task:** Show *He said, "Hello".* (include the double quotes)

*Steps*
1. Choose quotes so it prints correctly.
2. Print the sentence exactly (comma, quotes, period).

*Example*
\`\`\`js
console.log('He said, "Hello".');
\`\`\`
`,
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              tests: [
                { input: '', expect_print: 'He said, "Hello".' },
                { input: null, expect_print: 'He said, "Hello".' },
                { input: 'Z', expect_print: 'He said, "Hello".' },
                { input: 1, expect_print: 'He said, "Hello".' },
                { input: {}, expect_print: 'He said, "Hello".' },
              ],
              hints: [
                'Double quotes can be inside single quotes easily.',
                'Or escape the inner quotes.',
                'Check punctuation.',
              ],
            },
            {
              title: 'S1.6 Hard — Name Says a Word',
              description: `**Task:** The system gives you a *name* and a *word*.  
Show: *<name> says "<word>"!*

*Steps*
1. Use the two given values.
2. Put the word inside *double quotes* in the output.
3. Print exactly one line.

*Example*
Input: \`["Zia", "Hi"]\` → Output shown: \`Zia says "Hi"!\`
`,
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              tests: [
                { input: ['Zia', 'Hi'], expect_print: 'Zia says "Hi"!' },
                {
                  input: ['Pax', "It\'s ok"],
                  expect_print: 'Pax says "It\'s ok"!',
                },
                { input: ['Bot', 'Beep'], expect_print: 'Bot says "Beep"!' },
                { input: ['A', 'B'], expect_print: 'A says "B"!' },
                { input: ['Name', ''], expect_print: 'Name says ""!' },
              ],
              hints: [
                'Build the sentence using +.',
                'Wrap the second value in double quotes in the output.',
                'Keep spaces and ! exactly.',
              ],
            },
          ],
        },

        // S1.7 STRINGS: JOIN (NO TEMPLATE STRINGS YET)
        {
          title: 'S1.7 — Joining Words',
          description: 'Stick words together.',
          content: `
*Story:* The Sign Maker joins words.

*What you learn (just this):*
- Join with a space: \`'Hello' + ' ' + 'World'\`

*Examples*
\`\`\`js
const first = 'Hello';
const second = 'world';
console.log(first + ' ' + second); // Hello world
\`\`\`
\`\`\`js
// Empty pieces still keep the space
console.log('A' + ' ' + ''); // A 
console.log('' + ' ' + 'B'); //  B
\`\`\`

*Try it ideas*
- Join your first name and favorite color.
`.trim(),
          challenges: [
            {
              title: 'S1.7 Easy — Join Two Words',
              description: `**Task:** The system gives you *two words* (a and b). Show them with *one space* between.

*Steps*
1. Join \`a + " " + b\`.
2. Print the result.
3. Do not remove empty words; still keep the *one space* in the middle.

*Example*
Input: \`["Hello", "world"]\` → Output shown: \`Hello world\`
`,
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              tests: [
                { input: ['Hello', 'world'], expect_print: 'Hello world' },
                { input: ['Red', 'Balloon'], expect_print: 'Red Balloon' },
                { input: ['A', ''], expect_print: 'A ' },
                { input: ['', 'B'], expect_print: ' B' },
                { input: ['', ''], expect_print: ' ' },
              ],
              hints: [
                'Use: a + " " + b',
                'Print exactly one space in the middle.',
                'Do not trim text.',
              ],
            },
            {
              title: 'S1.7 Medium — Hello, Name.',
              description: `**Task:** The system gives you a *name*. Show: *Hello, <name>.*

*Steps*
1. Join strings with \`+\`.
2. Keep the *comma* after \`Hello,\`.
3. Add a *period* at the end.

*Example*
Input: \`"Zia"\` → Output shown: \`Hello, Zia.\`
`,
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              tests: [
                { input: 'Zia', expect_print: 'Hello, Zia.' },
                { input: 'Pax', expect_print: 'Hello, Pax.' },
                { input: 'A', expect_print: 'Hello, A.' },
                { input: '', expect_print: 'Hello, .' },
                { input: 'World', expect_print: 'Hello, World.' },
              ],
              hints: [
                '"Hello, " + name + "."',
                'Keep punctuation.',
                'Print one line.',
              ],
            },
            {
              title: 'S1.7 Hard — Three Words Line',
              description: `**Task:** The system gives you *three words* (a, b, c). Show: *a b c* (one space between each).

*Steps*
1. Join them with spaces.
2. Print exactly *one space* between words.
3. If a word is empty, still keep spaces in those places.

*Example*
Input: \`["bun", "jam", "bun"]\` → Output shown: \`bun jam bun\`
`,
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              tests: [
                { input: ['bun', 'jam', 'bun'], expect_print: 'bun jam bun' },
                {
                  input: ['bread', 'cheese', ''],
                  expect_print: 'bread cheese ',
                },
                { input: ['', 'jam', 'bread'], expect_print: ' jam bread' },
                { input: ['', '', ''], expect_print: '  ' },
                { input: ['x', '', 'y'], expect_print: 'x  y' },
              ],
              hints: ['a + " " + b + " " + c', 'Do not trim.', 'Print once.'],
            },
          ],
        },

        // S1.8 STRINGS: LENGTH & FIRST/LAST (NO SPLIT/JOIN/INDEX LOOPS)
        {
          title: 'S1.8 — How Long? First and Last',
          description: 'Count letters and pick ends.',
          content: `
*Story:* Letter Counters measure words.

*What you learn (just this):*
- Length: \`word.length\`
- First letter: \`word[0]\`
- Last letter: \`word[word.length - 1]\`

*Examples*
\`\`\`js
const w = 'Code';
console.log(w.length);            // 4
console.log(w[0]);                // C
console.log(w[w.length - 1]);     // e
\`\`\`
\`\`\`js
// Empty string examples
console.log(''.length);           // 0
// Be careful: 'hello world' has a space that counts
console.log('hello world'.length); // 11
\`\`\`

*Try it ideas*
- What is the first letter of your name?
- What is the last letter of "Codeville"?
`.trim(),
          challenges: [
            {
              title: 'S1.8 Easy — Count Letters',
              description: `**Task:** The system gives you a *word*. Show how many *characters* it has.

*Steps*
1. Use \`word.length\`.
2. Print the number.
3. Spaces count as characters.

*Example*
Input: \`"hi there"\` → Output shown: \`8\`
`,
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              tests: [
                { input: 'cat', expect_print: 3 },
                { input: 'robot', expect_print: 5 },
                { input: 'A', expect_print: 1 },
                { input: '', expect_print: 0 },
                { input: 'hi there', expect_print: 8 },
              ],
              hints: [
                'Use .length.',
                'Empty string has length 0.',
                'Spaces count too.',
              ],
            },
            {
              title: 'S1.8 Medium — First-Last Format',
              description: `**Task:** The system gives you a *word*. Show *first-last*.  
If the word is empty, show just a dash: *-*.

*Steps*
1. If the word is empty → print \`"-"\`.
2. Else print the first letter, then a dash, then the last letter.

*Example*
Input: \`"hello"\` → Output shown: \`h-o\`
`,
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              tests: [
                { input: 'hello', expect_print: 'h-o' },
                { input: 'Pax', expect_print: 'P-x' },
                { input: 'Z', expect_print: 'Z-Z' },
                { input: '', expect_print: '-' },
                { input: 'ab', expect_print: 'a-b' },
              ],
              hints: [
                'Check empty first.',
                'First is word[0].',
                'Last is word[word.length - 1].',
              ],
            },
            {
              title: 'S1.8 Hard — Middle Peek',
              description: `**Task:** The system gives you a *word*.  
If it has *odd* length, show the *middle 1* letter.  
If it has *even* length, show the *middle 2* letters.  
If it is empty, show *nothing* (empty line).

*Steps*
1. Let \`n = word.length\`.
2. If \`n === 0\` → print \`""\` (empty).
3. If \`n\` is odd → take the *1* middle letter.
4. If \`n\` is even → take the *2* middle letters.
5. Print the result.

*Example*
Input: \`"code"\` → Output shown: \`od\`
`,
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              tests: [
                { input: 'cat', expect_print: 'a' },
                { input: 'code', expect_print: 'od' },
                { input: 'A', expect_print: 'A' },
                { input: '', expect_print: '' },
                { input: 'robot', expect_print: 'b' },
              ],
              hints: [
                'Odd middle index: Math.floor(n / 2).',
                'Even: take n/2 - 1 and n/2.',
                'Print exactly what you pick.',
              ],
            },
          ],
        },
      ],
    };

    // INSERT CHAPTER 1
    await tx.insert(schema.chapters).values({
      title: chapter1.title,
      storyId: story?.id,
      description: chapter1.description,
      rewardOptions: COMMON_REWARD_OPTIONS,
    });

    const createdChapter = await tx.query.chapters.findFirst({
      where: eq(schema.chapters.title, chapter1.title),
    });

    for (const sec of chapter1.sections) {
      await tx.insert(schema.sections).values({
        title: sec.title,
        chapterId: createdChapter?.id,
        description: sec.description,
        rewardOptions: COMMON_REWARD_OPTIONS,
        content: sec.content,
      });

      const createdSection = await tx.query.sections.findFirst({
        where: eq(schema.sections.title, sec.title),
      });

      for (const ch of sec.challenges) {
        await tx.insert(schema.challenges).values({
          title: ch.title,
          sectionID: createdSection?.id,
          description: ch.description,
          difficulty: ch.difficulty,
          expectedOutput: testsJson(ch.tests), // includes expect_print
          moduleType: ch.moduleType,
          rewardPoints: ch.rewardPoints,
        });

        const createdChallenge = await tx.query.challenges.findFirst({
          where: eq(schema.challenges.title, ch.title),
        });

        for (let i = 0; i < ch.hints.length; i++) {
          await tx.insert(schema.challengeHints).values({
            challengeId: createdChallenge?.id,
            displayText: `Hint ${i + 1}`,
            hintText: ch.hints[i] || '',
            cost: (i + 1) * 5,
          });
        }
      }
    }

    console.log('Seeding completed (Chapter 1).');
  });
}

main()
  .then(() => console.log('Seeding completed'))
  .catch((e) => console.error(e));
