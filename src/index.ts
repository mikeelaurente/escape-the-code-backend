import 'dotenv/config';
import { db } from './db';
import * as schema from './db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const emails = ['test@gmail.com', 'test2@gmail.com', 'test3@gmail.com'];

  for (let email of emails) {
    const user: typeof schema.users.$inferInsert = {
      email,
      hashedPassword: 'hashed',
      firstName: 'first',
      lastName: 'last',
    };
    await db().insert(schema.users).values(user);

    const createdUser = await db().query.users.findFirst({
      where: eq(schema.users.email, email),
    });

    const studentCredit: typeof schema.userCredits.$inferInsert = {
      userId: createdUser?.id,
      value: 100,
    };

    await db().insert(schema.userCredits).values(studentCredit);
  }

  const users = await db().query.users.findMany({
    columns: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  // story 1
  await db()
    .insert(schema.stories)
    .values({
      title: 'The Lost Treasure',
      description: 'An epic adventure to find the lost treasure of Eldorado.',
      rewardOptions: {
        easy: 20,
        medium: 30,
        hard: 50,
      },
    });

  const story1 = await db().query.stories.findFirst({
    where: eq(schema.stories.title, 'The Lost Treasure'),
  });

  // story 1 - chapter 1
  await db()
    .insert(schema.chapters)
    .values({
      title: 'S1 - Chapter 1',
      storyId: story1?.id,
      description: 'chapter 1',
      rewardOptions: {
        easy: 20,
        medium: 30,
        hard: 50,
      },
    });

  const s1chapter1 = await db().query.chapters.findFirst({
    where: eq(schema.chapters.title, 'S1 - Chapter 1'),
  });

  //s1 chapter 1 - section 1
  await db()
    .insert(schema.sections)
    .values({
      title: 'S1C1 - Section 1',
      chapterId: s1chapter1?.id,
      description: 'Section 1',
      rewardOptions: {
        easy: 20,
        medium: 30,
        hard: 50,
      },
    });

  const s1c1section1 = await db().query.sections.findFirst({
    where: eq(schema.sections.title, 'S1C1 - Section 1'),
  });

  // s1 c1 section 1 - challenge 1
  await db().insert(schema.challenges).values({
    title: 'S1C1Sec1 Challenge 1 - easy',
    sectionID: s1c1section1?.id,
    description: 'Challenge 1 - easy',
    difficulty: 'easy',
    expectedOutput: 'output 1.1',
    moduleType: 'print',
    rewardPoints: 10,
  });

  // s1 c1 section 1 = challenge 2
  await db().insert(schema.challenges).values({
    title: 'S1C1Sec1 Challenge 2 - medium',
    sectionID: s1c1section1?.id,
    description: 'Challenge 2 - medium',
    difficulty: 'medium',
    expectedOutput: 'output 1.2',
    moduleType: 'print',
    rewardPoints: 20,
  });

  // s1 c1 section 1 = challenge 3
  await db().insert(schema.challenges).values({
    title: 'S1C1Sec1 Challenge 3 - hard',
    sectionID: s1c1section1?.id,
    description: 'Challenge 3 - hard',
    difficulty: 'hard',
    expectedOutput: 'output 1.3',
    moduleType: 'print',
    rewardPoints: 30,
  });

  // s1 chapter 1 - section 2
  await db()
    .insert(schema.sections)
    .values({
      title: 'S1C1 - Section 2',
      chapterId: s1chapter1?.id,
      description: 'Section 2',
      rewardOptions: {
        easy: 20,
        medium: 30,
        hard: 50,
      },
    });

  const s1c1section2 = await db().query.sections.findFirst({
    where: eq(schema.sections.title, 'S1C1 - Section 2'),
  });

  // s1 c1 section 2 - challenge 1
  await db().insert(schema.challenges).values({
    title: 'S1C1Sec2 Challenge 1 - easy',
    sectionID: s1c1section2?.id,
    description: 'Challenge 1 - easy',
    difficulty: 'easy',
    expectedOutput: 'output 2.1',
    moduleType: 'print',
    rewardPoints: 10,
  });

  // s1 c1 section 2 - challenge 2
  await db().insert(schema.challenges).values({
    title: 'S1C1Sec2 Challenge 2 - medium',
    sectionID: s1c1section2?.id,
    description: 'Challenge 2 - medium',
    difficulty: 'medium',
    expectedOutput: 'output 2.2',
    moduleType: 'print',
    rewardPoints: 20,
  });

  // s1 c1 section 2 - challenge 3
  await db().insert(schema.challenges).values({
    title: 'S1C1Sec2 Challenge 3 - hard',
    sectionID: s1c1section2?.id,
    description: 'Challenge 3 - hard',
    difficulty: 'hard',
    expectedOutput: 'output 2.3',
    moduleType: 'print',
    rewardPoints: 30,
  });

  // s1 chapter 1 - section 3
  await db()
    .insert(schema.sections)
    .values({
      title: 'S1C1 - Section 3',
      chapterId: s1chapter1?.id,
      description: 'Section 3',
      rewardOptions: {
        easy: 20,
        medium: 30,
        hard: 50,
      },
    });

  const s1c1section3 = await db().query.sections.findFirst({
    where: eq(schema.sections.title, 'S1C1 - Section 3'),
  });

  // s1 c1 section 3 - challenge 1
  await db().insert(schema.challenges).values({
    title: 'S1C1Sec3 Challenge 1 - easy',
    sectionID: s1c1section3?.id,
    description: 'Challenge 1 - easy',
    difficulty: 'easy',
    expectedOutput: 'output 3.1',
    moduleType: 'print',
    rewardPoints: 10,
  });

  // s1 c1 section 3 = challenge 2
  await db().insert(schema.challenges).values({
    title: 'S1C1Sec3 Challenge 2 - medium',
    sectionID: s1c1section3?.id,
    description: 'Challenge 2 - medium',
    difficulty: 'medium',
    expectedOutput: 'output 3.2',
    moduleType: 'print',
    rewardPoints: 20,
  });

  // s1 c1 section 2 = challenge 3
  await db().insert(schema.challenges).values({
    title: 'S1C1Sec3 Challenge 3 - hard',
    sectionID: s1c1section3?.id,
    description: 'Challenge 3 - hard',
    difficulty: 'hard',
    expectedOutput: 'output 3.3',
    moduleType: 'print',
    rewardPoints: 30,
  });

  // story 1 - chapter 2
  await db()
    .insert(schema.chapters)
    .values({
      title: 'S1 - Chapter 2',
      storyId: story1?.id,
      description: 'chapter 2',
      rewardOptions: {
        easy: 20,
        medium: 30,
        hard: 50,
      },
    });

  const s1chapter2 = await db().query.chapters.findFirst({
    where: eq(schema.chapters.title, 'S1 - Chapter 2'),
  });

  // s1 chapter 2 - section 1
  await db()
    .insert(schema.sections)
    .values({
      title: 'S1C2 - Section 1',
      chapterId: s1chapter2?.id,
      description: 'Section 1',
      rewardOptions: {
        easy: 20,
        medium: 30,
        hard: 50,
      },
    });

  const s1c2section1 = await db().query.sections.findFirst({
    where: eq(schema.sections.title, 'S1C2 - Section 1'),
  });

  // s1 c2 section 1 - challenge 1
  await db().insert(schema.challenges).values({
    title: 'S1C2Sec1 Challenge 1 - easy',
    sectionID: s1c2section1?.id,
    description: 'Challenge 1 - easy',
    difficulty: 'easy',
    expectedOutput: 'output 1.1',
    moduleType: 'print',
    rewardPoints: 10,
  });

  // s1 c2 section 1 - challenge 2
  await db().insert(schema.challenges).values({
    title: 'S1C2Sec1 Challenge 2 - medium',
    sectionID: s1c2section1?.id,
    description: 'Challenge 2 - medium',
    difficulty: 'medium',
    expectedOutput: 'output 1.2',
    moduleType: 'print',
    rewardPoints: 20,
  });

  // s1 c2 section 1 - challenge 3
  await db().insert(schema.challenges).values({
    title: 'S1C2Sec1 Challenge 3 - hard',
    sectionID: s1c2section1?.id,
    description: 'Challenge 3 - hard',
    difficulty: 'hard',
    expectedOutput: 'output 1.3',
    moduleType: 'print',
    rewardPoints: 30,
  });

  // s1 chapter 2 - section 2
  await db()
    .insert(schema.sections)
    .values({
      title: 'S1C2 - Section 1',
      chapterId: s1chapter2?.id,
      description: 'Section 1',
      rewardOptions: {
        easy: 20,
        medium: 30,
        hard: 50,
      },
    });

  const s1c2section2 = await db().query.sections.findFirst({
    where: eq(schema.sections.title, 'S1C2 - Section 1'),
  });

  // s1 c2 section 2 - challenge 1
  await db().insert(schema.challenges).values({
    title: 'S1C2Sec2 Challenge 1 - easy',
    sectionID: s1c2section2?.id,
    description: 'Challenge 1 - easy',
    difficulty: 'easy',
    expectedOutput: 'output 2.1',
    moduleType: 'print',
    rewardPoints: 10,
  });

  // s1 c2 section 2 - challenge 2
  await db().insert(schema.challenges).values({
    title: 'S1C2Sec2 Challenge 2 - medium',
    sectionID: s1c2section2?.id,
    description: 'Challenge 2 - medium',
    difficulty: 'medium',
    expectedOutput: 'output 2.2',
    moduleType: 'print',
    rewardPoints: 20,
  });

  // s1 c2 section 2 - challenge 3
  await db().insert(schema.challenges).values({
    title: 'S1C2Sec2 Challenge 3 - hard',
    sectionID: s1c2section2?.id,
    description: 'Challenge 3 - hard',
    difficulty: 'hard',
    expectedOutput: 'output 2.3',
    moduleType: 'print',
    rewardPoints: 30,
  });
}

main();
