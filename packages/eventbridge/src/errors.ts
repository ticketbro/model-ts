export class PublishError extends Error {
  readonly details: any

  constructor(details?: any) {
    super("An error occured on publishing events")
    this.name = "PublishError"
    this.details = details
  }
}