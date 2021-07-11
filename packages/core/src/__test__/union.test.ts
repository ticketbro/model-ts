import * as t from "io-ts"
import { model } from "../model"
import { RuntimeTypeValidationError } from "../runtime-type-validation-error"
import { Union, union } from "../union"

describe("without providers", () => {
  class A extends model("A", t.type({ a: t.string })) {}
  class B extends model("B", t.type({ b: t.number })) {}

  class Union extends union([A, B]) {}

  test("it throws if Union is constructed with `new`", () => {
    expect(() => new Union(null as never)).toThrowError()
  })

  describe("decode without `_tag`", () => {
    test("it decodes a value", () => {
      const decodedA = Union.from({ a: "a" })
      expect(decodedA).toBeInstanceOf(A)
      expect(decodedA).toMatchInlineSnapshot(`
        A {
          "_codec": ExactType {
            "_tag": "ExactType",
            "decode": [Function],
            "encode": [Function],
            "is": [Function],
            "name": "{| a: string |}",
            "type": InterfaceType {
              "_tag": "InterfaceType",
              "decode": [Function],
              "encode": [Function],
              "is": [Function],
              "name": "{ a: string }",
              "props": Object {
                "a": StringType {
                  "_tag": "StringType",
                  "decode": [Function],
                  "encode": [Function],
                  "is": [Function],
                  "name": "string",
                  "validate": [Function],
                },
              },
              "validate": [Function],
            },
            "validate": [Function],
          },
          "_tag": "A",
          "a": "a",
          "encode": [Function],
          "values": [Function],
        }
      `)

      const decodedB = Union.from({ b: 42, c: "" })
      expect(decodedB).toBeInstanceOf(B)
      expect(decodedB).toMatchInlineSnapshot(`
        B {
          "_codec": ExactType {
            "_tag": "ExactType",
            "decode": [Function],
            "encode": [Function],
            "is": [Function],
            "name": "{| b: number |}",
            "type": InterfaceType {
              "_tag": "InterfaceType",
              "decode": [Function],
              "encode": [Function],
              "is": [Function],
              "name": "{ b: number }",
              "props": Object {
                "b": NumberType {
                  "_tag": "NumberType",
                  "decode": [Function],
                  "encode": [Function],
                  "is": [Function],
                  "name": "number",
                  "validate": [Function],
                },
              },
              "validate": [Function],
            },
            "validate": [Function],
          },
          "_tag": "B",
          "b": 42,
          "encode": [Function],
          "values": [Function],
        }
      `)
    })

    test("it throws an error if it's unable to decode a value", () => {
      expect(() => Union.from("doesn't work")).toThrow(
        RuntimeTypeValidationError
      )
    })

    test("it uses the first matching model in case of ambiguity", () => {
      expect(Union.from({ a: "string", b: 42 })).toBeInstanceOf(A)
    })
  })

  describe("decode with `_tag`", () => {
    test("it decodes a value", () => {
      const decodedA = Union.from({ _tag: "A", a: "a" })
      expect(decodedA).toBeInstanceOf(A)
      expect(decodedA).toMatchInlineSnapshot(`
        A {
          "_codec": ExactType {
            "_tag": "ExactType",
            "decode": [Function],
            "encode": [Function],
            "is": [Function],
            "name": "{| a: string |}",
            "type": InterfaceType {
              "_tag": "InterfaceType",
              "decode": [Function],
              "encode": [Function],
              "is": [Function],
              "name": "{ a: string }",
              "props": Object {
                "a": StringType {
                  "_tag": "StringType",
                  "decode": [Function],
                  "encode": [Function],
                  "is": [Function],
                  "name": "string",
                  "validate": [Function],
                },
              },
              "validate": [Function],
            },
            "validate": [Function],
          },
          "_tag": "A",
          "a": "a",
          "encode": [Function],
          "values": [Function],
        }
      `)

      const decodedB = Union.from({ _tag: "B", b: 42, c: "" })
      expect(decodedB).toBeInstanceOf(B)
      expect(decodedB).toMatchInlineSnapshot(`
        B {
          "_codec": ExactType {
            "_tag": "ExactType",
            "decode": [Function],
            "encode": [Function],
            "is": [Function],
            "name": "{| b: number |}",
            "type": InterfaceType {
              "_tag": "InterfaceType",
              "decode": [Function],
              "encode": [Function],
              "is": [Function],
              "name": "{ b: number }",
              "props": Object {
                "b": NumberType {
                  "_tag": "NumberType",
                  "decode": [Function],
                  "encode": [Function],
                  "is": [Function],
                  "name": "number",
                  "validate": [Function],
                },
              },
              "validate": [Function],
            },
            "validate": [Function],
          },
          "_tag": "B",
          "b": 42,
          "encode": [Function],
          "values": [Function],
        }
      `)
    })

    test("it first tries a matching _tag", () => {
      expect(Union.from({ _tag: "B", a: "string", b: 42 })).toBeInstanceOf(B)
    })

    test("it uses the first matching model if the _tag is unknown", () => {
      expect(Union.from({ _tag: "x", a: "string", b: 42 })).toBeInstanceOf(A)
    })

    test("it throws an error if it's unable to decode a value", () => {
      expect(() => Union.from({ _tag: "C", c: "hello" })).toThrow(
        RuntimeTypeValidationError
      )
    })
  })
})

