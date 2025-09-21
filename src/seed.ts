import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from './db';
import * as schema from './db/schema';
import * as bcrypt from 'bcryptjs';

async function main() {
  return db.transaction(async (tx) => {
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

    type LinkRef = { title: string; url: string };

    type Section = {
      title: string;
      description: string;
      content: string; // HTML (no Cast-a-Spell box, no Fun Facts)
      runnables: Runnable[];
      trivia: string[]; // << NEW
      additionalResources: LinkRef[]; // << NEW
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
            'Welcome to the console gate! In this lesson, you will learn to “speak” to the screen using console.log. We keep it simple: one command, one friendly message, and instant results.',
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p><strong>Zia</strong> and <strong>Pax</strong> meet the mysterious <em>Console Keeper</em>.
  The Keeper whispers: “If you can make the screen speak, the gate will open!”</p>

  <h4>✨ The Secret Spell</h4>
  <p>Use <code>console.log('text here')</code> to show words on the screen. The computer prints whatever is inside the quotes.</p>
  <ul>
    <li><strong>Quotes</strong> can be single (<code>'...'</code>) or double (<code>"..."</code>).</li>
    <li>Each call to <code>console.log</code> prints a new line.</li>
    <li>Emojis, punctuation, and spaces print exactly as written.</li>
  </ul>
</div>`.trim(),
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
            '“log” means “write it down.” The console is your magic notebook.',
            'Quotes are like a treasure box—whatever you put inside shows up exactly the same.',
            'You can print many lines by calling console.log many times.',
          ],
          additionalResources: [
            {
              title: 'MDN — Console API',
              url: 'https://developer.mozilla.org/en-US/docs/Web/API/Console',
            },
            {
              title: 'JavaScript.info — Debugging in the browser',
              url: 'https://javascript.info/debugging-chrome',
            },
          ],
          challenges: [
            {
              title: 'S1.1 Easy — Say Hello',
              description: `
<p><strong>Task:</strong> Show this message exactly: <code>Hello, Codeville!</code></p>
<ol>
  <li>Type one line.</li>
  <li>Use <code>console.log</code>.</li>
  <li>Put the words inside quotes.</li>
</ol>`.trim(),
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
                'The message must match exactly.',
              ],
            },
            {
              title: 'S1.1 Medium — Hello, Name!',
              description: `
<p><strong>Task:</strong> The system gives you a name (like Zia). Show: <code>Hello, Zia!</code></p>
<p><em>Example:</em> Input: <code>"Zia"</code> → Output: <code>Hello, Zia!</code></p>`.trim(),
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
              hints: ['Use "Hello, " + name + "!"', 'Keep the comma and the !'],
            },
            {
              title: 'S1.1 Hard — Happy Birthday!',
              description: `
<p><strong>Task:</strong> The system gives you a name. Show: <code>Happy Birthday, &lt;name&gt;!</code></p>
<p><em>Example:</em> Input: <code>"Mimi"</code> → Output: <code>Happy Birthday, Mimi!</code></p>`.trim(),
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
                'Mind spaces and punctuation.',
              ],
            },
          ],
        },

        // S1.2 COMMENTS ONLY
        {
          title: 'S1.2 — Comments & Neat Code',
          description:
            'Comments are tiny notes that help people understand code. In this lesson, you will write friendly hints for your future self using // at the start of a line.',
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>The Keeper smiles: “Clean code is kind code.” Zia writes <em>notes</em> so future Zia understands. Pax labels each step.</p>

  <h4>✨ The Secret Spell</h4>
  <p>Start a note with <code>//</code>. The computer ignores everything after <code>//</code> on that line.</p>
  <ul>
    <li>Use comments to label steps, explain decisions, or mark TODOs.</li>
    <li>Short and clear notes help teammates later.</li>
  </ul>
</div>`.trim(),
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
            'Comments are only for humans—computers pretend they aren’t there.',
            'Good comments are like signposts: short, clear, and helpful.',
            'You can put a comment after code on the same line.',
          ],
          additionalResources: [
            {
              title: 'MDN — Comments',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#comments',
            },
            {
              title: 'JavaScript.info — Code structure',
              url: 'https://javascript.info/structure',
            },
          ],
          challenges: [
            {
              title: 'S1.2 Easy — One Note, One Hello',
              description: `
<p><strong>Task:</strong> Print <code>Hello!</code> with one comment line above.</p>
<ol>
  <li>Write a comment starting with <code>//</code>.</li>
  <li>On the next line, print <code>Hello!</code>.</li>
  <li>Only <code>Hello!</code> appears on screen.</li>
</ol>`.trim(),
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
                'First line: // your note',
                'Second line: console.log("Hello!");',
              ],
            },
            {
              title: 'S1.2 Medium — Keep It Secret',
              description: `
<p><strong>Task:</strong> Print <code>I like code</code> with one comment line above.</p>`.trim(),
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
              hints: ['console.log("I like code");', 'No extra punctuation.'],
            },
            {
              title: 'S1.2 Hard — Two Notes, One Line',
              description: `
<p><strong>Task:</strong> Write two comment lines, then print <code>Ready</code> on the third line.</p>`.trim(),
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
              ],
            },
          ],
        },

        // S1.3 ADD
        {
          title: 'S1.3 — Numbers: Add',
          description:
            'Use the plus sign to add two numbers. See how zero changes nothing and negatives behave.',
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>In Coin Corner, gnomes stack shiny coins. Zia learns that numbers can be added to make bigger piles.</p>

  <h4>✨ The Secret Spell</h4>
  <p>Use <code>+</code> to add. Numbers do <em>not</em> need quotes.</p>
  <ul>
    <li><code>2 + 3</code> is <strong>5</strong>.</li>
    <li>Zero doesn’t change a number: <code>n + 0</code> is <code>n</code>.</li>
    <li>Negatives work too: <code>-1 + 4</code> is <strong>3</strong>.</li>
  </ul>
</div>`.trim(),
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
            'Adding is commutative: a + b is the same as b + a.',
            'Any number plus zero stays the same—zero is a quiet friend.',
            'You can add negative numbers to move left on the number line.',
          ],
          additionalResources: [
            {
              title: 'MDN — Operators',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Expressions_and_operators',
            },
            {
              title: 'JavaScript.info — Operators',
              url: 'https://javascript.info/operators',
            },
          ],
          challenges: [
            {
              title: 'S1.3 Easy — Add 2 and 3',
              description:
                `<p><strong>Task:</strong> Show the answer to <code>2 + 3</code>.</p>`.trim(),
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
              hints: ['console.log(2 + 3);', 'No quotes for numbers.'],
            },
            {
              title: 'S1.3 Medium — Add the Given Numbers',
              description:
                `<p><strong>Task:</strong> The system gives you two numbers (a, b). Show <code>a + b</code>.</p>`.trim(),
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
              hints: ['console.log(a + b);'],
            },
            {
              title: 'S1.3 Hard — Add a Number and Itself',
              description:
                `<p><strong>Task:</strong> The system gives you one number (n). Show <code>n + n</code>.</p>`.trim(),
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
              hints: ['Double the number with n + n.'],
            },
          ],
        },

        // S1.4 SUBTRACT/MULTIPLY/DIVIDE
        {
          title: 'S1.4 — Numbers: Subtract, Multiply, Divide',
          description:
            'Learn subtract (-), multiply (*), and divide (/). For our puzzles, dividing by zero should print the word "undefined".',
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>Gears of the Rainbow Bridge spin using math. Zia learns three more spells and watches the bridge light up when answers are correct.</p>

  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Subtract: <code>a - b</code></li>
    <li>Multiply: <code>a * b</code></li>
    <li>Divide: <code>a / b</code></li>
  </ul>
  <p><em>Note:</em> If <code>b</code> is <code>0</code> when dividing, print <code>"undefined"</code> for our puzzles.</p>
</div>`.trim(),
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
            'Subtracting can make numbers negative.',
          ],
          additionalResources: [
            {
              title: 'MDN — Arithmetic Operators',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Arithmetic_Operators',
            },
            {
              title: 'JavaScript.info — Numbers',
              url: 'https://javascript.info/number',
            },
          ],
          challenges: [
            {
              title: 'S1.4 Easy — Times Table: 3 × 4',
              description:
                `<p><strong>Task:</strong> Show the answer to <code>3 * 4</code>.</p>`.trim(),
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
              hints: ['Use the * operator.', 'console.log(3 * 4);'],
            },
            {
              title: 'S1.4 Medium — Safe Divide',
              description: `
<p><strong>Task:</strong> The system gives you two numbers (a, b). Show <code>a / b</code>. If <code>b</code> is <code>0</code>, print <code>"undefined"</code>.</p>
<p><em>Example:</em> Input: <code>[5, 0]</code> → Output: <code>undefined</code></p>`.trim(),
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
              hints: ['Check b === 0 first.', 'Else print a / b.'],
            },
            {
              title: 'S1.4 Hard — Mix: Add Then Multiply',
              description:
                `<p><strong>Task:</strong> The system gives you (a, b). Show <code>(a + b) * 2</code>.</p>`.trim(),
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
              hints: ['Use parentheses: (a + b) * 2'],
            },
          ],
        },

        // S1.5 ORDER OF OPERATIONS
        {
          title: 'S1.5 — Do First Things First (Parentheses)',
          description:
            'Parentheses choose what happens first. Without them, multiply/divide happen before add/subtract.',
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>At Puzzle Plaza, signs show numbers and brackets. Zia learns that brackets choose what happens first.</p>

  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Without parentheses, multiply/divide happen before add/subtract.</li>
    <li>With parentheses <code>()</code>, you choose what happens first.</li>
  </ul>
</div>`.trim(),
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
            'The order rule is often called PEMDAS.',
            'Parentheses act like a spotlight—everything inside happens first.',
            'Grouping steps creates mini-puzzles inside expressions.',
          ],
          additionalResources: [
            {
              title: 'MDN — Operator Precedence',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence',
            },
            {
              title: 'JavaScript.info — Operators',
              url: 'https://javascript.info/operators#operator-precedence',
            },
          ],
          challenges: [
            {
              title: 'S1.5 Easy — No Brackets',
              description:
                `<p><strong>Task:</strong> Given <code>(a, b, c)</code>, show <code>a + b * c</code>.</p>`.trim(),
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
              hints: ['Multiply first, then add.', 'No parentheses.'],
            },
            {
              title: 'S1.5 Medium — Use Brackets',
              description:
                `<p><strong>Task:</strong> Given <code>(a, b, c)</code>, show <code>(a + b) * c</code>.</p>`.trim(),
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
              hints: ['Do (a + b) first.', 'Then multiply by c.'],
            },
            {
              title: 'S1.5 Hard — Small Puzzle',
              description:
                `<p><strong>Task:</strong> Given <code>(a, b, c)</code>, show <code>a * (b + c) - a</code>.</p>`.trim(),
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
              hints: ['Use () for b + c.', 'Follow the steps carefully.'],
            },
          ],
        },

        // S1.6 STRINGS: QUOTES & ESCAPES
        {
          title: 'S1.6 — Words with Quotes',
          description:
            'Learn two ways to include quotes inside strings: opposite outer quotes or escaping with backslash.',
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>At Quote Quay, signs have talking marks. Zia practices printing speech and contractions.</p>

  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Use double quotes outside: <code>"It's sunny"</code></li>
    <li>Or escape inside: <code>'It\\'s sunny'</code></li>
  </ul>
</div>`.trim(),
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
            '\\ is an escape hatch that lets a quote appear safely.',
            'Both styles are common—choose whichever reads best.',
          ],
          additionalResources: [
            {
              title: 'MDN — String literals',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#string_literals',
            },
            {
              title: 'JavaScript.info — Strings',
              url: 'https://javascript.info/string',
            },
          ],
          challenges: [
            {
              title: 'S1.6 Easy — It’s Sunny',
              description:
                `<p><strong>Task:</strong> Show <code>It's sunny</code>.</p>`.trim(),
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
              hints: ['Use double quotes outside or escape the single quote.'],
            },
            {
              title: 'S1.6 Medium — He Said, "Hello".',
              description:
                `<p><strong>Task:</strong> Show <code>He said, "Hello".</code> (include the double quotes)</p>`.trim(),
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
                'Use single quotes outside, or escape the inner quotes.',
                'Check punctuation.',
              ],
            },
            {
              title: 'S1.6 Hard — Name Says a Word',
              description:
                `<p><strong>Task:</strong> The system gives you a name and a word. Show: <code>&lt;name&gt; says "&lt;word&gt;"!</code></p>`.trim(),
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
                'Wrap the second value in double quotes in the output.',
                'Keep spaces and ! exactly.',
              ],
            },
          ],
        },

        // S1.7 STRINGS: JOIN
        {
          title: 'S1.7 — Joining Words',
          description:
            'Glue pieces of text into a single line using the + sign and a single space in between.',
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>At Sign Street, letters hold hands. Zia learns to join words so names and messages look neat.</p>

  <h4>✨ The Secret Spell</h4>
  <p>Join with a space: <code>'Hello' + ' ' + 'World'</code></p>
</div>`.trim(),
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
            'A single space is also a character—treat it carefully.',
            'Joining pieces builds names, labels, and whole sentences.',
          ],
          additionalResources: [
            {
              title: 'MDN — Strings',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String',
            },
            {
              title: 'JavaScript.info — Strings',
              url: 'https://javascript.info/string',
            },
          ],
          challenges: [
            {
              title: 'S1.7 Easy — Join Two Words',
              description:
                `<p><strong>Task:</strong> The system gives you two words (a, b). Show them with one space between.</p>`.trim(),
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
              hints: ['Use a + " " + b', 'Do not trim text.'],
            },
            {
              title: 'S1.7 Medium — Hello, Name.',
              description:
                `<p><strong>Task:</strong> The system gives you a name. Show: <code>Hello, &lt;name&gt;.</code></p>`.trim(),
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
              hints: ['"Hello, " + name + "."', 'Keep punctuation.'],
            },
            {
              title: 'S1.7 Hard — Three Words Line',
              description:
                `<p><strong>Task:</strong> The system gives you three words (a, b, c). Show: <code>a b c</code> (one space between each).</p>`.trim(),
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
              hints: ['a + " " + b + " " + c'],
            },
          ],
        },

        // S1.8 STRINGS: LENGTH & FIRST/LAST
        {
          title: 'S1.8 — How Long? First and Last',
          description:
            'Count characters with .length, then find the first and last character with indexing.',
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>Letter Counters measure words like rulers. Zia counts names; Pax checks first and last letters.</p>

  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Length: <code>word.length</code></li>
    <li>First letter: <code>word[0]</code></li>
    <li>Last letter: <code>word[word.length - 1]</code></li>
  </ul>
  <p><em>Tip:</em> Spaces count. Empty strings have length 0.</p>
</div>`.trim(),
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
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Property_accessors',
            },
          ],
          challenges: [
            {
              title: 'S1.8 Easy — Count Letters',
              description:
                `<p><strong>Task:</strong> The system gives you a word. Show how many characters it has using <code>.length</code>.</p>`.trim(),
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
              hints: ['Use .length.'],
            },
            {
              title: 'S1.8 Medium — First-Last Format',
              description:
                `<p><strong>Task:</strong> The system gives you a word. Show <code>first-last</code>. If empty, show just <code>-</code>.</p>`.trim(),
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
                'First is word[0]. Last is word[word.length-1].',
                'Handle empty first.',
              ],
            },
            {
              title: 'S1.8 Hard — Middle Peek',
              description: `
<p><strong>Task:</strong> The system gives you a word.</p>
<ul>
  <li>If it has odd length, show the middle 1 letter.</li>
  <li>If it has even length, show the middle 2 letters.</li>
  <li>If it is empty, show nothing (empty line).</li>
</ul>`.trim(),
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
              hints: ['Odd: Math.floor(n/2). Even: take n/2 - 1 and n/2.'],
            },
          ],
        },
      ],
    };

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
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>In the Pack Square, the Pouch Maker hands Zia tiny pockets labeled with names. “Put a value here, take it out later,” she says. Pax practices placing numbers and words into pockets and showing them on the screen.</p>

  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Create a changeable pocket: <code>let name = 'Zia';</code></li>
    <li>Create a steady pocket: <code>const city = 'Codeville';</code></li>
    <li>Show what’s inside: <code>console.log(name);</code></li>
  </ul>

  <div id="spell"></div>
