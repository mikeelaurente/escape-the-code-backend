import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from './db';
import * as schema from './db/schema';
import * as bcrypt from 'bcryptjs';
import { updateUserBalance } from './db/repositories/user.repository';

async function main() {
  return db.transaction(async (tx) => {
    console.log('Starting seed transaction');

    // Clear tables
    await tx.delete(schema.hintUsages);
    await tx.delete(schema.creditTransactions);
    await tx.delete(schema.userAchievements);
    await tx.delete(schema.achievements);
    await tx.delete(schema.challengeHints);
    await tx.delete(schema.storyProgress);
    await tx.delete(schema.challengeAnswerSubmissions);
    await tx.delete(schema.challengeAnswers);
    await tx.delete(schema.storyProgress);
    await tx.delete(schema.challenges);
    await tx.delete(schema.sections);
    await tx.delete(schema.chapters);
    await tx.delete(schema.stories);
    await tx.delete(schema.users);
    await tx.delete(schema.achievements);

    /*
    
    export const achievements = mysqlTable('achievements', {
      id: int('id').autoincrement().primaryKey(),
      title: varchar({ length: 255 }).notNull().unique(),
      description: varchar({ length: 1024 }).notNull(),
      difficulty: varchar({ length: 30 })
        .notNull()
        .$type<'easy' | 'medium' | 'hard'>(),
      rewardPoints: int().notNull(),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
    });
    
    export const userAchievements = mysqlTable('user_achievements', {
      id: int('id').autoincrement().primaryKey(),
      userId: int('user_id').references(() => users.id),
      achievementId: int('achievement_id').references(() => achievements.id),
      awardedAt: datetime().notNull(),
    });

    // Generate Achievements here
    */

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
        verified: schema.VerificationStatus.Verified,
        verifiedAt: new Date(),
      });

      const currentUser = await tx.query.users.findFirst({
        where: eq(schema.users.email, email),
      });

      await tx.insert(schema.creditTransactions).values({
        title: 'Initial Balance',
        amount: 50,
        userId: currentUser?.id,
        type: 'in',
        group: 'reward',
      });

      await updateUserBalance(Number(currentUser?.id), tx);
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
      creditPoints: number;
      moduleType: 'javascript';
      hints: string[];
    };

    type Runnable = { title: string; code: string };

    type LinkRef = { title: string; url: string };

    type Section = {
      title: string;
      description: string;
      content: string; // HTML (no Cast-a-Spell box, no Fun Facts)
      runnables: Runnable[];
      trivia: string[]; // << NEW
      additionalResources: LinkRef[]; // << NEW
      challenges: Challenge[];
      rewardPoints: number;
      creditPoints: number;
    };

    type Chapter = {
      title: string;
      description: string;
      sections: Section[];
      rewardPoints: number;
      creditPoints: number;
    };

    const REWARD = { easy: 10, medium: 20, hard: 30 };
    const COMMON_REWARD_OPTIONS = { easy: 20, medium: 30, hard: 50 };
    const testsJson = (tests: Challenge['tests']) => JSON.stringify(tests);

    // ----------------- Chapter 1 -----------------
    const REWARD_POINTS = { easy: 10, medium: 20, hard: 30 } as const;
    const CREDIT_POINTS = { easy: 3, medium: 5, hard: 8 } as const;

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
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p><strong>Zia</strong> and <strong>Pax</strong> meet the mysterious <em>Console Keeper</em>.
  The Keeper whispers: “If you can make the screen speak, the gate will open!” Zia traces the letters of a tiny spell and the air shimmers as words appear.</p>

  <h4>✨ The Secret Spell</h4>
  <p>Use <code>console.log('text here')</code> to show words on the screen. The computer prints exactly what is inside the quotes.</p>
  <ul>
    <li>Quotes can be single (<code>'...'</code>) or double (<code>"..."</code>).</li>
    <li>Call <code>console.log</code> again to print another line.</li>
    <li>Emojis, punctuation, and spaces all appear exactly as written.</li>
  </ul>

  <div id="spell"></div>
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
          trivia: [
            '“Log” means “write it down”; the console is your magic notebook.',
            'You can print many lines by calling console.log multiple times.',
            'If nothing appears, check your quotes and parentheses.',
          ],
          additionalResources: [
            {
              title: 'MDN — console.log()',
              url: 'https://developer.mozilla.org/en-US/docs/Web/API/console/log',
            },
            {
              title: 'MDN — Expressions and operators (intro)',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Expressions_and_Operators',
            },
          ],
          rewardPoints: 60,
          creditPoints: 16,
          challenges: [
            {
              title: 'S1.1 Easy — Say Hello',
              description: `
<p><strong>Task:</strong> Show this message exactly: <code>Hello, Codeville!</code></p>
<ol>
  <li>Type one line using <code>console.log</code>.</li>
  <li>Put the words inside quotes.</li>
  <li>Copy the message exactly (same letters and marks).</li>
</ol>`.trim(),
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.easy,
              creditPoints: CREDIT_POINTS.easy,
              tests: [
                { input: '', expect_print: 'Hello, Codeville!' },
                { input: null, expect_print: 'Hello, Codeville!' },
                { input: 123, expect_print: 'Hello, Codeville!' },
                { input: 'anything', expect_print: 'Hello, Codeville!' },
                { input: {}, expect_print: 'Hello, Codeville!' },
              ],
              hints: [
                'Use: console.log("Hello, Codeville!");',
                'The message must match exactly. Check the comma and the exclamation mark.',
                '✅ Solution: <code>console.log("Hello, Codeville!");</code>',
              ],
            },
            {
              title: 'S1.1 Medium — Hello, Name!',
              description: `
<p><strong>Task:</strong> The system gives you a name in <code>input</code>. Show: <code>Hello, &lt;name&gt;!</code></p>
<ol>
  <li>Use <code>console.log</code> to print <code>Hello, &lt;name&gt;!</code>.</li>
  <li>Keep the comma and the exclamation mark.</li>
</ol>`.trim(),
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.medium,
              creditPoints: CREDIT_POINTS.medium,
              tests: [
                { input: 'Zia', expect_print: 'Hello, Zia!' },
                { input: 'Pax', expect_print: 'Hello, Pax!' },
                { input: 'Buddy', expect_print: 'Hello, Buddy!' },
                { input: 'A', expect_print: 'Hello, A!' },
                { input: '', expect_print: 'Hello, !' },
              ],
              hints: [
                'Build the sentence: "Hello, " + input + "!"',
                'Check punctuation carefully.',
                '✅ Solution: <code>console.log("Hello, " + input + "!");</code>',
              ],
            },
            {
              title: 'S1.1 Hard — Happy Birthday!',
              description: `
<p><strong>Task:</strong> The system gives you a name in <code>input</code>. Show: <code>Happy Birthday, &lt;name&gt;!</code></p>
<ol>
  <li>Print exactly with spaces, comma, and exclamation.</li>
</ol>`.trim(),
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.hard,
              creditPoints: CREDIT_POINTS.hard,
              tests: [
                { input: 'Zia', expect_print: 'Happy Birthday, Zia!' },
                { input: 'Pax', expect_print: 'Happy Birthday, Pax!' },
                { input: 'Mimi', expect_print: 'Happy Birthday, Mimi!' },
                { input: '', expect_print: 'Happy Birthday, !' },
                { input: 'A', expect_print: 'Happy Birthday, A!' },
              ],
              hints: [
                'Try: "Happy Birthday, " + input + "!"',
                'Look closely at spaces and punctuation.',
                '✅ Solution: <code>console.log("Happy Birthday, " + input + "!");</code>',
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
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>The Keeper smiles: “Clean code is kind code.” Zia writes notes in code so future Zia understands. Pax leaves short labels that tell the story of each line.</p>

  <h4>✨ The Secret Spell</h4>
  <p>Start a note with <code>//</code>. The computer ignores everything after <code>//</code> on that line.</p>
  <ul>
    <li>Use comments to label steps, explain decisions, or mark TODOs.</li>
    <li>Short and clear notes help you and your teammates later.</li>
  </ul>

  <div id="spell"></div>
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
          trivia: [
            'Comments are for humans—computers ignore them.',
            'A short comment is often better than a long one.',
            'You can put a comment after code on the same line.',
          ],
          additionalResources: [
            {
              title: 'MDN — Comments',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#comments',
            },
            {
              title: 'MDN — Code readability',
              url: 'https://developer.mozilla.org/en-US/docs/MDN/Guidelines/Writing_style_guide',
            },
          ],
          rewardPoints: 60,
          creditPoints: 16,
          challenges: [
            {
              title: 'S1.2 Easy — One Note, One Hello',
              description: `
<p><strong>Task:</strong> Print <code>Hello!</code></p>
<ol>
  <li>Write one comment line above your code (start with <code>//</code>).</li>
  <li>Then print <code>Hello!</code> using <code>console.log</code>.</li>
  <li>Only <code>Hello!</code> should appear on screen (notes do not print).</li>
</ol>`.trim(),
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.easy,
              creditPoints: CREDIT_POINTS.easy,
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
                '✅ Solution:<br><code>// note<br>console.log("Hello!");</code>',
              ],
            },
            {
              title: 'S1.2 Medium — Keep It Secret',
              description: `
<p><strong>Task:</strong> Print <code>I like code</code></p>
<ol>
  <li>Write a short comment line with <code>//</code>.</li>
  <li>On the next line, print <code>I like code</code>.</li>
  <li>Screen should show only <code>I like code</code>.</li>
</ol>`.trim(),
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.medium,
              creditPoints: CREDIT_POINTS.medium,
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
                '✅ Solution:<br><code>// secret<br>console.log("I like code");</code>',
              ],
            },
            {
              title: 'S1.2 Hard — Two Notes, One Line',
              description: `
<p><strong>Task:</strong> Print <code>Ready</code></p>
<ol>
  <li>Write two comment lines at the top.</li>
  <li>On the third line, print <code>Ready</code>.</li>
  <li>Only <code>Ready</code> should appear on the screen.</li>
</ol>`.trim(),
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.hard,
              creditPoints: CREDIT_POINTS.hard,
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
                '✅ Solution:<br><code>// one<br>// two<br>console.log("Ready");</code>',
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
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>In Coin Corner, gnomes stack shiny coins. Zia learns that numbers can be added together to make bigger piles. Pax tries tiny sums, then huge treasure stacks.</p>

  <h4>✨ The Secret Spell</h4>
  <p>Use <code>+</code> to add. Numbers do <em>not</em> need quotes.</p>
  <ul>
    <li><code>2 + 3</code> is <strong>5</strong>.</li>
    <li>Zero doesn’t change a number: <code>n + 0</code> is <code>n</code>.</li>
    <li>Negatives work too: <code>-1 + 4</code> is <strong>3</strong>.</li>
  </ul>

  <div id="spell"></div>
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
          trivia: [
            'Addition is commutative: a + b is the same as b + a.',
            'Any number plus zero stays the same—zero is a quiet friend.',
            'Negative numbers move you left on the number line.',
          ],
          additionalResources: [
            {
              title: 'MDN — Arithmetic operators',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Arithmetic_Operators',
            },
            {
              title: 'Khan Academy — Addition and subtraction intro',
              url: 'https://www.khanacademy.org/math/arithmetic/arith-review-add-subtract',
            },
          ],
          rewardPoints: 60,
          creditPoints: 16,
          challenges: [
            {
              title: 'S1.3 Easy — Add 2 and 3',
              description: `
<p><strong>Task:</strong> Show the answer to <code>2 + 3</code>.</p>
<ol>
  <li>Type one line.</li>
  <li>Use numbers and <code>+</code>.</li>
  <li>Print the result.</li>
</ol>`.trim(),
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.easy,
              creditPoints: CREDIT_POINTS.easy,
              tests: [
                { input: '', expect_print: 5 },
                { input: null, expect_print: 5 },
                { input: 'x', expect_print: 5 },
                { input: 0, expect_print: 5 },
                { input: {}, expect_print: 5 },
              ],
              hints: [
                'Use: console.log(2 + 3);',
                'No quotes for numbers.',
                '✅ Solution: <code>console.log(2 + 3);</code>',
              ],
            },
            {
              title: 'S1.3 Medium — Add the Given Numbers',
              description: `
<p><strong>Task:</strong> The system gives you two numbers in <code>input</code> as <code>[a, b]</code>. Show <code>a + b</code>.</p>
<ol>
  <li>Use <code>input[0] + input[1]</code>.</li>
  <li>Print the sum.</li>
</ol>`.trim(),
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.medium,
              creditPoints: CREDIT_POINTS.medium,
              tests: [
                { input: [2, 3], expect_print: 5 },
                { input: [10, 5], expect_print: 15 },
                { input: [0, 7], expect_print: 7 },
                { input: [-1, 4], expect_print: 3 },
                { input: [1000, 2000], expect_print: 3000 },
              ],
              hints: [
                'Assume input = [a, b].',
                'Do: console.log(input[0] + input[1]);',
                '✅ Solution: <code>console.log(input[0] + input[1]);</code>',
              ],
            },
            {
              title: 'S1.3 Hard — Add a Number and Itself',
              description: `
<p><strong>Task:</strong> The system gives you one number in <code>input</code>. Show <code>input + input</code>.</p>
<ol>
  <li>Use <code>input + input</code> to double.</li>
  <li>Print the result.</li>
</ol>`.trim(),
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.hard,
              creditPoints: CREDIT_POINTS.hard,
              tests: [
                { input: 1, expect_print: 2 },
                { input: 5, expect_print: 10 },
                { input: 0, expect_print: 0 },
                { input: -3, expect_print: -6 },
                { input: 10000, expect_print: 20000 },
              ],
              hints: [
                'Double the number: input + input.',
                'Print only the number.',
                '✅ Solution: <code>console.log(input + input);</code>',
              ],
            },
          ],
        },

        // S1.4 SUBTRACT / MULTIPLY / DIVIDE
        {
          title: 'S1.4 — Numbers: Subtract, Multiply, Divide',
          description:
            'Now you’ll learn three more number spells: take away (subtract), make groups (multiply), and share equally (divide). You’ll see how each changes numbers in a different way and how to read results clearly. We will also talk about dividing by zero and why we print "undefined" to stay safe. Practice each spell so your math gears turn smoothly.',
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>Gears of the Rainbow Bridge spin using math. Zia learns three more spells and watches the bridge light up when answers are correct. Pax experiments with many pairs of numbers to see the patterns.</p>

  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Subtract: <code>a - b</code></li>
    <li>Multiply: <code>a * b</code></li>
    <li>Divide: <code>a / b</code> (if <code>b === 0</code>, print <code>"undefined"</code>)</li>
  </ul>

  <div id="spell"></div>
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
          trivia: [
            'Multiplication is repeated addition.',
            'Division shares a number into equal groups.',
            'Subtracting can make numbers smaller or even negative.',
          ],
          additionalResources: [
            {
              title: 'MDN — Arithmetic operators',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Arithmetic_Operators',
            },
            {
              title: 'Khan Academy — Multiply & divide',
              url: 'https://www.khanacademy.org/math/arithmetic',
            },
          ],
          rewardPoints: 60,
          creditPoints: 16,
          challenges: [
            {
              title: 'S1.4 Easy — Times Table: 3 × 4',
              description: `
<p><strong>Task:</strong> Show the answer to <code>3 * 4</code>.</p>
<ol>
  <li>Use numbers and <code>*</code>.</li>
  <li>Print the result.</li>
</ol>`.trim(),
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.easy,
              creditPoints: CREDIT_POINTS.easy,
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
                '✅ Solution: <code>console.log(3 * 4);</code>',
              ],
            },
            {
              title: 'S1.4 Medium — Safe Divide',
              description: `
<p><strong>Task:</strong> The system gives you two numbers in <code>input</code> as <code>[a, b]</code>. Show <code>a / b</code>. If <code>b</code> is <code>0</code>, print <code>"undefined"</code>.</p>
<ol>
  <li>If <code>input[1] === 0</code> → print <code>"undefined"</code>.</li>
  <li>Else print <code>input[0] / input[1]</code>.</li>
</ol>`.trim(),
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.medium,
              creditPoints: CREDIT_POINTS.medium,
              tests: [
                { input: [8, 2], expect_print: 4 },
                { input: [7, 2], expect_print: 3.5 },
                { input: [5, 0], expect_print: 'undefined' },
                { input: [0, 3], expect_print: 0 },
                { input: [-10, 2], expect_print: -5 },
              ],
              hints: [
                'Check input[1] first.',
                'If it is 0 → print "undefined".',
                '✅ Solution:<br><code>if (input[1] === 0) { console.log("undefined"); } else { console.log(input[0] / input[1]); }</code>',
              ],
            },
            {
              title: 'S1.4 Hard — Mix: Add Then Multiply',
              description: `
<p><strong>Task:</strong> The system gives you numbers in <code>input</code> as <code>[a, b]</code>. Show <code>(a + b) * 2</code>.</p>
<ol>
  <li>Add <code>input[0] + input[1]</code>.</li>
  <li>Multiply the answer by <code>2</code>.</li>
  <li>Print the final number.</li>
</ol>`.trim(),
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.hard,
              creditPoints: CREDIT_POINTS.hard,
              tests: [
                { input: [2, 3], expect_print: 10 },
                { input: [0, 0], expect_print: 0 },
                { input: [-1, 4], expect_print: 6 },
                { input: [10, -5], expect_print: 10 },
                { input: [100, 1], expect_print: 202 },
              ],
              hints: [
                'Use parentheses: (input[0] + input[1]) * 2',
                'Add first, then multiply.',
                '✅ Solution: <code>console.log((input[0] + input[1]) * 2);</code>',
              ],
            },
          ],
        },

        // S1.5 ORDER OF OPERATIONS
        {
          title: 'S1.5 — Do First Things First (Parentheses)',
          description:
            'Sometimes math wants to do many things at once. This lesson shows how parentheses tell math what to do first. You will try expressions with and without parentheses to see the order clearly. Moving the brackets changes the result, which feels like steering a puzzle. Practice slowly and read your results out loud.',
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>At Puzzle Plaza, signs show numbers and brackets. Zia learns that brackets choose what happens first. Pax moves them around and giggles when the answers change.</p>

  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Without parentheses, multiply/divide happen before add/subtract.</li>
    <li>With parentheses <code>()</code>, you choose what happens first.</li>
  </ul>

  <div id="spell"></div>
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
          trivia: [
            'The conventional order is often remembered as PEMDAS.',
            'Parentheses group steps like mini-puzzles.',
            'You can nest parentheses to control complex expressions.',
          ],
          additionalResources: [
            {
              title: 'MDN — Operator precedence',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence',
            },
            {
              title: 'Khan Academy — Order of operations',
              url: 'https://www.khanacademy.org/math/arithmetic/arith-review-order-of-operations',
            },
          ],
          rewardPoints: 60,
          creditPoints: 16,
          challenges: [
            {
              title: 'S1.5 Easy — No Brackets',
              description: `
<p><strong>Task:</strong> The system gives you <code>input = [a, b, c]</code>. Show <code>a + b * c</code>.</p>
<ol>
  <li>Do <code>b * c</code> first.</li>
  <li>Then add <code>a</code>.</li>
</ol>`.trim(),
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.easy,
              creditPoints: CREDIT_POINTS.easy,
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
                '✅ Solution: <code>console.log(input[0] + input[1] * input[2]);</code>',
              ],
            },
            {
              title: 'S1.5 Medium — Use Brackets',
              description: `
<p><strong>Task:</strong> The system gives you <code>input = [a, b, c]</code>. Show <code>(a + b) * c</code>.</p>
<ol>
  <li>Add <code>a + b</code> inside parentheses.</li>
  <li>Multiply the result by <code>c</code>.</li>
</ol>`.trim(),
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.medium,
              creditPoints: CREDIT_POINTS.medium,
              tests: [
                { input: [2, 3, 4], expect_print: 20 },
                { input: [2, 0, 10], expect_print: 20 },
                { input: [10, 2, 3], expect_print: 36 },
                { input: [-1, 5, 2], expect_print: 8 },
                { input: [100, 1, 1], expect_print: 101 },
              ],
              hints: [
                'Do (input[0] + input[1]) first.',
                'Then multiply by input[2].',
                '✅ Solution: <code>console.log((input[0] + input[1]) * input[2]);</code>',
              ],
            },
            {
              title: 'S1.5 Hard — Small Puzzle',
              description: `
<p><strong>Task:</strong> The system gives you <code>input = [a, b, c]</code>. Show <code>a * (b + c) - a</code>.</p>
<ol>
  <li>Add <code>b + c</code> inside <code>()</code>.</li>
  <li>Multiply by <code>a</code>.</li>
  <li>Subtract <code>a</code>.</li>
</ol>`.trim(),
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.hard,
              creditPoints: CREDIT_POINTS.hard,
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
                '✅ Solution: <code>console.log(input[0] * (input[1] + input[2]) - input[0]);</code>',
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
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>At Quote Quay, signs have talking marks. Zia practices printing speech and contractions. Pax experiments until punctuation looks just right.</p>

  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Use double quotes outside: <code>"It's sunny"</code></li>
    <li>Or escape inside: <code>'It\\'s sunny'</code></li>
  </ul>

  <div id="spell"></div>
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
          trivia: [
            'Inside/outside quotes are like nesting boxes—pick which one goes where.',
            'A backslash (\\) is an escape hatch that lets a quote appear safely.',
            'Both styles are common—choose the one that’s easiest to read.',
          ],
          additionalResources: [
            {
              title: 'MDN — String literals',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String#string_literals',
            },
            {
              title: 'MDN — Escape sequences',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Character_escape',
            },
          ],
          rewardPoints: 60,
          creditPoints: 16,
          challenges: [
            {
              title: 'S1.6 Easy — It’s Sunny',
              description: `
<p><strong>Task:</strong> Show <code>It's sunny</code>.</p>
<ol>
  <li>Use quotes correctly so the text is exact.</li>
  <li>Print the sentence.</li>
</ol>`.trim(),
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.easy,
              creditPoints: CREDIT_POINTS.easy,
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
                '✅ Solution: <code>console.log("It\'s sunny");</code>',
              ],
            },
            {
              title: 'S1.6 Medium — He Said, "Hello".',
              description: `
<p><strong>Task:</strong> Show <code>He said, "Hello".</code> (include the double quotes).</p>
<ol>
  <li>Choose quotes so it prints correctly.</li>
  <li>Print the sentence exactly (comma, quotes, period).</li>
</ol>`.trim(),
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.medium,
              creditPoints: CREDIT_POINTS.medium,
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
                '✅ Solution: <code>console.log(\'He said, "Hello".\');</code>',
              ],
            },
            {
              title: 'S1.6 Hard — Name Says a Word',
              description: `
<p><strong>Task:</strong> The system gives you <code>input = [name, word]</code>. Show: <code>name says "word"!</code></p>
<ol>
  <li>Use the two given values.</li>
  <li>Put the word inside double quotes in the output.</li>
</ol>`.trim(),
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.hard,
              creditPoints: CREDIT_POINTS.hard,
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
                "✅ Solution: <code>console.log(input[0] + ' says \"' + input[1] + '\"!');</code>",
              ],
            },
          ],
        },

        // S1.7 STRINGS: JOIN
        {
          title: 'S1.7 — Joining Words',
          description:
            'When words need to stand together, we join them with a space. This lesson shows how to glue pieces of text into a single line using the + sign. You’ll see how empty pieces behave while the space stays in the middle. Practice with two and three-word lines to build little sentences. Clear spacing makes signs easy to read.',
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>At Sign Street, letters hold hands. Zia learns to join words so names and messages look neat. Pax tests different pieces and watches the spaces line up perfectly.</p>

  <h4>✨ The Secret Spell</h4>
  <p>Join with a space: <code>'Hello' + ' ' + 'World'</code></p>

  <div id="spell"></div>
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
          trivia: [
            'Text is called a string because letters are “strung” together.',
            'A space is also a character—treat it carefully.',
            'Joining pieces builds names, labels, and whole sentences.',
          ],
          additionalResources: [
            {
              title: 'MDN — String',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String',
            },
            {
              title: 'MDN — Operators ( + for string concatenation )',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Addition',
            },
          ],
          rewardPoints: 60,
          creditPoints: 16,
          challenges: [
            {
              title: 'S1.7 Easy — Join Two Words',
              description: `
<p><strong>Task:</strong> The system gives you two words in <code>input = [a, b]</code>. Show them with one space between.</p>
<ol>
  <li>Join <code>input[0] + " " + input[1]</code>.</li>
  <li>Print the result.</li>
  <li>Do not remove empty words; still keep the one space in the middle.</li>
</ol>`.trim(),
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.easy,
              creditPoints: CREDIT_POINTS.easy,
              tests: [
                { input: ['Hello', 'world'], expect_print: 'Hello world' },
                { input: ['Red', 'Balloon'], expect_print: 'Red Balloon' },
                { input: ['A', ''], expect_print: 'A ' },
                { input: ['', 'B'], expect_print: ' B' },
                { input: ['', ''], expect_print: ' ' },
              ],
              hints: [
                'Use: input[0] + " " + input[1]',
                'Print exactly one space in the middle.',
                '✅ Solution: <code>console.log(input[0] + " " + input[1]);</code>',
              ],
            },
            {
              title: 'S1.7 Medium — Hello, Name.',
              description: `
<p><strong>Task:</strong> The system gives you a name in <code>input</code>. Show: <code>Hello, &lt;name&gt;.</code></p>
<ol>
  <li>Join strings with <code>+</code>.</li>
  <li>Keep the comma after <code>Hello,</code> and add a period at the end.</li>
</ol>`.trim(),
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.medium,
              creditPoints: CREDIT_POINTS.medium,
              tests: [
                { input: 'Zia', expect_print: 'Hello, Zia.' },
                { input: 'Pax', expect_print: 'Hello, Pax.' },
                { input: 'A', expect_print: 'Hello, A.' },
                { input: '', expect_print: 'Hello, .' },
                { input: 'World', expect_print: 'Hello, World.' },
              ],
              hints: [
                '"Hello, " + input + "."',
                'Keep punctuation.',
                '✅ Solution: <code>console.log("Hello, " + input + ".");</code>',
              ],
            },
            {
              title: 'S1.7 Hard — Three Words Line',
              description: `
<p><strong>Task:</strong> The system gives you three words in <code>input = [a, b, c]</code>. Show: <code>a b c</code> (one space between each).</p>
<ol>
  <li>Join them with spaces.</li>
  <li>If any are empty, still keep spaces in those places.</li>
</ol>`.trim(),
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.hard,
              creditPoints: CREDIT_POINTS.hard,
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
              hints: [
                'input[0] + " " + input[1] + " " + input[2]',
                'Do not trim.',
                '✅ Solution: <code>console.log(input[0] + " " + input[1] + " " + input[2]);</code>',
              ],
            },
          ],
        },

        // S1.8 STRINGS: LENGTH & FIRST/LAST
        {
          title: 'S1.8 — How Long? First and Last',
          description:
            'Now we measure words! This lesson shows how to count characters, find the first letter, and find the last letter. You’ll see that spaces also count, and empty strings have a length of zero. These tiny tools help with name tags and labels later. Try them slowly—one peek at a time.',
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>Letter Counters measure words like rulers. Zia counts names and Pax checks the first and last letters to decorate badges.</p>

  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Length: <code>word.length</code></li>
    <li>First letter: <code>word[0]</code></li>
    <li>Last letter: <code>word[word.length - 1]</code></li>
  </ul>
  <p><em>Tip:</em> Spaces count as characters. Empty strings have length 0.</p>

  <div id="spell"></div>
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
          trivia: [
            'Spaces, punctuation, and emojis all count toward length.',
            'Indexing starts at 0, so the first letter is [0].',
            'To get the last letter, use length - 1.',
          ],
          additionalResources: [
            {
              title: 'MDN — String.length',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length',
            },
            {
              title: 'MDN — Property accessors (bracket notation)',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Property_Accessors',
            },
          ],
          rewardPoints: 60,
          creditPoints: 16,
          challenges: [
            {
              title: 'S1.8 Easy — Count Letters',
              description: `
<p><strong>Task:</strong> The system gives you a word in <code>input</code>. Show how many characters it has.</p>
<ol>
  <li>Use <code>input.length</code>.</li>
  <li>Print the number.</li>
</ol>`.trim(),
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.easy,
              creditPoints: CREDIT_POINTS.easy,
              tests: [
                { input: 'cat', expect_print: 3 },
                { input: 'robot', expect_print: 5 },
                { input: 'A', expect_print: 1 },
                { input: '', expect_print: 0 },
                { input: 'hi there', expect_print: 8 },
              ],
              hints: [
                'Use input.length.',
                'Empty string has length 0.',
                '✅ Solution: <code>console.log(input.length);</code>',
              ],
            },
            {
              title: 'S1.8 Medium — First-Last Format',
              description: `
<p><strong>Task:</strong> The system gives you a word in <code>input</code>. Show <code>first-last</code>. If the word is empty, show just <code>-</code>.</p>
<ol>
  <li>If <code>input.length === 0</code> → print <code>"-"</code>.</li>
  <li>Else print <code>input[0]</code>, then <code>"-"</code>, then <code>input[input.length - 1]</code>.</li>
</ol>`.trim(),
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.medium,
              creditPoints: CREDIT_POINTS.medium,
              tests: [
                { input: 'hello', expect_print: 'h-o' },
                { input: 'Pax', expect_print: 'P-x' },
                { input: 'Z', expect_print: 'Z-Z' },
                { input: '', expect_print: '-' },
                { input: 'ab', expect_print: 'a-b' },
              ],
              hints: [
                'Check empty first.',
                'First is input[0]. Last is input[input.length - 1].',
                '✅ Solution:<br><code>if (input.length===0) { console.log("-"); } else { console.log(input[0] + "-" + input[input.length-1]); }</code>',
              ],
            },
            {
              title: 'S1.8 Hard — Middle Peek',
              description: `
<p><strong>Task:</strong> The system gives you a word in <code>input</code>.
If it has odd length, show the middle 1 letter.
If it has even length, show the middle 2 letters.
If it is empty, show nothing (empty line).</p>`.trim(),
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.hard,
              creditPoints: CREDIT_POINTS.hard,
              tests: [
                { input: 'cat', expect_print: 'a' },
                { input: 'code', expect_print: 'od' },
                { input: 'A', expect_print: 'A' },
                { input: '', expect_print: '' },
                { input: 'robot', expect_print: 'b' },
              ],
              hints: [
                'Odd middle index: Math.floor(input.length / 2).',
                'Even: take input.length/2 - 1 and input.length/2.',
                '✅ Solution:<br><code>const n = input.length;<br>if (n===0) { console.log(""); }<br>else if (n%2===1) { console.log(input[Math.floor(n/2)]); }<br>else { console.log(input[n/2-1] + input[n/2]); }</code>',
              ],
            },
          ],
        },
      ],
      rewardPoints: 30,
      creditPoints: 20,
    };

    /* ----------------- Chapter 2 ----------------- */
    const chapter2: Chapter = {
      rewardPoints: 60,
      creditPoints: 16,
      title: 'Chapter 2 — Pockets, Paths, and Choices',
      description:
        'Zia and Pax discover satchels where numbers and words can be stored—variables! They learn comparisons and booleans, then use if-statements to make choices. Everything is paced for beginners.',
      sections: [
        // S2.1 VARIABLES
        {
          title: 'S2.1 — Little Pockets (Variables)',
          description:
            'Variables are pockets for values. Use let for changeable values and const for steady ones. Names should be short and clear. Print what’s inside to see the value.',
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>In the Pack Square, the Pouch Maker hands Zia tiny pockets labeled with names. Pax practices placing numbers and words into pockets and showing them on the screen.</p>


  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Create a changeable pocket: <code>let name = 'Zia';</code></li>
    <li>Create a steady pocket: <code>const city = 'Codeville';</code></li>
    <li>Print what’s inside: <code>console.log(name);</code></li>
  </ul>


  <div id="spell"></div>
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
          trivia: [
            'Use let when a value will change; use const when it should not.',
            'camelCase names (e.g., favoriteColor) are common in JS.',
            'Variables save you from retyping values.',
          ],
          additionalResources: [
            {
              title: 'MDN — let',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let',
            },
            {
              title: 'MDN — const',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const',
            },
            {
              title: 'MDN — Variables',
              url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps/Variables',
            },
          ],
          rewardPoints: 60,
          creditPoints: 16,
          challenges: [
            {
              title: 'S2.1 Easy — Store and Show',
              description: `
<p><strong>Task:</strong> Make a variable called <code>pet</code> with value <code>"cat"</code>. Print it.</p>`.trim(),
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.easy,
              creditPoints: CREDIT_POINTS.easy,
              tests: [
                { input: '', expect_print: 'cat' },
                { input: null, expect_print: 'cat' },
                { input: 0, expect_print: 'cat' },
                { input: 'ignored', expect_print: 'cat' },
                { input: {}, expect_print: 'cat' },
              ],
              hints: [
                'Declare with let.',
                'Print the variable (not the string literal again).',
                '✅ Solution: <code>let pet = "cat"; console.log(pet);</code>',
              ],
            },
            {
              title: 'S2.1 Medium — Update a Pocket',
              description: `
<p><strong>Task:</strong> Create <code>count</code> with value <code>1</code>, change it to <code>2</code>, then print the new value only.</p>`.trim(),
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.medium,
              creditPoints: CREDIT_POINTS.medium,
              tests: [
                { input: '', expect_print: 2 },
                { input: null, expect_print: 2 },
                { input: 'x', expect_print: 2 },
                { input: 999, expect_print: 2 },
              ],
              hints: [
                'Use let so the value can change.',
                'Print once, after updating.',
                '✅ Solution: <code>let count = 1; count = 2; console.log(count);</code>',
              ],
            },
            {
              title: 'S2.1 Hard — Two Pockets, One Sum',
              description: `
<p><strong>Task:</strong> Make <code>a = 4</code> and <code>b = 6</code>. Print their sum.</p>`.trim(),
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.hard,
              creditPoints: CREDIT_POINTS.hard,
              tests: [
                { input: '', expect_print: 10 },
                { input: null, expect_print: 10 },
                { input: 'n/a', expect_print: 10 },
                { input: 0, expect_print: 10 },
              ],
              hints: [
                'Numbers don’t use quotes.',
                'Add then print.',
                '✅ Solution: <code>let a = 4, b = 6; console.log(a + b);</code>',
              ],
            },
          ],
        },

        // S2.2 MODULO
        {
          title: 'S2.2 — Sharing Fairly (Remainder %)',
          description:
            'Modulo (%) gives the remainder after division. It helps with even/odd checks and repeating patterns.',
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>At Circle Court, coins are shared among sprites. The leftover pebble clinks into a bowl—that’s the remainder.</p>


  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Remainder: <code>a % b</code></li>
    <li>Even check: <code>n % 2 === 0</code></li>
  </ul>


  <div id="spell"></div>
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
          trivia: [
            '7 % 3 is 1 because 3+3=6 with 1 leftover.',
            'Modulo is perfect for even/odd.',
            'Great for cycles like weekdays or indices.',
          ],
          additionalResources: [
            {
              title: 'MDN — Arithmetic operators (%)',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder',
            },
            {
              title: 'Khan Academy — Remainders',
              url: 'https://www.khanacademy.org/math/arithmetic/arith-review-multiply-divide#arith-review-remainders',
            },
          ],
          rewardPoints: 60,
          creditPoints: 16,
          challenges: [
            {
              title: 'S2.2 Easy — 10 % 4',
              description:
                `<p><strong>Task:</strong> Print the remainder of <code>10 % 4</code>.</p>`.trim(),
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.easy,
              creditPoints: CREDIT_POINTS.easy,
              tests: [
                { input: '', expect_print: 2 },
                { input: null, expect_print: 2 },
                { input: 'x', expect_print: 2 },
                { input: 0, expect_print: 2 },
              ],
              hints: [
                'Compute directly.',
                'Print the number only.',
                '✅ Solution: <code>console.log(10 % 4);</code>',
              ],
            },
            {
              title: 'S2.2 Medium — Even or Odd',
              description: `
<p><strong>Task:</strong> Given a number in <code>input</code>, print <code>"even"</code> if it’s even, otherwise <code>"odd"</code>.</p>`.trim(),
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.medium,
              creditPoints: CREDIT_POINTS.medium,
              tests: [
                { input: 4, expect_print: 'even' },
                { input: 7, expect_print: 'odd' },
                { input: 0, expect_print: 'even' },
                { input: -2, expect_print: 'even' },
                { input: -3, expect_print: 'odd' },
              ],
              hints: [
                'Check input % 2.',
                'Zero counts as even.',
                '✅ Solution: <code>console.log(input % 2 === 0 ? "even" : "odd");</code>',
              ],
            },
            {
              title: 'S2.2 Hard — Remainder Label',
              description: `
<p><strong>Task:</strong> The system gives <code>input = [a, b]</code>. Print <code>a % b</code>. If <code>b === 0</code>, print <code>"undefined"</code>.</p>`.trim(),
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.hard,
              creditPoints: CREDIT_POINTS.hard,
              tests: [
                { input: [7, 3], expect_print: 1 },
                { input: [10, 5], expect_print: 0 },
                { input: [1, 0], expect_print: 'undefined' },
                { input: [-7, 3], expect_print: -1 },
                { input: [7, -3], expect_print: 1 },
              ],
              hints: [
                'Guard b === 0.',
                'Then compute the remainder.',
                '✅ Solution: <code>if (input[1] === 0) { console.log("undefined"); } else { console.log(input[0] % input[1]); }</code>',
              ],
            },
          ],
        },

        // S2.3 COMPARISONS
        {
          title: 'S2.3 — Comparing Things (===, >, <, ≥, ≤)',
          description:
            'Comparisons return true or false. We use strict equality (===) and the usual greater/less signs.',
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>At Balance Bridge, two plates hold values to compare. The pointer flips to “true” or “false”.</p>


  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Equal: <code>a === b</code></li>
    <li>Greater: <code>a > b</code>, Less: <code>a < b</code></li>
    <li>Greater or equal: <code>a >= b</code>, Less or equal: <code>a <= b</code></li>
  </ul>


  <div id="spell"></div>
</div>
      `.trim(),
          runnables: [
            { title: 'Spell 1 — equals', code: 'console.log(3 === 3);' },
            { title: 'Spell 2 — greater', code: 'console.log(5 > 2);' },
            { title: 'Spell 3 — less or equal', code: 'console.log(4 <= 4);' },
            {
              title: 'Spell 4 — string compare',
              code: "console.log('apple' < 'banana');",
            },
          ],
          trivia: [
            '=== checks value and type.',
            'Comparisons always yield true/false.',
            'Strings compare lexicographically by code points.',
          ],
          additionalResources: [
            {
              title: 'MDN — Comparison operators',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Comparison_Operators',
            },
            {
              title: 'MDN — Equality comparisons',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness',
            },
          ],
          rewardPoints: 60,
          creditPoints: 16,
          challenges: [
            {
              title: 'S2.3 Easy — True or False',
              description:
                `<p><strong>Task:</strong> Print the result of <code>7 > 5</code>.</p>`.trim(),
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.easy,
              creditPoints: CREDIT_POINTS.easy,
              tests: [
                { input: '', expect_print: true },
                { input: null, expect_print: true },
                { input: 0, expect_print: true },
                { input: 'ignored', expect_print: true },
              ],
              hints: [
                'Use > to compare.',
                'Print the boolean directly.',
                '✅ Solution: <code>console.log(7 > 5);</code>',
              ],
            },
            {
              title: 'S2.3 Medium — Check Match',
              description: `
<p><strong>Task:</strong> The system gives <code>input = [a, b]</code>. Print <code>true</code> if <code>a === b</code>, else <code>false</code>.</p>`.trim(),
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.medium,
              creditPoints: CREDIT_POINTS.medium,
              tests: [
                { input: [3, 3], expect_print: true },
                { input: [3, 4], expect_print: false },
                { input: ['5', 5], expect_print: false },
                { input: ['hi', 'hi'], expect_print: true },
                { input: ['a', 'b'], expect_print: false },
              ],
              hints: [
                'Use strict equality.',
                'Print the comparison directly.',
                '✅ Solution: <code>console.log(input[0] === input[1]);</code>',
              ],
            },
            {
              title: 'S2.3 Hard — Between Check',
              description: `
<p><strong>Task:</strong> The system gives <code>input = [n, low, high]</code>. Print <code>true</code> if <code>n</code> is between <code>low</code> and <code>high</code> (inclusive), else <code>false</code>.</p>`.trim(),
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.hard,
              creditPoints: CREDIT_POINTS.hard,
              tests: [
                { input: [5, 1, 5], expect_print: true },
                { input: [0, 1, 5], expect_print: false },
                { input: [3, 3, 7], expect_print: true },
                { input: [8, 3, 7], expect_print: false },
                { input: [7, 7, 7], expect_print: true },
              ],
              hints: [
                'Use >= and <= with &&.',
                'Ends are inclusive.',
                '✅ Solution: <code>console.log(input[0] >= input[1] && input[0] <= input[2]);</code>',
              ],
            },
          ],
        },

        // S2.4 LOGIC
        {
          title: 'S2.4 — Tiny Truths (Booleans & Logic)',
          description:
            'Glue booleans with AND (&&), OR (||), and flip them with NOT (!).',
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>In Lantern Lane, lights turn on if switches agree. AND needs both; OR needs at least one; NOT flips the result.</p>


  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>AND: <code>a && b</code></li>
    <li>OR: <code>a || b</code></li>
    <li>NOT: <code>!a</code></li>
  </ul>


  <div id="spell"></div>
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
          trivia: [
            'AND is like “both switches on”.',
            'OR is “at least one switch on”.',
            'NOT flips true ↔ false.',
          ],
          additionalResources: [
            {
              title: 'MDN — Logical operators',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_Operators',
            },
            {
              title: 'MDN — Expressions & operators',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Expressions_and_Operators',
            },
          ],
          rewardPoints: 60,
          creditPoints: 16,
          challenges: [
            {
              title: 'S2.4 Easy — At Least One',
              description:
                `<p><strong>Task:</strong> Print the result of <code>true || false</code>.</p>`.trim(),
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.easy,
              creditPoints: CREDIT_POINTS.easy,
              tests: [
                { input: '', expect_print: true },
                { input: null, expect_print: true },
                { input: 'x', expect_print: true },
                { input: 0, expect_print: true },
              ],
              hints: [
                'OR is true if any side is true.',
                'Print directly.',
                '✅ Solution: <code>console.log(true || false);</code>',
              ],
            },
            {
              title: 'S2.4 Medium — In Range AND',
              description: `
<p><strong>Task:</strong> Given <code>input</code>, print <code>true</code> if <code>1 &le; input &le; 10</code>, else <code>false</code>.</p>`.trim(),
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.medium,
              creditPoints: CREDIT_POINTS.medium,
              tests: [
                { input: 5, expect_print: true },
                { input: 1, expect_print: true },
                { input: 10, expect_print: true },
                { input: 0, expect_print: false },
                { input: 11, expect_print: false },
              ],
              hints: [
                'Use (input >= 1) && (input <= 10).',
                'Return the boolean directly.',
                '✅ Solution: <code>console.log(input >= 1 && input <= 10);</code>',
              ],
            },
            {
              title: 'S2.4 Hard — Not Empty',
              description: `
<p><strong>Task:</strong> Given a word in <code>input</code>, print <code>true</code> if it is not empty, else <code>false</code>.</p>`.trim(),
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.hard,
              creditPoints: CREDIT_POINTS.hard,
              tests: [
                { input: 'hi', expect_print: true },
                { input: '', expect_print: false },
                { input: 'a', expect_print: true },
                { input: ' ', expect_print: true },
                { input: 'robot', expect_print: true },
              ],
              hints: [
                'Use length.',
                'Flip with ! if needed.',
                '✅ Solution: <code>console.log(input.length !== 0);</code>',
              ],
            },
          ],
        },

        // S2.5 IF
        {
          title: 'S2.5 — If This, Then That',
          description:
            'A single if runs code when a condition is true; otherwise it does nothing.',
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>At Choice Corner, a door opens only if you say the secret number.</p>


  <h4>✨ The Secret Spell</h4>
  <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:8px;"><code>if (condition) {
  console.log('Yes!');
}</code></pre>


  <div id="spell"></div>
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
          trivia: [
            'If nothing prints, the condition was false.',
            'Conditions are booleans built from comparisons.',
            'Curly braces hold the code to run.',
          ],
          additionalResources: [
            {
              title: 'MDN — if...else',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/if...else',
            },
          ],
          rewardPoints: 60,
          creditPoints: 16,
          challenges: [
            {
              title: 'S2.5 Easy — If Nice',
              description: `
<p><strong>Task:</strong> If <code>input > 5</code>, print <code>"nice"</code>. Otherwise, print nothing.</p>`.trim(),
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.easy,
              creditPoints: CREDIT_POINTS.easy,
              tests: [
                { input: 6, expect_print: 'nice' },
                { input: 5, expect_print: '' },
                { input: 10, expect_print: 'nice' },
                { input: -1, expect_print: '' },
                { input: 0, expect_print: '' },
              ],
              hints: [
                'Use if (input > 5).',
                'Print only when true.',
                '✅ Solution: <code>if (input > 5) { console.log("nice"); }</code>',
              ],
            },
            {
              title: 'S2.5 Medium — If Even',
              description: `
<p><strong>Task:</strong> If <code>input</code> is even, print <code>"even"</code>. Else, print nothing.</p>`.trim(),
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.medium,
              creditPoints: CREDIT_POINTS.medium,
              tests: [
                { input: 8, expect_print: 'even' },
                { input: 3, expect_print: '' },
                { input: 0, expect_print: 'even' },
                { input: -2, expect_print: 'even' },
                { input: 11, expect_print: '' },
              ],
              hints: [
                'Use input % 2 === 0.',
                'Print only when true.',
                '✅ Solution: <code>if (input % 2 === 0) { console.log("even"); }</code>',
              ],
            },
            {
              title: 'S2.5 Hard — If In Range',
              description: `
<p><strong>Task:</strong> If <code>1 &le; input &le; 10</code>, print <code>"ok"</code>. Else, print nothing.</p>`.trim(),
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.hard,
              creditPoints: CREDIT_POINTS.hard,
              tests: [
                { input: 1, expect_print: 'ok' },
                { input: 10, expect_print: 'ok' },
                { input: 0, expect_print: '' },
                { input: 11, expect_print: '' },
                { input: -5, expect_print: '' },
              ],
              hints: [
                'Use input >= 1 && input <= 10.',
                'Print only when true.',
                '✅ Solution: <code>if (input >= 1 && input <= 10) { console.log("ok"); }</code>',
              ],
            },
          ],
        },

        // S2.6 IF/ELSE
        {
          title: 'S2.6 — Choose A or B (if/else)',
          description:
            'if/else chooses between two branches so your code always prints one message.',
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>At the Fork Gate, a sign points left or right. The program chooses a path.</p>


  <h4>✨ The Secret Spell</h4>
  <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:8px;"><code>if (condition) {
  console.log('A');
} else {
  console.log('B');
}</code></pre>


  <div id="spell"></div>
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
          trivia: [
            'Exactly one branch runs.',
            'Conditions can use comparisons and logic.',
            'Keep branch messages short and clear.',
          ],
          additionalResources: [
            {
              title: 'MDN — if...else',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/if...else',
            },
          ],
          rewardPoints: 60,
          creditPoints: 16,
          challenges: [
            {
              title: 'S2.6 Easy — Even/Odd',
              description:
                `<p><strong>Task:</strong> Given <code>input</code>, print <code>"even"</code> if even, otherwise <code>"odd"</code>.</p>`.trim(),
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.easy,
              creditPoints: CREDIT_POINTS.easy,
              tests: [
                { input: 4, expect_print: 'even' },
                { input: 9, expect_print: 'odd' },
                { input: 0, expect_print: 'even' },
                { input: -2, expect_print: 'even' },
                { input: -3, expect_print: 'odd' },
              ],
              hints: [
                'Use modulo 2 and if/else.',
                'Zero is even.',
                '✅ Solution: <code>if (input % 2 === 0) { console.log("even"); } else { console.log("odd"); }</code>',
              ],
            },
            {
              title: 'S2.6 Medium — Age Gate',
              description:
                `<p><strong>Task:</strong> Given <code>input</code> as an age, print <code>"allowed"</code> if <code>input &ge; 13</code>, else <code>"blocked"</code>.</p>`.trim(),
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.medium,
              creditPoints: CREDIT_POINTS.medium,
              tests: [
                { input: 13, expect_print: 'allowed' },
                { input: 12, expect_print: 'blocked' },
                { input: 18, expect_print: 'allowed' },
                { input: 0, expect_print: 'blocked' },
                { input: 100, expect_print: 'allowed' },
              ],
              hints: [
                'Use >= 13.',
                'Print exactly the words.',
                '✅ Solution: <code>if (input >= 13) { console.log("allowed"); } else { console.log("blocked"); }</code>',
              ],
            },
            {
              title: 'S2.6 Hard — Inside or Outside',
              description:
                `<p><strong>Task:</strong> Given <code>input</code>, print <code>"inside"</code> if <code>1 &le; input &le; 10</code>, else <code>"outside"</code>.</p>`.trim(),
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.hard,
              creditPoints: CREDIT_POINTS.hard,
              tests: [
                { input: 1, expect_print: 'inside' },
                { input: 10, expect_print: 'inside' },
                { input: 0, expect_print: 'outside' },
                { input: 11, expect_print: 'outside' },
                { input: -5, expect_print: 'outside' },
              ],
              hints: [
                'Combine two comparisons with &&.',
                'Exactly one word prints.',
                '✅ Solution: <code>if (input >= 1 && input <= 10) { console.log("inside"); } else { console.log("outside"); }</code>',
              ],
            },
          ],
        },
      ],
    };

    /* ----------------- Chapter 3 ----------------- */
    const chapter3: Chapter = {
      rewardPoints: 60,
      creditPoints: 16,
      title: 'Chapter 3 — Little Lists and Lineups (Arrays)',
      description:
        'Arrays store ordered lists of values. Create arrays, count items, pick by position, and add/remove items at the ends.',
      sections: [
        // S3.1 CREATE ARRAYS
        {
          title: 'S3.1 — Make a Line (Create Arrays)',
          description:
            'An array is a lineup of values inside square brackets. Items are separated by commas. You can mix numbers and strings.',
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>At Shelf Square, bottles line up in a neat row. Zia places labels in an array to keep them together.</p>


  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Create: <code>let colors = ['red', 'blue'];</code></li>
    <li>Print the whole array: <code>console.log(colors);</code></li>
  </ul>


  <div id="spell"></div>
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
          trivia: [
            'Arrays remember item order.',
            'You can store mixed types.',
            'Empty array [] has length 0.',
          ],
          additionalResources: [
            {
              title: 'MDN — Arrays',
              url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps/Arrays',
            },
            {
              title: 'MDN — Array (reference)',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array',
            },
          ],
          rewardPoints: 60,
          creditPoints: 16,
          challenges: [
            {
              title: 'S3.1 Easy — Two Pets',
              description:
                `<p><strong>Task:</strong> Create <code>["cat","dog"]</code> and print it.</p>`.trim(),
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.easy,
              creditPoints: CREDIT_POINTS.easy,
              tests: [
                { input: '', expect_print: '["cat","dog"]' },
                { input: null, expect_print: '["cat","dog"]' },
                { input: 'ignored', expect_print: '["cat","dog"]' },
                { input: 0, expect_print: '["cat","dog"]' },
              ],
              hints: [
                'Use [] and commas.',
                'Print the array variable.',
                '✅ Solution: <code>const pets = ["cat","dog"]; console.log(JSON.stringify(pets));</code>',
              ],
            },
            {
              title: 'S3.1 Medium — Three Numbers',
              description:
                `<p><strong>Task:</strong> Create <code>[1,2,3]</code> and print it.</p>`.trim(),
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.medium,
              creditPoints: CREDIT_POINTS.medium,
              tests: [
                { input: '', expect_print: '[1,2,3]' },
                { input: null, expect_print: '[1,2,3]' },
                { input: 'n/a', expect_print: '[1,2,3]' },
                { input: 42, expect_print: '[1,2,3]' },
              ],
              hints: [
                'No quotes for numbers.',
                'Separate with commas.',
                '✅ Solution: <code>const a=[1,2,3]; console.log(JSON.stringify(a));</code>',
              ],
            },
            {
              title: 'S3.1 Hard — Mixed Trio',
              description:
                `<p><strong>Task:</strong> Create <code>["sun",7,"moon"]</code> and print it.</p>`.trim(),
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.hard,
              creditPoints: CREDIT_POINTS.hard,
              tests: [
                { input: '', expect_print: '["sun",7,"moon"]' },
                { input: null, expect_print: '["sun",7,"moon"]' },
                { input: 0, expect_print: '["sun",7,"moon"]' },
                { input: 'x', expect_print: '["sun",7,"moon"]' },
              ],
              hints: [
                'Strings need quotes; numbers don’t.',
                'Keep order.',
                '✅ Solution: <code>const a=["sun",7,"moon"]; console.log(JSON.stringify(a));</code>',
              ],
            },
          ],
        },

        // S3.2 LENGTH
        {
          title: 'S3.2 — How Many? (.length)',
          description: 'Use the length property to count items in an array.',
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>The Counter Clock ticks each time an item joins the lineup.</p>


  <h4>✨ The Secret Spell</h4>
  <ul><li>Count: <code>array.length</code></li></ul>


  <div id="spell"></div>
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
          trivia: [
            'Empty array has length 0.',
            'Length grows and shrinks as items change.',
            'Strings also have .length.',
          ],
          additionalResources: [
            {
              title: 'MDN — Array.length',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/length',
            },
          ],
          rewardPoints: 60,
          creditPoints: 16,
          challenges: [
            {
              title: 'S3.2 Easy — Count 3',
              description:
                `<p><strong>Task:</strong> Print the length of <code>["a","b","c"]</code>.</p>`.trim(),
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.easy,
              creditPoints: CREDIT_POINTS.easy,
              tests: [
                { input: '', expect_print: 3 },
                { input: null, expect_print: 3 },
                { input: 'x', expect_print: 3 },
                { input: 0, expect_print: 3 },
              ],
              hints: [
                'Use .length.',
                'Print the number.',
                '✅ Solution: <code>console.log(["a","b","c"].length);</code>',
              ],
            },
            {
              title: 'S3.2 Medium — Length of Empty',
              description:
                `<p><strong>Task:</strong> Make an empty array and print its length.</p>`.trim(),
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.medium,
              creditPoints: CREDIT_POINTS.medium,
              tests: [
                { input: '', expect_print: 0 },
                { input: null, expect_print: 0 },
                { input: 'ignored', expect_print: 0 },
                { input: {}, expect_print: 0 },
              ],
              hints: [
                '[] makes an empty array.',
                'Length is 0.',
                '✅ Solution: <code>const a=[]; console.log(a.length);</code>',
              ],
            },
            {
              title: 'S3.2 Hard — Count Mixed',
              description:
                `<p><strong>Task:</strong> Create <code>["a",1,"b",2]</code>. Print its length.</p>`.trim(),
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.hard,
              creditPoints: CREDIT_POINTS.hard,
              tests: [
                { input: '', expect_print: 4 },
                { input: null, expect_print: 4 },
                { input: 'x', expect_print: 4 },
                { input: 0, expect_print: 4 },
              ],
              hints: [
                'Length counts all items, any type.',
                'Print once.',
                '✅ Solution: <code>const a=["a",1,"b",2]; console.log(a.length);</code>',
              ],
            },
          ],
        },

        // S3.3 INDEXING
        {
          title: 'S3.3 — First, Middle, Last (Indexing)',
          description:
            'Pick items by position using square brackets. First is index 0; last is length - 1.',
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>Index Isle has stepping stones numbered from 0.</p>


  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>First: <code>a[0]</code></li>
    <li>Last: <code>a[a.length - 1]</code></li>
  </ul>


  <div id="spell"></div>
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
          trivia: [
            'Indexing starts at 0.',
            'Last item is length - 1.',
            'Past-the-end gives undefined.',
          ],
          additionalResources: [
            {
              title: 'MDN — Property accessors',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Property_Accessors',
            },
          ],
          rewardPoints: 60,
          creditPoints: 16,
          challenges: [
            {
              title: 'S3.3 Easy — First Fruit',
              description:
                `<p><strong>Task:</strong> From <code>["apple","banana","pear"]</code>, print the first item.</p>`.trim(),
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.easy,
              creditPoints: CREDIT_POINTS.easy,
              tests: [
                { input: '', expect_print: 'apple' },
                { input: null, expect_print: 'apple' },
                { input: 'x', expect_print: 'apple' },
                { input: 0, expect_print: 'apple' },
              ],
              hints: [
                'Index 0 is first.',
                'Print that value.',
                '✅ Solution: <code>console.log(["apple","banana","pear"][0]);</code>',
              ],
            },
            {
              title: 'S3.3 Medium — Last Color',
              description:
                `<p><strong>Task:</strong> From <code>["red","green","blue"]</code>, print the last item.</p>`.trim(),
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.medium,
              creditPoints: CREDIT_POINTS.medium,
              tests: [
                { input: '', expect_print: 'blue' },
                { input: null, expect_print: 'blue' },
                { input: 'x', expect_print: 'blue' },
                { input: 0, expect_print: 'blue' },
              ],
              hints: [
                'Use length - 1.',
                'Then access that index.',
                '✅ Solution: <code>const a=["red","green","blue"]; console.log(a[a.length-1]);</code>',
              ],
            },
            {
              title: 'S3.3 Hard — Middle Animal',
              description:
                `<p><strong>Task:</strong> From <code>["ant","bear","cat","dog","eel"]</code>, print the middle (index 2).</p>`.trim(),
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.hard,
              creditPoints: CREDIT_POINTS.hard,
              tests: [
                { input: '', expect_print: 'cat' },
                { input: null, expect_print: 'cat' },
                { input: 'ignored', expect_print: 'cat' },
                { input: 0, expect_print: 'cat' },
              ],
              hints: [
                'Count from 0: 0,1,2,3,4.',
                'Pick index 2.',
                '✅ Solution: <code>console.log(["ant","bear","cat","dog","eel"][2]);</code>',
              ],
            },
          ],
        },

        // S3.4 PUSH / POP
        {
          title: 'S3.4 — Add & Remove (push, pop)',
          description:
            'Use push to add to the end of an array, and pop to remove the last item.',
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>At End Dock, a ferry brings new items and takes the last one away.</p>


  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Add to end: <code>a.push('new')</code></li>
    <li>Remove last: <code>a.pop()</code></li>
  </ul>


  <div id="spell"></div>
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
          trivia: [
            'push returns the new length.',
            'pop returns the removed item.',
            'Arrays are flexible shelves—easy to grow or shrink.',
          ],
          additionalResources: [
            {
              title: 'MDN — Array.prototype.push()',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push',
            },
            {
              title: 'MDN — Array.prototype.pop()',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/pop',
            },
          ],
          rewardPoints: 60,
          creditPoints: 16,
          challenges: [
            {
              title: 'S3.4 Easy — Add One',
              description:
                `<p><strong>Task:</strong> Start with <code>["a"]</code>. Add <code>"b"</code> to the end and print the result.</p>`.trim(),
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.easy,
              creditPoints: CREDIT_POINTS.easy,
              tests: [
                { input: '', expect_print: '["a","b"]' },
                { input: null, expect_print: '["a","b"]' },
                { input: 'x', expect_print: '["a","b"]' },
                { input: 0, expect_print: '["a","b"]' },
              ],
              hints: [
                'Create the array, then push.',
                'Print the whole array.',
                '✅ Solution: <code>const a=["a"]; a.push("b"); console.log(JSON.stringify(a));</code>',
              ],
            },
            {
              title: 'S3.4 Medium — Add Two',
              description:
                `<p><strong>Task:</strong> Start with <code>[]</code>. Add <code>"x"</code> then <code>"y"</code>, then print.</p>`.trim(),
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.medium,
              creditPoints: CREDIT_POINTS.medium,
              tests: [
                { input: '', expect_print: '["x","y"]' },
                { input: null, expect_print: '["x","y"]' },
                { input: 'n/a', expect_print: '["x","y"]' },
                { input: 42, expect_print: '["x","y"]' },
              ],
              hints: [
                'Call push twice in order.',
                'Print at the end.',
                '✅ Solution: <code>const a=[]; a.push("x"); a.push("y"); console.log(JSON.stringify(a));</code>',
              ],
            },
            {
              title: 'S3.4 Hard — Pop Result',
              description:
                `<p><strong>Task:</strong> Start with <code>["dog","cat","bird"]</code>. Remove the last item using <code>pop()</code>. Print the array that remains.</p>`.trim(),
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD_POINTS.hard,
              creditPoints: CREDIT_POINTS.hard,
              tests: [
                { input: '', expect_print: '["dog","cat"]' },
                { input: null, expect_print: '["dog","cat"]' },
                { input: 0, expect_print: '["dog","cat"]' },
                { input: 'ignored', expect_print: '["dog","cat"]' },
              ],
              hints: [
                'Create the start array.',
                'Call pop once.',
                '✅ Solution: <code>const a=["dog","cat","bird"]; a.pop(); console.log(JSON.stringify(a));</code>',
              ],
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
        rewardPoints: chapter.rewardPoints,
        creditPoints: chapter.creditPoints,
        order: order,
      });

      const createdChapter = await tx.query.chapters.findFirst({
        where: eq(schema.chapters.title, chapter.title),
      });

      let sectionOrder = 1;
      for (const sec of chapter.sections) {
        await tx.insert(schema.sections).values({
          title: sec.title,
          chapterId: Number(createdChapter?.id),
          description: sec.description,
          rewardPoints: sec.rewardPoints,
          creditPoints: sec.creditPoints,
          runnables: JSON.stringify(sec.runnables),
          trivias: JSON.stringify(sec.trivia),
          additionalResources: JSON.stringify(sec.additionalResources),
          content: sec.content,
          order: sectionOrder,
        });
        sectionOrder++;

        const createdSection = await tx.query.sections.findFirst({
          where: eq(schema.sections.title, sec.title),
        });

        let challengeOrder = 1;

        for (const ch of sec.challenges) {
          await tx.insert(schema.challenges).values({
            title: ch.title,
            sectionID: createdSection?.id,
            order: challengeOrder,
            description: ch.description,
            difficulty: ch.difficulty,
            expectedOutput: testsJson(ch.tests), // includes expect_print
            moduleType: ch.moduleType,
            rewardPoints: ch.rewardPoints,
            creditPoints: ch.creditPoints,
          });

          challengeOrder++;

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
