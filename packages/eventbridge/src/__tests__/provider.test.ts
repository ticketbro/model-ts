import * as t from 'io-ts'
import { model } from '@model-ts/core'
import { EventBridgeProvider, getProvider } from '../provider'
import EventBridge from 'aws-sdk/clients/eventbridge'

jest.mock('aws-sdk/clients/eventbridge')

const makeSut = (client: EventBridge): EventBridgeProvider => {
  return getProvider(client)
}

const mockEvent = (provider: EventBridgeProvider) => {
  const codec = t.type({
    foo: t.string,
    bar: t.string,
  })
  class UserCreatedEvent extends model('UserCreatedEvent', codec , provider) {
    source = 'core'
    detailType = 'core.user.created'
  }
  const event = new UserCreatedEvent({
    foo: 'any-foo',
    bar: 'any-bar'
  })
  return {
    event,
    provider
  }
}

describe('EventBus', () => {
  beforeAll(() => {
    process.env.EVENT_BUS = 'any-event-bus'
  })
  it('should call provider.publish()', async () => {
    const client = new EventBridge()
    client.putEvents = jest.fn().mockImplementationOnce(() => ({
      promise: () => Promise.resolve({
        Entries: []
      })
    }))
    const provider = makeSut(client)
    provider.instanceProps.publish = jest.fn()
    const { event } = mockEvent(provider)
    await event.publish()
    expect(provider.instanceProps.publish).toHaveBeenCalled()
  })
  it('should call eventBridge.putEvents() with correct values', async () => {
    const client = new EventBridge()
    const { event } = mockEvent(makeSut(client))
    client.putEvents = jest.fn().mockImplementationOnce(() => ({
      promise: () => Promise.resolve({
        Entries: []
      })
    }))
    await event.publish()
    expect(client.putEvents).toHaveBeenCalledWith({
      Entries: [{
        EventBusName: process.env.EVENT_BUS,
        Source: event.source,
        DetailType: event.detailType,
        Detail: event.encode(),
      }]
    })
  })
  it('should throw if no results', async () => {
    const client = new EventBridge()
    client.putEvents = jest.fn().mockImplementationOnce(() => ({
      promise: () => Promise.resolve({})
    }))
    const { event } = mockEvent(makeSut(client))
    const promise = event.publish()
    await expect(promise).rejects.toThrow()
  })
  it('should throw if FailedEntryCount > 0', async () => {
    const client = new EventBridge()
    client.putEvents = jest.fn().mockImplementationOnce(() => ({
      promise: () => Promise.resolve({
        FailedEntryCount: 1
      })
    }))
    const { event } = mockEvent(makeSut(client))
    const promise = event.publish()
    await expect(promise).rejects.toThrow()
  })
  it('should return Entries', async () => {
    const client = new EventBridge()
    const { event } = mockEvent(makeSut(client))
    client.putEvents = jest.fn().mockImplementationOnce(() => ({
      promise: () => Promise.resolve({
        Entries: [{
          EventBusName: process.env.EVENT_BUS,
          Source: 'core',
          DetailType: 'core.user.created',
          Detail: event.encode(),
        }]
      })
    }))
    const results = await event.publish()
    expect(results).toEqual([{
      EventBusName: process.env.EVENT_BUS,
      Source: 'core',
      DetailType: 'core.user.created',
      Detail: event.encode(),
    }])
  })
})