import { ModelInstance, Provider } from '@model-ts/core'
import EventBridge from 'aws-sdk/clients/eventbridge'
import { InternalServerError } from './errors'

export interface EventBridgeProvider extends Provider {
  instanceProps: {
    publish: <T extends ModelInstance<string, any> & { source: string; detailType: string} >(
      this: T
    ) => Promise<EventBridge.PutEventsResponse['Entries']>
  }
}

export const getProvider = (client: EventBridge) => {
  const provider: EventBridgeProvider = {
    instanceProps: {
      async publish(this) {
        const result = await client.putEvents({
          Entries: [{
            EventBusName: process.env.EVENT_BUS,
            Source: this.source,
            DetailType: this.detailType,
            Detail: this.encode(),
          }]
        }).promise()

        const failed = result.FailedEntryCount || !result.Entries
        if (failed) {
          throw new InternalServerError()
        }
        return result.Entries
      },
    },
  }
  return provider
}