describe("with provider", () => {
  const PROVIDER = {
    unionProps: {
      printModels<T extends Union>(this: T) {
        return this._models.map(({ _tag }) => _tag).join(" | ")
      },
      constValue: 42,
      get doubleConstValue() {
        return this.constValue * 2
      },
    },
  }

  class A extends model("A", t.type({ a: t.string })) {}
  class B extends model("B", t.type({ b: t.number }), PROVIDER) {}
  class U extends union([A, B], PROVIDER) {}

  test("it injects class props", () => {
    expect(U.printModels()).toMatchInlineSnapshot(`"A | B"`)
    expect(U.constValue).toEqual(42)
    expect(U.doubleConstValue).toEqual(84)
  })
})

describe("as io-ts codec", () => {
  class A extends model("A", t.type({ a: t.string })) {}
  class B extends model("B", t.type({ b: t.number })) {}

  class Union extends union([A, B]) {}

  test("it decodes", () => {
    expect(t.type({ union: Union }).decode({ union: { b: 42 } }))
      .toMatchInlineSnapshot(`
      Object {
        "_tag": "Right",
        "right": Object {
          "union": B {
            "_codec": ExactType {
              "_tag": "ExactType",
              "decode": [Function],
              "encode": [Function],
              "is": [Function],
              "name": "{| b: number |}",
              "type": InterfaceType {
                "_tag": "InterfaceType",
                "decode": [Function],
                "encode": [Function],
                "is": [Function],
                "name": "{ b: number }",
                "props": Object {
                  "b": NumberType {
                    "_tag": "NumberType",
                    "decode": [Function],
                    "encode": [Function],
                    "is": [Function],
                    "name": "number",
                    "validate": [Function],
                  },
                },
                "validate": [Function],
              },
              "validate": [Function],
            },
            "_tag": "B",
            "b": 42,
            "encode": [Function],
            "values": [Function],
          },
        },
      }
    `)
  })

  test("it fails", () => {
    expect(t.type({ union: Union }).decode({ union: "something else" }))
      .toMatchInlineSnapshot(`
      Object {
        "_tag": "Left",
        "left": Array [
          Object {
            "context": Array [
              Object {
                "actual": Object {
                  "union": "something else",
                },
                "key": "",
                "type": InterfaceType {
                  "_tag": "InterfaceType",
                  "decode": [Function],
                  "encode": [Function],
                  "is": [Function],
                  "name": "{ union: Union }",
                  "props": Object {
                    "union": [Function],
                  },
                  "validate": [Function],
                },
              },
              Object {
                "actual": "something else",
                "key": "union",
                "type": [Function],
              },
              Object {
                "actual": "something else",
                "key": "0",
                "type": [Function],
              },
            ],
            "message": undefined,
            "value": "something else",
          },
          Object {
            "context": Array [
              Object {
                "actual": Object {
                  "union": "something else",
                },
                "key": "",
                "type": InterfaceType {
                  "_tag": "InterfaceType",
                  "decode": [Function],
                  "encode": [Function],
                  "is": [Function],
                  "name": "{ union: Union }",
                  "props": Object {
                    "union": [Function],
                  },
                  "validate": [Function],
                },
              },
              Object {
                "actual": "something else",
                "key": "union",
                "type": [Function],
              },
              Object {
                "actual": "something else",
                "key": "1",
                "type": [Function],
              },
            ],
            "message": undefined,
            "value": "something else",
          },
        ],
      }
    `)
  })
})
