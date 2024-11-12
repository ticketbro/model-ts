import { BulkOperation } from "./operations"
import { TransactionCanceledException } from '@aws-sdk/client-dynamodb'

// TODO: populate errors with more info

export class KeyExistsError extends Error {
  name = "KeyExistsError"
}

export class ItemNotFoundError extends Error {
  name = "ItemNotFoundError"
}

export class ConditionalCheckFailedError extends Error {
  name = "ConditionalCheckFailedError"
}

export class RaceConditionError extends Error {
  name = "RaceConditionError"
}

export class BulkWriteTransactionError extends Error {
  name = "BulkWriteTransactionError"
  error: TransactionCanceledException

  constructor(error: TransactionCanceledException) {
    super("An error occurred in one transaction during the bulk-write process.")
    this.error = error
  }
}

export class BulkWriteRollbackError extends Error {
  name = "BulkWriteRollbackError"
  requiresRollback: BulkOperation<any, any>[]

  constructor(requiresRollback: BulkOperation<any, any>[]) {
    super(
      "An error occurred during the bulk-write rollback. Some operations have not been rolled back."
    )
    this.requiresRollback = requiresRollback
  }
}

export class PaginationError extends Error {
  name = "PaginationError"
}

export type DynamoDBError =
  | KeyExistsError
  | ItemNotFoundError
  | ConditionalCheckFailedError
  | BulkWriteTransactionError
  | BulkWriteRollbackError
  | PaginationError
