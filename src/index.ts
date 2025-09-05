// import 'dotenv/config';
// import { drizzle } from 'drizzle-orm/mysql2';
// import { eq } from 'drizzle-orm';
// import { usersTable } from './db/schema';

import 'dotenv/config';
import { db } from './db';
import * as schema from './db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const email = 'test2@gmail.com';

  const user: typeof schema.users.$inferInsert = {
    email: email,
    hashedPassword: 'hashed',
    firstName: 'first',
    lastName: 'last',
  };

  //await db().insert(schema.users).values(user);

  const createdUser = await db().query.users.findFirst({
    where: eq(schema.users.email, email),
  });

  const studentCredit: typeof schema.userCredits.$inferInsert = {
    userId: createdUser?.id,
    value: 100,
  };

  await db().insert(schema.userCredits).values(studentCredit);
}

main();

// const db = drizzle(process.env.DATABASE_URL!);

// async function main() {
//   const user: typeof usersTable.$inferInsert = {
//     name: 'John',
//     age: 30,
//     email: 'john@example.com',
//   };

//   await db.insert(usersTable).values(user);
//   console.log('New user created!');

//   const users = await db.select().from(usersTable);
//   console.log('Getting all users from the database: ', users);
//   /*
//   const users: {
//     id: number;
//     name: string;
//     age: number;
//     email: string;
//   }[]
//   */

//   await db
//     .update(usersTable)
//     .set({
//       age: 31,
//     })
//     .where(eq(usersTable.email, user.email));
//   console.log('User info updated!');

//   await db.delete(usersTable).where(eq(usersTable.email, user.email));
//   console.log('User deleted!');
// }

// main();
