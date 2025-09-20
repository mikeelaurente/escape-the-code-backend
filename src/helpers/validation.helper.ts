import { ZodSafeParseError } from 'zod';

export const extractValidationErrors = <T>(
  validationResult: ZodSafeParseError<T>,
) => {
  if (validationResult.success) {
    return [];
  }

  return validationResult.error.issues.reduce(
    (acc, cur) => ({
      ...acc,
      [cur.path.join('.')]: cur.message,
    }),
    {},
  );
};
