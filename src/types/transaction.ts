import type * as schema from '../db/schema';
import z from 'zod';
import type { Paginated } from './api';
import { createQueryParamsSchema } from './schema';
import type { Challenge } from './challenge';

export type CreditTransaction = typeof schema.creditTransactions.$inferSelect;
export type CreditTransactionId = CreditTransaction['id'];

export type CreditTransactionWithDetails = CreditTransaction & {
  challenges: Challenge[];
};

export type CreditTransactionDto = {
  id: CreditTransaction['id'];
  userId: CreditTransaction['userId'];
  title: CreditTransaction['title'];
  type: CreditTransaction['type'];
  referenceId: CreditTransaction['referenceId'];
  group: CreditTransaction['group'];
  amount: CreditTransaction['amount'];
  createdAt: CreditTransaction['createdAt'];
  updatedAt: CreditTransaction['updatedAt'];
};


export const CreditTransactionTypeFilters = ['all', 'in', 'out'] as const;
export const CreditTransactionGroupFilters = ['all', 'hint', 'reward'] as const;

const CreditTransactionTypeFilter = z.enum(Object.values(CreditTransactionTypeFilters)).default('all');
const CreditTransactionGroupFilter = z.enum(Object.values(CreditTransactionGroupFilters)).default('all');

export const CreditTransactionsQueryParamsSchema = createQueryParamsSchema(
  z.object({
    type: CreditTransactionTypeFilter,
    group: CreditTransactionGroupFilter
  }),
);

export type CreditTransactionsQueryParams = z.infer<
  typeof CreditTransactionsQueryParamsSchema
>;

export type CreditTransactionsQueryResponse = Paginated<CreditTransactionDto>;