</div>
      `.trim(),
          runnables: [
            {
              title: 'Spell 1 — make a pocket',
              code: "let name='Zia'; console.log(name);",
            },
            {
              title: 'Spell 2 — steady pocket',
              code: "const city='Codeville'; console.log(city);",
            },
            {
              title: 'Spell 3 — change the value',
              code: "let mood='happy'; console.log(mood); mood='excited'; console.log(mood);",
            },
            {
              title: 'Spell 4 — numbers in pockets',
              code: 'let a=2; let b=3; console.log(a+b);',
            },
          ],
          trivia: [
            'Use camelCase for variable names like favoriteColor.',
            'const prevents reassignment but its contents can still change when it holds an object or array.',
            'Good names are short, precise, and readable.',
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
              title: 'javascript.info — Variables',
              url: 'https://javascript.info/variables',
            },
          ],
          challenges: [
            {
              title: 'S2.1 Easy — Store and Show',
              description: `
<p><strong>Task:</strong> Make a variable named <code>pet</code> with the value <code>"cat"</code>. Then print it.</p>
<ol>
  <li>Use <code>let</code> to create <code>pet</code>.</li>
  <li>Assign it the string <code>"cat"</code>.</li>
  <li>Print using <code>console.log(pet)</code>.</li>
</ol>
          `.trim(),
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
              description: `
