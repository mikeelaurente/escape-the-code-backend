import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from './db';
import * as schema from './db/schema';
import * as bcrypt from 'bcryptjs';

async function main() {
  return db().transaction(async (tx) => {
    console.log('Starting seed transaction');

    // Clear tables
    await tx.delete(schema.creditUsage);
    await tx.delete(schema.userAchievements);
    await tx.delete(schema.achievements);
    await tx.delete(schema.userCredits);
    await tx.delete(schema.challengeHints);
    await tx.delete(schema.storyProgress);
    await tx.delete(schema.challengeAnswers);
    await tx.delete(schema.storyProgress);
    await tx.delete(schema.challenges);
    await tx.delete(schema.sections);
    await tx.delete(schema.chapters);
    await tx.delete(schema.stories);
    await tx.delete(schema.users);

    // Seed demo users + credits
    for (let i = 0; i < 5; i++) {
      let salt = await bcrypt.genSalt(10);

      const hashedPassword = await bcrypt.hash('password', salt);

      const email = `test${i}@mail.com`;

      await tx.insert(schema.users).values({
        email,
        hashedPassword,
        firstName: `Firstname${i}`,
        lastName: `Lastame${i}`,
      });

      const currentUser = await tx.query.users.findFirst({
        where: eq(schema.users.email, email),
      });

      await tx.insert(schema.userCredits).values({
        userId: currentUser?.id,
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

    type Runnable = { title: string; code: string };

    type Section = {
      title: string;
      description: string;
      content: string; // HTML content, your specified layout
      runnables: Runnable[];
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

    // ----------------- Chapter 1 -----------------
    const chapter1: Chapter = {
      title: 'Chapter 1 — Welcome to Codeville!',
      description:
        'Zia and Pax arrive at Codeville, a bright city where signs glow when you talk to the computer. In this chapter, learners discover how to print messages, leave friendly notes with comments, and use the number spells for adding, subtracting, multiplying, and dividing. They also learn how parentheses decide which math happens first and how to work with words (strings), including quotes and counting letters. Each lesson is tiny, friendly, and safe for complete beginners. No prior experience is required—every spell is explained slowly with lots of examples.',
      sections: [
        // S1.1 PRINTING ONLY
        {
          title: 'S1.1 — Printing Your First Message',
          description:
            'Welcome to the console gate! In this lesson, you will learn to “speak” to the screen using console.log. We keep it simple: one command, one friendly message, and instant results. You’ll see how quotes hold your words and how multiple lines show multiple messages. By the end, you’ll feel confident making the computer say exactly what you want.',
          content: `
<div style="display: flex; flex-direction: column; gap: 20px; margin: auto;">

  <!-- Story -->
  <h4>🗺️ The Encounter</h4>
  <p><strong>Zia</strong> and <strong>Pax</strong> meet the mysterious <em>Console Keeper</em>. 
  The Keeper whispers: “If you can make the screen speak, the gate will open!” Zia lifts a tiny wand and traces the letters of a spell. The air shimmers as words appear. Pax cheers, and the great gate smiles back.</p>

  <!-- Learning -->
  <h4>✨ The Secret Spell</h4>
  <p>Use <code>console.log('text here')</code> to <em>show words</em> on the screen. The computer prints whatever is inside the quotes.</p>
  <ul>
    <li><strong>Quotes</strong> can be single (<code>'...'</code>) or double (<code>"..."</code>).</li>
    <li>Everything you put inside <code>console.log(...)</code> appears in order, line by line.</li>
    <li>Emojis, punctuation, and spaces are all okay—they show exactly as you write them.</li>
  </ul>

  <!-- Example + Fun Facts Side by Side -->
  <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">

    <!-- Example / Spell Anchor -->
    <div style="flex: 1; min-width: 280px;  border-radius:12px; padding:16px; 
      background: linear-gradient(68.5deg, rgba(97,68,194,1) 0.6%, rgba(96,184,214,1) 99.5%); 
      color: #f1f1f1; 
      box-shadow:0 2px 6px rgba(0,0,0,0.4);">
      <h4 style="color:white">🧙‍♀️ Cast a Spell</h4>
      <hr/>
      <div id="spell"></div>
    </div>

    <!-- Fun Facts -->
    <div style="flex: 1; min-width: 280px; border-radius:12px; background: linear-gradient(68.5deg, rgba(97,68,194,1) 0.6%, rgba(96,184,214,1) 99.5%);  padding:16px; color:white">
      <h4>🌟 Fun Facts</h4>
      <hr/>
      <ul>
        <li><strong>log</strong> means “write it down.” The console is your magic notebook.</li>
        <li>Quotes are like a treasure box—whatever you put inside shows up exactly the same.</li>
        <li>You can print many lines by calling <code>console.log</code> many times.</li>
      </ul>
    </div>
  </div>
</div>
          `.trim(),
          runnables: [
            {
              title: 'Spell 1 — Friendly hello',
              code: "console.log('Hello, Codeville!');",
            },
            {
              title: 'Spell 2 — Double-quoted charm',
              code: 'console.log("I can talk to the screen!");',
            },
            {
              title: 'Spell 3 — Sparkles',
              code: "console.log('Stars: ✨✨✨');",
            },
            {
              title: 'Spell 4 — Two-line echo',
              code: "console.log('Line 1');\nconsole.log('Line 2');",
            },
            {
              title: 'Spell 5 — Secret favorite word',
              code: "console.log('Pancake');",
            },
          ],
          challenges: [
            {
              title: 'S1.1 Easy — Say Hello',
              description: `**Task:** Show this message exactly: Hello, Codeville!

Steps
1. Type one line.
2. Use \`console.log\`.
3. Put the words inside quotes.
4. Copy the message exactly (same letters and marks).

Example
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
              description: `**Task:** The system gives you a name (like Zia). Show: Hello, Zia!

Steps
1. You will receive a name.
2. Use \`console.log\` to print \`Hello, <name>!\`.
3. Keep the comma and the exclamation mark.

Example  
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
              description: `**Task:** The system gives you a name. Show: Happy Birthday, &lt;name&gt;!

Steps
1. Take the name you get.
2. Use \`console.log\` to print exactly: \`Happy Birthday, <name>!\`.
3. Check spaces, comma, and !.

Example  
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
          description:
            'Comments are tiny notes that help people understand code. In this lesson, you will write friendly hints for your future self using // at the start of a line. Comments don’t change what the computer does—they’re just labels and reminders. Clean code with helpful comments is easier to read and fix. Let’s practice making your code kind and tidy.',
          content: `
<div style="display: flex; flex-direction: column; gap: 20px; margin: auto;">

  <!-- Story -->
  <h4>🗺️ The Encounter</h4>
  <p>The Keeper smiles: “Clean code is kind code.” Zia writes <em>notes</em> in code so future Zia understands. Pax leaves short labels that tell the story of each line.</p>

  <!-- Learning -->
  <h4>✨ The Secret Spell</h4>
  <p>Start a note with <code>//</code>. The computer <em>ignores</em> everything after <code>//</code> on that line.</p>
  <ul>
    <li>Use comments to label steps, explain decisions, or mark TODOs.</li>
    <li>Short and clear notes help you and your teammates later.</li>
  </ul>

  <!-- Example + Fun Facts Side by Side -->
  <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">

    <!-- Example / Spell Anchor -->
    <div style="flex: 1; min-width: 280px;  border-radius:12px; padding:16px; 
      background: linear-gradient(68.5deg, rgba(97,68,194,1) 0.6%, rgba(96,184,214,1) 99.5%); 
      color: #f1f1f1; 
      box-shadow:0 2px 6px rgba(0,0,0,0.4);">
      <h4 style="color:white">🧙‍♀️ Cast a Spell</h4>
      <hr/>
      <div id="spell"></div>
    </div>

    <!-- Fun Facts -->
    <div style="flex: 1; min-width: 280px; border-radius:12px; background: linear-gradient(68.5deg, rgba(97,68,194,1) 0.6%, rgba(96,184,214,1) 99.5%);  padding:16px; color:white">
      <h4>🌟 Fun Facts</h4>
      <hr/>
      <ul>
        <li>Comments are only for humans—computers pretend they aren’t there.</li>
        <li>Good comments are like signposts: short, clear, and helpful.</li>
        <li>You can put a comment after code on the same line.</li>
      </ul>
    </div>
  </div>
</div>
          `.trim(),
          runnables: [
            {
              title: 'Spell 1 — Simple note',
              code: "// a friendly note\nconsole.log('Hello!');",
            },
            {
              title: 'Spell 2 — Two steps',
              code: "// step 1\nconsole.log('A');\n// step 2\nconsole.log('B');",
            },
            {
              title: 'Spell 3 — Whisper after code',
              code: "console.log('Hi'); // this prints Hi",
            },
          ],
          challenges: [
            {
              title: 'S1.2 Easy — One Note, One Hello',
              description: `**Task:** Print Hello!

Steps
1. Write one comment line above your code (start with \`//\`).
2. Then print Hello! using \`console.log\`.
3. Only Hello! should appear on screen (notes do not print).

Example
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
              description: `**Task:** Print I like code

Steps
1. Write a short comment line (with \`//\`).
2. On the next line, print I like code.
3. Screen should show only I like code.

Example
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
              description: `**Task:** Print Ready

Steps
1. Write two comment lines at the top.
2. On the third line, print Ready.
3. Only Ready should appear on the screen.

Example
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
          description:
            'Numbers are like tiny creatures that can join together. In this lesson, you will use the plus sign to add two numbers. You’ll see how zero changes nothing, how negatives behave, and how results appear instantly. We’ll practice with small and big numbers so you feel comfortable with the spell. Keep your numbers outside quotes—numbers don’t need them.',
          content: `
<div style="display: flex; flex-direction: column; gap: 20px; margin: auto;">

  <!-- Story -->
  <h4>🗺️ The Encounter</h4>
  <p>In Coin Corner, gnomes stack shiny coins. Zia learns that numbers can be added together to make bigger piles. Pax tries with tiny numbers, then with huge treasure stacks.</p>

  <!-- Learning -->
  <h4>✨ The Secret Spell</h4>
  <p>Use <code>+</code> to add. Numbers do <em>not</em> need quotes.</p>
  <ul>
    <li><code>2 + 3</code> is <strong>5</strong>.</li>
    <li>Zero doesn’t change a number: <code>n + 0</code> is <code>n</code>.</li>
    <li>Negatives work too: <code>-1 + 4</code> is <strong>3</strong>.</li>
  </ul>

  <!-- Example + Fun Facts Side by Side -->
  <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">

    <!-- Example / Spell Anchor -->
    <div style="flex: 1; min-width: 280px;  border-radius:12px; padding:16px; 
      background: linear-gradient(68.5deg, rgba(97,68,194,1) 0.6%, rgba(96,184,214,1) 99.5%); 
      color: #f1f1f1; 
      box-shadow:0 2px 6px rgba(0,0,0,0.4);">
      <h4 style="color:white">🧙‍♀️ Cast a Spell</h4>
      <hr/>
      <div id="spell"></div>
    </div>

    <!-- Fun Facts -->
    <div style="flex: 1; min-width: 280px; border-radius:12px; background: linear-gradient(68.5deg, rgba(97,68,194,1) 0.6%, rgba(96,184,214,1) 99.5%);  padding:16px; color:white">
      <h4>🌟 Fun Facts</h4>
      <hr/>
      <ul>
        <li>Adding is commutative: <code>a + b</code> is the same as <code>b + a</code>.</li>
        <li>Any number plus zero stays the same—zero is a quiet friend.</li>
        <li>You can add negative numbers to move left on the number line.</li>
      </ul>
    </div>
  </div>
</div>
          `.trim(),
          runnables: [
            { title: 'Spell 1 — 2 + 3', code: 'console.log(2 + 3);' },
            { title: 'Spell 2 — 0 + 7', code: 'console.log(0 + 7);' },
            {
              title: 'Spell 3 — negative + positive',
              code: 'console.log(-1 + 4);',
            },
            {
              title: 'Spell 4 — big treasure',
              code: 'console.log(100 + 200);',
            },
          ],
          challenges: [
            {
              title: 'S1.3 Easy — Add 2 and 3',
              description: `**Task:** Show the answer to 2 + 3.

Steps
1. Type one line.
2. Use numbers and \`+\`.
3. Print the result.

Example
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
              description: `**Task:** The system gives you two numbers (call them a and b). Show a + b.

Steps
1. Use \`a + b\`.
2. Print the sum.

Example  
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
              description: `**Task:** The system gives you one number (call it n). Show n + n.

Steps
1. Use \`n + n\`.
2. Print the result.

Example  
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
          description:
            'Now you’ll learn three more number spells: take away (subtract), make groups (multiply), and share equally (divide). You’ll see how each changes numbers in a different way and how to read results clearly. We will also talk about dividing by zero and why we print "undefined" to stay safe. Practice each spell so your math gears turn smoothly.',
          content: `
<div style="display: flex; flex-direction: column; gap: 20px; margin: auto;">

  <!-- Story -->
  <h4>🗺️ The Encounter</h4>
  <p>Gears of the Rainbow Bridge spin using math. Zia learns three more spells and watches the bridge light up when answers are correct. Pax experiments with many pairs of numbers to see the patterns.</p>

  <!-- Learning -->
  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Subtract: <code>a - b</code></li>
    <li>Multiply: <code>a * b</code></li>
    <li>Divide: <code>a / b</code></li>
  </ul>
  <p><em>Note:</em> If <code>b</code> is <code>0</code> when dividing, print <code>"undefined"</code> for our puzzles.</p>

  <!-- Example + Fun Facts Side by Side -->
  <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">

    <!-- Example / Spell Anchor -->
    <div style="flex: 1; min-width: 280px;  border-radius:12px; padding:16px; 
      background: linear-gradient(68.5deg, rgba(97,68,194,1) 0.6%, rgba(96,184,214,1) 99.5%); 
      color: #f1f1f1; 
      box-shadow:0 2px 6px rgba(0,0,0,0.4);">
      <h4 style="color:white">🧙‍♀️ Cast a Spell</h4>
      <hr/>
      <div id="spell"></div>
    </div>

    <!-- Fun Facts -->
    <div style="flex: 1; min-width: 280px; border-radius:12px; background: linear-gradient(68.5deg, rgba(97,68,194,1) 0.6%, rgba(96,184,214,1) 99.5%);  padding:16px; color:white">
      <h4>🌟 Fun Facts</h4>
      <hr/>
      <ul>
        <li>Multiplication is repeated addition: <code>3 * 4</code> is <code>3 + 3 + 3 + 3</code>.</li>
        <li>Division shares a number into equal groups.</li>
        <li>Subtracting can make numbers smaller or even negative.</li>
      </ul>
    </div>
  </div>
</div>
          `.trim(),
          runnables: [
            { title: 'Spell 1 — subtraction', code: 'console.log(9 - 5);' },
            { title: 'Spell 2 — multiplication', code: 'console.log(7 * 3);' },
            { title: 'Spell 3 — division', code: 'console.log(12 / 4);' },
            {
              title: 'Spell 4 — zero division (JS behavior)',
              code: 'console.log(5 / 0); // Infinity (for learning only)',
            },
          ],
          challenges: [
            {
              title: 'S1.4 Easy — Times Table: 3 × 4',
              description: `**Task:** Show the answer to 3 × 4.

Steps
1. Use numbers and \`*\`.
2. Print the result.

Example
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
              description: `**Task:** The system gives you two numbers (a, b). Show a / b.  
If b is 0, print the word "undefined".

Steps
1. If \`b === 0\` → print \`"undefined"\`.
2. Else print \`a / b\`.

Example  
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
              description: `**Task:** The system gives you numbers (a, b). Show (a + b) * 2.

Steps
1. Add \`a + b\`.
2. Multiply the answer by \`2\`.
3. Print the final number.

Example  
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
          description:
            'Sometimes math wants to do many things at once. This lesson shows how parentheses tell math what to do first. You will try expressions with and without parentheses to see the order clearly. Moving the brackets changes the result, which feels like steering a puzzle. Practice slowly and read your results out loud.',
          content: `
<div style="display: flex; flex-direction: column; gap: 20px; margin: auto;">

  <!-- Story -->
  <h4>🗺️ The Encounter</h4>
  <p>At Puzzle Plaza, signs show numbers and brackets. Zia learns that brackets choose what happens first. Pax moves them around and giggles when the answers change.</p>

  <!-- Learning -->
  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Without parentheses, multiply/divide happen before add/subtract.</li>
    <li>With parentheses <code>()</code>, you choose what happens first.</li>
  </ul>

  <!-- Example + Fun Facts Side by Side -->
  <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">

    <!-- Example / Spell Anchor -->
    <div style="flex: 1; min-width: 280px;  border-radius:12px; padding:16px; 
      background: linear-gradient(68.5deg, rgba(97,68,194,1) 0.6%, rgba(96,184,214,1) 99.5%); 
      color: #f1f1f1; 
      box-shadow:0 2px 6px rgba(0,0,0,0.4);">
      <h4 style="color:white">🧙‍♀️ Cast a Spell</h4>
      <hr/>
      <div id="spell"></div>
    </div>

    <!-- Fun Facts -->
    <div style="flex: 1; min-width: 280px; border-radius:12px; background: linear-gradient(68.5deg, rgba(97,68,194,1) 0.6%, rgba(96,184,214,1) 99.5%);  padding:16px; color:white">
      <h4>🌟 Fun Facts</h4>
      <hr/>
      <ul>
        <li>This order is called <strong>PEMDAS</strong> in some places (we use it gently here).</li>
        <li>Brackets are like a spotlight—everything inside happens first.</li>
        <li>Adding more brackets can group steps into little mini-puzzles.</li>
      </ul>
    </div>
  </div>
</div>
          `.trim(),
          runnables: [
            {
              title: 'Spell 1 — no parentheses',
              code: 'console.log(2 + 3 * 4); // 14',
            },
            {
              title: 'Spell 2 — with parentheses',
              code: 'console.log((2 + 3) * 4); // 20',
            },
            {
              title: 'Spell 3 — more practice A',
              code: 'console.log(1 + 2 * 3 + 4); // 11',
            },
            {
              title: 'Spell 4 — more practice B',
              code: 'console.log((1 + 2) * (3 + 4)); // 21',
            },
          ],
          challenges: [
            {
              title: 'S1.5 Easy — No Brackets',
              description: `**Task:** The system gives you (a, b, c). Show a + b * c.

Steps
1. Do \`b * c\` first.
2. Then add \`a\`.
3. Print the result.

Example  
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
              description: `**Task:** The system gives you (a, b, c). Show (a + b) * c.

Steps
1. Add \`a + b\` inside ().
2. Multiply the result by \`c\`.
3. Print the number.

Example  
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
              description: `**Task:** The system gives you (a, b, c). Show a * (b + c) - a.

Steps
1. Add \`b + c\` inside \`()\`.
2. Multiply by \`a\`.
3. Subtract \`a\`.
4. Print the final answer.

Example  
Input: \`[2, 3, 4]\` → Output shown: \`10\`
`,
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              tests: [
                { input: [2, 3, 4], expect_print: 10 },
                { input: [1, 1, 1], expect_print: 1 },
                { input: [5, 5, 0], expect_print: 20 },
                { input: [0, 10, 10], expect_print: 0 },
                { input: [-2, 3, 1], expect_print: -6 },
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
          description:
            'Sometimes your words need quotation marks inside them. In this lesson, you’ll learn two friendly ways to include quotes so your sentence prints perfectly. You can wrap text with one kind of quote and put the other kind inside, or you can escape a quote with a backslash. Practice these tiny tricks to make dialog and contractions look right.',
          content: `
<div style="display: flex; flex-direction: column; gap: 20px; margin: auto;">

  <!-- Story -->
  <h4>🗺️ The Encounter</h4>
  <p>At Quote Quay, signs have talking marks. Zia practices printing speech and contractions. Pax experiments until punctuation looks just right.</p>

  <!-- Learning -->
  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Use double quotes outside: <code>"It's sunny"</code></li>
    <li>Or escape inside: <code>'It\\'s sunny'</code></li>
  </ul>

  <!-- Example + Fun Facts Side by Side -->
  <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">

    <!-- Example / Spell Anchor -->
    <div style="flex: 1; min-width: 280px;  border-radius:12px; padding:16px; 
      background: linear-gradient(68.5deg, rgba(97,68,194,1) 0.6%, rgba(96,184,214,1) 99.5%); 
      color: #f1f1f1; 
      box-shadow:0 2px 6px rgba(0,0,0,0.4);">
      <h4 style="color:white">🧙‍♀️ Cast a Spell</h4>
      <hr/>
      <div id="spell"></div>
    </div>

    <!-- Fun Facts -->
    <div style="flex: 1; min-width: 280px; border-radius:12px; background: linear-gradient(68.5deg, rgba(97,68,194,1) 0.6%, rgba(96,184,214,1) 99.5%);  padding:16px; color:white">
      <h4>🌟 Fun Facts</h4>
      <hr/>
      <ul>
        <li>Inside/outside quotes are like nesting boxes—pick which one goes where.</li>
        <li><code>\\</code> is an escape hatch that lets a quote appear safely.</li>
        <li>Both styles are common—choose the one that’s easiest to read.</li>
      </ul>
    </div>
  </div>
</div>
          `.trim(),
          runnables: [
            {
              title: 'Spell 1 — double outside',
              code: 'console.log("It\\\'s sunny");',
            },
            {
              title: 'Spell 2 — escape inside',
              code: "console.log('It\\'s sunny');",
            },
            {
              title: 'Spell 3 — quoted hello',
              code: 'console.log(\'He said, "Hello".\');',
            },
          ],
          challenges: [
            {
              title: 'S1.6 Easy — It’s Sunny',
              description: `**Task:** Show It's sunny.

Steps
1. Use quotes correctly so the text is exact.
2. Print the sentence.

Example
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
              description: `**Task:** Show He said, "Hello". (include the double quotes)

Steps
1. Choose quotes so it prints correctly.
2. Print the sentence exactly (comma, quotes, period).

Example
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
              description: `**Task:** The system gives you a name and a word.  
Show: &lt;name&gt; says "&lt;word&gt;"!

Steps
1. Use the two given values.
2. Put the word inside double quotes in the output.
3. Print exactly one line.

Example  
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
          description:
            'When words need to stand together, we join them with a space. This lesson shows how to glue pieces of text into a single line using the + sign. You’ll see how empty pieces behave while the space stays in the middle. Practice with two and three-word lines to build little sentences. Clear spacing makes signs easy to read.',
          content: `
<div style="display: flex; flex-direction: column; gap: 20px; margin: auto;">

  <!-- Story -->
  <h4>🗺️ The Encounter</h4>
  <p>At Sign Street, letters hold hands. Zia learns to join words so names and messages look neat. Pax tests different pieces and watches the spaces line up perfectly.</p>

  <!-- Learning -->
  <h4>✨ The Secret Spell</h4>
  <p>Join with a space: <code>'Hello' + ' ' + 'World'</code></p>

  <!-- Example + Fun Facts Side by Side -->
  <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">

    <!-- Example / Spell Anchor -->
    <div style="flex: 1; min-width: 280px;  border-radius:12px; padding:16px; 
      background: linear-gradient(68.5deg, rgba(97,68,194,1) 0.6%, rgba(96,184,214,1) 99.5%); 
      color: #f1f1f1; 
      box-shadow:0 2px 6px rgba(0,0,0,0.4);">
      <h4 style="color:white">🧙‍♀️ Cast a Spell</h4>
      <hr/>
      <div id="spell"></div>
    </div>

    <!-- Fun Facts -->
    <div style="flex: 1; min-width: 280px; border-radius:12px; background: linear-gradient(68.5deg, rgba(97,68,194,1) 0.6%, rgba(96,184,214,1) 99.5%);  padding:16px; color:white">
      <h4>🌟 Fun Facts</h4>
      <hr/>
      <ul>
        <li>Text is called a <strong>string</strong> because letters are “strung” together.</li>
        <li>A single space is also a character—treat it carefully.</li>
        <li>Joining pieces builds names, labels, and whole sentences.</li>
      </ul>
    </div>
  </div>
</div>
          `.trim(),
          runnables: [
            {
              title: 'Spell 1 — join two',
              code: "console.log('Hello' + ' ' + 'world');",
            },
            {
              title: 'Spell 2 — empty second word',
              code: "console.log('A' + ' ' + '');",
            },
            {
              title: 'Spell 3 — empty first word',
              code: "console.log('' + ' ' + 'B');",
            },
          ],
          challenges: [
            {
              title: 'S1.7 Easy — Join Two Words',
              description: `**Task:** The system gives you two words (a and b). Show them with one space between.

Steps
1. Join \`a + " " + b\`.
2. Print the result.
3. Do not remove empty words; still keep the one space in the middle.

Example  
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
              description: `**Task:** The system gives you a name. Show: Hello, &lt;name&gt;.

Steps
1. Join strings with \`+\`.
2. Keep the comma after \`Hello,\`.
3. Add a period at the end.

Example  
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
              description: `**Task:** The system gives you three words (a, b, c). Show: a b c (one space between each).

Steps
1. Join them with spaces.
2. Print exactly one space between words.
3. If a word is empty, still keep spaces in those places.

Example  
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
          description:
            'Now we measure words! This lesson shows how to count characters, find the first letter, and find the last letter. You’ll see that spaces also count, and empty strings have a length of zero. These tiny tools help with name tags and labels later. Try them slowly—one peek at a time.',
          content: `
<div style="display: flex; flex-direction: column; gap: 20px; margin: auto;">

  <!-- Story -->
  <h4>🗺️ The Encounter</h4>
  <p>Letter Counters measure words like rulers. Zia counts names and Pax checks the first and last letters to decorate badges.</p>

  <!-- Learning -->
  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Length: <code>word.length</code></li>
    <li>First letter: <code>word[0]</code></li>
    <li>Last letter: <code>word[word.length - 1]</code></li>
  </ul>
  <p><em>Tip:</em> Spaces count as characters. Empty strings have length 0.</p>

  <!-- Example + Fun Facts Side by Side -->
  <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">

    <!-- Example / Spell Anchor -->
    <div style="flex: 1; min-width: 280px;  border-radius:12px; padding:16px; 
      background: linear-gradient(68.5deg, rgba(97,68,194,1) 0.6%, rgba(96,184,214,1) 99.5%); 
      color: #f1f1f1; 
      box-shadow:0 2px 6px rgba(0,0,0,0.4);">
      <h4 style="color:white">🧙‍♀️ Cast a Spell</h4>
      <hr/>
      <div id="spell"></div>
    </div>

    <!-- Fun Facts -->
    <div style="flex: 1; min-width: 280px; border-radius:12px; background: linear-gradient(68.5deg, rgba(97,68,194,1) 0.6%, rgba(96,184,214,1) 99.5%);  padding:16px; color:white">
      <h4>🌟 Fun Facts</h4>
      <hr/>
      <ul>
        <li>Spaces, punctuation, and emojis all count toward length.</li>
        <li>Indexing starts at 0, so the first letter is <code>[0]</code>.</li>
        <li>To get the last letter, use <code>length - 1</code>.</li>
      </ul>
    </div>
  </div>
</div>
          `.trim(),
          runnables: [
            { title: 'Spell 1 — length', code: "console.log('cat'.length);" },
            {
              title: 'Spell 2 — first letter',
              code: "const w='robot'; console.log(w[0]);",
            },
            {
              title: 'Spell 3 — last letter',
              code: "const w='robot'; console.log(w[w.length-1]);",
            },
            {
              title: 'Spell 4 — empty string length',
              code: "console.log(''.length);",
            },
          ],
          challenges: [
            {
              title: 'S1.8 Easy — Count Letters',
              description: `**Task:** The system gives you a word. Show how many characters it has.

Steps
1. Use \`word.length\`.
2. Print the number.
3. Spaces count as characters.

Example  
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
              description: `**Task:** The system gives you a word. Show first-last.  
If the word is empty, show just a dash: -.

Steps
1. If the word is empty → print \`"-"\`.
2. Else print the first letter, then a dash, then the last letter.

Example  
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
              description: `**Task:** The system gives you a word.  
If it has odd length, show the middle 1 letter.  
If it has even length, show the middle 2 letters.  
If it is empty, show nothing (empty line).

Steps
1. Let \`n = word.length\`.
2. If \`n === 0\` → print \`""\` (empty).
3. If \`n\` is odd → take the 1 middle letter.
4. If \`n\` is even → take the 2 middle letters.
5. Print the result.

Example  
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

    // ----------------- Chapter 2 -----------------
    const chapter2: Chapter = {
      title: 'Chapter 2 — Pockets, Paths, and Choices',
      description:
        'Zia and Pax discover satchels where numbers and words can be stored—these are variables! They learn how to compare values and speak in true/false (booleans), then use if-statements to make tiny choices in their code. By gently practicing comparisons and conditions, they unlock doors that open only for the right answers. Each lesson is friendly, slow, and designed for absolute beginners.',
      sections: [
        // S2.1 VARIABLES
        {
          title: 'S2.1 — Little Pockets (Variables)',
          description:
            'Think of variables as little pockets that hold values for later. We use let to create a pocket whose value can change and const for a pocket that should stay the same. Names should be short and clear so future you understands them. In this lesson, you’ll make pockets for words and numbers and print what is inside.',
          content: `
<div style="display: flex; flex-direction: column; gap: 20px; margin: auto;">
  <h4>🗺️ The Encounter</h4>
  <p>In the Pack Square, the Pouch Maker hands Zia tiny pockets labeled with names. “Put a value here, take it out later,” she says. Pax practices placing numbers and words into pockets and showing them on the screen.</p>

  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Create a changeable pocket: <code>let name = 'Zia';</code></li>
    <li>Create a steady pocket: <code>const city = 'Codeville';</code></li>
    <li>Print what’s inside: <code>console.log(name);</code></li>
  </ul>

  <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
    <div style="flex:1; min-width:280px; border-radius:12px; padding:16px;
      background:linear-gradient(68.5deg, rgba(97,68,194,1) .6%, rgba(96,184,214,1) 99.5%);
      color:#f1f1f1; box-shadow:0 2px 6px rgba(0,0,0,.4);">
      <h4 style="color:white">🧙‍♀️ Cast a Spell</h4>
      <hr/>
      <div id="spell"></div>
    </div>

    <div style="flex:1; min-width:280px; border-radius:12px; background:linear-gradient(68.5deg, rgba(97,68,194,1) .6%, rgba(96,184,214,1) 99.5%); padding:16px; color:white">
      <h4>🌟 Fun Facts</h4>
      <hr/>
      <ul>
        <li><code>let</code> can change later; <code>const</code> stays the same.</li>
        <li>Names usually use <em>camelCase</em> like <code>favoriteColor</code>.</li>
        <li>Variables remember values so you don’t have to retype them.</li>
      </ul>
    </div>
  </div>
</div>
          `.trim(),
          runnables: [
            {
              title: 'Spell 1 — make a pocket',
              code: "let name = 'Zia'; console.log(name);",
            },
            {
              title: 'Spell 2 — steady pocket',
              code: "const city = 'Codeville'; console.log(city);",
            },
            {
              title: 'Spell 3 — change the value',
              code: "let mood = 'happy'; console.log(mood); mood = 'excited'; console.log(mood);",
            },
            {
              title: 'Spell 4 — numbers in pockets',
              code: 'let a = 2; let b = 3; console.log(a + b);',
            },
          ],
          challenges: [
            {
              title: 'S2.1 Easy — Store and Show',
              description: `**Task:** Make a variable called \pet\` with the value \`"cat"\`. Print it.

*Example (no code)*
- Input: (none) → Output: \`cat\``,
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              tests: [
                { input: '', expect_print: 'cat' },
                { input: null, expect_print: 'cat' },
                { input: 0, expect_print: 'cat' },
                { input: 'ignored', expect_print: 'cat' },
                { input: {}, expect_print: 'cat' },
              ],
              hints: [
                'Use let to create the variable.',
                'Print the variable name, not the word again.',
              ],
            },
            {
              title: 'S2.1 Medium — Update a Pocket',
              description: `**Task:** Make \count\` start at \`1\`. Change it to \`2\`. Print the *new* value only.

*Example (no code)*
- Input: (none) → Output: \`2\``,
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              tests: [
                { input: '', expect_print: 2 },
                { input: null, expect_print: 2 },
                { input: 'x', expect_print: 2 },
                { input: 999, expect_print: 2 },
              ],
              hints: [
                'Use let (not const) so it can change.',
                'Print once, after updating.',
              ],
            },
            {
              title: 'S2.1 Hard — Two Pockets, One Sum',
              description: `**Task:** Make two variables: \a = 4\` and \`b = 6\`. Print their sum.

*Example (no code)*
- Input: (none) → Output: \`10\``,
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              tests: [
                { input: '', expect_print: 10 },
                { input: null, expect_print: 10 },
                { input: 'n/a', expect_print: 10 },
                { input: 0, expect_print: 10 },
              ],
              hints: ['No quotes for numbers.', 'Add first, then print once.'],
            },
          ],
        },

        // S2.2 MODULO %
        {
          title: 'S2.2 — Sharing Fairly (Remainder %)',
          description:
            'Sometimes numbers don’t split evenly. The modulo operator % tells you what’s left over after division. It’s useful for patterns like even/odd and for wrapping around in small cycles. In this lesson, you’ll learn to peek at the remainder and print the result safely.',
          content: `
<div style="display: flex; flex-direction: column; gap: 20px; margin: auto;">
  <h4>🗺️ The Encounter</h4>
  <p>At Circle Court, coins are shared among sprites. When the last sprite gets one coin too few, the remainder pebble clinks into a bowl. Zia listens and counts the leftovers.</p>

  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Remainder: <code>a % b</code> (what’s left after dividing a by b)</li>
    <li>Even check: <code>n % 2 === 0</code></li>
  </ul>

  <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
    <div style="flex:1; min-width:280px; border-radius:12px; padding:16px;
      background:linear-gradient(68.5deg, rgba(97,68,194,1) .6%, rgba(96,184,214,1) 99.5%);
      color:#f1f1f1; box-shadow:0 2px 6px rgba(0,0,0,.4);">
      <h4 style="color:white">🧙‍♀️ Cast a Spell</h4>
      <hr/>
      <div id="spell"></div>
    </div>

    <div style="flex:1; min-width:280px; border-radius:12px; background:linear-gradient(68.5deg, rgba(97,68,194,1) .6%, rgba(96,184,214,1) 99.5%); padding:16px; color:white">
      <h4>🌟 Fun Facts</h4>
      <hr/>
      <ul>
        <li>\`7 % 3\` is \`1\` because 3+3=6 and 1 is left.</li>
        <li>Use modulo to tell if a number is even or odd.</li>
        <li>Modulo is handy for repeating patterns like days of the week.</li>
      </ul>
    </div>
  </div>
</div>
          `.trim(),
          runnables: [
            {
              title: 'Spell 1 — simple remainder',
              code: 'console.log(7 % 3); // 1',
            },
            {
              title: 'Spell 2 — even',
              code: 'let n = 10; console.log(n % 2 === 0);',
            },
            {
              title: 'Spell 3 — odd',
              code: 'let n = 11; console.log(n % 2 !== 0);',
            },
          ],
          challenges: [
            {
              title: 'S2.2 Easy — 10 % 4',
              description: `**Task:** Print the remainder when 10 is divided by 4.

*Example (no code)*
- Input: (none) → Output: \`2\``,
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              tests: [
                { input: '', expect_print: 2 },
                { input: null, expect_print: 2 },
                { input: 'x', expect_print: 2 },
                { input: 0, expect_print: 2 },
              ],
              hints: ['Compute 10 % 4 directly.', 'Print the number only.'],
            },
            {
              title: 'S2.2 Medium — Even or Odd',
              description: `**Task:** The system gives you a number \n\`.  
If \`n\` is even, print \`"even"\`. If odd, print \`"odd"\`.

*Example (no code)*
- Input: \`4\` → Output: \`even\`  
- Input: \`7\` → Output: \`odd\``,
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              tests: [
                { input: 4, expect_print: 'even' },
                { input: 7, expect_print: 'odd' },
                { input: 0, expect_print: 'even' },
                { input: -2, expect_print: 'even' },
                { input: -3, expect_print: 'odd' },
              ],
              hints: ['Use modulo 2.', 'Zero counts as even.'],
            },
            {
              title: 'S2.2 Hard — Remainder Label',
              description: `**Task:** The system gives you \a\` and \`b\`.  
Print the remainder of \`a % b\`. If \`b\` is \`0\`, print \`"undefined"\`.

*Example (no code)*
- Input: \`[7, 3]\` → Output: \`1\`  
- Input: \`[5, 0]\` → Output: \`undefined\``,
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              tests: [
                { input: [7, 3], expect_print: 1 },
                { input: [10, 5], expect_print: 0 },
                { input: [1, 0], expect_print: 'undefined' },
                { input: [-7, 3], expect_print: -1 },
                { input: [7, -3], expect_print: 1 },
              ],
              hints: ['Guard against division by 0.', 'Then use a % b.'],
            },
          ],
        },

        // S2.3 COMPARISONS
        {
          title: 'S2.3 — Comparing Things (===, >, <, ≥, ≤)',
          description:
            'Computers ask questions by comparing values. The result is true or false, like a tiny yes/no. We will use strict equality (===) and the usual greater/less signs to compare numbers and words. Reading these results helps us make choices later with if-statements. Practice carefully and say the result out loud.',
          content: `
<div style="display: flex; flex-direction: column; gap: 20px; margin: auto;">
  <h4>🗺️ The Encounter</h4>
  <p>At Balance Bridge, two plates hold values to compare. Zia and Pax place numbers on each side and watch the pointer flip to “true” or “false”.</p>

  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Equal: <code>a === b</code></li>
    <li>Greater: <code>a > b</code>, Less: <code>a < b</code></li>
    <li>Greater or equal: <code>a >= b</code>, Less or equal: <code>a <= b</code></li>
  </ul>

  <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
    <div style="flex:1; min-width:280px; border-radius:12px; padding:16px;
      background:linear-gradient(68.5deg, rgba(97,68,194,1) .6%, rgba(96,184,214,1) 99.5%);
      color:#f1f1f1; box-shadow:0 2px 6px rgba(0,0,0,.4);">
      <h4 style="color:white">🧙‍♀️ Cast a Spell</h4>
      <hr/>
      <div id="spell"></div>
    </div>

    <div style="flex:1; min-width:280px; border-radius:12px; background:linear-gradient(68.5deg, rgba(97,68,194,1) .6%, rgba(96,184,214,1) 99.5%); padding:16px; color:white">
      <h4>🌟 Fun Facts</h4>
      <hr/>
      <ul>
        <li><code>===</code> checks value and type; it’s safer for beginners.</li>
        <li>Comparisons always give <code>true</code> or <code>false</code>.</li>
        <li>You can compare strings: <code>'a' &lt; 'b'</code> is <code>true</code>.</li>
      </ul>
    </div>
  </div>
</div>
          `.trim(),
          runnables: [
            {
              title: 'Spell 1 — equals',
              code: 'console.log(3 === 3); // true',
            },
            { title: 'Spell 2 — greater', code: 'console.log(5 > 2); // true' },
            {
              title: 'Spell 3 — less or equal',
              code: 'console.log(4 <= 4); // true',
            },
            {
              title: 'Spell 4 — string compare',
              code: "console.log('apple' < 'banana');",
            },
          ],
          challenges: [
            {
              title: 'S2.3 Easy — True or False',
              description: `**Task:** Print the result of \`7 > 5\`.

*Example (no code)*
- Input: (none) → Output: \`true\``,
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              tests: [
                { input: '', expect_print: true },
                { input: null, expect_print: true },
                { input: 0, expect_print: true },
                { input: 'ignored', expect_print: true },
              ],
              hints: [
                'Use > to compare.',
                'Print the boolean result directly.',
              ],
            },
            {
              title: 'S2.3 Medium — Check Match',
              description: `**Task:** The system gives you \a\` and \`b\`.  
Print \`true\` if \`a === b\`, else print \`false\`.

*Example (no code)*
- Input: \`[3, 3]\` → Output: \`true\`  
- Input: \`[3, 4]\` → Output: \`false\``,
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              tests: [
                { input: [3, 3], expect_print: true },
                { input: [3, 4], expect_print: false },
                { input: ['5', 5], expect_print: false },
                { input: ['hi', 'hi'], expect_print: true },
                { input: ['a', 'b'], expect_print: false },
              ],
              hints: ['Use === (not ==).', 'Print the comparison directly.'],
            },
            {
              title: 'S2.3 Hard — Between Check',
              description: `**Task:** The system gives you \n, low, high\`.  
Print \`true\` if \`n\` is between \`low\` and \`high\` (inclusive). Else print \`false\`.

*Example (no code)*
- Input: \`[5, 1, 5]\` → Output: \`true\`  
- Input: \`[0, 1, 5]\` → Output: \`false\``,
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              tests: [
                { input: [5, 1, 5], expect_print: true },
                { input: [0, 1, 5], expect_print: false },
                { input: [3, 3, 7], expect_print: true },
                { input: [8, 3, 7], expect_print: false },
                { input: [7, 7, 7], expect_print: true },
              ],
              hints: [
                'Join checks with >= and <=; print true/false.',
                'Be inclusive of the ends.',
              ],
            },
          ],
        },

        // S2.4 LOGIC
        {
          title: 'S2.4 — Tiny Truths (Booleans & Logic)',
          description:
            'Booleans are tiny truth values: true or false. We can glue them together with AND (&&), OR (||), and flip them with NOT (!). These building blocks help us ask more than one question at a time. Practice with gentle examples to see how the answers change.',
          content: `
<div style="display: flex; flex-direction: column; gap: 20px; margin: auto;">
  <h4>🗺️ The Encounter</h4>
  <p>In Lantern Lane, lights turn on if two switches agree. Zia learns the secret signals: AND means both, OR means at least one, and NOT flips the answer.</p>

  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>AND: <code>a && b</code> (true if both are true)</li>
    <li>OR: <code>a || b</code> (true if at least one is true)</li>
    <li>NOT: <code>!a</code> (flips true/false)</li>
  </ul>

  <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
    <div style="flex:1; min-width:280px; border-radius:12px; padding:16px;
      background:linear-gradient(68.5deg, rgba(97,68,194,1) .6%, rgba(96,184,214,1) 99.5%);
      color:#f1f1f1; box-shadow:0 2px 6px rgba(0,0,0,.4);">
      <h4 style="color:white">🧙‍♀️ Cast a Spell</h4>
      <hr/>
      <div id="spell"></div>
    </div>

    <div style="flex:1; min-width:280px; border-radius:12px; background:linear-gradient(68.5deg, rgba(97,68,194,1) .6%, rgba(96,184,214,1) 99.5%); padding:16px; color:white">
      <h4>🌟 Fun Facts</h4>
      <hr/>
      <ul>
        <li>Think of AND as “both switches on”.</li>
        <li>Think of OR as “at least one switch on”.</li>
        <li>NOT flips the light—on becomes off, off becomes on.</li>
      </ul>
    </div>
  </div>
</div>
          `.trim(),
          runnables: [
            {
              title: 'Spell 1 — both true',
              code: 'console.log(true && true);',
            },
            {
              title: 'Spell 2 — one is enough',
              code: 'console.log(false || true);',
            },
            { title: 'Spell 3 — flip it', code: 'console.log(!false);' },
            {
              title: 'Spell 4 — mix with comparisons',
              code: 'let a=5; console.log(a>=1 && a<=10);',
            },
          ],
          challenges: [
            {
              title: 'S2.4 Easy — At Least One',
              description: `**Task:** Print the result of \true || false\`.

*Example (no code)*
- Input: (none) → Output: \`true\``,
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              tests: [
                { input: '', expect_print: true },
                { input: null, expect_print: true },
                { input: 'x', expect_print: true },
                { input: 0, expect_print: true },
              ],
              hints: ['OR is true if any side is true.'],
            },
            {
              title: 'S2.4 Medium — In Range AND',
              description: `**Task:** The system gives you \n\`.  
Print \`true\` if \`n\` is between 1 and 10 inclusive, else \`false\`.

*Example (no code)*
- Input: \`5\` → Output: \`true\`  
- Input: \`11\` → Output: \`false\``,
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              tests: [
                { input: 5, expect_print: true },
                { input: 1, expect_print: true },
                { input: 10, expect_print: true },
                { input: 0, expect_print: false },
                { input: 11, expect_print: false },
              ],
              hints: [
                'Use (n >= 1) && (n <= 10).',
                'Print the boolean directly.',
              ],
            },
            {
              title: 'S2.4 Hard — Not Empty',
              description: `**Task:** The system gives you a word.  
Print \`true\` if it is not empty, else print \`false\`.

*Example (no code)*
- Input: \`"hi"\` → Output: \`true\`  
- Input: \`""\` → Output: \`false\``,
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              tests: [
                { input: 'hi', expect_print: true },
                { input: '', expect_print: false },
                { input: 'a', expect_print: true },
                { input: ' ', expect_print: true },
                { input: 'robot', expect_print: true },
              ],
              hints: [
                'Check length, then use ! to flip if needed.',
                'Print true/false.',
              ],
            },
          ],
        },

        // S2.5 IF
        {
          title: 'S2.5 — If This, Then That',
          description:
            'If-statements let your code make a choice. When a condition is true, a block of code runs; otherwise it is skipped. We start with a single if to keep it simple. Read your condition slowly and predict what will print.',
          content: `
<div style="display: flex; flex-direction: column; gap: 20px; margin: auto;">
  <h4>🗺️ The Encounter</h4>
  <p>At Choice Corner, a door opens only if you say the secret number. Zia learns to test a condition and speak when it’s true.</p>

  <h4>✨ The Secret Spell</h4>
  <pre style="background:#1e1e1e; color:#d4d4d4; padding:12px; border-radius:8px;"><code>if (condition) {
  // runs when condition is true
  console.log('Yes!');
}</code></pre>

  <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
    <div style="flex:1; min-width:280px; border-radius:12px; padding:16px;
      background:linear-gradient(68.5deg, rgba(97,68,194,1) .6%, rgba(96,184,214,1) 99.5%);
      color:#f1f1f1; box-shadow:0 2px 6px rgba(0,0,0,.4);">
      <h4 style="color:white">🧙‍♀️ Cast a Spell</h4>
      <hr/>
      <div id="spell"></div>
    </div>

    <div style="flex:1; min-width:280px; border-radius:12px; background:linear-gradient(68.5deg, rgba(97,68,194,1) .6%, rgba(96,184,214,1) 99.5%); padding:16px; color:white">
      <h4>🌟 Fun Facts</h4>
      <hr/>
      <ul>
        <li>If nothing is printed, your condition was false.</li>
        <li>Conditions use comparisons and booleans.</li>
        <li>Curly braces <code>{}</code> hold the code to run.</li>
      </ul>
    </div>
  </div>
</div>
          `.trim(),
          runnables: [
            {
              title: 'Spell 1 — simple if',
              code: "let n=3; if (n>2) { console.log('big'); }",
            },
            {
              title: 'Spell 2 — no print when false',
              code: "let n=1; if (n>2) { console.log('big'); }",
            },
          ],
          challenges: [
            {
              title: 'S2.5 Easy — If Nice',
              description: `**Task:** If \a > 5\`, print \`"nice"\`. Otherwise, print nothing.

*Example (no code)*
- Input: \`6\` → Output: \`nice\`  
- Input: \`5\` → Output: *(nothing)*`,
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              tests: [
                { input: 6, expect_print: 'nice' },
                { input: 5, expect_print: '' },
                { input: 10, expect_print: 'nice' },
                { input: -1, expect_print: '' },
                { input: 0, expect_print: '' },
              ],
              hints: ['Only print when the condition is true.', 'No else yet.'],
            },
            {
              title: 'S2.5 Medium — If Even',
              description: `**Task:** The system gives you \n\`. If it is even, print \`"even"\`. Else, print nothing.

*Example (no code)*
- Input: \`8\` → Output: \`even\`  
- Input: \`3\` → Output: *(nothing)*`,
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              tests: [
                { input: 8, expect_print: 'even' },
                { input: 3, expect_print: '' },
                { input: 0, expect_print: 'even' },
                { input: -2, expect_print: 'even' },
                { input: 11, expect_print: '' },
              ],
              hints: ['Use modulo 2.', 'Only print when true.'],
            },
            {
              title: 'S2.5 Hard — If In Range',
              description: `**Task:** The system gives you \n\`. If \`1 <= n <= 10\`, print \`"ok"\`. Else, print nothing.

*Example (no code)*
- Input: \`5\` → Output: \`ok\`  
- Input: \`11\` → Output: *(nothing)*`,
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              tests: [
                { input: 1, expect_print: 'ok' },
                { input: 10, expect_print: 'ok' },
                { input: 0, expect_print: '' },
                { input: 11, expect_print: '' },
                { input: -5, expect_print: '' },
              ],
              hints: ['Use && to join two checks.', 'Print once when true.'],
            },
          ],
        },

        // S2.6 IF/ELSE
        {
          title: 'S2.6 — Choose A or B (if/else)',
          description:
            'Now we add an else part: if the condition is true, do one thing; otherwise, do another. This makes the program speak in two possible ways. Practice with simple choices like even/odd to get comfortable. Read each branch and predict what prints.',
          content: `
<div style="display: flex; flex-direction: column; gap: 20px; margin: auto;">
  <h4>🗺️ The Encounter</h4>
  <p>At the Fork Gate, a sign points left or right. Zia learns to choose paths using if/else so the code always picks one message.</p>

  <h4>✨ The Secret Spell</h4>
  <pre style="background:#1e1e1e; color:#d4d4d4; padding:12px; border-radius:8px;"><code>if (condition) {
  console.log('A');
} else {
  console.log('B');
}</code></pre>

  <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
    <div style="flex:1; min-width:280px; border-radius:12px; padding:16px;
      background:linear-gradient(68.5deg, rgba(97,68,194,1) .6%, rgba(96,184,214,1) 99.5%);
      color:#f1f1f1; box-shadow:0 2px 6px rgba(0,0,0,.4);">
      <h4 style="color:white">🧙‍♀️ Cast a Spell</h4>
      <hr/>
      <div id="spell"></div>
    </div>

    <div style="flex:1; min-width:280px; border-radius:12px; background:linear-gradient(68.5deg, rgba(97,68,194,1) .6%, rgba(96,184,214,1) 99.5%); padding:16px; color:white">
      <h4>🌟 Fun Facts</h4>
      <hr/>
      <ul>
        <li>Exactly one branch runs—never both.</li>
        <li>Use clear, short messages in each branch.</li>
        <li>You can use comparisons, modulo, and logic in the condition.</li>
      </ul>
    </div>
  </div>
</div>
          `.trim(),
          runnables: [
            {
              title: 'Spell 1 — even/odd',
              code: "let n=7; if (n%2===0){console.log('even');} else {console.log('odd');}",
            },
            {
              title: 'Spell 2 — pass/fail',
              code: "let score=6; if (score>=5){console.log('pass');} else {console.log('try again');}",
            },
          ],
          challenges: [
            {
              title: 'S2.6 Easy — Even/Odd',
              description: `**Task:** The system gives you \n\`.  
Print \`"even"\` if even, otherwise \`"odd"\`.

*Example (no code)*
- Input: \`4\` → Output: \`even\`  
- Input: \`9\` → Output: \`odd\``,
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              tests: [
                { input: 4, expect_print: 'even' },
                { input: 9, expect_print: 'odd' },
                { input: 0, expect_print: 'even' },
                { input: -2, expect_print: 'even' },
                { input: -3, expect_print: 'odd' },
              ],
              hints: ['Use if/else.', 'Modulo 2 decides even or odd.'],
            },
            {
              title: 'S2.6 Medium — Age Gate',
              description: `**Task:** The system gives you \age\`.  
If \`age >= 13\`, print \`"allowed"\`. Else print \`"blocked"\`.

*Example (no code)*
- Input: \`15\` → Output: \`allowed\`  
- Input: \`12\` → Output: \`blocked\``,
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              tests: [
                { input: 13, expect_print: 'allowed' },
                { input: 12, expect_print: 'blocked' },
                { input: 18, expect_print: 'allowed' },
                { input: 0, expect_print: 'blocked' },
                { input: 100, expect_print: 'allowed' },
              ],
              hints: ['Use >= to include 13.', 'Print exactly the words.'],
            },
            {
              title: 'S2.6 Hard — Inside or Outside',
              description: `**Task:** The system gives you \n\`.  
If \`1 <= n <= 10\`, print \`"inside"\`. Else print \`"outside"\`.

*Example (no code)*
- Input: \`10\` → Output: \`inside\`  
- Input: \`0\` → Output: \`outside\``,
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              tests: [
                { input: 1, expect_print: 'inside' },
                { input: 10, expect_print: 'inside' },
                { input: 0, expect_print: 'outside' },
                { input: 11, expect_print: 'outside' },
                { input: -5, expect_print: 'outside' },
              ],
              hints: [
                'Join two checks with &&.',
                'Choose exactly one word to print.',
              ],
            },
          ],
        },
      ],
    };

    // ----------------- Chapter 3 -----------------
    const chapter3: Chapter = {
      title: 'Chapter 3 — Little Lists and Lineups (Arrays)',
      description:
        'Zia and Pax find shelves where many values sit in order—these are arrays. They learn to create arrays, count how many items there are, and pick items by position. Then they practice adding and removing items at the ends. Everything stays beginner-friendly, with careful steps, clear examples, and tiny challenges.',
      sections: [
        // S3.1 CREATE ARRAYS
        {
          title: 'S3.1 — Make a Line (Create Arrays)',
          description:
            'An array is a lineup of values inside square brackets. Items are separated by commas, and you can mix numbers and strings. Start with small arrays and print them to see what they look like. We’ll use length and positions in the next sections.',
          content: `
<div style="display: flex; flex-direction: column; gap: 20px; margin: auto;">
  <h4>🗺️ The Encounter</h4>
  <p>At Shelf Square, bottles line up in a neat row. Zia places labels in an array to keep them together, while Pax counts how many bottles are on the shelf.</p>

  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Create: <code>let colors = ['red', 'blue'];</code></li>
    <li>Print the whole array: <code>console.log(colors);</code></li>
  </ul>

  <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
    <div style="flex:1; min-width:280px; border-radius:12px; padding:16px;
      background:linear-gradient(68.5deg, rgba(97,68,194,1) .6%, rgba(96,184,214,1) 99.5%);
      color:#f1f1f1; box-shadow:0 2px 6px rgba(0,0,0,.4);">
      <h4 style="color:white">🧙‍♀️ Cast a Spell</h4>
      <hr/>
      <div id="spell"></div>
    </div>

    <div style="flex:1; min-width:280px; border-radius:12px; background:linear-gradient(68.5deg, rgba(97,68,194,1) .6%, rgba(96,184,214,1) 99.5%); padding:16px; color:white">
      <h4>🌟 Fun Facts</h4>
      <hr/>
      <ul>
        <li>Arrays remember the order of items.</li>
        <li>You can put strings, numbers, or both together.</li>
        <li>Empty array: <code>[]</code> has length 0.</li>
      </ul>
    </div>
  </div>
</div>
          `.trim(),
          runnables: [
            {
              title: 'Spell 1 — two colors',
              code: "let colors=['red','blue']; console.log(colors);",
            },
            {
              title: 'Spell 2 — mixed items',
              code: "let stuff=['cup',3,'hat']; console.log(stuff);",
            },
            {
              title: 'Spell 3 — empty shelf',
              code: 'let empty=[]; console.log(empty);',
            },
          ],
          challenges: [
            {
              title: 'S3.1 Easy — Two Pets',
              description: `**Task:** Make an array with \"cat"\` and \`"dog"\`. Print the array.

*Example (no code)*
- Input: (none) → Output: \`["cat","dog"]\``,
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              tests: [
                { input: '', expect_print: '["cat","dog"]' },
                { input: null, expect_print: '["cat","dog"]' },
                { input: 'ignored', expect_print: '["cat","dog"]' },
                { input: 0, expect_print: '["cat","dog"]' },
              ],
              hints: [
                'Use square brackets with commas.',
                'Print the array variable.',
              ],
            },
            {
              title: 'S3.1 Medium — Three Numbers',
              description: `**Task:** Create \`[1, 2, 3]\ and print it.

*Example (no code)*
- Input: (none) → Output: \`[1,2,3]\``,
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              tests: [
                { input: '', expect_print: '[1,2,3]' },
                { input: null, expect_print: '[1,2,3]' },
                { input: 'n/a', expect_print: '[1,2,3]' },
                { input: 42, expect_print: '[1,2,3]' },
              ],
              hints: ['No quotes for numbers.', 'Separate with commas.'],
            },
            {
              title: 'S3.1 Hard — Mixed Trio',
              description: `**Task:** Create \`["sun", 7, "moon"]\ and print it.

*Example (no code)*
- Input: (none) → Output: \`["sun",7,"moon"]\``,
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              tests: [
                { input: '', expect_print: '["sun",7,"moon"]' },
                { input: null, expect_print: '["sun",7,"moon"]' },
                { input: 0, expect_print: '["sun",7,"moon"]' },
                { input: 'x', expect_print: '["sun",7,"moon"]' },
              ],
              hints: [
                'Strings need quotes, numbers do not.',
                'Keep the order.',
              ],
            },
          ],
        },

        // S3.2 LENGTH
        {
          title: 'S3.2 — How Many? (.length)',
          description:
            'Arrays know how many items they have. The length property tells you the count. We’ll try it with empty arrays and longer ones to see how it changes. Counting helps when picking positions later.',
          content: `
<div style="display: flex; flex-direction: column; gap: 20px; margin: auto;">
  <h4>🗺️ The Encounter</h4>
  <p>The Counter Clock ticks each time an item joins the lineup. Zia watches the number change as she adds or removes items.</p>

  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Count: <code>array.length</code></li>
  </ul>

  <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
    <div style="flex:1; min-width:280px; border-radius:12px; padding:16px;
      background:linear-gradient(68.5deg, rgba(97,68,194,1) .6%, rgba(96,184,214,1) 99.5%);
      color:#f1f1f1; box-shadow:0 2px 6px rgba(0,0,0,.4);">
      <h4 style="color:white">🧙‍♀️ Cast a Spell</h4>
      <hr/>
      <div id="spell"></div>
    </div>

    <div style="flex:1; min-width:280px; border-radius:12px; background:linear-gradient(68.5deg, rgba(97,68,194,1) .6%, rgba(96,184,214,1) 99.5%); padding:16px; color:white">
      <h4>🌟 Fun Facts</h4>
      <hr/>
      <ul>
        <li>Empty array has length 0.</li>
        <li>Length grows and shrinks as items change.</li>
        <li>Strings also have <code>.length</code>—you met that in Chapter 1.</li>
      </ul>
    </div>
  </div>
</div>
          `.trim(),
          runnables: [
            {
              title: 'Spell 1 — count two',
              code: "let colors=['red','blue']; console.log(colors.length);",
            },
            {
              title: 'Spell 2 — count empty',
              code: 'let a=[]; console.log(a.length);',
            },
            {
              title: 'Spell 3 — count three',
              code: "let a=['x','y','z']; console.log(a.length);",
            },
          ],
          challenges: [
            {
              title: 'S3.2 Easy — Count 3',
              description: `**Task:** Print the length of \`["a","b","c"]\.

*Example (no code)*
- Input: (none) → Output: \`3\``,
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              tests: [
                { input: '', expect_print: 3 },
                { input: null, expect_print: 3 },
                { input: 'x', expect_print: 3 },
                { input: 0, expect_print: 3 },
              ],
              hints: ['Use .length right away.', 'Print the number.'],
            },
            {
              title: 'S3.2 Medium — Length of Empty',
              description: `**Task:** Make an empty array and print its length.

*Example (no code)*
- Input: (none) → Output: \`0\``,
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              tests: [
                { input: '', expect_print: 0 },
                { input: null, expect_print: 0 },
                { input: 'ignored', expect_print: 0 },
                { input: {}, expect_print: 0 },
              ],
              hints: ['[] is an empty array.', 'Length is 0.'],
            },
            {
              title: 'S3.2 Hard — Count Mixed',
              description: `**Task:** Create \`["a", 1, "b", 2]\. Print its length.

*Example (no code)*
- Input: (none) → Output: \`4\``,
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              tests: [
                { input: '', expect_print: 4 },
                { input: null, expect_print: 4 },
                { input: 'x', expect_print: 4 },
                { input: 0, expect_print: 4 },
              ],
              hints: ['Length counts all items, any type.', 'Print once.'],
            },
          ],
        },

        // S3.3 INDEXING
        {
          title: 'S3.3 — First, Middle, Last (Indexing)',
          description:
            'We pick items by position using square brackets. Positions start at 0 for the first item. You will print the first and last items, and try middle positions to practice. Be careful not to go past the ends.',
          content: `
<div style="display: flex; flex-direction: column; gap: 20px; margin: auto;">
  <h4>🗺️ The Encounter</h4>
  <p>Index Isle has stepping stones numbered starting from 0. Zia hops to the right stone to pick an item from the lineup.</p>

  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>First: <code>a[0]</code></li>
    <li>Last: <code>a[a.length - 1]</code></li>
  </ul>

  <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
    <div style="flex:1; min-width:280px; border-radius:12px; padding:16px;
      background:linear-gradient(68.5deg, rgba(97,68,194,1) .6%, rgba(96,184,214,1) 99.5%);
      color:#f1f1f1; box-shadow:0 2px 6px rgba(0,0,0,.4);">
      <h4 style="color:white">🧙‍♀️ Cast a Spell</h4>
      <hr/>
      <div id="spell"></div>
    </div>

    <div style="flex:1; min-width:280px; border-radius:12px; background:linear-gradient(68.5deg, rgba(97,68,194,1) .6%, rgba(96,184,214,1) 99.5%); padding:16px; color:white">
      <h4>🌟 Fun Facts</h4>
      <hr/>
      <ul>
        <li>Indexing starts at 0, not 1.</li>
        <li>Last item is at <code>length - 1</code>.</li>
        <li>Going past the ends gives <code>undefined</code>.</li>
      </ul>
    </div>
  </div>
</div>
          `.trim(),
          runnables: [
            {
              title: 'Spell 1 — first item',
              code: "let a=['red','green','blue']; console.log(a[0]);",
            },
            {
              title: 'Spell 2 — last item',
              code: "let a=['red','green','blue']; console.log(a[a.length-1]);",
            },
            {
              title: 'Spell 3 — middle item',
              code: "let a=['sun','moon','star']; console.log(a[1]);",
            },
          ],
          challenges: [
            {
              title: 'S3.3 Easy — First Fruit',
              description: `**Task:** Given \`["apple","banana","pear"]\, print the first item.

*Example (no code)*
- Input: (none) → Output: \`apple\``,
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              tests: [
                { input: '', expect_print: 'apple' },
                { input: null, expect_print: 'apple' },
                { input: 'x', expect_print: 'apple' },
                { input: 0, expect_print: 'apple' },
              ],
              hints: ['First is index 0.', 'Print that item.'],
            },
            {
              title: 'S3.3 Medium — Last Color',
              description: `**Task:** Given \`["red","green","blue"]\, print the last item.

*Example (no code)*
- Input: (none) → Output: \`blue\``,
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              tests: [
                { input: '', expect_print: 'blue' },
                { input: null, expect_print: 'blue' },
                { input: 'x', expect_print: 'blue' },
                { input: 0, expect_print: 'blue' },
              ],
              hints: ['Use length - 1.', 'Print the item.'],
            },
            {
              title: 'S3.3 Hard — Middle Animal',
              description: `**Task:** Given \`["ant","bear","cat","dog","eel"]\, print the middle item (index 2).

*Example (no code)*
- Input: (none) → Output: \`cat\``,
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              tests: [
                { input: '', expect_print: 'cat' },
                { input: null, expect_print: 'cat' },
                { input: 'ignored', expect_print: 'cat' },
                { input: 0, expect_print: 'cat' },
              ],
              hints: ['Count from 0: 0,1,2,3,4.', 'Pick index 2.'],
            },
          ],
        },

        // S3.4 PUSH / POP
        {
          title: 'S3.4 — Add & Remove (push, pop)',
          description:
            'Arrays can grow and shrink at the end. Use push to add one item to the end, and pop to remove the last item. Practice adding two items and popping one to see the lineup change. Print the array to check your work.',
          content: `
<div style="display: flex; flex-direction: column; gap: 20px; margin: auto;">
  <h4>🗺️ The Encounter</h4>
  <p>At End Dock, a ferry brings new items to the lineup and takes the last one away. Zia adds labels with push and removes them with pop.</p>

  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Add to end: <code>a.push('new')</code></li>
    <li>Remove last: <code>a.pop()</code></li>
  </ul>

  <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
    <div style="flex:1; min-width:280px; border-radius:12px; padding:16px;
      background:linear-gradient(68.5deg, rgba(97,68,194,1) .6%, rgba(96,184,214,1) 99.5%);
      color:#f1f1f1; box-shadow:0 2px 6px rgba(0,0,0,.4);">
      <h4 style="color:white">🧙‍♀️ Cast a Spell</h4>
      <hr/>
      <div id="spell"></div>
    </div>

    <div style="flex:1; min-width:280px; border-radius:12px; background:linear-gradient(68.5deg, rgba(97,68,194,1) .6%, rgba(96,184,214,1) 99.5%); padding:16px; color:white">
      <h4>🌟 Fun Facts</h4>
      <hr/>
      <ul>
        <li><code>push</code> returns the new length.</li>
        <li><code>pop</code> returns the removed item.</li>
        <li>Arrays are flexible shelves—easy to grow or shrink.</li>
      </ul>
    </div>
  </div>
</div>
          `.trim(),
          runnables: [
            {
              title: 'Spell 1 — push one',
              code: "let a=['red']; a.push('blue'); console.log(a);",
            },
            {
              title: 'Spell 2 — push two',
              code: "let a=['sun']; a.push('moon'); a.push('star'); console.log(a);",
            },
            {
              title: 'Spell 3 — pop one',
              code: "let a=['A','B','C']; a.pop(); console.log(a);",
            },
          ],
          challenges: [
            {
              title: 'S3.4 Easy — Add One',
              description: `**Task:** Start with \`["a"]\. Add \`"b"\` to the end and print.

*Example (no code)*
- Input: (none) → Output: \`["a","b"]\``,
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              tests: [
                { input: '', expect_print: '["a","b"]' },
                { input: null, expect_print: '["a","b"]' },
                { input: 'x', expect_print: '["a","b"]' },
                { input: 0, expect_print: '["a","b"]' },
              ],
              hints: ['Use push once.', 'Print the array.'],
            },
            {
              title: 'S3.4 Medium — Add Two',
              description: `**Task:** Start with \`[]\. Add \`"x"\` then \`"y"\`, then print.

*Example (no code)*
- Input: (none) → Output: \`["x","y"]\``,
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              tests: [
                { input: '', expect_print: '["x","y"]' },
                { input: null, expect_print: '["x","y"]' },
                { input: 'n/a', expect_print: '["x","y"]' },
                { input: 42, expect_print: '["x","y"]' },
              ],
              hints: ['Call push twice.', 'Order matters.'],
            },
            {
              title: 'S3.4 Hard — Pop Result',
              description: `**Task:** Start with \`["dog","cat","bird"]\.  
Remove the last item using \`pop()\`. Print the array that remains.

*Example (no code)*
- Input: (none) → Output: \`["dog","cat"]\``,
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              tests: [
                { input: '', expect_print: '["dog","cat"]' },
                { input: null, expect_print: '["dog","cat"]' },
                { input: 0, expect_print: '["dog","cat"]' },
                { input: 'ignored', expect_print: '["dog","cat"]' },
              ],
              hints: ['Use pop once.', 'Print the array after popping.'],
            },
          ],
        },
      ],
    };

    const createChapter = async (chapter: Chapter, order: number) => {
      // INSERT CHAPTER 1
      await tx.insert(schema.chapters).values({
        title: chapter.title,
        storyId: story?.id,
        description: chapter.description,
        rewardOptions: COMMON_REWARD_OPTIONS,
        order: order,
      });

      const createdChapter = await tx.query.chapters.findFirst({
        where: eq(schema.chapters.title, chapter.title),
      });

      let sectionOrder = 1;
      for (const sec of chapter.sections) {
        await tx.insert(schema.sections).values({
          title: sec.title,
          chapterId: createdChapter?.id,
          description: sec.description,
          rewardOptions: COMMON_REWARD_OPTIONS,
          runnables: JSON.stringify(sec.runnables),
          content: sec.content,
          order: sectionOrder,
        });
        sectionOrder++;

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
    };

    let chapterOrder = 1;
    for (const chapter of [chapter1, chapter2, chapter3]) {
      await createChapter(chapter, chapterOrder);
      chapterOrder++;
      console.log('Seeding completed ' + chapter.title + '.');
    }

    console.log('Seeding completed.');
  });
}

main()
  .then(() => console.log('Seeding completed'))
  .catch((e) => console.error(e));
