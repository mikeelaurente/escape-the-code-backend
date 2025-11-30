import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { and, asc, desc, eq, like, or, SQL } from 'drizzle-orm';
import { extractValidationErrors } from '../../../helpers/validation.helper';
import QueryString from 'qs';
import { CreditTransactionGroupFilters, CreditTransactionsQueryParamsSchema, CreditTransactionTypeFilters } from '../../../types/transaction';

export const getTransactionsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.user?.id);

    const url = new URL(req.host + req.originalUrl);
    const queryParams = QueryString.parse(url?.searchParams.toString() || '');

    const result = CreditTransactionsQueryParamsSchema.safeParse(queryParams);
    if (!result.success) {
      return res.json({
        status: 'error',
        errors: extractValidationErrors(result),
      });
    }

    const query = result.data;
    const sql: SQL<unknown>[] = [
      eq(schema.creditTransactions.userId, userId)
    ];
    let order = desc(schema.creditTransactions.id);

    if (query.sort && query.sort.name && query.sort.name.trim().length > 0) {
      const whitelisted = {
        id: schema.creditTransactions.id,
        title: schema.creditTransactions.title,
        type: schema.creditTransactions.type,
        group: schema.creditTransactions.group,
      };
      type keys = keyof typeof whitelisted;
      if (Object.keys(whitelisted).includes(query.sort.name)) {
        const k = query.sort.name as keys;
        order =
          query.sort.order === 'asc'
            ? asc(whitelisted[k])
            : desc(whitelisted[k]);
      }
    }

    if (query.search && query.search.trim().length > 0) {
      sql.push(
        or(like(schema.creditTransactions.title, `%${query.search}%`)) as SQL<unknown>,
      );
    }

    if (query.filters?.type && query.filters.type !== 'all' && CreditTransactionTypeFilters.includes(query.filters.type)) {
      sql.push(eq(schema.creditTransactions.type, query.filters.type));
    }

    if (query.filters?.group && query.filters.group !== 'all' && CreditTransactionGroupFilters.includes(query.filters.group)) {
      sql.push(eq(schema.creditTransactions.group, query.filters.group));
    }

    const total = await db.$count(schema.creditTransactions, and(...sql));

    const offset = Number(query.limit * (query.page - 1));
    const transactions = await db.query.creditTransactions.findMany({
      where: and(...sql),
      orderBy: order,
      limit: Number(query.limit ?? 5),
      offset: offset,
    });

    res.json({
      status: 'ok',
      data: transactions,
      meta: {
        total,
        limit: result.data.limit,
        page: result.data.page,
        offset,
      },
    });
  } catch (error) {
    next(error);
  }
};
