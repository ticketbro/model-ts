import * as t from "io-ts"
import { AnyModel, InputOf, OutputOf } from "./model"
import { Provider, UnionProps } from "./provider"
import { RuntimeTypeValidationError } from "./runtime-type-validation-error"

export interface BaseUnion<M extends [AnyModel, AnyModel, ...AnyModel[]]> {
  _models: Array<M[number]>

  // Disable constructor
  new (_: never): {}

  /**
   * Tries to decode the provided value with any of the provided model codecs. If `_tag` is present
   * on the value to be decoded, a model matching that specific test will be tried first.
   * Throws `RuntimeTypeValidationError` if value can't be decoded.
   *
   * @param {unknown} value - Value to be decoded
   * @throws {RuntimeTypeValidationError} Type can't be decoded using the model's codec.
   */
  decodeOrThrow(value: unknown): InstanceType<M[number]>
  /**
   * Tries to decode the provided value with any of the provided model codecs. If `_tag` is present
   * on the value to be decoded, a model matching that specific test will be tried first.
   * Throws `RuntimeTypeValidationError` if value can't be decoded.
   *
   * Shorthand for `decodeOrThrow`.
   *
   * @param {unknown} value - Value to be decoded
   * @throws {RuntimeTypeValidationError} Type can't be decoded using the model's codec.
   */
  from(value: unknown): InstanceType<M[number]>

  // io-ts type props
  _A: InstanceType<M[number]>
  _O: OutputOf<M[number]>
  _I: InputOf<M[number]>
  is(value: unknown): value is InstanceType<M[number]>
  decode(value: unknown): t.Validation<InstanceType<M[number]>>
  encode(value: InstanceType<M[number]>): OutputOf<M[number]>
  validate(
    value: unknown,
    context: t.Context
  ): t.Validation<InstanceType<M[number]>>
  // TODO: figure out pipe typing
  pipe: any
  asDecoder(): t.Decoder<unknown, InstanceType<M[number]>>
  asEncoder<T extends [AnyModel, AnyModel, ...AnyModel[]]>(
    this: BaseUnion<T>
  ): t.Encoder<InstanceType<T[number]>, OutputOf<T[number]>>
}

export type Union<
  M extends [AnyModel, AnyModel, ...AnyModel[]] = [
    AnyModel,
    AnyModel,
    ...AnyModel[]
  ],
  P extends Provider = Provider
> = BaseUnion<M> & UnionProps<P>

export type MemberOf<T extends Union> = InstanceType<T["_models"][number]>

export function union<M extends [AnyModel, AnyModel, ...AnyModel[]]>(
  models: M
): Union<M>
export function union<
  M extends [AnyModel, AnyModel, ...AnyModel[]],
  P extends Provider = Provider
>(models: M, provider: P): Union<M, P>
export function union<
  M extends [AnyModel, AnyModel, ...AnyModel[]],
  P extends Provider = Provider
>(models: M, provider?: P): Union<M, P> {
  class Union {
    static _A: InstanceType<M[number]>
    static _O: OutputOf<M[number]>
    static _I: InputOf<M[number]>
    static _models: Array<M[number]> = models
    static _codec: t.UnionC<M> = t.union(models)

    private static _modelMap = new Map<string, M[number]>(
      models.map((model) => [model._tag, model])
    )

    constructor() {
      throw new Error("Can't instantiate union models.")
    }

    static decodeOrThrow(value: unknown): InstanceType<M[number]> {
      const _tag = typeof value === "object" && (value as any)._tag

      if (_tag && this._modelMap.has(_tag)) {
        // Try preferred model
        try {
          const model = this._modelMap.get(_tag)! as M[number]
          return model.from(value) as InstanceType<M[number]>
        } catch (error) {
          // Ignore and continue with other models.
        }
      }

      // Try remaining models
      for (const model of this._models.filter((model) => model._tag !== _tag)) {
        try {
          return model.from(value) as InstanceType<M[number]>
        } catch (error) {}
      }

      throw new RuntimeTypeValidationError(
        "Couldn't decode using any of the provided union types."
      )
    }

    static from(value: unknown): InstanceType<M[number]> {
      return this.decodeOrThrow(value)
    }

    // io-ts interop
    static validate(
      value: unknown,
      context: t.Context
    ): t.Validation<InstanceType<M[number]>> {
      const _tag = typeof value === "object" && (value as any)._tag

      if (_tag && this._modelMap.has(_tag)) {
        // Try preferred model
        try {
          const model = this._modelMap.get(_tag)! as M[number]
          return model.validate(value, context) as t.Validation<
            InstanceType<M[number]>
          >
        } catch (error) {
          // Ignore and continue with other models.
        }
      }

      // Try full union
      return this._codec.validate(value, context) as t.Validation<
        InstanceType<M[number]>
      >
    }
    static decode(value: unknown): t.Validation<InstanceType<M[number]>> {
      return this.validate(value, [{ key: "", type: this, actual: value }])
    }
    static is(value: unknown): value is InstanceType<M[number]> {
      return this._codec.is(value)
    }
    static encode(value: InstanceType<M[number]>): OutputOf<M[number]> {
      return value.encode()
    }
    static pipe(ab: t.Any, name?: string) {
      return this._codec.pipe(ab, name)
    }
    static asDecoder(): t.Decoder<unknown, InstanceType<M[number]>> {
      return this
    }
    static asEncoder(): t.Encoder<
      InstanceType<M[number]>,
      OutputOf<M[number]>
    > {
      return this
    }
  }

  Object.assign(Union, provider?.unionProps ?? {})

  return Union
}
