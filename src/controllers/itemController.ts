import { Request, Response, NextFunction } from 'express';
import { items, Item } from '../models/item';
import { db } from '../db';
import * as schema from '../db/schema';

// Create an item
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

// Read all items
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

// Read single item
export const getUserById = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseInt(req.params.id || '', 10);
    const item = items.find((i) => i.id === id);
    if (!item) {
      res.status(404).json({ message: 'Item not found' });
      return;
    }
    res.json(item);
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
