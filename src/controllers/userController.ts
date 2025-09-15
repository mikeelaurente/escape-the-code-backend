import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import * as bcrypt from 'bcryptjs';

const createUserSchema = z.object({
  firstName: z.string().nonempty('Firstname is required'),
  lastName: z
    .string({
      error: 'Lastname is required',
    })
    .nonempty('Lastname is required'),
  email: z.email().nonempty(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.email().nonempty('Email is required'),
  password: z.string().min(3),
});

// User CRUD operations
export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validationResult = await createUserSchema.safeParseAsync(req.body);

    if (!validationResult.success) {
      return res.render('register', {
        title: 'EscapeTheCode',
        apiUrl: 'http://localhost:' + process.env.PORT + '/api',
        data: req.body,
        errors: validationResult.error.issues.reduce(
          (acc, cur) => ({
            ...acc,
            [cur.path.join('.')]: cur.message,
          }),
          {},
        ),
      });
    }

    const email = validationResult.data.email;
    const password = validationResult.data.password;
    const firstName = validationResult.data.firstName;
    const lastName = validationResult.data.lastName;

    const existingUser = await db().query.users.findFirst({
      where: eq(schema.users.email, email),
    });

    if (existingUser) {
      return res.render('register', {
        title: 'EscapeTheCode',
        apiUrl: 'http://localhost:' + process.env.PORT + '/api',
        data: req.body,
        errors: {
          email: 'Email is already registered',
        },
      });
    }

    let salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await db().insert(schema.users).values({
      email,
      hashedPassword,
      firstName,
      lastName,
    });

    req.session.message = 'You are now registered!';
    res.redirect('/login');
  } catch (error) {
    next(error);
  }
};

// User CRUD operations
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validationResult = await loginSchema.safeParseAsync(req.body);

    if (!validationResult.success) {
      return res.render('login', {
        title: 'EscapeTheCode',
        apiUrl: 'http://localhost:' + process.env.PORT + '/api',
        data: req.body,
        errors: validationResult.error.issues.reduce(
          (acc, cur) => ({
            ...acc,
            [cur.path.join('.')]: cur.message,
          }),
          {},
        ),
        errorMessage: 'Invalid credentials',
      });
    }

    const email = validationResult.data.email;
    const password = validationResult.data.password;

    const user = await db().query.users.findFirst({
      where: eq(schema.users.email, email),
    });

    console.log('user', user);

    if (!user) {
      return res.render('login', {
        title: 'EscapeTheCode',
        apiUrl: 'http://localhost:' + process.env.PORT + '/api',
        data: req.body,
        errors: {},
        errorMessage: 'Invalid credentials',
      });
    }

    if (!(await bcrypt.compare(password, user.hashedPassword!))) {
      return res.render('login', {
        title: 'EscapeTheCode',
        apiUrl: 'http://localhost:' + process.env.PORT + '/api',
        data: req.body,
        errors: {},
        errorMessage: 'Invalid credentials',
      });
    }

    req.session.message = 'Welcome to EscapeTheCode!';

    req.session.userId = user.id;
    req.session.userInfo = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    res.redirect('/');
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const users = await db().query.users.findMany({
      columns: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
      with: {
        credits: {
          columns: {
            value: true,
          },
        },
      },
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// Read single user
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await db().query.users.findFirst({
      where: eq(schema.users.id, parseInt(req.params.id || '', 10)),
    });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// Update an item
// export const updateUser = (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const id = parseInt(req.params.id || '', 10);
//     const { name } = req.body;
//     const item = items.find((i) => i.id === id);
//     if (item === undefined) {
//       res.status(404).json({ message: 'Item not found' });
//       return;
//     }
//     item.name = name;
//     res.json(item);
//   } catch (error) {
//     next(error);
//   }
// };

// Delete an item
// export const deleteUser = (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const id = parseInt(req.params.id || '', 10);
//     const itemIndex = items.findIndex((i) => i.id === id);
//     if (itemIndex === -1) {
//       res.status(404).json({ message: 'Item not found' });
//       return;
//     }
//     const deletedItem = items.splice(itemIndex, 1)[0];
//     res.json(deletedItem);
//   } catch (error) {
//     next(error);
//   }
// };
