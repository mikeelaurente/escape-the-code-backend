import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from './db';
import * as schema from './db/schema';
import { getStories } from './controllers/storyController';

async function main() {
  const stories = await db().query.stories.findMany({
    with: {
      chapters: {
        with: {
          sections: {
            with: {
              challenges: true,
            },
          },
        },
      },
    },
  });

  console.log(stories);
  console.log(stories[0]?.chapters);
  console.log(stories[0]?.chapters[0]?.sections);
  console.log(stories[0]?.chapters[0]?.sections[0]?.challenges);
}

main()
  .then(() => {
    console.log('Seeding completed');
  })
  .catch((e) => {
    console.error(e);
  });
