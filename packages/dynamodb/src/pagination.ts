import crypto from "crypto"
import { PaginationError } from "./errors"

const SIV = "Q05yyCR+0tyWl6glrZhlNw=="
const ENCRYPTION_ALG = "aes-256-ctr"

export interface PageInfo {
  hasPreviousPage: boolean
  hasNextPage: boolean
  startCursor: string | null
  endCursor: string | null
}

export interface Edge<T> {
  node: T
  cursor: string
}

export interface PaginationResult<T> {
  pageInfo: PageInfo
  edges: Edge<T>[]
}

export enum PaginationDirection {
  FORWARD,
  BACKWARD,
}

export interface PaginationInput {
  first?: number | null
  last?: number | null
  before?: string | null
  after?: string | null
}

// TODO: make configurable
const DEFAULT_OPTIONS = {
  limit: 50,
  default: 20,
}

export function decodePagination(pagination: PaginationInput): {
  cursor?: string
  limit: number
  direction: PaginationDirection
} {
  const { after, before, first, last } = pagination

  if (before && after)
    throw new PaginationError(
      `Only one of "before" and "after" can be specified`
    )
  if (first && last)
    throw new PaginationError(`Only one of "first" and "last" can be specified`)
  if (before && first)
    throw new PaginationError(
      `Only one of "before" and "first" can be specified`
    )
  if (last && after)
    throw new PaginationError(`Only one of "last" and "after" can be specified`)

  if (first && first < 0) throw new PaginationError(`"first" must be positive`)
  if (last && last < 0) throw new PaginationError(`"last" must be positive`)

  return {
    cursor: before ?? after ?? undefined,
    limit: Math.min(
      first ?? last ?? DEFAULT_OPTIONS.default,
      DEFAULT_OPTIONS.limit
    ),
    direction:
      before || last
        ? PaginationDirection.BACKWARD
        : PaginationDirection.FORWARD,
  }
}

/**
 * Utility function to encrypt a cursor with AES-256-CTR, but uses a
 * synthetic initialization vector (SIV) to ensure that the same cursor
 * produces the same encrypted value.
 */
const encryptCursor = (key: Buffer, cursor: string) => {
  const cipher = crypto.createCipheriv(
    ENCRYPTION_ALG,
    key,
    Buffer.from(SIV, "base64")
  )

  const encrypted = Buffer.concat([cipher.update(cursor), cipher.final()])

  return encrypted.toString("base64")
}

/**
 * Utility function to decrypt a cursor with AES-256-CTR, but uses a
 * synthetic initialization vector (SIV) to ensure that the same cursor
 * produces the same encrypted value.
 */
const decryptCursor = (key: Buffer, encryptedCursor: string) => {
  try {
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALG,
      key,
      Buffer.from(SIV, "base64")
    )

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedCursor, "base64")),
      decipher.final(),
    ]).toString()

    return decrypted
  } catch (error) {
    return null
  }
}

export const encodeDDBCursor = (
  {
    PK,
    SK,
    GSI2PK,
    GSI2SK,
    GSI3PK,
    GSI3SK,
    GSI4PK,
    GSI4SK,
    GSI5PK,
    GSI5SK,
  }: {
    PK: string
    SK: string
    GSI2PK?: string
    GSI2SK?: string
    GSI3PK?: string
    GSI3SK?: string
    GSI4PK?: string
    GSI4SK?: string
    GSI5PK?: string
    GSI5SK?: string
  },
  encryptionKey?: Buffer
) => {
  const cursor = Buffer.from(
    JSON.stringify({
      PK,
      SK,
      GSI2PK,
      GSI2SK,
      GSI3PK,
      GSI3SK,
      GSI4PK,
      GSI4SK,
      GSI5PK,
      GSI5SK,
    })
  ).toString("base64")

  if (encryptionKey) return encryptCursor(encryptionKey, cursor)

  return cursor
}

export const decodeDDBCursor = (
  encoded: string,
  index?: "GSI2" | "GSI3" | "GSI4" | "GSI5",
  encryptionKey?: Buffer
) => {
  try {
    const json = encryptionKey ? decryptCursor(encryptionKey, encoded) : encoded
    // const json = encoded

    if (!json) throw new Error("Couldn't decrypt cursor")

    const {
      PK,
      SK,
      GSI2PK,
      GSI2SK,
      GSI3PK,
      GSI3SK,
      GSI4PK,
      GSI4SK,
      GSI5PK,
      GSI5SK,
    } = JSON.parse(Buffer.from(json, "base64").toString())

    if (typeof PK !== "string" || typeof SK !== "string") throw new Error()

    if (!index) return { PK, SK }
    if (index === "GSI2") return { PK, SK, GSI2PK, GSI2SK }
    if (index === "GSI3") return { PK, SK, GSI3PK, GSI3SK }
    if (index === "GSI4") return { PK, SK, GSI4PK, GSI4SK }
    if (index === "GSI5") return { PK, SK, GSI5PK, GSI5SK }
  } catch (error) {
    throw new PaginationError("Couldn't decode cursor")
  }
}
