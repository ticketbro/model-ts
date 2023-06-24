import { ModelInstance } from "@model-ts/core"
import EventBridge, { ClientConfiguration } from "aws-sdk/clients/eventbridge"
import { PublishError } from "./errors"

export interface ClientProps extends ClientConfiguration {
  eventBusName: string
}

export class Client {
  eventBusName: string
  eventBridgeClient: EventBridge

  constructor(options: ClientProps) {
    this.eventBridgeClient = new EventBridge(options)
    this.eventBusName = options.eventBusName
  }

  async publish(
    ...events: Array<
      ModelInstance<string, any> & {
        source: string
        detailType: string
      }
    >
  ) {
    if (!events.length) return []

    const chunks = chunk(events, 10)

    const entries: EventBridge.PutEventsResultEntry[] = []
    let failedCount = 0

    for (const chunk of chunks) {
      const { Entries, FailedEntryCount } = await this.eventBridgeClient
        .putEvents({
          Entries: chunk.map((event) => ({
            EventBusName: this.eventBusName,
            Source: event.source,
            DetailType: event.detailType,
            Detail: JSON.stringify(event.encode()),
          })),
        })
        .promise()

      failedCount += FailedEntryCount ?? 0
      entries.push(...(Entries ?? []))
    }

    if (failedCount > 0) {
      throw new PublishError()
    }

    return entries
  }
}

const chunk = <T>(array: T[], size: number) =>
  Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  )
