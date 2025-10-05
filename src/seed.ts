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

    const globalAchievements = [
      // CH1
      {
        code: 'CH1_CLEAN_SLATE',
        icon: 'ti ti-bulb',
        difficulty: 'easy',
        title: 'Clean Slate',
        description: 'Solve your first Chapter 1 challenge.',
        rewardPoints: 10,
        creditPoints: 5,
        rule: { type: 'streak', length: 1, chapterOrder: 1 },
      },
      {
        code: 'CH1_SPEEDY_SPEAKER',
        icon: 'ti ti-bolt',
        difficulty: 'medium',
        title: 'Speedy Speaker',
        description:
          'Solve any Chapter 1 printing/strings challenge in under 20 seconds.',
        rewardPoints: 20,
        creditPoints: 10,
        rule: {
          type: 'time_to_solve_under_seconds',
          seconds: 20,
          chapterOrder: 1,
        },
      },
      {
        code: 'CH1_NO_HINTS_3',
        icon: 'ti ti-shield-check',
        difficulty: 'medium',
        title: 'Pure Intuition (x3)',
        description: 'Solve 3 challenges in Chapter 1 with no hints.',
        rewardPoints: 25,
        creditPoints: 12,
        rule: { type: 'no_hints_total', count: 3 },
      },
      {
        code: 'CH1_PERFECT',
        icon: 'ti ti-award',
        difficulty: 'hard',
        title: 'Chapter 1: Perfect',
        description:
          'Complete all Chapter 1 challenges with zero hints and zero wrong attempts.',
        rewardPoints: 50,
        creditPoints: 20,
        rule: {
          type: 'chapter_perfect',
          chapterTitle: 'Chapter 1 — Welcome to Codeville!',
        },
      },

      // CH2
      {
        code: 'CH2_VARIABLE_VOYAGER',
        icon: 'ti ti-briefcase',
        difficulty: 'easy',
        title: 'Variable Voyager',
        description: 'Solve any Chapter 2 variable challenge.',
        rewardPoints: 10,
        creditPoints: 5,
        rule: { type: 'streak', length: 1, chapterOrder: 2 },
      },
      {
        code: 'CH2_EVEN_ODD_MASTER',
        icon: 'ti ti-calculator',
        difficulty: 'medium',
        title: 'Even/Odd Master',
        description: 'Solve 5 challenges in Chapter 2 with ≤ 1 hint each.',
        rewardPoints: 30,
        creditPoints: 15,
        rule: { type: 'limited_hints_per_challenge', maxHints: 1, count: 5 },
      },
      {
        code: 'CH2_PERFECT',
        icon: 'ti ti-award-filled',
        difficulty: 'hard',
        title: 'Chapter 2: Perfect',
        description:
          'Complete all Chapter 2 challenges with zero hints and zero wrong attempts.',
        rewardPoints: 60,
        creditPoints: 25,
        rule: {
          type: 'chapter_perfect',
          chapterTitle: 'Chapter 2 — Pockets, Paths, and Choices',
        },
      },

      // CH3
      {
        code: 'CH3_ARRAY_APPRENTICE',
        icon: 'ti ti-layout-list',
        difficulty: 'easy',
        title: 'Array Apprentice',
        description: 'Solve your first array challenge in Chapter 3.',
        rewardPoints: 10,
        creditPoints: 5,
        rule: { type: 'streak', length: 1, chapterOrder: 3 },
      },
      {
        code: 'CH3_ZERO_HINTS_STREAK_3',
        icon: 'ti ti-star',
        difficulty: 'medium',
        title: 'No-Help Trio',
        description: 'Get a streak of 3 Chapter 3 solves with no hints.',
        rewardPoints: 35,
        creditPoints: 18,
        rule: { type: 'no_hints_streak', length: 3 },
      },
      {
        code: 'CH3_PERFECT',
        icon: 'ti ti-bookmarks',
        difficulty: 'hard',
        title: 'Chapter 3: Perfect',
        description:
          'Complete all Chapter 3 challenges with zero hints and zero wrong attempts.',
        rewardPoints: 70,
        creditPoints: 30,
        rule: {
          type: 'chapter_perfect',
          chapterTitle: 'Chapter 3 — Little Lists and Lineups (Arrays)',
        },
      },

      // Global
      {
        code: 'GLOBAL_DAILY_7',
        icon: 'ti ti-calendar-stats',
        difficulty: 'medium',
        title: 'Week Warrior',
        description: 'Log activity 7 days in a row.',
        rewardPoints: 40,
        creditPoints: 20,
        rule: { type: 'daily_active_streak', days: 7 },
      },
      {
        code: 'GLOBAL_STREAK_5_NO_WRONG',
        icon: 'ti ti-fire',
        difficulty: 'hard',
        title: 'Flawless Five',
        description: '5-pass streak with zero wrong attempts on each.',
        rewardPoints: 80,
        creditPoints: 35,
        rule: { type: 'streak', length: 5, withoutWrong: true },
      },
      {
        code: 'GLOBAL_COMMUNITY_HELPER_3',
        icon: 'ti ti-users',
        difficulty: 'medium',
        title: 'Community Helper',
        description: 'Get 3 community solutions approved.',
        rewardPoints: 50,
        creditPoints: 25,
        rule: { type: 'community_solution_shared', approved: true, count: 3 },
      },
    ];

    const achievements = [
      {
        code: 'streak_3',
        title: 'Hot Start',
        description: 'Solve 3 challenges in a row without a wrong answer.',
        icon: 'ti ti-flame',
        difficulty: 'easy',
        rule: { type: 'streak', length: 3, withoutWrong: true },
        rewardPoints: 100,
        creditPoints: 20,
      },
      {
        code: 'streak_10',
        title: 'On Fire!',
        description: 'Keep a perfect 10-challenge streak with no mistakes.',
        icon: 'ti ti-flame',
        difficulty: 'medium',
        rule: { type: 'streak', length: 10, withoutWrong: true },
        rewardPoints: 250,
        creditPoints: 40,
      },
      {
        code: 'no_hints_streak_5',
        title: 'Pure Skill',
        description: 'Complete 5 challenges in a row without using any hints.',
        icon: 'ti ti-shield-check',
        difficulty: 'medium',
        rule: { type: 'no_hints_streak', length: 5 },
        rewardPoints: 120,
        creditPoints: 25,
      },
      {
        code: 'no_hints_total_20',
        title: 'Independent Thinker',
        description: 'Finish 20 total challenges without using a single hint.',
        icon: 'ti ti-brain',
        difficulty: 'hard',
        rule: { type: 'no_hints_total', count: 20 },
        rewardPoints: 200,
        creditPoints: 30,
      },
      {
        code: 'speed_solver_60s',
        title: 'Lightning Fingers',
        description: 'Solve a challenge in under 60 seconds.',
        icon: 'ti ti-bolt',
        difficulty: 'easy',
        rule: { type: 'time_to_solve_under_seconds', seconds: 60 },
        rewardPoints: 80,
        creditPoints: 15,
      },
      {
        code: 'speed_solver_30s',
        title: 'Flash Coder',
        description: 'Solve a challenge in under 30 seconds.',
        icon: 'ti ti-bolt',
        difficulty: 'hard',
        rule: { type: 'time_to_solve_under_seconds', seconds: 30 },
        rewardPoints: 150,
        creditPoints: 25,
      },
      {
        code: 'chapter1_perfect',
        title: 'Perfect Chapter 1',
        description:
          'Complete every challenge in Chapter 1 without using any hints.',
        icon: 'ti ti-trophy',
        difficulty: 'hard',
        rule: {
          type: 'chapter_perfect',
          chapterTitle: 'Chapter 1 — Welcome to Codeville!',
        },
        rewardPoints: 300,
        creditPoints: 50,
      },
      {
        code: 'daily_streak_7',
        title: 'Dedicated Learner',
        description: 'Stay active for 7 days in a row.',
        icon: 'ti ti-calendar-check',
        difficulty: 'medium',
        rule: { type: 'daily_active_streak', days: 7 },
        rewardPoints: 150,
        creditPoints: 30,
      },
      {
        code: 'daily_streak_30',
        title: 'Unstoppable',
        description: 'Stay active for 30 days straight.',
        icon: 'ti ti-calendar-stats',
        difficulty: 'legendary',
        rule: { type: 'daily_active_streak', days: 30 },
        rewardPoints: 400,
        creditPoints: 80,
      },
      {
        code: 'community_share_1',
        title: 'Helpful Hero',
        description: 'Share your first approved community solution.',
        icon: 'ti ti-hand-off',
        difficulty: 'easy',
        rule: { type: 'community_solution_shared', approved: true, count: 1 },
        rewardPoints: 120,
        creditPoints: 25,
      },
      {
        code: 'community_share_5',
        title: 'Teacher Spirit',
        description: 'Share 5 approved community solutions.',
        icon: 'ti ti-bulb',
        difficulty: 'medium',
        rule: { type: 'community_solution_shared', approved: true, count: 5 },
        rewardPoints: 300,
        creditPoints: 60,
      },
      {
        code: 'hint_master_3',
        title: 'Minimalist',
        description:
          'Solve 3 challenges while using at most 1 hint per challenge.',
        icon: 'ti ti-target',
        difficulty: 'easy',
        rule: { type: 'limited_hints_per_challenge', maxHints: 1, count: 3 },
        rewardPoints: 90,
        creditPoints: 15,
      },
      {
        code: 'hint_master_10',
        title: 'Hint Ninja',
        description: 'Solve 10 challenges while using at most 1 hint each.',
        icon: 'ti ti-eye-off',
        difficulty: 'hard',
        rule: { type: 'limited_hints_per_challenge', maxHints: 1, count: 10 },
        rewardPoints: 200,
        creditPoints: 35,
      },
    ];

    // CHAPTER 2 — Pockets, Paths, and Choices
    const achievementsChapter2 = [
      {
        code: 'c2_streak_5_perfect',
        title: 'Precision Path',
        description:
          'Solve 5 Chapter 2 challenges in a row with no wrong answers.',
        icon: 'ti ti-flag-check',
        difficulty: 'medium',
        rule: {
          type: 'streak',
          length: 5,
          withoutWrong: true,
          chapterOrder: 2,
        },
        rewardPoints: 220,
        creditPoints: 40,
      },
      {
        code: 'c2_no_hints_streak_5',
        title: 'Pure Logic',
        description:
          'Complete 5 Chapter 2 challenges in a row without using hints.',
        icon: 'ti ti-shield-check',
        difficulty: 'medium',
        rule: { type: 'no_hints_streak', length: 5 },
        rewardPoints: 180,
        creditPoints: 35,
      },
      {
        code: 'c2_no_hints_total_10',
        title: 'Untouched Scripts',
        description: 'Finish 10 total Chapter 2 challenges without any hints.',
        icon: 'ti ti-brain',
        difficulty: 'hard',
        rule: { type: 'no_hints_total', count: 10 },
        rewardPoints: 260,
        creditPoints: 50,
      },
      {
        code: 'c2_speed_solver_45s',
        title: 'Snappy Thinker',
        description: 'Solve any Chapter 2 challenge in under 45 seconds.',
        icon: 'ti ti-bolt',
        difficulty: 'medium',
        rule: {
          type: 'time_to_solve_under_seconds',
          seconds: 45,
          chapterOrder: 2,
        },
        rewardPoints: 140,
        creditPoints: 25,
      },
      {
        code: 'c2_speed_solver_20s',
        title: 'Reflex Coder',
        description: 'Solve any Chapter 2 challenge in under 20 seconds.',
        icon: 'ti ti-bolt',
        difficulty: 'hard',
        rule: {
          type: 'time_to_solve_under_seconds',
          seconds: 20,
          chapterOrder: 2,
        },
        rewardPoints: 220,
        creditPoints: 35,
      },
      {
        code: 'c2_hint_discipline_1of8',
        title: 'Minimalist Thinker',
        description:
          'Solve 8 Chapter 2 challenges using at most 1 hint per challenge.',
        icon: 'ti ti-target',
        difficulty: 'medium',
        rule: { type: 'limited_hints_per_challenge', maxHints: 1, count: 8 },
        rewardPoints: 200,
        creditPoints: 40,
      },
      {
        code: 'c2_chapter_perfect',
        title: 'Perfect Chapter 2',
        description:
          'Complete every challenge in Chapter 2 without using any hints.',
        icon: 'ti ti-trophy',
        difficulty: 'hard',
        rule: {
          type: 'chapter_perfect',
          chapterTitle: 'Chapter 2 — Pockets, Paths, and Choices',
        },
        rewardPoints: 360,
        creditPoints: 70,
      },
      {
        code: 'c2_daily_streak_7',
        title: 'Routine Builder',
        description: 'Stay active for 7 days in a row during Chapter 2.',
        icon: 'ti ti-calendar-check',
        difficulty: 'medium',
        rule: { type: 'daily_active_streak', days: 7 },
        rewardPoints: 170,
        creditPoints: 30,
      },
      {
        code: 'c2_share_3',
        title: 'Logic Mentor',
        description: 'Share 3 approved community solutions for Chapter 2.',
        icon: 'ti ti-bulb',
        difficulty: 'medium',
        rule: { type: 'community_solution_shared', approved: true, count: 3 },
        rewardPoints: 240,
        creditPoints: 50,
      },
    ];

    // CHAPTER 3 — Little Lists and Lineups (Arrays)
    const achievementsChapter3 = [
      {
        code: 'c3_streak_6_perfect',
        title: 'Array Ace',
        description:
          'Solve 6 Chapter 3 challenges in a row with no wrong answers.',
        icon: 'ti ti-flag-check',
        difficulty: 'medium',
        rule: {
          type: 'streak',
          length: 6,
          withoutWrong: true,
          chapterOrder: 3,
        },
        rewardPoints: 240,
        creditPoints: 45,
      },
      {
        code: 'c3_no_hints_streak_6',
        title: 'Shelf Sage',
        description: 'Complete 6 Chapter 3 challenges in a row without hints.',
        icon: 'ti ti-shield-check',
        difficulty: 'hard',
        rule: { type: 'no_hints_streak', length: 6 },
        rewardPoints: 260,
        creditPoints: 55,
      },
      {
        code: 'c3_no_hints_total_12',
        title: 'Untouched Shelves',
        description: 'Finish 12 total Chapter 3 challenges without any hints.',
        icon: 'ti ti-brain',
        difficulty: 'hard',
        rule: { type: 'no_hints_total', count: 12 },
        rewardPoints: 320,
        creditPoints: 60,
      },
      {
        code: 'c3_speed_solver_40s',
        title: 'Quick Sorter',
        description: 'Solve any Chapter 3 challenge in under 40 seconds.',
        icon: 'ti ti-bolt',
        difficulty: 'medium',
        rule: {
          type: 'time_to_solve_under_seconds',
          seconds: 40,
          chapterOrder: 3,
        },
        rewardPoints: 150,
        creditPoints: 25,
      },
      {
        code: 'c3_speed_solver_18s',
        title: 'Rapid Stacker',
        description: 'Solve any Chapter 3 challenge in under 18 seconds.',
        icon: 'ti ti-bolt',
        difficulty: 'hard',
        rule: {
          type: 'time_to_solve_under_seconds',
          seconds: 18,
          chapterOrder: 3,
        },
        rewardPoints: 230,
        creditPoints: 35,
      },
      {
        code: 'c3_hint_discipline_1of10',
        title: 'Shelf Minimalist',
        description:
          'Solve 10 Chapter 3 challenges using at most 1 hint per challenge.',
        icon: 'ti ti-target',
        difficulty: 'medium',
        rule: { type: 'limited_hints_per_challenge', maxHints: 1, count: 10 },
        rewardPoints: 220,
        creditPoints: 45,
      },
      {
        code: 'c3_chapter_perfect',
        title: 'Perfect Chapter 3',
        description:
          'Complete every challenge in Chapter 3 without using any hints.',
        icon: 'ti ti-trophy',
        difficulty: 'hard',
        rule: {
          type: 'chapter_perfect',
          chapterTitle: 'Chapter 3 — Little Lists and Lineups (Arrays)',
        },
        rewardPoints: 380,
        creditPoints: 80,
      },
      {
        code: 'c3_daily_streak_7',
        title: 'Array Regular',
        description: 'Stay active for 7 days in a row during Chapter 3.',
        icon: 'ti ti-calendar-check',
        difficulty: 'medium',
        rule: { type: 'daily_active_streak', days: 7 },
        rewardPoints: 170,
        creditPoints: 30,
      },
      {
        code: 'c3_share_3',
        title: 'Array Tutor',
        description: 'Share 3 approved community solutions for Chapter 3.',
        icon: 'ti ti-bulb',
        difficulty: 'medium',
        rule: { type: 'community_solution_shared', approved: true, count: 3 },
        rewardPoints: 240,
        creditPoints: 50,
      },
    ];

    for (const ach of [
      achievements,
      achievementsChapter2,
      achievementsChapter3,
      globalAchievements,
    ].flat()) {
      await tx.insert(schema.achievements).values({
        code: ach.code,
        title: ach.title,
        description: ach.description,
        icon: ach.icon,
        rule: ach.rule as any,
        difficulty: ach.difficulty as any,
        rewardPoints: ach.rewardPoints,
        creditPoints: ach.creditPoints,
      });
    }

    // Story
    await tx.insert(schema.stories).values({
      title: 'Code Quest: The Sparkling City of JS',
      description:
        'Join Zia and Pax as they explore the Sparkling City of JS. Learn JavaScript basics by solving tiny puzzles to light bridges, open doors, and help friendly bots. No OOP—just the building blocks!',
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
      hints: {
        displayText: string;
        hintText: string; // Markdown
        cost: number;
      }[];
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
      coverImage?: string;
      challenges: Challenge[];
      rewardPoints: number;
      creditPoints: number;
    };

    type Chapter = {
      title: string;
      description: string;
      sections: Section[];
      coverImage?: string;
      rewardPoints: number;
      creditPoints: number;
    };

    const testsJson = (tests: Challenge['tests']) => JSON.stringify(tests);

    // ----------------- Chapter 1 -----------------//
    const REWARD = { easy: 10, medium: 20, hard: 30 };
    const CREDIT = { easy: 5, medium: 10, hard: 15 };
    const SECTION_BONUS = { rewardPoints: 15, creditPoints: 8 };

    /* ----------------- Chapter 1 ----------------- */
    const chapter1: Chapter = {
      rewardPoints: 180,
      creditPoints: 48,
      coverImage: 'https://cdn.example.com/cover/ch1-welcome.jpg',
      title: 'Chapter 1 — Welcome to Codeville!',
      description:
        'Zia and Pax arrive at Codeville and learn to print messages, write comments, use basic arithmetic, control order with parentheses, and work with strings (quotes, joining, and measuring). Everything is gentle and beginner-friendly.',
      sections: [
        /* S1.1 — PRINTING ONLY */
        {
          title: 'S1.1 — Printing Your First Message',
          description:
            'Speak to the screen with console.log. Quotes hold your words, and each call prints one line.',
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p><strong>Zia</strong> and <strong>Pax</strong> meet the Console Keeper: “Make the screen speak and the gate opens!”</p>

  <h4>✨ The Secret Spell</h4>
  <p>Use <code>console.log('text')</code> to print a line on the screen.</p>
  <ul>
    <li>Single (<code>'...'</code>) or double (<code>"..."</code>) quotes both work.</li>
    <li>Each call prints on its own line.</li>
    <li>Emojis, punctuation, and spaces print as written.</li>
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
            '“log” means “write it down”; the console is your magic notebook.',
            'Quotes are like a treasure box—whatever goes inside prints exactly.',
            'Print multiple lines by calling console.log multiple times.',
          ],
          additionalResources: [
            {
              title: 'MDN — console.log()',
              url: 'https://developer.mozilla.org/en-US/docs/Web/API/console/log',
            },
            {
              title: 'MDN — Strings',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String',
            },
          ],
          rewardPoints: 60,
          creditPoints: 16,
          challenges: [
            {
              title: 'S1.1 Easy — Say Hello',
              description: `<p><strong>Task:</strong> Show exactly: <code>Hello, Codeville!</code></p>`,
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              creditPoints: CREDIT.easy,
              tests: [
                { input: '', expect_print: 'Hello, Codeville!' },
                { input: null, expect_print: 'Hello, Codeville!' },
                { input: 123, expect_print: 'Hello, Codeville!' },
                { input: 'anything', expect_print: 'Hello, Codeville!' },
                { input: {}, expect_print: 'Hello, Codeville!' },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Use console.log with quotes.',
                  cost: 3,
                },
                {
                  displayText: 'Hint 2',
                  hintText:
                    'The message must match exactly—check comma and exclamation point.',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText: '<code>console.log("Hello, Codeville!");</code>',
                  cost: 8,
                },
              ],
            },
            {
              title: 'S1.1 Medium — Hello, Name!',
              description: `<p><strong>Task:</strong> Given a name in <code>input</code>, print <code>Hello, &lt;name&gt;!</code></p>`,
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              creditPoints: CREDIT.medium,
              tests: [
                { input: 'Zia', expect_print: 'Hello, Zia!' },
                { input: 'Pax', expect_print: 'Hello, Pax!' },
                { input: 'Buddy', expect_print: 'Hello, Buddy!' },
                { input: 'A', expect_print: 'Hello, A!' },
                { input: '', expect_print: 'Hello, !' },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Use string concatenation to add the name.',
                  cost: 3,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Keep the comma and exclamation point.',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText:
                    '<code>console.log("Hello, " + input + "!");</code>',
                  cost: 8,
                },
              ],
            },
            {
              title: 'S1.1 Hard — Happy Birthday!',
              description: `<p><strong>Task:</strong> Given a name in <code>input</code>, print <code>Happy Birthday, &lt;name&gt;!</code></p>`,
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              creditPoints: CREDIT.hard,
              tests: [
                { input: 'Zia', expect_print: 'Happy Birthday, Zia!' },
                { input: 'Pax', expect_print: 'Happy Birthday, Pax!' },
                { input: 'Mimi', expect_print: 'Happy Birthday, Mimi!' },
                { input: '', expect_print: 'Happy Birthday, !' },
                { input: 'A', expect_print: 'Happy Birthday, A!' },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Build the phrase with the given name.',
                  cost: 3,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Mind spaces, comma, and exclamation point.',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText:
                    '<code>console.log("Happy Birthday, " + input + "!");</code>',
                  cost: 8,
                },
              ],
            },
          ],
        },

        /* S1.2 — COMMENTS ONLY */
        {
          title: 'S1.2 — Comments & Neat Code',
          description:
            'Comments are notes for humans. Start a comment with //; the computer ignores it.',
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>The Keeper smiles: “Clean code is kind code.” Zia writes notes so future Zia understands.</p>

  <h4>✨ The Secret Spell</h4>
  <p>Start a note with <code>//</code>. Everything after <code>//</code> on that line is ignored by the computer.</p>

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
            'Comments are only for humans—computers ignore them.',
            'Use comments to label steps and explain decisions.',
            'You can place a comment after code on the same line.',
          ],
          additionalResources: [
            {
              title: 'MDN — Comments',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#comments',
            },
            {
              title: 'Google JS Style Guide — Comments',
              url: 'https://google.github.io/styleguide/jsguide.html#formatting-comments',
            },
          ],
          rewardPoints: 60,
          creditPoints: 16,
          challenges: [
            {
              title: 'S1.2 Easy — One Note, One Hello',
              description: `<p><strong>Task:</strong> Write one comment line, then print <code>Hello!</code></p>`,
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              creditPoints: CREDIT.easy,
              tests: [
                { input: '', expect_print: 'Hello!' },
                { input: null, expect_print: 'Hello!' },
                { input: 'x', expect_print: 'Hello!' },
                { input: 0, expect_print: 'Hello!' },
                { input: {}, expect_print: 'Hello!' },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Start your first line with //.',
                  cost: 3,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Print exactly Hello! on the next line.',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText: '<code>// note\\nconsole.log("Hello!");</code>',
                  cost: 8,
                },
              ],
            },
            {
              title: 'S1.2 Medium — Keep It Secret',
              description: `<p><strong>Task:</strong> Write a short comment, then print <code>I like code</code>.</p>`,
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              creditPoints: CREDIT.medium,
              tests: [
                { input: '', expect_print: 'I like code' },
                { input: null, expect_print: 'I like code' },
                { input: 'anything', expect_print: 'I like code' },
                { input: 1, expect_print: 'I like code' },
                { input: {}, expect_print: 'I like code' },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Comment line starts with //.',
                  cost: 3,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Don’t add extra punctuation.',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText:
                    '<code>// my note\\nconsole.log("I like code");</code>',
                  cost: 8,
                },
              ],
            },
            {
              title: 'S1.2 Hard — Two Notes, One Line',
              description: `<p><strong>Task:</strong> Write two comment lines, then print <code>Ready</code>.</p>`,
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              creditPoints: CREDIT.hard,
              tests: [
                { input: '', expect_print: 'Ready' },
                { input: null, expect_print: 'Ready' },
                { input: 'note', expect_print: 'Ready' },
                { input: 0, expect_print: 'Ready' },
                { input: {}, expect_print: 'Ready' },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Use // for each note line.',
                  cost: 3,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Print exactly Ready once.',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText:
                    '<code>// note one\\n// note two\\nconsole.log("Ready");</code>',
                  cost: 8,
                },
              ],
            },
          ],
        },

        /* S1.3 — NUMBERS: ADD */
        {
          title: 'S1.3 — Numbers: Add',
          description:
            'Use the + operator to add numbers. Numbers do not need quotes.',
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>In Coin Corner, gnomes stack shiny coins. Numbers join to make bigger piles.</p>

  <h4>✨ The Secret Spell</h4>
  <p>Add with <code>a + b</code>. Zero changes nothing; negatives work too.</p>

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
            'Addition is commutative: a + b == b + a.',
            'Zero is the additive identity.',
            'You can add negatives to move left on the number line.',
          ],
          additionalResources: [
            {
              title: 'MDN — Operators (Arithmetic)',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Expressions_and_Operators#arithmetic_operators',
            },
            {
              title: 'Khan Academy — Addition intro',
              url: 'https://www.khanacademy.org/math/arithmetic/addition-subtraction/addition-within-20/v/adding-within-20',
            },
          ],
          rewardPoints: 60,
          creditPoints: 16,
          challenges: [
            {
              title: 'S1.3 Easy — Add 2 and 3',
              description: `<p><strong>Task:</strong> Print the result of <code>2 + 3</code>.</p>`,
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              creditPoints: CREDIT.easy,
              tests: [
                { input: '', expect_print: 5 },
                { input: null, expect_print: 5 },
                { input: 'x', expect_print: 5 },
                { input: 0, expect_print: 5 },
                { input: {}, expect_print: 5 },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Use numbers without quotes.',
                  cost: 3,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Print just the sum.',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText: '<code>console.log(2 + 3);</code>',
                  cost: 8,
                },
              ],
            },
            {
              title: 'S1.3 Medium — Add the Given Numbers',
              description: `<p><strong>Task:</strong> <code>input</code> is <code>[a, b]</code>. Print <code>a + b</code>.</p>`,
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              creditPoints: CREDIT.medium,
              tests: [
                { input: [2, 3], expect_print: 5 },
                { input: [10, 5], expect_print: 15 },
                { input: [0, 7], expect_print: 7 },
                { input: [-1, 4], expect_print: 3 },
                { input: [1000, 2000], expect_print: 3000 },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Access items: input[0] and input[1].',
                  cost: 3,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Add them and print once.',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText: '<code>console.log(input[0] + input[1]);</code>',
                  cost: 8,
                },
              ],
            },
            {
              title: 'S1.3 Hard — Add a Number and Itself',
              description: `<p><strong>Task:</strong> <code>input</code> is a number <code>n</code>. Print <code>n + n</code>.</p>`,
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              creditPoints: CREDIT.hard,
              tests: [
                { input: 1, expect_print: 2 },
                { input: 5, expect_print: 10 },
                { input: 0, expect_print: 0 },
                { input: -3, expect_print: -6 },
                { input: 10000, expect_print: 20000 },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Use the same variable twice.',
                  cost: 3,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Print only the number.',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText: '<code>console.log(input + input);</code>',
                  cost: 8,
                },
              ],
            },
          ],
        },

        /* S1.4 — SUBTRACT / MULTIPLY / DIVIDE (safe divide messaging) */
        {
          title: 'S1.4 — Numbers: Subtract, Multiply, Divide',
          description:
            'Use - to subtract, * to multiply, and / to divide. If the divisor is 0, print "undefined" for these puzzles.',
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>Gears of the Rainbow Bridge spin with math. Different operators change numbers in different ways.</p>

  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Subtract: <code>a - b</code></li>
    <li>Multiply: <code>a * b</code></li>
    <li>Divide: <code>a / b</code> (guard against dividing by 0)</li>
  </ul>

  <div id="spell"></div>
</div>
      `.trim(),
          runnables: [
            { title: 'Spell 1 — subtraction', code: 'console.log(9 - 5);' },
            { title: 'Spell 2 — multiplication', code: 'console.log(7 * 3);' },
            { title: 'Spell 3 — division', code: 'console.log(12 / 4);' },
            {
              title: 'Spell 4 — zero division (learning)',
              code: 'console.log("Guard against 0 in these puzzles");',
            },
          ],
          trivia: [
            'Multiplication is repeated addition.',
            'Division shares a number into equal groups.',
            'Subtracting can result in negative values.',
          ],
          additionalResources: [
            {
              title: 'MDN — Arithmetic operators',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Expressions_and_Operators#arithmetic_operators',
            },
            {
              title: 'Khan Academy — Multiplication & division intro',
              url: 'https://www.khanacademy.org/math/arithmetic',
            },
          ],
          rewardPoints: 60,
          creditPoints: 16,
          challenges: [
            {
              title: 'S1.4 Easy — Times Table: 3 × 4',
              description: `<p><strong>Task:</strong> Print the result of <code>3 * 4</code>.</p>`,
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              creditPoints: CREDIT.easy,
              tests: [
                { input: '', expect_print: 12 },
                { input: null, expect_print: 12 },
                { input: 'x', expect_print: 12 },
                { input: 0, expect_print: 12 },
                { input: {}, expect_print: 12 },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Use * for multiplication.',
                  cost: 3,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Print just the number.',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText: '<code>console.log(3 * 4);</code>',
                  cost: 8,
                },
              ],
            },
            {
              title: 'S1.4 Medium — Safe Divide',
              description: `<p><strong>Task:</strong> <code>input</code> is <code>[a, b]</code>. Print <code>a / b</code>. If <code>b === 0</code>, print <code>"undefined"</code>.</p>`,
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              creditPoints: CREDIT.medium,
              tests: [
                { input: [8, 2], expect_print: 4 },
                { input: [7, 2], expect_print: 3.5 },
                { input: [5, 0], expect_print: 'undefined' },
                { input: [0, 3], expect_print: 0 },
                { input: [-10, 2], expect_print: -5 },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Check the divisor before dividing.',
                  cost: 3,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'When b is 0, print the string "undefined".',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText:
                    '<code>if (input[1] === 0) { console.log("undefined"); } else { console.log(input[0] / input[1]); }</code>',
                  cost: 8,
                },
              ],
            },
            {
              title: 'S1.4 Hard — Mix: Add Then Multiply',
              description: `<p><strong>Task:</strong> <code>input</code> is <code>[a, b]</code>. Print <code>(a + b) * 2</code>.</p>`,
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              creditPoints: CREDIT.hard,
              tests: [
                { input: [2, 3], expect_print: 10 },
                { input: [0, 0], expect_print: 0 },
                { input: [-1, 4], expect_print: 6 },
                { input: [10, -5], expect_print: 10 },
                { input: [100, 1], expect_print: 202 },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Use parentheses to add before multiplying.',
                  cost: 3,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Print exactly one number.',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText:
                    '<code>console.log((input[0] + input[1]) * 2);</code>',
                  cost: 8,
                },
              ],
            },
          ],
        },

        /* S1.5 — ORDER OF OPERATIONS */
        {
          title: 'S1.5 — Do First Things First (Parentheses)',
          description:
            'Without parentheses, multiply/divide happen before add/subtract. Parentheses let you choose what runs first.',
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>At Puzzle Plaza, brackets decide what happens first.</p>

  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Default order: × and ÷ before + and −.</li>
    <li>Use <code>()</code> to group operations.</li>
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
              title: 'Spell 3 — practice A',
              code: 'console.log(1 + 2 * 3 + 4); // 11',
            },
            {
              title: 'Spell 4 — practice B',
              code: 'console.log((1 + 2) * (3 + 4)); // 21',
            },
          ],
          trivia: [
            'PEMDAS/BODMAS are mnemonics for operation order.',
            'Parentheses act like a spotlight—do this first.',
            'Moving parentheses can change the result a lot.',
          ],
          additionalResources: [
            {
              title: 'Khan Academy — Order of operations',
              url: 'https://www.khanacademy.org/math/arithmetic/arith-review-order-of-operations',
            },
            {
              title: 'MDN — Operator precedence',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence',
            },
          ],
          rewardPoints: 60,
          creditPoints: 16,
          challenges: [
            {
              title: 'S1.5 Easy — No Brackets',
              description: `<p><strong>Task:</strong> <code>input = [a, b, c]</code>. Print <code>a + b * c</code> (no parentheses).</p>`,
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              creditPoints: CREDIT.easy,
              tests: [
                { input: [2, 3, 4], expect_print: 14 },
                { input: [2, 0, 10], expect_print: 2 },
                { input: [10, 2, 3], expect_print: 16 },
                { input: [-1, 5, 2], expect_print: 9 },
                { input: [100, 1, 1], expect_print: 101 },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Multiply first, then add.',
                  cost: 3,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'No parentheses here.',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText:
                    '<code>console.log(input[0] + input[1] * input[2]);</code>',
                  cost: 8,
                },
              ],
            },
            {
              title: 'S1.5 Medium — Use Brackets',
              description: `<p><strong>Task:</strong> <code>input = [a, b, c]</code>. Print <code>(a + b) * c</code>.</p>`,
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              creditPoints: CREDIT.medium,
              tests: [
                { input: [2, 3, 4], expect_print: 20 },
                { input: [2, 0, 10], expect_print: 20 },
                { input: [10, 2, 3], expect_print: 36 },
                { input: [-1, 5, 2], expect_print: 8 },
                { input: [100, 1, 1], expect_print: 101 },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Add inside parentheses first.',
                  cost: 3,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Then multiply by c.',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText:
                    '<code>console.log((input[0] + input[1]) * input[2]);</code>',
                  cost: 8,
                },
              ],
            },
            {
              title: 'S1.5 Hard — Small Puzzle',
              description: `<p><strong>Task:</strong> <code>input = [a, b, c]</code>. Print <code>a * (b + c) - a</code>.</p>`,
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              creditPoints: CREDIT.hard,
              tests: [
                { input: [2, 3, 4], expect_print: 10 },
                { input: [1, 1, 1], expect_print: 1 },
                { input: [5, 5, 0], expect_print: 20 },
                { input: [0, 10, 10], expect_print: 0 },
                { input: [-2, 3, 1], expect_print: -6 },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Group b + c first.',
                  cost: 3,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Multiply by a, then subtract a.',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText:
                    '<code>console.log(input[0] * (input[1] + input[2]) - input[0]);</code>',
                  cost: 8,
                },
              ],
            },
          ],
        },

        /* S1.6 — STRINGS: QUOTES & ESCAPES */
        {
          title: 'S1.6 — Words with Quotes',
          description:
            'Place quotes inside strings either by switching outer quotes or escaping with a backslash.',
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>At Quote Quay, Zia prints speech and contractions cleanly.</p>

  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Double outside: <code>"It's sunny"</code></li>
    <li>Escape inside: <code>'It\\'s sunny'</code></li>
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
            'Choose inner/outer quotes to avoid escaping.',
            'A backslash \\ lets a quote appear inside the same quotes.',
            'Both styles are common—pick the most readable.',
          ],
          additionalResources: [
            {
              title: 'MDN — String literals',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String#string_literals',
            },
          ],
          rewardPoints: 60,
          creditPoints: 16,
          challenges: [
            {
              title: 'S1.6 Easy — It’s Sunny',
              description: `<p><strong>Task:</strong> Print exactly <code>It's sunny</code>.</p>`,
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              creditPoints: CREDIT.easy,
              tests: [
                { input: '', expect_print: "It's sunny" },
                { input: null, expect_print: "It's sunny" },
                { input: 'x', expect_print: "It's sunny" },
                { input: 0, expect_print: "It's sunny" },
                { input: {}, expect_print: "It's sunny" },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText:
                    'Use double quotes outside, or escape the apostrophe.',
                  cost: 3,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Match spacing and casing exactly.',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText: '<code>console.log("It\'s sunny");</code>',
                  cost: 8,
                },
              ],
            },
            {
              title: 'S1.6 Medium — He Said, "Hello".',
              description: `<p><strong>Task:</strong> Print exactly <code>He said, "Hello".</code> (include the double quotes).</p>`,
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              creditPoints: CREDIT.medium,
              tests: [
                { input: '', expect_print: 'He said, "Hello".' },
                { input: null, expect_print: 'He said, "Hello".' },
                { input: 'Z', expect_print: 'He said, "Hello".' },
                { input: 1, expect_print: 'He said, "Hello".' },
                { input: {}, expect_print: 'He said, "Hello".' },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText:
                    'Wrap the whole string in single quotes to include double quotes easily.',
                  cost: 3,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Check comma and period.',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText: '<code>console.log(\'He said, "Hello".\');</code>',
                  cost: 8,
                },
              ],
            },
            {
              title: 'S1.6 Hard — Name Says a Word',
              description: `<p><strong>Task:</strong> <code>input = [name, word]</code>. Print <code>name says "word"!</code></p>`,
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              creditPoints: CREDIT.hard,
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
                {
                  displayText: 'Hint 1',
                  hintText: 'Build the sentence using +.',
                  cost: 3,
                },
                {
                  displayText: 'Hint 2',
                  hintText:
                    'Wrap the second value in double quotes in the output.',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText:
                    "<code>console.log(input[0] + ' says \"' + input[1] + '\"!');</code>",
                  cost: 8,
                },
              ],
            },
          ],
        },

        /* S1.7 — STRINGS: JOIN (no template strings yet) */
        {
          title: 'S1.7 — Joining Words',
          description:
            'Glue pieces of text with +. Add a single space character between words explicitly.',
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>At Sign Street, letters hold hands—spacing makes signs easy to read.</p>

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
            'A single space is also a character.',
            'Joining builds names, labels, and sentences.',
            'Empty strings are valid pieces—keep the space you add.',
          ],
          additionalResources: [
            {
              title: 'MDN — String concatenation',
              url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps/Strings#concatenation',
            },
          ],
          rewardPoints: 60,
          creditPoints: 16,
          challenges: [
            {
              title: 'S1.7 Easy — Join Two Words',
              description: `<p><strong>Task:</strong> <code>input = [a, b]</code>. Print <code>a</code> and <code>b</code> with one space between.</p>`,
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              creditPoints: CREDIT.easy,
              tests: [
                { input: ['Hello', 'world'], expect_print: 'Hello world' },
                { input: ['Red', 'Balloon'], expect_print: 'Red Balloon' },
                { input: ['A', ''], expect_print: 'A ' },
                { input: ['', 'B'], expect_print: ' B' },
                { input: ['', ''], expect_print: ' ' },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Add exactly one space between pieces.',
                  cost: 3,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Do not trim—empty pieces are allowed.',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText:
                    '<code>console.log(input[0] + " " + input[1]);</code>',
                  cost: 8,
                },
              ],
            },
            {
              title: 'S1.7 Medium — Hello, Name.',
              description: `<p><strong>Task:</strong> <code>input</code> is a name. Print <code>Hello, &lt;name&gt;.</code></p>`,
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              creditPoints: CREDIT.medium,
              tests: [
                { input: 'Zia', expect_print: 'Hello, Zia.' },
                { input: 'Pax', expect_print: 'Hello, Pax.' },
                { input: 'A', expect_print: 'Hello, A.' },
                { input: '', expect_print: 'Hello, .' },
                { input: 'World', expect_print: 'Hello, World.' },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText:
                    'Join literal pieces with the name and punctuation.',
                  cost: 3,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Keep comma and period.',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText:
                    '<code>console.log("Hello, " + input + ".");</code>',
                  cost: 8,
                },
              ],
            },
            {
              title: 'S1.7 Hard — Three Words Line',
              description: `<p><strong>Task:</strong> <code>input = [a, b, c]</code>. Print <code>a b c</code> with exactly one space between each.</p>`,
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              creditPoints: CREDIT.hard,
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
                {
                  displayText: 'Hint 1',
                  hintText: 'Join in order with spaces.',
                  cost: 3,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Empty parts still keep their spaces.',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText:
                    '<code>console.log(input[0] + " " + input[1] + " " + input[2]);</code>',
                  cost: 8,
                },
              ],
            },
          ],
        },

        /* S1.8 — STRINGS: LENGTH & FIRST/LAST */
        {
          title: 'S1.8 — How Long? First and Last',
          description:
            'Measure strings with .length, take the first character with [0], and the last with [length - 1].',
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>Letter Counters measure words like rulers. Badges need first and last letters.</p>

  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Length: <code>word.length</code></li>
    <li>First letter: <code>word[0]</code></li>
    <li>Last letter: <code>word[word.length - 1]</code></li>
  </ul>

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
              title: 'Spell 4 — empty length',
              code: "console.log(''.length);",
            },
          ],
          trivia: [
            'Spaces, punctuation, and emojis count in length.',
            'Indexing starts at 0.',
            'The last index is length - 1.',
          ],
          additionalResources: [
            {
              title: 'MDN — String length',
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
              description: `<p><strong>Task:</strong> <code>input</code> is a word. Print <code>input.length</code>.</p>`,
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              creditPoints: CREDIT.easy,
              tests: [
                { input: 'cat', expect_print: 3 },
                { input: 'robot', expect_print: 5 },
                { input: 'A', expect_print: 1 },
                { input: '', expect_print: 0 },
                { input: 'hi there', expect_print: 8 },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Use the .length property.',
                  cost: 3,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Spaces count too.',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText: '<code>console.log(input.length);</code>',
                  cost: 8,
                },
              ],
            },
            {
              title: 'S1.8 Medium — First-Last Format',
              description: `<p><strong>Task:</strong> <code>input</code> is a word. If empty, print <code>-</code>. Otherwise print <code>first-last</code>.</p>`,
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              creditPoints: CREDIT.medium,
              tests: [
                { input: 'hello', expect_print: 'h-o' },
                { input: 'Pax', expect_print: 'P-x' },
                { input: 'Z', expect_print: 'Z-Z' },
                { input: '', expect_print: '-' },
                { input: 'ab', expect_print: 'a-b' },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Check for empty first.',
                  cost: 3,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Use input[0] and input[input.length - 1].',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText:
                    '<code>if (input.length === 0) { console.log("-"); } else { console.log(input[0] + "-" + input[input.length - 1]); }</code>',
                  cost: 8,
                },
              ],
            },
            {
              title: 'S1.8 Hard — Middle Peek',
              description: `<p><strong>Task:</strong> <code>input</code> is a word. If length is odd, print the middle 1 letter; if even, print the middle 2 letters; if empty, print an empty line.</p>`,
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              creditPoints: CREDIT.hard,
              tests: [
                { input: 'cat', expect_print: 'a' },
                { input: 'code', expect_print: 'od' },
                { input: 'A', expect_print: 'A' },
                { input: '', expect_print: '' },
                { input: 'robot', expect_print: 'b' },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Let n = input.length.',
                  cost: 3,
                },
                {
                  displayText: 'Hint 2',
                  hintText:
                    'Odd: index Math.floor(n/2). Even: take n/2-1 and n/2.',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText:
                    '<code>const n = input.length; if (n === 0) { console.log(""); } else if (n % 2 === 1) { console.log(input[Math.floor(n/2)]); } else { console.log(input[n/2 - 1] + input[n/2]); }</code>',
                  cost: 8,
                },
              ],
            },
          ],
        },
      ],
    };

    const chapter2: Chapter = {
      title: 'Chapter 2 — Pockets, Paths, and Choices',
      coverImage: 'https://cdn.example.com/cover/ch2-pockets-paths-choices.jpg',
      description:
        'Zia and Pax discover satchels where numbers and words can be stored—variables! They learn how to compare values and speak in true/false (booleans), then use if-statements to make tiny choices in their code. By gently practicing comparisons and conditions, they unlock doors that open only for the right answers. Each lesson is friendly, slow, and designed for absolute beginners.',
      rewardPoints: 100, // chapter completion bonus
      creditPoints: 40, // chapter completion bonus
      sections: [
        // S2.1 VARIABLES
        {
          title: 'S2.1 — Little Pockets (Variables)',
          coverImage:
            'https://cdn.example.com/cover/sections/ch2-01-variables.jpg',
          description:
            'Think of variables as little pockets that hold values for later. We use let to create a pocket whose value can change and const for a pocket that should stay the same. Names should be short and clear so future you understands them. In this lesson, you’ll make pockets for words and numbers and print what is inside.',
          rewardPoints: SECTION_BONUS.rewardPoints,
          creditPoints: SECTION_BONUS.creditPoints,
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>In the Pack Square, the Pouch Maker hands Zia tiny pockets labeled with names. “Put a value here, take it out later,” she says. Pax practices placing numbers and words into pockets and showing them on the screen.</p>
  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Create a changeable pocket: <code>let name = 'Zia';</code></li>
    <li>Create a steady pocket: <code>const city = 'Codeville';</code></li>
    <li>Print what’s inside: <code>console.log(name);</code></li>
  </ul>
  <div id="spell"></div>
</div>
      `.trim(),
          trivia: [
            'Use <code>let</code> for values that will change; <code>const</code> for values that should stay the same.',
            'Variable names often use <em>camelCase</em> like <code>favoriteColor</code>.',
            'Variables help avoid retyping the same literal over and over.',
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
          runnables: [
            {
              title: 'Spell — make a pocket',
              code: "let name = 'Zia'; console.log(name);",
            },
            {
              title: 'Spell — steady pocket',
              code: "const city = 'Codeville'; console.log(city);",
            },
            {
              title: 'Spell — change the value',
              code: "let mood='happy'; console.log(mood); mood='excited'; console.log(mood);",
            },
            {
              title: 'Spell — numbers in pockets',
              code: 'let a=2; let b=3; console.log(a+b);',
            },
          ],
          challenges: [
            {
              title: 'S2.1 Easy — Store and Show',
              description:
                '<p><strong>Task:</strong> Make a variable named <code>pet</code> with the value <code>"cat"</code>. Print it.</p>',
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              creditPoints: CREDIT.easy,
              tests: [
                { input: '', expect_print: 'cat' },
                { input: null, expect_print: 'cat' },
                { input: 0, expect_print: 'cat' },
                { input: 'ignored', expect_print: 'cat' },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText:
                    'Create a variable with let and assign the string "cat".',
                  cost: 5,
                },
                {
                  displayText: 'Hint 2',
                  hintText:
                    'After creating pet, print it using console.log(pet).',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText: "let pet = 'cat';\nconsole.log(pet);",
                  cost: 10,
                },
              ],
            },
            {
              title: 'S2.1 Medium — Update a Pocket',
              description:
                '<p><strong>Task:</strong> Make <code>count</code> start at <code>1</code>. Change it to <code>2</code>. Print only the new value.</p>',
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              creditPoints: CREDIT.medium,
              tests: [
                { input: '', expect_print: 2 },
                { input: null, expect_print: 2 },
                { input: 'x', expect_print: 2 },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Use let so the value can change.',
                  cost: 7,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Assign 1, then reassign to 2, and print once.',
                  cost: 7,
                },
                {
                  displayText: 'Solution',
                  hintText: 'let count = 1;\ncount = 2;\nconsole.log(count);',
                  cost: 12,
                },
              ],
            },
            {
              title: 'S2.1 Hard — Two Pockets, One Sum',
              description:
                '<p><strong>Task:</strong> Make two variables: <code>a = 4</code> and <code>b = 6</code>. Print their sum.</p>',
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              creditPoints: CREDIT.hard,
              tests: [
                { input: '', expect_print: 10 },
                { input: null, expect_print: 10 },
                { input: 'n/a', expect_print: 10 },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Create two number variables with let.',
                  cost: 9,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Add them and print the total.',
                  cost: 9,
                },
                {
                  displayText: 'Solution',
                  hintText: 'let a = 4; let b = 6;\nconsole.log(a + b);',
                  cost: 15,
                },
              ],
            },
          ],
        },

        // S2.2 MODULO
        {
          title: 'S2.2 — Sharing Fairly (Remainder %)',
          coverImage:
            'https://cdn.example.com/cover/sections/ch2-02-modulo.jpg',
          description:
            'Sometimes numbers don’t split evenly. The modulo operator % tells you what’s left over after division. It’s useful for patterns like even/odd and for wrapping around in small cycles. In this lesson, you’ll learn to peek at the remainder and print the result safely.',
          rewardPoints: SECTION_BONUS.rewardPoints,
          creditPoints: SECTION_BONUS.creditPoints,
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>At Circle Court, coins are shared among sprites. When the last sprite gets one coin too few, the remainder pebble clinks into a bowl. Zia listens and counts the leftovers.</p>
  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Remainder: <code>a % b</code> (what’s left after dividing a by b)</li>
    <li>Even check: <code>n % 2 === 0</code></li>
  </ul>
  <div id="spell"></div>
</div>
      `.trim(),
          trivia: [
            '<code>7 % 3</code> is <code>1</code> because 3+3=6 and 1 is left.',
            'Modulo helps detect even/odd and repeating patterns.',
            'Modulo works with negatives in JS (sign follows the dividend).',
          ],
          additionalResources: [
            {
              title: 'MDN — Remainder operator (%)',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder',
            },
            {
              title: 'javascript.info — Operators',
              url: 'https://javascript.info/operators',
            },
          ],
          runnables: [
            { title: 'Spell — simple remainder', code: 'console.log(7 % 3);' },
            {
              title: 'Spell — even',
              code: 'let n=10; console.log(n % 2 === 0);',
            },
            {
              title: 'Spell — odd',
              code: 'let n=11; console.log(n % 2 !== 0);',
            },
          ],
          challenges: [
            {
              title: 'S2.2 Easy — 10 % 4',
              description:
                '<p><strong>Task:</strong> Print the remainder when 10 is divided by 4.</p>',
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              creditPoints: CREDIT.easy,
              tests: [
                { input: '', expect_print: 2 },
                { input: null, expect_print: 2 },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Use the remainder operator with 10 % 4.',
                  cost: 5,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Print the numeric result only.',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText: 'console.log(10 % 4);',
                  cost: 10,
                },
              ],
            },
            {
              title: 'S2.2 Medium — Even or Odd',
              description:
                '<p><strong>Task:</strong> You receive a number in <code>input</code>. If it is even, print <code>"even"</code>. If it is odd, print <code>"odd"</code>.</p>',
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              creditPoints: CREDIT.medium,
              tests: [
                { input: 4, expect_print: 'even' },
                { input: 7, expect_print: 'odd' },
                { input: 0, expect_print: 'even' },
                { input: -3, expect_print: 'odd' },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Check input % 2 === 0 for even.',
                  cost: 7,
                },
                {
                  displayText: 'Hint 2',
                  hintText:
                    'Use an if/else or conditional logic to print the word.',
                  cost: 7,
                },
                {
                  displayText: 'Solution',
                  hintText:
                    "if (input % 2 === 0) { console.log('even'); } else { console.log('odd'); }",
                  cost: 12,
                },
              ],
            },
            {
              title: 'S2.2 Hard — Remainder Label',
              description:
                '<p><strong>Task:</strong> You receive <code>input</code> as an array <code>[a, b]</code>. Print <code>a % b</code>. If <code>b</code> is <code>0</code>, print <code>"undefined"</code>.</p>',
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              creditPoints: CREDIT.hard,
              tests: [
                { input: [7, 3], expect_print: 1 },
                { input: [10, 5], expect_print: 0 },
                { input: [1, 0], expect_print: 'undefined' },
                { input: [-7, 3], expect_print: -1 },
                { input: [7, -3], expect_print: 1 },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'First guard for division by zero (b === 0).',
                  cost: 9,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Otherwise print a % b directly.',
                  cost: 9,
                },
                {
                  displayText: 'Solution',
                  hintText:
                    "const a = input[0]; const b = input[1];\nif (b === 0) { console.log('undefined'); }\nelse { console.log(a % b); }",
                  cost: 15,
                },
              ],
            },
          ],
        },

        // S2.3 COMPARISONS
        {
          title: 'S2.3 — Comparing Things (===, >, <, ≥, ≤)',
          coverImage:
            'https://cdn.example.com/cover/sections/ch2-03-comparisons.jpg',
          description:
            'Computers ask questions by comparing values. The result is true or false, like a tiny yes/no. We will use strict equality (===) and the usual greater/less signs to compare numbers and words. Reading these results helps us make choices later with if-statements.',
          rewardPoints: SECTION_BONUS.rewardPoints,
          creditPoints: SECTION_BONUS.creditPoints,
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>At Balance Bridge, two plates hold values to compare. Zia and Pax place numbers on each side and watch the pointer flip to “true” or “false”.</p>
  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>Equal: <code>a === b</code></li>
    <li>Greater: <code>a > b</code>, Less: <code>a < b</code></li>
    <li>Greater or equal: <code>a >= b</code>, Less or equal: <code>a <= b</code></li>
  </ul>
  <div id="spell"></div>
</div>
      `.trim(),
          trivia: [
            '<code>===</code> checks both value and type; avoid loose <code>==</code> as a beginner.',
            'Comparisons evaluate to booleans: <code>true</code> or <code>false</code>.',
            'Strings compare lexicographically: <code>"apple" &lt; "banana"</code> is <code>true</code>.',
          ],
          additionalResources: [
            {
              title: 'MDN — Comparison operators',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Comparison',
            },
            {
              title: 'javascript.info — Comparison',
              url: 'https://javascript.info/comparison',
            },
          ],
          runnables: [
            { title: 'Spell — equals', code: 'console.log(3 === 3);' },
            { title: 'Spell — greater', code: 'console.log(5 > 2);' },
            { title: 'Spell — less or equal', code: 'console.log(4 <= 4);' },
            {
              title: 'Spell — string compare',
              code: "console.log('apple' < 'banana');",
            },
          ],
          challenges: [
            {
              title: 'S2.3 Easy — True or False',
              description:
                '<p><strong>Task:</strong> Print the result of <code>7 &gt; 5</code>.</p>',
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              creditPoints: CREDIT.easy,
              tests: [
                { input: '', expect_print: true },
                { input: null, expect_print: true },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Use the greater-than operator >.',
                  cost: 5,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Print the boolean directly.',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText: 'console.log(7 > 5);',
                  cost: 10,
                },
              ],
            },
            {
              title: 'S2.3 Medium — Check Match',
              description:
                '<p><strong>Task:</strong> You receive <code>input</code> as <code>[a, b]</code>. Print <code>true</code> if <code>a === b</code>, otherwise <code>false</code>.</p>',
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              creditPoints: CREDIT.medium,
              tests: [
                { input: [3, 3], expect_print: true },
                { input: [3, 4], expect_print: false },
                { input: ['5', 5], expect_print: false },
                { input: ['hi', 'hi'], expect_print: true },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Use strict equality (===).',
                  cost: 7,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Read from input[0] and input[1].',
                  cost: 7,
                },
                {
                  displayText: 'Solution',
                  hintText:
                    'const a = input[0], b = input[1];\nconsole.log(a === b);',
                  cost: 12,
                },
              ],
            },
            {
              title: 'S2.3 Hard — Between Check',
              description:
                '<p><strong>Task:</strong> You receive <code>input</code> as <code>[n, low, high]</code>. Print <code>true</code> if <code>n</code> is between <code>low</code> and <code>high</code> (inclusive); otherwise <code>false</code>.</p>',
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              creditPoints: CREDIT.hard,
              tests: [
                { input: [5, 1, 5], expect_print: true },
                { input: [0, 1, 5], expect_print: false },
                { input: [3, 3, 7], expect_print: true },
                { input: [8, 3, 7], expect_print: false },
                { input: [7, 7, 7], expect_print: true },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Use >= for the low end and <= for the high end.',
                  cost: 9,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Combine with && so both conditions must be true.',
                  cost: 9,
                },
                {
                  displayText: 'Solution',
                  hintText:
                    'const [n, low, high] = input;\nconsole.log(n >= low && n <= high);',
                  cost: 15,
                },
              ],
            },
          ],
        },

        // S2.4 LOGIC
        {
          title: 'S2.4 — Tiny Truths (Booleans & Logic)',
          coverImage: 'https://cdn.example.com/cover/sections/ch2-04-logic.jpg',
          description:
            'Booleans are tiny truth values: true or false. We can glue them together with AND (&&), OR (||), and flip them with NOT (!). These building blocks help us ask more than one question at a time.',
          rewardPoints: SECTION_BONUS.rewardPoints,
          creditPoints: SECTION_BONUS.creditPoints,
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>In Lantern Lane, lights turn on if two switches agree. Zia learns the secret signals: AND means both, OR means at least one, and NOT flips the answer.</p>
  <h4>✨ The Secret Spell</h4>
  <ul>
    <li>AND: <code>a && b</code> (true if both are true)</li>
    <li>OR: <code>a || b</code> (true if at least one is true)</li>
    <li>NOT: <code>!a</code> (flips true/false)</li>
  </ul>
  <div id="spell"></div>
</div>
      `.trim(),
          trivia: [
            'Think of AND as “both switches on”.',
            'OR is true if at least one side is true.',
            'NOT flips the boolean value.',
          ],
          additionalResources: [
            {
              title: 'MDN — Logical operators',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_Operators',
            },
            {
              title: 'javascript.info — Logical operators',
              url: 'https://javascript.info/logical-operators',
            },
          ],
          runnables: [
            { title: 'Spell — both true', code: 'console.log(true && true);' },
            {
              title: 'Spell — one is enough',
              code: 'console.log(false || true);',
            },
            { title: 'Spell — flip it', code: 'console.log(!false);' },
            {
              title: 'Spell — mix with comparisons',
              code: 'let a=5; console.log(a>=1 && a<=10);',
            },
          ],
          challenges: [
            {
              title: 'S2.4 Easy — At Least One',
              description:
                '<p><strong>Task:</strong> Print the result of <code>true || false</code>.</p>',
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              creditPoints: CREDIT.easy,
              tests: [
                { input: '', expect_print: true },
                { input: null, expect_print: true },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Use the OR operator (||).',
                  cost: 5,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Print the boolean directly.',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText: 'console.log(true || false);',
                  cost: 10,
                },
              ],
            },
            {
              title: 'S2.4 Medium — In Range AND',
              description:
                '<p><strong>Task:</strong> You receive a number in <code>input</code>. Print <code>true</code> if <code>1 ≤ input ≤ 10</code>, else <code>false</code>.</p>',
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              creditPoints: CREDIT.medium,
              tests: [
                { input: 5, expect_print: true },
                { input: 1, expect_print: true },
                { input: 10, expect_print: true },
                { input: 0, expect_print: false },
                { input: 11, expect_print: false },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Join (input >= 1) and (input <= 10) with &&.',
                  cost: 7,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Print the boolean result directly.',
                  cost: 7,
                },
                {
                  displayText: 'Solution',
                  hintText: 'console.log(input >= 1 && input <= 10);',
                  cost: 12,
                },
              ],
            },
            {
              title: 'S2.4 Hard — Not Empty',
              description:
                '<p><strong>Task:</strong> You receive a string in <code>input</code>. Print <code>true</code> if it is not empty (length &gt; 0), else <code>false</code>.</p>',
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              creditPoints: CREDIT.hard,
              tests: [
                { input: 'hi', expect_print: true },
                { input: '', expect_print: false },
                { input: 'a', expect_print: true },
                { input: ' ', expect_print: true },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Check input.length > 0.',
                  cost: 9,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Print true or false accordingly.',
                  cost: 9,
                },
                {
                  displayText: 'Solution',
                  hintText: 'console.log(input.length > 0);',
                  cost: 15,
                },
              ],
            },
          ],
        },

        // S2.5 IF
        {
          title: 'S2.5 — If This, Then That',
          coverImage: 'https://cdn.example.com/cover/sections/ch2-05-if.jpg',
          description:
            'If-statements let your code make a choice. When a condition is true, a block of code runs; otherwise it is skipped. We start with a single if to keep it simple.',
          rewardPoints: SECTION_BONUS.rewardPoints,
          creditPoints: SECTION_BONUS.creditPoints,
          content: `
<div style="display:flex;flex-direction:column;gap:20px;margin:auto;">
  <h4>🗺️ The Encounter</h4>
  <p>At Choice Corner, a door opens only if you say the secret number. Zia learns to test a condition and speak when it’s true.</p>
  <h4>✨ The Secret Spell</h4>
  <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:8px;"><code>if (condition) {
  console.log('Yes!');
}</code></pre>
  <div id="spell"></div>
</div>
      `.trim(),
          trivia: [
            'If the condition is false, the body does not run.',
            'Conditions usually use comparisons and booleans.',
            'Curly braces <code>{}</code> hold the code to run when true.',
          ],
          additionalResources: [
            {
              title: 'MDN — if...else',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/if...else',
            },
            {
              title: 'javascript.info — Conditional operators',
              url: 'https://javascript.info/ifelse',
            },
          ],
          runnables: [
            {
              title: 'Spell — simple if',
              code: "let n=3; if (n>2) { console.log('big'); }",
            },
            {
              title: 'Spell — no print when false',
              code: "let n=1; if (n>2) { console.log('big'); }",
            },
          ],
          challenges: [
            {
              title: 'S2.5 Easy — If Nice',
              description:
                '<p><strong>Task:</strong> You receive a number in <code>input</code>. If <code>input &gt; 5</code>, print <code>"nice"</code>. Otherwise, print nothing.</p>',
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              creditPoints: CREDIT.easy,
              tests: [
                { input: 6, expect_print: 'nice' },
                { input: 5, expect_print: '' },
                { input: -1, expect_print: '' },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Use if (input > 5) { ... }',
                  cost: 5,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Only print inside the true branch.',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText: "if (input > 5) { console.log('nice'); }",
                  cost: 10,
                },
              ],
            },
            {
              title: 'S2.5 Medium — If Even',
              description:
                '<p><strong>Task:</strong> You receive <code>input</code>. If it is even, print <code>"even"</code>. Else, print nothing.</p>',
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              creditPoints: CREDIT.medium,
              tests: [
                { input: 8, expect_print: 'even' },
                { input: 3, expect_print: '' },
                { input: 0, expect_print: 'even' },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Even means input % 2 === 0.',
                  cost: 7,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Print only when the condition is true.',
                  cost: 7,
                },
                {
                  displayText: 'Solution',
                  hintText: "if (input % 2 === 0) { console.log('even'); }",
                  cost: 12,
                },
              ],
            },
            {
              title: 'S2.5 Hard — If In Range',
              description:
                '<p><strong>Task:</strong> You receive <code>input</code>. If <code>1 &le; input &le; 10</code>, print <code>"ok"</code>. Else, print nothing.</p>',
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              creditPoints: CREDIT.hard,
              tests: [
                { input: 1, expect_print: 'ok' },
                { input: 10, expect_print: 'ok' },
                { input: 0, expect_print: '' },
                { input: 11, expect_print: '' },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Use input >= 1 && input <= 10.',
                  cost: 9,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Only print when the check is true.',
                  cost: 9,
                },
                {
                  displayText: 'Solution',
                  hintText:
                    "if (input >= 1 && input <= 10) { console.log('ok'); }",
                  cost: 15,
                },
              ],
            },
          ],
        },

        // S2.6 IF/ELSE
        {
          title: 'S2.6 — Choose A or B (if/else)',
          coverImage:
            'https://cdn.example.com/cover/sections/ch2-06-if-else.jpg',
          description:
            'Now we add an else part: if the condition is true, do one thing; otherwise, do another. This makes the program speak in two possible ways. Practice with simple choices like even/odd to get comfortable.',
          rewardPoints: SECTION_BONUS.rewardPoints,
          creditPoints: SECTION_BONUS.creditPoints,
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
          trivia: [
            'Exactly one branch runs—never both.',
            'Use clear, short messages in each branch.',
            'Conditions can use comparisons, modulo, and logic.',
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
          runnables: [
            {
              title: 'Spell — even/odd',
              code: "let n=7; if (n%2===0){console.log('even');} else {console.log('odd');}",
            },
            {
              title: 'Spell — pass/fail',
              code: "let score=6; if (score>=5){console.log('pass');} else {console.log('try again');}",
            },
          ],
          challenges: [
            {
              title: 'S2.6 Easy — Even/Odd',
              description:
                '<p><strong>Task:</strong> You receive <code>input</code>. Print <code>"even"</code> if even, otherwise <code>"odd"</code>.</p>',
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              creditPoints: CREDIT.easy,
              tests: [
                { input: 4, expect_print: 'even' },
                { input: 9, expect_print: 'odd' },
                { input: 0, expect_print: 'even' },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Use if/else with input % 2 === 0.',
                  cost: 5,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Print exactly "even" or "odd".',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText:
                    "if (input % 2 === 0) { console.log('even'); } else { console.log('odd'); }",
                  cost: 10,
                },
              ],
            },
            {
              title: 'S2.6 Medium — Age Gate',
              description:
                '<p><strong>Task:</strong> You receive <code>input</code> as <code>age</code>. If <code>age &ge; 13</code>, print <code>"allowed"</code>. Else print <code>"blocked"</code>.</p>',
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              creditPoints: CREDIT.medium,
              tests: [
                { input: 13, expect_print: 'allowed' },
                { input: 12, expect_print: 'blocked' },
                { input: 18, expect_print: 'allowed' },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Compare input against 13 using >=.',
                  cost: 7,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Choose one of two messages with else.',
                  cost: 7,
                },
                {
                  displayText: 'Solution',
                  hintText:
                    "if (input >= 13) { console.log('allowed'); } else { console.log('blocked'); }",
                  cost: 12,
                },
              ],
            },
            {
              title: 'S2.6 Hard — Inside or Outside',
              description:
                '<p><strong>Task:</strong> You receive a number in <code>input</code>. If <code>1 ≤ input ≤ 10</code>, print <code>"inside"</code>. Else print <code>"outside"</code>.</p>',
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              creditPoints: CREDIT.hard,
              tests: [
                { input: 1, expect_print: 'inside' },
                { input: 10, expect_print: 'inside' },
                { input: 0, expect_print: 'outside' },
                { input: 11, expect_print: 'outside' },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Join two comparisons with &&.',
                  cost: 9,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Remember to print exactly one word.',
                  cost: 9,
                },
                {
                  displayText: 'Solution',
                  hintText:
                    "if (input >= 1 && input <= 10) { console.log('inside'); } else { console.log('outside'); }",
                  cost: 15,
                },
              ],
            },
          ],
        },
      ],
    };

    const chapter3: Chapter = {
      title: 'Chapter 3 — Little Lists and Lineups (Arrays)',
      coverImage: 'https://cdn.example.com/cover/ch3-lists-lineups-arrays.jpg',
      description:
        'Zia and Pax find shelves where many values sit in order—these are arrays. They learn to create arrays, count how many items there are, and pick items by position. Then they practice adding and removing items at the ends. Everything stays beginner-friendly, with careful steps, clear examples, and tiny challenges.',
      rewardPoints: 80, // chapter completion bonus
      creditPoints: 30, // chapter completion bonus
      sections: [
        // S3.1 CREATE ARRAYS
        {
          title: 'S3.1 — Make a Line (Create Arrays)',
          coverImage:
            'https://cdn.example.com/cover/sections/ch3-01-create-arrays.jpg',
          description:
            'An array is a lineup of values inside square brackets. Items are separated by commas, and you can mix numbers and strings. Start with small arrays and print them to see what they look like.',
          rewardPoints: SECTION_BONUS.rewardPoints,
          creditPoints: SECTION_BONUS.creditPoints,
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
          trivia: [
            'Arrays remember the order of items.',
            'You can mix strings and numbers in one array.',
            'Empty array <code>[]</code> has length 0.',
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
          runnables: [
            {
              title: 'Spell — two colors',
              code: "let colors=['red','blue']; console.log(colors);",
            },
            {
              title: 'Spell — mixed items',
              code: "let stuff=['cup',3,'hat']; console.log(stuff);",
            },
            {
              title: 'Spell — empty shelf',
              code: 'let empty=[]; console.log(empty);',
            },
          ],
          challenges: [
            {
              title: 'S3.1 Easy — Two Pets',
              description:
                '<p><strong>Task:</strong> Create <code>["cat","dog"]</code> and print the array.</p>',
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              creditPoints: CREDIT.easy,
              tests: [
                { input: '', expect_print: '["cat","dog"]' },
                { input: null, expect_print: '["cat","dog"]' },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Use square brackets with a comma between items.',
                  cost: 5,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Print the entire array variable.',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText:
                    'const pets = ["cat","dog"]; console.log(JSON.stringify(pets));',
                  cost: 10,
                },
              ],
            },
            {
              title: 'S3.1 Medium — Three Numbers',
              description:
                '<p><strong>Task:</strong> Create <code>[1,2,3]</code> and print it as an array.</p>',
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              creditPoints: CREDIT.medium,
              tests: [
                { input: '', expect_print: '[1,2,3]' },
                { input: null, expect_print: '[1,2,3]' },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Numbers do not need quotes.',
                  cost: 7,
                },
                {
                  displayText: 'Hint 2',
                  hintText:
                    'Use JSON.stringify to match exact print if needed.',
                  cost: 7,
                },
                {
                  displayText: 'Solution',
                  hintText:
                    'const nums = [1,2,3]; console.log(JSON.stringify(nums));',
                  cost: 12,
                },
              ],
            },
            {
              title: 'S3.1 Hard — Mixed Trio',
              description:
                '<p><strong>Task:</strong> Create <code>["sun",7,"moon"]</code> and print it as an array.</p>',
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              creditPoints: CREDIT.hard,
              tests: [
                { input: '', expect_print: '["sun",7,"moon"]' },
                { input: null, expect_print: '["sun",7,"moon"]' },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Mix strings and numbers appropriately.',
                  cost: 9,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Match the exact order.',
                  cost: 9,
                },
                {
                  displayText: 'Solution',
                  hintText:
                    'const a = ["sun",7,"moon"]; console.log(JSON.stringify(a));',
                  cost: 15,
                },
              ],
            },
          ],
        },

        // S3.2 LENGTH
        {
          title: 'S3.2 — How Many? (.length)',
          coverImage:
            'https://cdn.example.com/cover/sections/ch3-02-length.jpg',
          description:
            'Arrays know how many items they have. The length property tells you the count. We’ll try it with empty arrays and longer ones to see how it changes.',
          rewardPoints: SECTION_BONUS.rewardPoints,
          creditPoints: SECTION_BONUS.creditPoints,
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
          trivia: [
            'Empty array has length 0.',
            'Length grows and shrinks as items change.',
            'Strings also have <code>.length</code>.',
          ],
          additionalResources: [
            {
              title: 'MDN — Array.length',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/length',
            },
            {
              title: 'javascript.info — Arrays',
              url: 'https://javascript.info/array',
            },
          ],
          runnables: [
            {
              title: 'Spell — count two',
              code: "let colors=['red','blue']; console.log(colors.length);",
            },
            {
              title: 'Spell — count empty',
              code: 'let a=[]; console.log(a.length);',
            },
            {
              title: 'Spell — count three',
              code: "let a=['x','y','z']; console.log(a.length);",
            },
          ],
          challenges: [
            {
              title: 'S3.2 Easy — Count 3',
              description:
                '<p><strong>Task:</strong> Print the length of <code>["a","b","c"]</code>.</p>',
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              creditPoints: CREDIT.easy,
              tests: [
                { input: '', expect_print: 3 },
                { input: null, expect_print: 3 },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Put the array into a variable.',
                  cost: 5,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Print variable.length.',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText:
                    'const arr = ["a","b","c"]; console.log(arr.length);',
                  cost: 10,
                },
              ],
            },
            {
              title: 'S3.2 Medium — Length of Empty',
              description:
                '<p><strong>Task:</strong> Make an empty array and print its length.</p>',
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              creditPoints: CREDIT.medium,
              tests: [
                { input: '', expect_print: 0 },
                { input: null, expect_print: 0 },
              ],
              hints: [
                { displayText: 'Hint 1', hintText: 'Use [].', cost: 7 },
                {
                  displayText: 'Hint 2',
                  hintText: 'The length of [] is 0.',
                  cost: 7,
                },
                {
                  displayText: 'Solution',
                  hintText: 'const a = []; console.log(a.length);',
                  cost: 12,
                },
              ],
            },
            {
              title: 'S3.2 Hard — Count Mixed',
              description:
                '<p><strong>Task:</strong> Create <code>["a", 1, "b", 2]</code> and print its length.</p>',
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              creditPoints: CREDIT.hard,
              tests: [
                { input: '', expect_print: 4 },
                { input: null, expect_print: 4 },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Combine strings and numbers in one array.',
                  cost: 9,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Print .length once.',
                  cost: 9,
                },
                {
                  displayText: 'Solution',
                  hintText: 'const a = ["a",1,"b",2]; console.log(a.length);',
                  cost: 15,
                },
              ],
            },
          ],
        },

        // S3.3 INDEXING
        {
          title: 'S3.3 — First, Middle, Last (Indexing)',
          coverImage:
            'https://cdn.example.com/cover/sections/ch3-03-indexing.jpg',
          description:
            'We pick items by position using square brackets. Positions start at 0 for the first item. You will print the first and last items, and try middle positions to practice. Be careful not to go past the ends.',
          rewardPoints: SECTION_BONUS.rewardPoints,
          creditPoints: SECTION_BONUS.creditPoints,
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
          trivia: [
            'Indexing starts at 0, not 1.',
            'The last index is length - 1.',
            'Going past the ends returns <code>undefined</code>.',
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
          runnables: [
            {
              title: 'Spell — first item',
              code: "let a=['red','green','blue']; console.log(a[0]);",
            },
            {
              title: 'Spell — last item',
              code: "let a=['red','green','blue']; console.log(a[a.length-1]);",
            },
            {
              title: 'Spell — middle item',
              code: "let a=['sun','moon','star']; console.log(a[1]);",
            },
          ],
          challenges: [
            {
              title: 'S3.3 Easy — First Fruit',
              description:
                '<p><strong>Task:</strong> From <code>["apple","banana","pear"]</code>, print the first item.</p>',
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              creditPoints: CREDIT.easy,
              tests: [
                { input: '', expect_print: 'apple' },
                { input: null, expect_print: 'apple' },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Indexes start at 0.',
                  cost: 5,
                },
                { displayText: 'Hint 2', hintText: 'Use arr[0].', cost: 5 },
                {
                  displayText: 'Solution',
                  hintText:
                    'const arr = ["apple","banana","pear"]; console.log(arr[0]);',
                  cost: 10,
                },
              ],
            },
            {
              title: 'S3.3 Medium — Last Color',
              description:
                '<p><strong>Task:</strong> From <code>["red","green","blue"]</code>, print the last item.</p>',
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              creditPoints: CREDIT.medium,
              tests: [
                { input: '', expect_print: 'blue' },
                { input: null, expect_print: 'blue' },
              ],
              hints: [
                { displayText: 'Hint 1', hintText: 'Use length - 1.', cost: 7 },
                {
                  displayText: 'Hint 2',
                  hintText: 'Access arr[arr.length - 1].',
                  cost: 7,
                },
                {
                  displayText: 'Solution',
                  hintText:
                    'const arr = ["red","green","blue"]; console.log(arr[arr.length - 1]);',
                  cost: 12,
                },
              ],
            },
            {
              title: 'S3.3 Hard — Middle Animal',
              description:
                '<p><strong>Task:</strong> From <code>["ant","bear","cat","dog","eel"]</code>, print the middle item (index 2).</p>',
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              creditPoints: CREDIT.hard,
              tests: [
                { input: '', expect_print: 'cat' },
                { input: null, expect_print: 'cat' },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Count 0,1,2,3,4 — the middle is 2.',
                  cost: 9,
                },
                { displayText: 'Hint 2', hintText: 'Access arr[2].', cost: 9 },
                {
                  displayText: 'Solution',
                  hintText:
                    'const arr = ["ant","bear","cat","dog","eel"]; console.log(arr[2]);',
                  cost: 15,
                },
              ],
            },
          ],
        },

        // S3.4 PUSH / POP
        {
          title: 'S3.4 — Add & Remove (push, pop)',
          coverImage:
            'https://cdn.example.com/cover/sections/ch3-04-push-pop.jpg',
          description:
            'Arrays can grow and shrink at the end. Use push to add one item to the end, and pop to remove the last item. Practice adding two items and popping one to see the lineup change.',
          rewardPoints: SECTION_BONUS.rewardPoints,
          creditPoints: SECTION_BONUS.creditPoints,
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
          trivia: [
            '<code>push</code> returns the new length.',
            '<code>pop</code> returns the removed item.',
            'Arrays are flexible shelves—easy to grow or shrink.',
          ],
          additionalResources: [
            {
              title: 'MDN — Array.push',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push',
            },
            {
              title: 'MDN — Array.pop',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/pop',
            },
          ],
          runnables: [
            {
              title: 'Spell — push one',
              code: "let a=['red']; a.push('blue'); console.log(a);",
            },
            {
              title: 'Spell — push two',
              code: "let a=['sun']; a.push('moon'); a.push('star'); console.log(a);",
            },
            {
              title: 'Spell — pop one',
              code: "let a=['A','B','C']; a.pop(); console.log(a);",
            },
          ],
          challenges: [
            {
              title: 'S3.4 Easy — Add One',
              description:
                '<p><strong>Task:</strong> Start with <code>["a"]</code>. Add <code>"b"</code> to the end and print the array.</p>',
              difficulty: 'easy',
              moduleType: 'javascript',
              rewardPoints: REWARD.easy,
              creditPoints: CREDIT.easy,
              tests: [
                { input: '', expect_print: '["a","b"]' },
                { input: null, expect_print: '["a","b"]' },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Create the starting array.',
                  cost: 5,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Use arr.push("b") then print as JSON.',
                  cost: 5,
                },
                {
                  displayText: 'Solution',
                  hintText:
                    'const arr=["a"]; arr.push("b"); console.log(JSON.stringify(arr));',
                  cost: 10,
                },
              ],
            },
            {
              title: 'S3.4 Medium — Add Two',
              description:
                '<p><strong>Task:</strong> Start with <code>[]</code>. Add <code>"x"</code> then <code>"y"</code> to the end, then print the array.</p>',
              difficulty: 'medium',
              moduleType: 'javascript',
              rewardPoints: REWARD.medium,
              creditPoints: CREDIT.medium,
              tests: [
                { input: '', expect_print: '["x","y"]' },
                { input: null, expect_print: '["x","y"]' },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Use push twice in order.',
                  cost: 7,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Print the array as JSON to match expected.',
                  cost: 7,
                },
                {
                  displayText: 'Solution',
                  hintText:
                    'const arr=[]; arr.push("x"); arr.push("y"); console.log(JSON.stringify(arr));',
                  cost: 12,
                },
              ],
            },
            {
              title: 'S3.4 Hard — Pop Result',
              description:
                '<p><strong>Task:</strong> Start with <code>["dog","cat","bird"]</code>. Remove the last item using <code>pop()</code>. Print the array that remains.</p>',
              difficulty: 'hard',
              moduleType: 'javascript',
              rewardPoints: REWARD.hard,
              creditPoints: CREDIT.hard,
              tests: [
                { input: '', expect_print: '["dog","cat"]' },
                { input: null, expect_print: '["dog","cat"]' },
              ],
              hints: [
                {
                  displayText: 'Hint 1',
                  hintText: 'Call pop once to remove the last item.',
                  cost: 9,
                },
                {
                  displayText: 'Hint 2',
                  hintText: 'Print the array as JSON to match exact output.',
                  cost: 9,
                },
                {
                  displayText: 'Solution',
                  hintText:
                    'const arr=["dog","cat","bird"]; arr.pop(); console.log(JSON.stringify(arr));',
                  cost: 15,
                },
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
        storyId: story!.id,
        description: chapter.description,
        rewardPoints: chapter.rewardPoints,
        creditPoints: chapter.creditPoints,
        coverImage: chapter.coverImage,
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
            difficulty: ch.difficulty as any,
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
            const hint = ch.hints[i];
            if (!hint) continue;
            await tx.insert(schema.challengeHints).values({
              challengeId: createdChallenge?.id,
              displayText: hint.displayText,
              hintText: hint.hintText,
              cost: hint.cost,
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
