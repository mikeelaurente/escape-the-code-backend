import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from './db';
import * as schema from './db/schema';

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
        await tx.insert(schema.sections).values({
          title: section.title,
          chapterId: createdChapter?.id,
          description: section.description,
          rewardOptions: {
            easy: 20,
            medium: 30,
            hard: 50,
          },
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
            { hintText: `This is a hint 1 for ${challenge.title}`, cost: 5 },
            { hintText: `This is a hint 2 for ${challenge.title}`, cost: 10 },
            { hintText: `This is a hint 3 for ${challenge.title}`, cost: 15 },
          ];

          for (const hint of challegeHints) {
            await tx.insert(schema.challengeHints).values({
              challengeId: createdChallenge?.id,
              hintText: hint.hintText,
              cost: hint.cost,
            });
          }
        }
      }
    }
  });
}

main()
  .then(() => {
    console.log('Seeding completed');
  })
  .catch((e) => {
    console.error(e);
  });
