import { Request, Response, NextFunction } from 'express';
import { items, Item } from '../models/item';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';

// User CRUD operations
export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;

    const user = await db().insert(schema.users).values({
      email,
      hashedPassword: password,
      firstName,
      lastName,
    });

    res.status(201).json(user);
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
export const updateUser = (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id || '', 10);
    const { name } = req.body;
    const item = items.find((i) => i.id === id);
    if (item === undefined) {
      res.status(404).json({ message: 'Item not found' });
      return;
    }
    item.name = name;
    res.json(item);
  } catch (error) {
    next(error);
  }
};

// Delete an item
export const deleteUser = (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id || '', 10);
    const itemIndex = items.findIndex((i) => i.id === id);
    if (itemIndex === -1) {
      res.status(404).json({ message: 'Item not found' });
      return;
    }
    const deletedItem = items.splice(itemIndex, 1)[0];
    res.json(deletedItem);
  } catch (error) {
    next(error);
  }
};

// Achievements CRUD operations
export const createAchievements = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const title = req.body.title;
    const description = req.body.description;
    const rewardPoints = req.body.rewardPoints;

    const achievements = await db().insert(schema.achievements).values({
      title,
      description,
      rewardPoints,
    });
    res.status(201).json(achievements);
  } catch (error) {
    next(error);
  }
};

export const getAchievements = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const achievements = await db().query.achievements.findMany({
      columns: {
        id: true,
        title: true,
        description: true,
        rewardPoints: true,
      },
    });
    res.json(achievements);
  } catch (error) {
    next(error);
  }
};
