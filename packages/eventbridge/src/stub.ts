import { Client } from "./client"

export const stubEventBus = (
  client: Client,
  fn: (event: any) => ReturnType<Client["publish"]>
) => {
  client.publish = (...events: any[]): any => {
    for (const event of events) {
      fn(event)
    }
  }
}
