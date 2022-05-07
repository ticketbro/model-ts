import { Client } from "./client"

export const stubEventBus = (
  client: Client,
  fn: (...events: any[]) => ReturnType<Client["publish"]>
) => {
  client.publish = fn
}
