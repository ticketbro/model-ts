export class InternalServerError extends Error {
  readonly details: any

  constructor(details?: any) {
    super("Internal Server Error")

    this.details = details
  }

  toAppSyncError() {
    return {
      type: "InternalServerError",
      message: this.message,
    }
  }

  toHttpError() {
    return {
      statusCode: 500,
      body: this.message,
    }
  }
}