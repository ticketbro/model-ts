import {
  GetCommandInput,
  PutCommandInput,
  UpdateCommandInput,
  NativeAttributeValue
} from "@aws-sdk/lib-dynamodb"
import { TypeOf } from "@model-ts/core"
import {
  DynamoDBModelInstance,
  DynamoDBModelConstructor,
  Decodable,
} from "./dynamodb-model"
import { Key } from "./client"
import {
  ConditionCheck,
} from "@aws-sdk/client-dynamodb"

export type Operation<
  T extends DynamoDBModelInstance,
  M extends DynamoDBModelConstructor<T>
> =
  | GetOperation<M>
  | PutOperation<T, M>
  | DeleteOperation<M>
  | UpdateRawOperation<M>
  | ConditionCheckOperation

export interface GetOperation<M extends Decodable>
  extends Pick<GetCommandInput, "ConsistentRead"> {
  _operation: "get"
  _model: M
  key: Key
}

export interface PutOperation<
  T extends DynamoDBModelInstance,
  M extends DynamoDBModelConstructor<T>
> extends Pick<
    PutCommandInput,
    | "ConditionExpression"
    | "ExpressionAttributeValues"
    | "ExpressionAttributeNames"
  > {
  IgnoreExistence?: boolean
  _operation: "put"
  _model: M
  _deleted?: boolean
  item: T
}

export interface DeleteOperation<M extends DynamoDBModelConstructor<any>> {
  _operation: "delete"
  _model: M
  key: Key
}

export interface UpdateRawOperation<M extends DynamoDBModelConstructor<any>>
  extends Pick<
    UpdateCommandInput,
    | "UpdateExpression"
    | "ConditionExpression"
    | "ExpressionAttributeNames"
    | "ExpressionAttributeValues"
  > {
  _operation: "updateRaw"
  _model: M
  key: Key
  attributes: Partial<TypeOf<M>> & {
    GSI2PK?: string | null
    GSI2SK?: string | null
    GSI3PK?: string | null
    GSI3SK?: string | null
    GSI4PK?: string | null
    GSI4SK?: string | null
    GSI5PK?: string | null
    GSI5SK?: string | null
  }
}

// -------------------------------------------------------------------------------------
// Bulk Operations
// -------------------------------------------------------------------------------------

export interface ConditionCheckOperation
  extends Pick<
    ConditionCheck,
    | "ConditionExpression"
    | "ExpressionAttributeNames"
  > {
  _operation: "condition"
  key: Key
  ExpressionAttributeValues?: Record<string, NativeAttributeValue>;
}

export interface TransactionOperation<
  T extends DynamoDBModelInstance,
  M extends DynamoDBModelConstructor<T>
> {
  /**
   * Performed inside a call to `docClient.transactWrite`. Might be executed in a different
   * transaction than other operations of this call.
   */
  action:
    | PutOperation<T, M>
    | UpdateRawOperation<M>
    | DeleteOperation<M>
    | ConditionCheckOperation
  /**
   * Performed in case a subsequent transaction fails. Can be omitted.
   */
  rollback?: PutOperation<T, M> | UpdateRawOperation<M> | DeleteOperation<M>
}

export type BulkOperation<
  T extends DynamoDBModelInstance,
  M extends DynamoDBModelConstructor<T>
> =
  | PutOperation<T, M>
  | UpdateRawOperation<M>
  | DeleteOperation<M>
  | ConditionCheckOperation
  | TransactionOperation<T, M>

export const isTransactionOperation = <
  T extends DynamoDBModelInstance,
  M extends DynamoDBModelConstructor<T>
>(
  operation: BulkOperation<T, M>
): operation is TransactionOperation<T, M> => "action" in operation
