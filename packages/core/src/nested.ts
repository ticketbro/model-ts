import { AnyModel } from "./model"

export type Nested<T> = T extends abstract new (
  ...args: any[]
) => infer I
  ? T & { _A: I }
  : never

  /**
   * Utility to properly resolve types when nesting models.
   * 
   * #### Example
   * 
   * ```ts
   * import * as t from "io-ts"
   * import { model, nested } from "@model-ts/core"
   * 
   * export class A extends model("A", t.type({ a: t.string })) {}
   * 
   * export class B extends model("B", t.type({ b: nested(A) })) {}
   * ```
   */
export const nested = <T extends AnyModel>(codec: T): Nested<T> => codec as any