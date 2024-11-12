import crypto from "crypto"
import { chunksOf } from "fp-ts/lib/Array"
import {
  CreateTableCommand,
  DeleteTableCommand,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb"
import diff from "snapshot-diff"
import { Client } from "./client"
import {
  BatchWriteCommand,
  GetCommand,
  DynamoDBDocumentClient,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb"

const ddb = new DynamoDBClient({
  endpoint: process.env.LOCAL_ENDPOINT,
  region: "local",
})

const docClient = DynamoDBDocumentClient.from(ddb)

export const createTable = async () => {
  const tableName = crypto.randomBytes(20).toString("hex")

  await ddb
    .send(
      new CreateTableCommand({
        TableName: tableName,
        AttributeDefinitions: [
          { AttributeName: "PK", AttributeType: "S" },
          { AttributeName: "SK", AttributeType: "S" },
          { AttributeName: "GSI2PK", AttributeType: "S" },
          { AttributeName: "GSI2SK", AttributeType: "S" },
          { AttributeName: "GSI3PK", AttributeType: "S" },
          { AttributeName: "GSI3SK", AttributeType: "S" },
          { AttributeName: "GSI4PK", AttributeType: "S" },
          { AttributeName: "GSI4SK", AttributeType: "S" },
          { AttributeName: "GSI5PK", AttributeType: "S" },
          { AttributeName: "GSI5SK", AttributeType: "S" },
        ],
        KeySchema: [
          { AttributeName: "PK", KeyType: "HASH" },
          { AttributeName: "SK", KeyType: "RANGE" },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: "GSI1",
            KeySchema: [
              { AttributeName: "SK", KeyType: "HASH" },
              { AttributeName: "PK", KeyType: "RANGE" },
            ],
            Projection: {
              ProjectionType: "ALL",
            },
          },
          {
            IndexName: "GSI2",
            KeySchema: [
              { AttributeName: "GSI2PK", KeyType: "HASH" },
              { AttributeName: "GSI2SK", KeyType: "RANGE" },
            ],
            Projection: {
              ProjectionType: "ALL",
            },
          },
          {
            IndexName: "GSI3",
            KeySchema: [
              { AttributeName: "GSI3PK", KeyType: "HASH" },
              { AttributeName: "GSI3SK", KeyType: "RANGE" },
            ],
            Projection: {
              ProjectionType: "ALL",
            },
          },
          {
            IndexName: "GSI4",
            KeySchema: [
              { AttributeName: "GSI4PK", KeyType: "HASH" },
              { AttributeName: "GSI4SK", KeyType: "RANGE" },
            ],
            Projection: {
              ProjectionType: "ALL",
            },
          },
          {
            IndexName: "GSI5",
            KeySchema: [
              { AttributeName: "GSI5PK", KeyType: "HASH" },
              { AttributeName: "GSI5SK", KeyType: "RANGE" },
            ],
            Projection: {
              ProjectionType: "ALL",
            },
          },
        ],
        BillingMode: "PAY_PER_REQUEST",
      })
    )
    .catch((e: any) => {
      console.log("Failed to create table, exiting.", e)
      process.exit(1)
    })

  return tableName
}

export const destroyTable = async (tableName: string) => {
  return ddb
    .send(new DeleteTableCommand({ TableName: tableName }))
    .then(() => {})
    .catch((e) => {
      console.log("Failed to destroy table, exiting.", e)
      process.exit(1)
    })
}

export const getTableContents = async (
  tableName: string
): Promise<{ [key: string]: any }> => {
  const scan = async (ExclusiveStartKey?: any): Promise<any[]> => {
    const { Items = [], LastEvaluatedKey } = await docClient.send(
      new ScanCommand({
        TableName: tableName,
        ExclusiveStartKey,
      })
    )

    if (LastEvaluatedKey) return [...Items, ...(await scan(LastEvaluatedKey))]
    return Items
  }

  const items = await scan()

  const acc: { [key: string]: any } = {}

  items.forEach((item) => (acc[`${item.PK}__${item.SK}`] = item))

  return acc
}

export interface Sandbox {
  destroy: () => Promise<void>
  snapshot: () => Promise<{ [key: string]: any }>
  seed: (...args: Array<{ [key: string]: any }>) => Promise<void>
  get: (pk: string, sk: string) => Promise<null | any>
  diff: (before: { [key: string]: any }) => Promise<string>
}

export const createSandbox = async (client: Client): Promise<Sandbox> => {
  const tableName = await createTable()

  client.setDocumentClient(docClient)
  client.setTableName(tableName)

  return {
    destroy: () => destroyTable(tableName),
    snapshot: () => getTableContents(tableName),
    seed: async (...args: Array<{ [key: string]: any }>) => {
      const chunks = chunksOf(25)(args)

      for (const chunk of chunks) {
        const items = chunk.map((i) =>
          typeof i?._model?.__dynamoDBEncode === "function"
            ? i._model.__dynamoDBEncode(i)
            : typeof i.encode === "function"
            ? i.encode()
            : i
        )

        await client.documentClient.send(
          new BatchWriteCommand({
            RequestItems: {
              [tableName]: items.map((i) => ({ PutRequest: { Item: i } })),
            },
          })
        )
      }
    },
    get: (pk: string, sk: string) =>
      client.documentClient
        .send(new GetCommand({ TableName: tableName, Key: { PK: pk, SK: sk } }))
        .then(({ Item }) => Item ?? null),
    diff: async (before) => {
      const snapshot = await getTableContents(tableName)

      return diff(before, snapshot)
    },
  }
}
