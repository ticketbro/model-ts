import { ModelInstance, ModelConstructor, Union } from "@model-ts/core"

export interface DynamoDBModelInstance extends ModelInstance<string, any> {
  /**
   * Returns the item's DynamoDB keys.
   */
  keys(): {
    PK: string
    SK: string
    GSI2PK?: string
    GSI2SK?: string
    GSI3PK?: string
    GSI3SK?: string
  }

  PK: string
  SK: string
  GSI2PK?: string // | null
  GSI2SK?: string // | null
  GSI3PK?: string // | null
  GSI3SK?: string // | null
}

// export interface DynamoDBModel {}

export type DynamoDBModelConstructor<
  T extends DynamoDBModelInstance
> = ModelConstructor<T>

export type DynamoDBUnion = Union<
  [
    DynamoDBModelConstructor<any>,
    DynamoDBModelConstructor<any>,
    ...DynamoDBModelConstructor<any>[]
  ]
>

export type Decodable = DynamoDBModelConstructor<any> | DynamoDBUnion

export type DecodableInstance<
  M extends Decodable
> = M extends DynamoDBModelConstructor<any>
  ? InstanceType<M>
  : M extends DynamoDBUnion
  ? InstanceType<M["_models"][number]>
  : never