<p><strong>Task:</strong> Make <code>count</code> start at <code>1</code>. Change it to <code>2</code>. Print the new value only.</p>
<ol>
  <li>Create <code>let count = 1;</code></li>
  <li>Update with <code>count = 2;</code></li>
  <li>Print once after updating.</li>
</ol>
          `.trim(),
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
              description: `
<p><strong>Task:</strong> Make two variables: <code>a = 4</code> and <code>b = 6</code>. Print their sum.</p>
<ol>
  <li>Create the variables without quotes.</li>
  <li>Add them together.</li>
  <li>Print only the result.</li>
</ol>
          `.trim(),
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

        // S2.2 MODULO
        {
          title: 'S2.2 — Sharing Fairly (Remainder %)',
          description:
            'Sometimes numbers don’t split evenly. The modulo operator % tells you what’s left over after division. It’s useful for patterns like even/odd and for wrapping around in small cycles. In this lesson, you’ll learn to peek at the remainder and print the result safely.',
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>At Circle Court, coins are shared among sprites. When the last sprite gets one coin too few, the remainder pebble clinks into a bowl. Zia listens and counts the leftovers.</p>

  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Remainder: <code>a % b</code> (what’s left after dividing <em>a</em> by <em>b</em>)</li>
    <li>Even check: <code>n % 2 === 0</code></li>
  </ul>

  <div id="spell"></div>
</div>
      `.trim(),
          runnables: [
            {
              title: 'Spell 1 — simple remainder',
              code: 'console.log(7 % 3);',
            },
            {
              title: 'Spell 2 — even',
              code: 'let n=10; console.log(n%2===0);',
            },
            { title: 'Spell 3 — odd', code: 'let n=11; console.log(n%2!==0);' },
          ],
          trivia: [
            '7 % 3 equals 1 because 3 + 3 = 6 and 1 remains.',
            'Modulo is great for cycling through indexes, like days of the week.',
            'Zero is even: 0 % 2 === 0.',
          ],
          additionalResources: [
            {
              title: 'MDN — Arithmetic Operators',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Expressions_and_Operators#arithmetic_operators',
            },
            {
              title: 'javascript.info — Operators',
              url: 'https://javascript.info/operators',
            },
            {
              title: 'freeCodeCamp — Remainder Operator',
              url: 'https://www.freecodecamp.org/news/the-modulo-operator-in-javascript/',
            },
          ],
          challenges: [
            {
              title: 'S2.2 Easy — 10 % 4',
              description: `
<p><strong>Task:</strong> Print the remainder when <code>10</code> is divided by <code>4</code>.</p>
<ol>
  <li>Use <code>10 % 4</code>.</li>
  <li>Print only the number.</li>
</ol>
          `.trim(),
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
              description: `
<p><strong>Task:</strong> You receive a number <code>n</code>. If <code>n</code> is even, print <code>"even"</code>. Otherwise, print <code>"odd"</code>.</p>
<ol>
  <li>Use modulo by 2.</li>
  <li>Choose exactly one word.</li>
</ol>
          `.trim(),
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
              description: `
<p><strong>Task:</strong> You receive <code>a</code> and <code>b</code>. Print the remainder of <code>a % b</code>. If <code>b</code> is <code>0</code>, print <code>"undefined"</code>.</p>
<ol>
  <li>Guard against division by zero.</li>
  <li>Otherwise, print the remainder.</li>
</ol>
          `.trim(),
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
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>At Balance Bridge, two plates hold values to compare. Zia and Pax place numbers on each side and watch the pointer flip to “true” or “false”.</p>

  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Equal: <code>a === b</code></li>
    <li>Greater: <code>a &gt; b</code>, Less: <code>a &lt; b</code></li>
    <li>Greater or equal: <code>a &gt;= b</code>, Less or equal: <code>a &lt;= b</code></li>
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
            '=== checks both value and type; it avoids many beginner pitfalls.',
            'String comparison is lexicographic (dictionary order) using Unicode code points.',
            'Comparisons always evaluate to a boolean value.',
          ],
          additionalResources: [
            {
              title: 'MDN — Comparison Operators',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Comparison',
            },
            {
              title: 'javascript.info — Comparison',
              url: 'https://javascript.info/comparison',
            },
          ],
          challenges: [
            {
              title: 'S2.3 Easy — True or False',
              description: `
<p><strong>Task:</strong> Print the result of <code>7 &gt; 5</code>.</p>
<p>Print the boolean value directly.</p>
          `.trim(),
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
              description: `
<p><strong>Task:</strong> You receive <code>a</code> and <code>b</code>. Print <code>true</code> if <code>a === b</code>, else print <code>false</code>.</p>
<p>Use strict equality.</p>
          `.trim(),
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
              description: `
<p><strong>Task:</strong> You receive <code>n</code>, <code>low</code>, and <code>high</code>. Print <code>true</code> if <code>n</code> is between <code>low</code> and <code>high</code> (inclusive). Otherwise print <code>false</code>.</p>
<p>Join checks with <code>&gt;=</code> and <code>&lt;=</code>.</p>
          `.trim(),
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
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>In Lantern Lane, lights turn on if two switches agree. Zia learns the secret signals: AND means both, OR means at least one, and NOT flips the answer.</p>

  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>AND: <code>a &amp;&amp; b</code> (true if both are true)</li>
    <li>OR: <code>a || b</code> (true if at least one is true)</li>
    <li>NOT: <code>!a</code> (flips true/false)</li>
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
            '&& stops early if the left side is false (short-circuit).',
            '|| stops early if the left side is true (short-circuit).',
            '! has higher precedence than && and ||.',
          ],
          additionalResources: [
            {
              title: 'MDN — Logical Operators',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_Operators',
            },
            {
              title: 'javascript.info — Logical Operators',
              url: 'https://javascript.info/logical-operators',
            },
          ],
          challenges: [
            {
              title: 'S2.4 Easy — At Least One',
              description: `
<p><strong>Task:</strong> Print the result of <code>true || false</code>.</p>
<p>Print the boolean directly.</p>
          `.trim(),
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
              description: `
<p><strong>Task:</strong> You receive <code>n</code>. Print <code>true</code> if <code>1 &lt;= n &lt;= 10</code>, else <code>false</code>.</p>
<p>Combine two comparisons with <code>&amp;&amp;</code>.</p>
          `.trim(),
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
              description: `
<p><strong>Task:</strong> You receive a word. Print <code>true</code> if it is not empty, else <code>false</code>.</p>
<p>Check <code>length</code> and use <code>!</code> if needed.</p>
          `.trim(),
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
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>At Choice Corner, a door opens only if you say the secret number. Zia learns to test a condition and speak when it’s true.</p>

  <h4>✨ The Secret Spell</h4>
  <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:8px;"><code>if (condition) {
  // runs when condition is true
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
            'Nothing prints if the condition is false and there’s no else.',
            'Conditions are just expressions that evaluate to true or false.',
            'Curly braces group the code that should run.',
          ],
          additionalResources: [
            {
              title: 'MDN — if...else',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/if...else',
            },
            {
              title: 'javascript.info — If statement',
              url: 'https://javascript.info/ifelse',
            },
          ],
          challenges: [
            {
              title: 'S2.5 Easy — If Nice',
              description: `
<p><strong>Task:</strong> If <code>a &gt; 5</code>, print <code>"nice"</code>. Otherwise, print nothing.</p>
<p>Only print when the condition is true.</p>
          `.trim(),
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
              description: `
<p><strong>Task:</strong> You receive <code>n</code>. If it is even, print <code>"even"</code>. Else, print nothing.</p>
<p>Use modulo 2 and a single <code>if</code>.</p>
          `.trim(),
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
              description: `
<p><strong>Task:</strong> You receive <code>n</code>. If <code>1 &lt;= n &lt;= 10</code>, print <code>"ok"</code>. Else, print nothing.</p>
<p>Join two comparisons with <code>&amp;&amp;</code>.</p>
          `.trim(),
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
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>At the Fork Gate, a sign points left or right. Zia learns to choose paths using if/else so the code always picks one message.</p>

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
            'Exactly one branch runs each time.',
            'Use clear, short messages in each branch.',
            'You can put any true/false expression in the condition.',
          ],
          additionalResources: [
            {
              title: 'MDN — if...else',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/if...else',
            },
            {
              title: 'javascript.info — Conditional branching',
              url: 'https://javascript.info/ifelse',
            },
          ],
          challenges: [
            {
              title: 'S2.6 Easy — Even/Odd',
              description: `
<p><strong>Task:</strong> You receive <code>n</code>. Print <code>"even"</code> if even, otherwise <code>"odd"</code>.</p>
<p>Use <code>if/else</code> and modulo.</p>
          `.trim(),
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
              description: `
<p><strong>Task:</strong> You receive <code>age</code>. If <code>age &gt;= 13</code>, print <code>"allowed"</code>. Else print <code>"blocked"</code>.</p>
<p>Be precise with spelling and punctuation.</p>
          `.trim(),
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
              description: `
<p><strong>Task:</strong> You receive <code>n</code>. If <code>1 &lt;= n &lt;= 10</code>, print <code>"inside"</code>. Else print <code>"outside"</code>.</p>
<p>Join two comparisons with <code>&amp;&amp;</code> and pick exactly one word.</p>
          `.trim(),
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
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>At Shelf Square, bottles line up in a neat row. Zia places labels in an array to keep them together, while Pax counts how many bottles are on the shelf.</p>

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
            'Arrays remember the order you add items.',
            'An empty array [] has length 0.',
            'Arrays can mix strings and numbers, but keep it simple for readability.',
          ],
          additionalResources: [
            {
              title: 'MDN — Arrays',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array',
            },
            {
              title: 'javascript.info — Arrays',
              url: 'https://javascript.info/array',
            },
          ],
          challenges: [
            {
              title: 'S3.1 Easy — Two Pets',
              description: `
<p><strong>Task:</strong> Make an array with <code>"cat"</code> and <code>"dog"</code>. Print the array.</p>
<p>Use square brackets and commas, then print once.</p>
          `.trim(),
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
              description: `
<p><strong>Task:</strong> Create <code>[1, 2, 3]</code> and print it.</p>
<p>Numbers do not need quotes.</p>
          `.trim(),
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
              description: `
<p><strong>Task:</strong> Create <code>["sun", 7, "moon"]</code> and print it.</p>
<p>Keep the items in that exact order.</p>
          `.trim(),
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
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>The Counter Clock ticks each time an item joins the lineup. Zia watches the number change as she adds or removes items.</p>

  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Count: <code>array.length</code></li>
  </ul>

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
            'length updates automatically when you push or pop.',
            'Strings also have .length (you saw that in Chapter 1).',
            'length is a property, not a function — no parentheses needed.',
          ],
          additionalResources: [
            {
              title: 'MDN — Array.length',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/length',
            },
            {
              title: 'javascript.info — Array methods (length section)',
              url: 'https://javascript.info/array#length',
            },
          ],
          challenges: [
            {
              title: 'S3.2 Easy — Count 3',
              description: `
<p><strong>Task:</strong> Print the length of <code>["a","b","c"]</code>.</p>
<p>Use <code>.length</code> and print the number.</p>
          `.trim(),
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
              description: `
<p><strong>Task:</strong> Make an empty array and print its length.</p>
<p>An empty array has length 0.</p>
          `.trim(),
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
              description: `
<p><strong>Task:</strong> Create <code>["a", 1, "b", 2]</code>. Print its length.</p>
<p>Count all items regardless of type.</p>
          `.trim(),
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
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>Index Isle has stepping stones numbered starting from 0. Zia hops to the right stone to pick an item from the lineup.</p>

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
            'Indexing starts at 0, not 1.',
            'The last item is at index length - 1.',
            'Going past the ends gives undefined.',
          ],
          additionalResources: [
            {
              title: 'MDN — Arrays (Accessing array elements)',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array#accessing_array_elements',
            },
            {
              title: 'javascript.info — Arrays (indexes)',
              url: 'https://javascript.info/array#pop-push-shift-unshift',
            },
          ],
          challenges: [
            {
              title: 'S3.3 Easy — First Fruit',
              description: `
<p><strong>Task:</strong> Given <code>["apple","banana","pear"]</code>, print the first item.</p>
<p>Use index <code>0</code>.</p>
          `.trim(),
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
              description: `
<p><strong>Task:</strong> Given <code>["red","green","blue"]</code>, print the last item.</p>
<p>Use <code>length - 1</code>.</p>
          `.trim(),
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
              description: `
<p><strong>Task:</strong> Given <code>["ant","bear","cat","dog","eel"]</code>, print the middle item (index 2).</p>
<p>Count from 0: 0, 1, <strong>2</strong>, 3, 4.</p>
          `.trim(),
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
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>At End Dock, a ferry brings new items to the lineup and takes the last one away. Zia adds labels with push and removes them with pop.</p>

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
            'push returns the new length of the array.',
            'pop returns the removed item.',
            'push/pop work at the end of the array.',
          ],
          additionalResources: [
            {
              title: 'MDN — push()',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push',
            },
            {
              title: 'MDN — pop()',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/pop',
            },
            {
              title: 'javascript.info — Array methods',
              url: 'https://javascript.info/array-methods',
            },
          ],
          challenges: [
            {
              title: 'S3.4 Easy — Add One',
              description: `
<p><strong>Task:</strong> Start with <code>["a"]</code>. Add <code>"b"</code> to the end and print.</p>
<p>Use <code>push</code> once.</p>
          `.trim(),
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
              description: `
<p><strong>Task:</strong> Start with <code>[]</code>. Add <code>"x"</code> then <code>"y"</code>, then print.</p>
<p>Call <code>push</code> twice in order.</p>
          `.trim(),
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
              description: `
<p><strong>Task:</strong> Start with <code>["dog","cat","bird"]</code>. Remove the last item using <code>pop()</code>. Print the array that remains.</p>
<p>Pop once, then print.</p>
          `.trim(),
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
          chapterId: Number(createdChapter?.id),
          description: sec.description,
          rewardOptions: COMMON_REWARD_OPTIONS,
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
