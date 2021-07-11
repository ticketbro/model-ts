/**
 * Interface to build data and functional providers against.
 *
 * A provider can inject properties, methods and functionality into both the model class itself through
 * `classProps` (as static methods) as well as into its instances through `instanceProps`.
 *
 * ### Enforcing Properties on models
 *
 * Often, injected functionality relies on certain fields and functions on the model class or instance
 * themselves. Since we have no access (at least not statically) to the models we're injecting into,
 * we need to work around that limitation and enforce these constraints through Provider interfacse.
 *
 * For example, let's assume that we're writing a provider for a KV Store that allows for basic CRUD
 * functionality (we'll focus on a `save()` function here), but requires our models to generate a
 * unique primary key. We can achieve this by specifying an interface for our provider and making use
 * of a generic typing for the `this` parameter to make sure the model actually implements a function
 * `getKey(): string`. If the condition is not met, the compiler errors when trying to invoke the
 * injected functions.
 *
 * ```ts
 * interface KVProvider extends Provider {
 *   instanceProps: {
 *     // T is a generic type for a model instance
 *     save<T extends { getKey: () => string }>(this: T): Promise<void>
 *   }
 *   classProps: {
 *     // C is a generic type for the model class itself and needs to extends `ModelConstructor` for us
 *     // to be able to derive the instance type via `InstanceType<C>`
 *     getAll<C extends ModelConstructor & { namespace: string }>(
 *       this: C
 *     ): Promise<InstanceType<C>>
 *   }
 * }
 *
 * const provider: KVProvider = {
 *   instanceProps: {
 *     save() {
 *       const key = this.getKey()
 *       return store.save(key, this)
 *     },
 *   },
 *   classProps: {
 *     getAll() {
 *       return store.list(this.namespace)
 *     },
 *   },
 * }
 *
 * const codec = t.type({ foo: t.number })
 *
 * class A extends Model("A", codec, provider) {
 *   static namespace = "A"
 * }
 * class B extends Model("B", codec, provider) {
 *   getKey() {
 *     return "mynamespace:" + this.foo
 *   }
 * }
 *
 * // @ts-expect-error
 * new A({ foo: 12 }).save() // Error!
 * new B({ foo: 12 }).save() // Promise<void>
 *
 * A.getAll() // Promise<A>
 * // @ts-expect-error
 * B.getAll() // Error!
 * ```
 *
 */
export interface Provider {
  /**
   * Injects these properties into model instances.
   *
   * ### Example
   *
   * ```ts
   * const provider = {
   *    // ...
   *    classProps: {
   *        foo: 42, // Simple value
   *
   *        // Function
   *        printSomething() {
   *            console.log("something")
   *        },
   *
   *        // With a getter
   *        get bar() {
   *            return "*".repeat(this.foo)
   *        },
   *
   *        getNamespace() {
   *            // Accessing properties of the model class can't be handled safely in the function
   *            // implementation, but can be enforced by specifically describing this provider
   *            // using an interface.
   *            // Check the description of the `Provider` type for reference.
   *            return this._namespace
   *        },
   *    },
   * }
   * ```
   */
  classProps?: { [key: string]: any }

  /**
   * Injects these properties into model instances.
   *
   * ### Example
   *
   * ```js
   * const client = {
   *    // ...
   *    instanceProps: {
   *        foo: 42, // Simple value
   *
   *        // Function
   *        printSomething() {
   *            console.log("something")
   *        },
   *
   *        // With a getter
   *        get bar() {
   *            return "*".repeat(this.foo)
   *        },
   *
   *        getId() {
   *            // Accessing properties of the model instance can't be handled safely in the function
   *            // implementation, but can be enforced by specifically describing this provider
   *            // using an interface.
   *            // Check the description of the `Provider` type for reference.
   *            return this._tag + ":" + this.id
   *        },
   *    },
   * }
   * ```
   */
  instanceProps?: { [key: string]: any }

  /**
   * Injects these properties into union classes.
   *
   * ### Example
   *
   * ```ts
   * const provider = {
   *    // ...
   *    unionProps: {
   *        foo: 42, // Simple value
   *
   *        // Function
   *        printSomething() {
   *            console.log("something")
   *        },
   *    },
   * }
   * ```
   */
  unionProps?: { [key: string]: any }
}

/**
 * The Provider's injected instance props.
 */
export type InstanceProps<P extends Provider> = P["instanceProps"]

/**
 * The Provider's injected class props.
 */
export type ClassProps<P extends Provider> = P["classProps"]

/**
 * The Provider's injected union props.
 */
export type UnionProps<P extends Provider> = P["unionProps"]
