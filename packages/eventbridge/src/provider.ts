import { ModelInstance, Provider } from "@model-ts/core"
import EventBridge from "aws-sdk/clients/eventbridge"
import { Client } from "./client"

export interface EventBridgeProvider extends Provider {
  instanceProps: {
    publish: <
      T extends ModelInstance<string, any> & {
        source: string
        detailType: string
      }
    >(
      this: T
    ) => Promise<EventBridge.PutEventsResponse["Entries"]>
  }
}

export const getProvider = (client: Client) => {
  const provider: EventBridgeProvider = {
    instanceProps: {
      async publish(this) {
        return client.publish(this)
      }
    }
  }
  return provider
}
