import { PaginationError } from "./errors"

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
  index?: "GSI2" | "GSI3" | "GSI4" | "GSI5"
) =>
  index === "GSI2"
    ? Buffer.from(JSON.stringify({ PK, SK, GSI2PK, GSI2SK })).toString("base64")
    : index === "GSI3"
    ? Buffer.from(JSON.stringify({ PK, SK, GSI3PK, GSI3SK })).toString("base64")
    : index === "GSI4"
    ? Buffer.from(JSON.stringify({ PK, SK, GSI4PK, GSI4SK })).toString("base64")
    : index === "GSI5"
    ? Buffer.from(JSON.stringify({ PK, SK, GSI5PK, GSI5SK })).toString("base64")
    : Buffer.from(JSON.stringify({ PK, SK })).toString("base64")

export const decodeDDBCursor = (encoded: string) => {
  try {
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
    } = JSON.parse(Buffer.from(encoded, "base64").toString())

    if (typeof PK !== "string" || typeof SK !== "string") throw new Error()

    return {
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
    }
  } catch (error) {
    throw new PaginationError("Couldn't decode cursor")
  }
}
