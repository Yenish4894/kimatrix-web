/**
 * How long a company's data survives, mirroring the backend constants that act on it:
 * `EXPIRY_RETENTION_DAYS` (config/retention.ts) and `DELETION_GRACE_DAYS`
 * (AccountDeletionService.ts). The UI states these numbers to customers, so they must
 * change together with the backend, never separately.
 */

/** Days a lapsed company's customer and purchase records are kept before removal. */
export const DATA_RETENTION_DAYS = 7;

/** Days between an account-closure request and the data being erased. */
export const ACCOUNT_DELETION_GRACE_DAYS = 7;
