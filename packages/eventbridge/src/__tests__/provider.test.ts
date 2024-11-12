import * as t from "io-ts"
import { model } from "@model-ts/core"
import { EventBridgeProvider, getProvider } from "../provider"
import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge"
import { Client } from "../client"
import { mockClient } from "aws-sdk-client-mock"
import "aws-sdk-client-mock-jest"

const mockEventBridgeClient = mockClient(EventBridgeClient)

const EVENT_BUS_NAME = "any-event-bus"

const makeSut = (eventBridgeClient: EventBridgeClient): EventBridgeProvider => {
  const client = new Client({ eventBusName: EVENT_BUS_NAME })

  client.eventBridgeClient = eventBridgeClient

  return getProvider(client)
}

const mockEvent = (provider: EventBridgeProvider) => {
  const codec = t.type({
    foo: t.string,
    bar: t.string,
  })
  class UserCreatedEvent extends model("UserCreatedEvent", codec, provider) {
    source = "core"
    detailType = "core.user.created"
  }
  const event = new UserCreatedEvent({
    foo: "any-foo",
    bar: "any-bar",
  })
  return {
    event,
    provider,
  }
}

it("should call provider.publish()", async () => {
  const client = new EventBridgeClient()
  mockEventBridgeClient.on(PutEventsCommand).resolvesOnce({
    Entries: [],
  })

  const provider = makeSut(client)
  provider.instanceProps.publish = jest.fn()
  const { event } = mockEvent(provider)
  await event.publish()
  expect(provider.instanceProps.publish).toHaveBeenCalled()
})

it("should call eventBridge.putEvents() with correct values", async () => {
  const client = new EventBridgeClient()
  const { event } = mockEvent(makeSut(client))
  mockEventBridgeClient.on(PutEventsCommand).resolvesOnce({
    Entries: [],
  })
  await event.publish()
  expect(mockEventBridgeClient).toHaveReceivedCommand(PutEventsCommand)
  expect(mockEventBridgeClient).toHaveReceivedCommandTimes(PutEventsCommand, 1)
  expect(mockEventBridgeClient).toHaveReceivedCommandWith(PutEventsCommand, {
    Entries: [
      {
        EventBusName: EVENT_BUS_NAME,
        Source: event.source,
        DetailType: event.detailType,
        Detail: JSON.stringify(event.encode()),
      },
    ],
  })
})

it("should succeed if no results", async () => {
  const client = new EventBridgeClient()
  const { event } = mockEvent(makeSut(client))
  mockEventBridgeClient.on(PutEventsCommand).resolvesOnce({ Entries: [] })
  const promise = event.publish()
  await expect(promise).resolves.toEqual([])
})

it("should throw if FailedEntryCount > 0", async () => {
  const client = new EventBridgeClient()
  mockEventBridgeClient.on(PutEventsCommand).rejects({})
  const { event } = mockEvent(makeSut(client))
  const promise = event.publish()
  await expect(promise).rejects.toThrow()
})

it("should return Entries", async () => {
  const client = new EventBridgeClient()
  const { event } = mockEvent(makeSut(client))
  mockEventBridgeClient
    .on(PutEventsCommand)
    .resolves({ Entries: [{ EventId: "MOCK-ID" }] })
  const results = await event.publish()
  expect(results).toEqual([
    {
      EventId: "MOCK-ID",
    },
  ])
})
