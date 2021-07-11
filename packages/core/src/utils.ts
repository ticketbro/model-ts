import * as t from "io-ts"
import { OutputOf, TypeOf } from "./model"
import { Provider } from "./provider"

export interface ModelConstructor<T = {}> {
  new (...args: any[]): T
  _tag: string
  _codec: t.HasProps
  decodeOrThrow<M extends ModelConstructor>(
    this: M,
    value: unknown
  ): InstanceType<M>
  from<M extends ModelConstructor>(this: M, value: unknown): InstanceType<M>
  encodeProp(key: any, value: any): any

  // io-ts interop
  _A: T
  _O: any
  _I: unknown
  decode<T>(this: ModelConstructor<T>, value: unknown): t.Validation<T>
  encode<M extends ModelConstructor>(
    this: M,
    value: InstanceType<M>
  ): OutputOf<M>
  validate<T>(
    this: ModelConstructor<T>,
    value: unknown,
    context: t.Context
  ): t.Validation<T>
  is<M extends ModelConstructor>(
    this: M,
    value: unknown
  ): value is InstanceType<M>
  pipe: any
  // asDecoder(): any
  // asEncoder(): any
  asDecoder<M extends ModelConstructor>(this: M): t.Decoder<unknown, TypeOf<M>>
  asEncoder<M extends ModelConstructor>(
    this: M
  ): t.Encoder<TypeOf<M>, OutputOf<M>>
}

/**
 * Utility to enforce a property on an object.
 */
export type RequireField<
  Target extends Record<string, any>,
  Key extends string,
  Expected,
  Return
> = Target[Key] extends Expected ? Return : never

/**
 * Encodes a specific model field.
 *
 * @param codec
 * @param key
 * @param value
 *
 * @throws {Error} No matching codec found.
 */
export function encodeProp(codec: t.Any, key: any, value: any): any {
  if (isTypeC(codec) && codec.props[key]) return codec.props[key].encode(value)
  if (isPartialC(codec) && codec.props[key])
    return codec.props[key].encode(value)
  if (isExactC(codec)) return encodeProp(codec.type, key, value)

  if (isIntersectionC(codec)) {
    for (const type of codec.types) {
      try {
        const encoded = encodeProp(type, key, value)
        return encoded
      } catch (e) {
        /* Ignore */
      }
    }
  }

  throw new Error("No matching codec found.")
}

export function getProps(codec: t.HasProps): t.Props {
  switch (codec._tag) {
    case "RefinementType":
    case "ReadonlyType":
      return getProps(codec.type)
    case "InterfaceType":
    case "StrictType":
    case "PartialType":
      return codec.props
    case "IntersectionType":
      return codec.types.reduce<t.Props>(
        (props, type) => Object.assign(props, getProps(type)),
        {}
      )
  }
}

function isIntersectionC(
  codec: t.Any
): codec is t.IntersectionC<[t.Mixed, t.Mixed, ...Array<t.Mixed>]> {
  return (codec as any)._tag === "IntersectionType"
}

function isPartialC(codec: t.Any): codec is t.PartialC<t.Props> {
  return (codec as any)._tag === "PartialType"
}

function isExactC(codec: t.Any): codec is t.ExactC<t.HasProps> {
  return (codec as any)._tag === "ExactType"
}

function isTypeC(codec: t.Any): codec is t.TypeC<t.Props> {
  return (codec as any)._tag === "InterfaceType"
}

type UnknownFallback<T, F> = unknown extends T ? F : T

type MergeProviders<T extends [Provider, ...Provider[]]> = T extends [Provider]
  ? T[0]
  : T extends [infer Head, ...infer Tail]
  ? Head extends Provider
    ? Tail extends [Provider, ...Provider[]]
      ? {
          classProps: UnknownFallback<
            Head["classProps"] & MergeProviders<Tail>["classProps"],
            {}
          >
          instanceProps: UnknownFallback<
            Head["instanceProps"] & MergeProviders<Tail>["instanceProps"],
            {}
          >
          unionProps: UnknownFallback<
            Head["unionProps"] & MergeProviders<Tail>["unionProps"],
            {}
          >
        }
      : never
    : never
  : never

export function mergeProviders<T extends [Provider, ...Provider[]]>(
  providers: T
): MergeProviders<T> {
  return Object.assign({}, ...providers)
}
