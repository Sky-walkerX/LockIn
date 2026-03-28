
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Todo
 * 
 */
export type Todo = $Result.DefaultSelection<Prisma.$TodoPayload>
/**
 * Model Tag
 * 
 */
export type Tag = $Result.DefaultSelection<Prisma.$TagPayload>
/**
 * Model Suggestion
 * 
 */
export type Suggestion = $Result.DefaultSelection<Prisma.$SuggestionPayload>
/**
 * Model TimerSession
 * 
 */
export type TimerSession = $Result.DefaultSelection<Prisma.$TimerSessionPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const Priority: {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH'
};

export type Priority = (typeof Priority)[keyof typeof Priority]


export const SuggestionType: {
  ADD: 'ADD',
  SKIP: 'SKIP',
  RESCHEDULE: 'RESCHEDULE'
};

export type SuggestionType = (typeof SuggestionType)[keyof typeof SuggestionType]


export const Recurrence: {
  NONE: 'NONE',
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY'
};

export type Recurrence = (typeof Recurrence)[keyof typeof Recurrence]

}

export type Priority = $Enums.Priority

export const Priority: typeof $Enums.Priority

export type SuggestionType = $Enums.SuggestionType

export const SuggestionType: typeof $Enums.SuggestionType

export type Recurrence = $Enums.Recurrence

export const Recurrence: typeof $Enums.Recurrence

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.todo`: Exposes CRUD operations for the **Todo** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Todos
    * const todos = await prisma.todo.findMany()
    * ```
    */
  get todo(): Prisma.TodoDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.tag`: Exposes CRUD operations for the **Tag** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Tags
    * const tags = await prisma.tag.findMany()
    * ```
    */
  get tag(): Prisma.TagDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.suggestion`: Exposes CRUD operations for the **Suggestion** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Suggestions
    * const suggestions = await prisma.suggestion.findMany()
    * ```
    */
  get suggestion(): Prisma.SuggestionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.timerSession`: Exposes CRUD operations for the **TimerSession** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TimerSessions
    * const timerSessions = await prisma.timerSession.findMany()
    * ```
    */
  get timerSession(): Prisma.TimerSessionDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.11.1
   * Query Engine version: f40f79ec31188888a2e33acda0ecc8fd10a853a9
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    Todo: 'Todo',
    Tag: 'Tag',
    Suggestion: 'Suggestion',
    TimerSession: 'TimerSession'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "user" | "todo" | "tag" | "suggestion" | "timerSession"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Todo: {
        payload: Prisma.$TodoPayload<ExtArgs>
        fields: Prisma.TodoFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TodoFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TodoPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TodoFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TodoPayload>
          }
          findFirst: {
            args: Prisma.TodoFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TodoPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TodoFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TodoPayload>
          }
          findMany: {
            args: Prisma.TodoFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TodoPayload>[]
          }
          create: {
            args: Prisma.TodoCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TodoPayload>
          }
          createMany: {
            args: Prisma.TodoCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TodoCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TodoPayload>[]
          }
          delete: {
            args: Prisma.TodoDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TodoPayload>
          }
          update: {
            args: Prisma.TodoUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TodoPayload>
          }
          deleteMany: {
            args: Prisma.TodoDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TodoUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TodoUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TodoPayload>[]
          }
          upsert: {
            args: Prisma.TodoUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TodoPayload>
          }
          aggregate: {
            args: Prisma.TodoAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTodo>
          }
          groupBy: {
            args: Prisma.TodoGroupByArgs<ExtArgs>
            result: $Utils.Optional<TodoGroupByOutputType>[]
          }
          count: {
            args: Prisma.TodoCountArgs<ExtArgs>
            result: $Utils.Optional<TodoCountAggregateOutputType> | number
          }
        }
      }
      Tag: {
        payload: Prisma.$TagPayload<ExtArgs>
        fields: Prisma.TagFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TagFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TagPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TagFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TagPayload>
          }
          findFirst: {
            args: Prisma.TagFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TagPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TagFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TagPayload>
          }
          findMany: {
            args: Prisma.TagFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TagPayload>[]
          }
          create: {
            args: Prisma.TagCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TagPayload>
          }
          createMany: {
            args: Prisma.TagCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TagCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TagPayload>[]
          }
          delete: {
            args: Prisma.TagDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TagPayload>
          }
          update: {
            args: Prisma.TagUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TagPayload>
          }
          deleteMany: {
            args: Prisma.TagDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TagUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TagUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TagPayload>[]
          }
          upsert: {
            args: Prisma.TagUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TagPayload>
          }
          aggregate: {
            args: Prisma.TagAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTag>
          }
          groupBy: {
            args: Prisma.TagGroupByArgs<ExtArgs>
            result: $Utils.Optional<TagGroupByOutputType>[]
          }
          count: {
            args: Prisma.TagCountArgs<ExtArgs>
            result: $Utils.Optional<TagCountAggregateOutputType> | number
          }
        }
      }
      Suggestion: {
        payload: Prisma.$SuggestionPayload<ExtArgs>
        fields: Prisma.SuggestionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SuggestionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SuggestionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SuggestionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SuggestionPayload>
          }
          findFirst: {
            args: Prisma.SuggestionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SuggestionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SuggestionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SuggestionPayload>
          }
          findMany: {
            args: Prisma.SuggestionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SuggestionPayload>[]
          }
          create: {
            args: Prisma.SuggestionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SuggestionPayload>
          }
          createMany: {
            args: Prisma.SuggestionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SuggestionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SuggestionPayload>[]
          }
          delete: {
            args: Prisma.SuggestionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SuggestionPayload>
          }
          update: {
            args: Prisma.SuggestionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SuggestionPayload>
          }
          deleteMany: {
            args: Prisma.SuggestionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SuggestionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SuggestionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SuggestionPayload>[]
          }
          upsert: {
            args: Prisma.SuggestionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SuggestionPayload>
          }
          aggregate: {
            args: Prisma.SuggestionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSuggestion>
          }
          groupBy: {
            args: Prisma.SuggestionGroupByArgs<ExtArgs>
            result: $Utils.Optional<SuggestionGroupByOutputType>[]
          }
          count: {
            args: Prisma.SuggestionCountArgs<ExtArgs>
            result: $Utils.Optional<SuggestionCountAggregateOutputType> | number
          }
        }
      }
      TimerSession: {
        payload: Prisma.$TimerSessionPayload<ExtArgs>
        fields: Prisma.TimerSessionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TimerSessionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TimerSessionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TimerSessionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TimerSessionPayload>
          }
          findFirst: {
            args: Prisma.TimerSessionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TimerSessionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TimerSessionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TimerSessionPayload>
          }
          findMany: {
            args: Prisma.TimerSessionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TimerSessionPayload>[]
          }
          create: {
            args: Prisma.TimerSessionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TimerSessionPayload>
          }
          createMany: {
            args: Prisma.TimerSessionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TimerSessionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TimerSessionPayload>[]
          }
          delete: {
            args: Prisma.TimerSessionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TimerSessionPayload>
          }
          update: {
            args: Prisma.TimerSessionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TimerSessionPayload>
          }
          deleteMany: {
            args: Prisma.TimerSessionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TimerSessionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TimerSessionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TimerSessionPayload>[]
          }
          upsert: {
            args: Prisma.TimerSessionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TimerSessionPayload>
          }
          aggregate: {
            args: Prisma.TimerSessionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTimerSession>
          }
          groupBy: {
            args: Prisma.TimerSessionGroupByArgs<ExtArgs>
            result: $Utils.Optional<TimerSessionGroupByOutputType>[]
          }
          count: {
            args: Prisma.TimerSessionCountArgs<ExtArgs>
            result: $Utils.Optional<TimerSessionCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    user?: UserOmit
    todo?: TodoOmit
    tag?: TagOmit
    suggestion?: SuggestionOmit
    timerSession?: TimerSessionOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    todos: number
    suggestions: number
    tags: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    todos?: boolean | UserCountOutputTypeCountTodosArgs
    suggestions?: boolean | UserCountOutputTypeCountSuggestionsArgs
    tags?: boolean | UserCountOutputTypeCountTagsArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountTodosArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TodoWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountSuggestionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SuggestionWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountTagsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TagWhereInput
  }


  /**
   * Count Type TodoCountOutputType
   */

  export type TodoCountOutputType = {
    timerSessions: number
    subTasks: number
    tags: number
  }

  export type TodoCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    timerSessions?: boolean | TodoCountOutputTypeCountTimerSessionsArgs
    subTasks?: boolean | TodoCountOutputTypeCountSubTasksArgs
    tags?: boolean | TodoCountOutputTypeCountTagsArgs
  }

  // Custom InputTypes
  /**
   * TodoCountOutputType without action
   */
  export type TodoCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TodoCountOutputType
     */
    select?: TodoCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * TodoCountOutputType without action
   */
  export type TodoCountOutputTypeCountTimerSessionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TimerSessionWhereInput
  }

  /**
   * TodoCountOutputType without action
   */
  export type TodoCountOutputTypeCountSubTasksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TodoWhereInput
  }

  /**
   * TodoCountOutputType without action
   */
  export type TodoCountOutputTypeCountTagsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TagWhereInput
  }


  /**
   * Count Type TagCountOutputType
   */

  export type TagCountOutputType = {
    todos: number
  }

  export type TagCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    todos?: boolean | TagCountOutputTypeCountTodosArgs
  }

  // Custom InputTypes
  /**
   * TagCountOutputType without action
   */
  export type TagCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TagCountOutputType
     */
    select?: TagCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * TagCountOutputType without action
   */
  export type TagCountOutputTypeCountTodosArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TodoWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserAvgAggregateOutputType = {
    xp: number | null
    level: number | null
    streak: number | null
  }

  export type UserSumAggregateOutputType = {
    xp: number | null
    level: number | null
    streak: number | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    email: string | null
    name: string | null
    password: string | null
    createdAt: Date | null
    updatedAt: Date | null
    xp: number | null
    level: number | null
    streak: number | null
    lastActiveDate: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    email: string | null
    name: string | null
    password: string | null
    createdAt: Date | null
    updatedAt: Date | null
    xp: number | null
    level: number | null
    streak: number | null
    lastActiveDate: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    email: number
    name: number
    password: number
    createdAt: number
    updatedAt: number
    xp: number
    level: number
    streak: number
    lastActiveDate: number
    _all: number
  }


  export type UserAvgAggregateInputType = {
    xp?: true
    level?: true
    streak?: true
  }

  export type UserSumAggregateInputType = {
    xp?: true
    level?: true
    streak?: true
  }

  export type UserMinAggregateInputType = {
    id?: true
    email?: true
    name?: true
    password?: true
    createdAt?: true
    updatedAt?: true
    xp?: true
    level?: true
    streak?: true
    lastActiveDate?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    email?: true
    name?: true
    password?: true
    createdAt?: true
    updatedAt?: true
    xp?: true
    level?: true
    streak?: true
    lastActiveDate?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    email?: true
    name?: true
    password?: true
    createdAt?: true
    updatedAt?: true
    xp?: true
    level?: true
    streak?: true
    lastActiveDate?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UserAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UserSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _avg?: UserAvgAggregateInputType
    _sum?: UserSumAggregateInputType
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    email: string
    name: string | null
    password: string | null
    createdAt: Date
    updatedAt: Date
    xp: number
    level: number
    streak: number
    lastActiveDate: Date | null
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    name?: boolean
    password?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    xp?: boolean
    level?: boolean
    streak?: boolean
    lastActiveDate?: boolean
    todos?: boolean | User$todosArgs<ExtArgs>
    suggestions?: boolean | User$suggestionsArgs<ExtArgs>
    tags?: boolean | User$tagsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    name?: boolean
    password?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    xp?: boolean
    level?: boolean
    streak?: boolean
    lastActiveDate?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    name?: boolean
    password?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    xp?: boolean
    level?: boolean
    streak?: boolean
    lastActiveDate?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    email?: boolean
    name?: boolean
    password?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    xp?: boolean
    level?: boolean
    streak?: boolean
    lastActiveDate?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "email" | "name" | "password" | "createdAt" | "updatedAt" | "xp" | "level" | "streak" | "lastActiveDate", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    todos?: boolean | User$todosArgs<ExtArgs>
    suggestions?: boolean | User$suggestionsArgs<ExtArgs>
    tags?: boolean | User$tagsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type UserIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      todos: Prisma.$TodoPayload<ExtArgs>[]
      suggestions: Prisma.$SuggestionPayload<ExtArgs>[]
      tags: Prisma.$TagPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      email: string
      name: string | null
      password: string | null
      createdAt: Date
      updatedAt: Date
      xp: number
      level: number
      streak: number
      lastActiveDate: Date | null
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    todos<T extends User$todosArgs<ExtArgs> = {}>(args?: Subset<T, User$todosArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TodoPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    suggestions<T extends User$suggestionsArgs<ExtArgs> = {}>(args?: Subset<T, User$suggestionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SuggestionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    tags<T extends User$tagsArgs<ExtArgs> = {}>(args?: Subset<T, User$tagsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TagPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
    readonly password: FieldRef<"User", 'String'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
    readonly xp: FieldRef<"User", 'Int'>
    readonly level: FieldRef<"User", 'Int'>
    readonly streak: FieldRef<"User", 'Int'>
    readonly lastActiveDate: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.todos
   */
  export type User$todosArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Todo
     */
    select?: TodoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Todo
     */
    omit?: TodoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TodoInclude<ExtArgs> | null
    where?: TodoWhereInput
    orderBy?: TodoOrderByWithRelationInput | TodoOrderByWithRelationInput[]
    cursor?: TodoWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TodoScalarFieldEnum | TodoScalarFieldEnum[]
  }

  /**
   * User.suggestions
   */
  export type User$suggestionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suggestion
     */
    select?: SuggestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Suggestion
     */
    omit?: SuggestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SuggestionInclude<ExtArgs> | null
    where?: SuggestionWhereInput
    orderBy?: SuggestionOrderByWithRelationInput | SuggestionOrderByWithRelationInput[]
    cursor?: SuggestionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SuggestionScalarFieldEnum | SuggestionScalarFieldEnum[]
  }

  /**
   * User.tags
   */
  export type User$tagsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tag
     */
    select?: TagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tag
     */
    omit?: TagOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TagInclude<ExtArgs> | null
    where?: TagWhereInput
    orderBy?: TagOrderByWithRelationInput | TagOrderByWithRelationInput[]
    cursor?: TagWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TagScalarFieldEnum | TagScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Todo
   */

  export type AggregateTodo = {
    _count: TodoCountAggregateOutputType | null
    _avg: TodoAvgAggregateOutputType | null
    _sum: TodoSumAggregateOutputType | null
    _min: TodoMinAggregateOutputType | null
    _max: TodoMaxAggregateOutputType | null
  }

  export type TodoAvgAggregateOutputType = {
    estimatedTime: number | null
    timeSpent: number | null
    sortOrder: number | null
  }

  export type TodoSumAggregateOutputType = {
    estimatedTime: number | null
    timeSpent: number | null
    sortOrder: number | null
  }

  export type TodoMinAggregateOutputType = {
    id: string | null
    title: string | null
    description: string | null
    isCompleted: boolean | null
    createdAt: Date | null
    dueDate: Date | null
    completedAt: Date | null
    priority: $Enums.Priority | null
    isAiSuggested: boolean | null
    estimatedTime: number | null
    timeSpent: number | null
    sortOrder: number | null
    recurrence: $Enums.Recurrence | null
    recurrenceEndDate: Date | null
    parentId: string | null
    userId: string | null
  }

  export type TodoMaxAggregateOutputType = {
    id: string | null
    title: string | null
    description: string | null
    isCompleted: boolean | null
    createdAt: Date | null
    dueDate: Date | null
    completedAt: Date | null
    priority: $Enums.Priority | null
    isAiSuggested: boolean | null
    estimatedTime: number | null
    timeSpent: number | null
    sortOrder: number | null
    recurrence: $Enums.Recurrence | null
    recurrenceEndDate: Date | null
    parentId: string | null
    userId: string | null
  }

  export type TodoCountAggregateOutputType = {
    id: number
    title: number
    description: number
    isCompleted: number
    createdAt: number
    dueDate: number
    completedAt: number
    priority: number
    isAiSuggested: number
    estimatedTime: number
    timeSpent: number
    sortOrder: number
    recurrence: number
    recurrenceEndDate: number
    parentId: number
    userId: number
    _all: number
  }


  export type TodoAvgAggregateInputType = {
    estimatedTime?: true
    timeSpent?: true
    sortOrder?: true
  }

  export type TodoSumAggregateInputType = {
    estimatedTime?: true
    timeSpent?: true
    sortOrder?: true
  }

  export type TodoMinAggregateInputType = {
    id?: true
    title?: true
    description?: true
    isCompleted?: true
    createdAt?: true
    dueDate?: true
    completedAt?: true
    priority?: true
    isAiSuggested?: true
    estimatedTime?: true
    timeSpent?: true
    sortOrder?: true
    recurrence?: true
    recurrenceEndDate?: true
    parentId?: true
    userId?: true
  }

  export type TodoMaxAggregateInputType = {
    id?: true
    title?: true
    description?: true
    isCompleted?: true
    createdAt?: true
    dueDate?: true
    completedAt?: true
    priority?: true
    isAiSuggested?: true
    estimatedTime?: true
    timeSpent?: true
    sortOrder?: true
    recurrence?: true
    recurrenceEndDate?: true
    parentId?: true
    userId?: true
  }

  export type TodoCountAggregateInputType = {
    id?: true
    title?: true
    description?: true
    isCompleted?: true
    createdAt?: true
    dueDate?: true
    completedAt?: true
    priority?: true
    isAiSuggested?: true
    estimatedTime?: true
    timeSpent?: true
    sortOrder?: true
    recurrence?: true
    recurrenceEndDate?: true
    parentId?: true
    userId?: true
    _all?: true
  }

  export type TodoAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Todo to aggregate.
     */
    where?: TodoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Todos to fetch.
     */
    orderBy?: TodoOrderByWithRelationInput | TodoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TodoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Todos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Todos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Todos
    **/
    _count?: true | TodoCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TodoAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TodoSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TodoMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TodoMaxAggregateInputType
  }

  export type GetTodoAggregateType<T extends TodoAggregateArgs> = {
        [P in keyof T & keyof AggregateTodo]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTodo[P]>
      : GetScalarType<T[P], AggregateTodo[P]>
  }




  export type TodoGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TodoWhereInput
    orderBy?: TodoOrderByWithAggregationInput | TodoOrderByWithAggregationInput[]
    by: TodoScalarFieldEnum[] | TodoScalarFieldEnum
    having?: TodoScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TodoCountAggregateInputType | true
    _avg?: TodoAvgAggregateInputType
    _sum?: TodoSumAggregateInputType
    _min?: TodoMinAggregateInputType
    _max?: TodoMaxAggregateInputType
  }

  export type TodoGroupByOutputType = {
    id: string
    title: string
    description: string | null
    isCompleted: boolean
    createdAt: Date
    dueDate: Date | null
    completedAt: Date | null
    priority: $Enums.Priority
    isAiSuggested: boolean
    estimatedTime: number | null
    timeSpent: number | null
    sortOrder: number | null
    recurrence: $Enums.Recurrence
    recurrenceEndDate: Date | null
    parentId: string | null
    userId: string
    _count: TodoCountAggregateOutputType | null
    _avg: TodoAvgAggregateOutputType | null
    _sum: TodoSumAggregateOutputType | null
    _min: TodoMinAggregateOutputType | null
    _max: TodoMaxAggregateOutputType | null
  }

  type GetTodoGroupByPayload<T extends TodoGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TodoGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TodoGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TodoGroupByOutputType[P]>
            : GetScalarType<T[P], TodoGroupByOutputType[P]>
        }
      >
    >


  export type TodoSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    isCompleted?: boolean
    createdAt?: boolean
    dueDate?: boolean
    completedAt?: boolean
    priority?: boolean
    isAiSuggested?: boolean
    estimatedTime?: boolean
    timeSpent?: boolean
    sortOrder?: boolean
    recurrence?: boolean
    recurrenceEndDate?: boolean
    parentId?: boolean
    userId?: boolean
    timerSessions?: boolean | Todo$timerSessionsArgs<ExtArgs>
    parent?: boolean | Todo$parentArgs<ExtArgs>
    subTasks?: boolean | Todo$subTasksArgs<ExtArgs>
    tags?: boolean | Todo$tagsArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
    _count?: boolean | TodoCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["todo"]>

  export type TodoSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    isCompleted?: boolean
    createdAt?: boolean
    dueDate?: boolean
    completedAt?: boolean
    priority?: boolean
    isAiSuggested?: boolean
    estimatedTime?: boolean
    timeSpent?: boolean
    sortOrder?: boolean
    recurrence?: boolean
    recurrenceEndDate?: boolean
    parentId?: boolean
    userId?: boolean
    parent?: boolean | Todo$parentArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["todo"]>

  export type TodoSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    isCompleted?: boolean
    createdAt?: boolean
    dueDate?: boolean
    completedAt?: boolean
    priority?: boolean
    isAiSuggested?: boolean
    estimatedTime?: boolean
    timeSpent?: boolean
    sortOrder?: boolean
    recurrence?: boolean
    recurrenceEndDate?: boolean
    parentId?: boolean
    userId?: boolean
    parent?: boolean | Todo$parentArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["todo"]>

  export type TodoSelectScalar = {
    id?: boolean
    title?: boolean
    description?: boolean
    isCompleted?: boolean
    createdAt?: boolean
    dueDate?: boolean
    completedAt?: boolean
    priority?: boolean
    isAiSuggested?: boolean
    estimatedTime?: boolean
    timeSpent?: boolean
    sortOrder?: boolean
    recurrence?: boolean
    recurrenceEndDate?: boolean
    parentId?: boolean
    userId?: boolean
  }

  export type TodoOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "title" | "description" | "isCompleted" | "createdAt" | "dueDate" | "completedAt" | "priority" | "isAiSuggested" | "estimatedTime" | "timeSpent" | "sortOrder" | "recurrence" | "recurrenceEndDate" | "parentId" | "userId", ExtArgs["result"]["todo"]>
  export type TodoInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    timerSessions?: boolean | Todo$timerSessionsArgs<ExtArgs>
    parent?: boolean | Todo$parentArgs<ExtArgs>
    subTasks?: boolean | Todo$subTasksArgs<ExtArgs>
    tags?: boolean | Todo$tagsArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
    _count?: boolean | TodoCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type TodoIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    parent?: boolean | Todo$parentArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type TodoIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    parent?: boolean | Todo$parentArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $TodoPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Todo"
    objects: {
      timerSessions: Prisma.$TimerSessionPayload<ExtArgs>[]
      parent: Prisma.$TodoPayload<ExtArgs> | null
      subTasks: Prisma.$TodoPayload<ExtArgs>[]
      tags: Prisma.$TagPayload<ExtArgs>[]
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      title: string
      description: string | null
      isCompleted: boolean
      createdAt: Date
      dueDate: Date | null
      completedAt: Date | null
      priority: $Enums.Priority
      isAiSuggested: boolean
      estimatedTime: number | null
      timeSpent: number | null
      sortOrder: number | null
      recurrence: $Enums.Recurrence
      recurrenceEndDate: Date | null
      parentId: string | null
      userId: string
    }, ExtArgs["result"]["todo"]>
    composites: {}
  }

  type TodoGetPayload<S extends boolean | null | undefined | TodoDefaultArgs> = $Result.GetResult<Prisma.$TodoPayload, S>

  type TodoCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TodoFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TodoCountAggregateInputType | true
    }

  export interface TodoDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Todo'], meta: { name: 'Todo' } }
    /**
     * Find zero or one Todo that matches the filter.
     * @param {TodoFindUniqueArgs} args - Arguments to find a Todo
     * @example
     * // Get one Todo
     * const todo = await prisma.todo.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TodoFindUniqueArgs>(args: SelectSubset<T, TodoFindUniqueArgs<ExtArgs>>): Prisma__TodoClient<$Result.GetResult<Prisma.$TodoPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Todo that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TodoFindUniqueOrThrowArgs} args - Arguments to find a Todo
     * @example
     * // Get one Todo
     * const todo = await prisma.todo.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TodoFindUniqueOrThrowArgs>(args: SelectSubset<T, TodoFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TodoClient<$Result.GetResult<Prisma.$TodoPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Todo that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TodoFindFirstArgs} args - Arguments to find a Todo
     * @example
     * // Get one Todo
     * const todo = await prisma.todo.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TodoFindFirstArgs>(args?: SelectSubset<T, TodoFindFirstArgs<ExtArgs>>): Prisma__TodoClient<$Result.GetResult<Prisma.$TodoPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Todo that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TodoFindFirstOrThrowArgs} args - Arguments to find a Todo
     * @example
     * // Get one Todo
     * const todo = await prisma.todo.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TodoFindFirstOrThrowArgs>(args?: SelectSubset<T, TodoFindFirstOrThrowArgs<ExtArgs>>): Prisma__TodoClient<$Result.GetResult<Prisma.$TodoPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Todos that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TodoFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Todos
     * const todos = await prisma.todo.findMany()
     * 
     * // Get first 10 Todos
     * const todos = await prisma.todo.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const todoWithIdOnly = await prisma.todo.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TodoFindManyArgs>(args?: SelectSubset<T, TodoFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TodoPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Todo.
     * @param {TodoCreateArgs} args - Arguments to create a Todo.
     * @example
     * // Create one Todo
     * const Todo = await prisma.todo.create({
     *   data: {
     *     // ... data to create a Todo
     *   }
     * })
     * 
     */
    create<T extends TodoCreateArgs>(args: SelectSubset<T, TodoCreateArgs<ExtArgs>>): Prisma__TodoClient<$Result.GetResult<Prisma.$TodoPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Todos.
     * @param {TodoCreateManyArgs} args - Arguments to create many Todos.
     * @example
     * // Create many Todos
     * const todo = await prisma.todo.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TodoCreateManyArgs>(args?: SelectSubset<T, TodoCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Todos and returns the data saved in the database.
     * @param {TodoCreateManyAndReturnArgs} args - Arguments to create many Todos.
     * @example
     * // Create many Todos
     * const todo = await prisma.todo.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Todos and only return the `id`
     * const todoWithIdOnly = await prisma.todo.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TodoCreateManyAndReturnArgs>(args?: SelectSubset<T, TodoCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TodoPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Todo.
     * @param {TodoDeleteArgs} args - Arguments to delete one Todo.
     * @example
     * // Delete one Todo
     * const Todo = await prisma.todo.delete({
     *   where: {
     *     // ... filter to delete one Todo
     *   }
     * })
     * 
     */
    delete<T extends TodoDeleteArgs>(args: SelectSubset<T, TodoDeleteArgs<ExtArgs>>): Prisma__TodoClient<$Result.GetResult<Prisma.$TodoPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Todo.
     * @param {TodoUpdateArgs} args - Arguments to update one Todo.
     * @example
     * // Update one Todo
     * const todo = await prisma.todo.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TodoUpdateArgs>(args: SelectSubset<T, TodoUpdateArgs<ExtArgs>>): Prisma__TodoClient<$Result.GetResult<Prisma.$TodoPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Todos.
     * @param {TodoDeleteManyArgs} args - Arguments to filter Todos to delete.
     * @example
     * // Delete a few Todos
     * const { count } = await prisma.todo.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TodoDeleteManyArgs>(args?: SelectSubset<T, TodoDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Todos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TodoUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Todos
     * const todo = await prisma.todo.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TodoUpdateManyArgs>(args: SelectSubset<T, TodoUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Todos and returns the data updated in the database.
     * @param {TodoUpdateManyAndReturnArgs} args - Arguments to update many Todos.
     * @example
     * // Update many Todos
     * const todo = await prisma.todo.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Todos and only return the `id`
     * const todoWithIdOnly = await prisma.todo.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TodoUpdateManyAndReturnArgs>(args: SelectSubset<T, TodoUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TodoPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Todo.
     * @param {TodoUpsertArgs} args - Arguments to update or create a Todo.
     * @example
     * // Update or create a Todo
     * const todo = await prisma.todo.upsert({
     *   create: {
     *     // ... data to create a Todo
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Todo we want to update
     *   }
     * })
     */
    upsert<T extends TodoUpsertArgs>(args: SelectSubset<T, TodoUpsertArgs<ExtArgs>>): Prisma__TodoClient<$Result.GetResult<Prisma.$TodoPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Todos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TodoCountArgs} args - Arguments to filter Todos to count.
     * @example
     * // Count the number of Todos
     * const count = await prisma.todo.count({
     *   where: {
     *     // ... the filter for the Todos we want to count
     *   }
     * })
    **/
    count<T extends TodoCountArgs>(
      args?: Subset<T, TodoCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TodoCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Todo.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TodoAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TodoAggregateArgs>(args: Subset<T, TodoAggregateArgs>): Prisma.PrismaPromise<GetTodoAggregateType<T>>

    /**
     * Group by Todo.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TodoGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TodoGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TodoGroupByArgs['orderBy'] }
        : { orderBy?: TodoGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TodoGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTodoGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Todo model
   */
  readonly fields: TodoFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Todo.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TodoClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    timerSessions<T extends Todo$timerSessionsArgs<ExtArgs> = {}>(args?: Subset<T, Todo$timerSessionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TimerSessionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    parent<T extends Todo$parentArgs<ExtArgs> = {}>(args?: Subset<T, Todo$parentArgs<ExtArgs>>): Prisma__TodoClient<$Result.GetResult<Prisma.$TodoPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    subTasks<T extends Todo$subTasksArgs<ExtArgs> = {}>(args?: Subset<T, Todo$subTasksArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TodoPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    tags<T extends Todo$tagsArgs<ExtArgs> = {}>(args?: Subset<T, Todo$tagsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TagPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Todo model
   */
  interface TodoFieldRefs {
    readonly id: FieldRef<"Todo", 'String'>
    readonly title: FieldRef<"Todo", 'String'>
    readonly description: FieldRef<"Todo", 'String'>
    readonly isCompleted: FieldRef<"Todo", 'Boolean'>
    readonly createdAt: FieldRef<"Todo", 'DateTime'>
    readonly dueDate: FieldRef<"Todo", 'DateTime'>
    readonly completedAt: FieldRef<"Todo", 'DateTime'>
    readonly priority: FieldRef<"Todo", 'Priority'>
    readonly isAiSuggested: FieldRef<"Todo", 'Boolean'>
    readonly estimatedTime: FieldRef<"Todo", 'Int'>
    readonly timeSpent: FieldRef<"Todo", 'Int'>
    readonly sortOrder: FieldRef<"Todo", 'Int'>
    readonly recurrence: FieldRef<"Todo", 'Recurrence'>
    readonly recurrenceEndDate: FieldRef<"Todo", 'DateTime'>
    readonly parentId: FieldRef<"Todo", 'String'>
    readonly userId: FieldRef<"Todo", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Todo findUnique
   */
  export type TodoFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Todo
     */
    select?: TodoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Todo
     */
    omit?: TodoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TodoInclude<ExtArgs> | null
    /**
     * Filter, which Todo to fetch.
     */
    where: TodoWhereUniqueInput
  }

  /**
   * Todo findUniqueOrThrow
   */
  export type TodoFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Todo
     */
    select?: TodoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Todo
     */
    omit?: TodoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TodoInclude<ExtArgs> | null
    /**
     * Filter, which Todo to fetch.
     */
    where: TodoWhereUniqueInput
  }

  /**
   * Todo findFirst
   */
  export type TodoFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Todo
     */
    select?: TodoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Todo
     */
    omit?: TodoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TodoInclude<ExtArgs> | null
    /**
     * Filter, which Todo to fetch.
     */
    where?: TodoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Todos to fetch.
     */
    orderBy?: TodoOrderByWithRelationInput | TodoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Todos.
     */
    cursor?: TodoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Todos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Todos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Todos.
     */
    distinct?: TodoScalarFieldEnum | TodoScalarFieldEnum[]
  }

  /**
   * Todo findFirstOrThrow
   */
  export type TodoFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Todo
     */
    select?: TodoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Todo
     */
    omit?: TodoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TodoInclude<ExtArgs> | null
    /**
     * Filter, which Todo to fetch.
     */
    where?: TodoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Todos to fetch.
     */
    orderBy?: TodoOrderByWithRelationInput | TodoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Todos.
     */
    cursor?: TodoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Todos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Todos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Todos.
     */
    distinct?: TodoScalarFieldEnum | TodoScalarFieldEnum[]
  }

  /**
   * Todo findMany
   */
  export type TodoFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Todo
     */
    select?: TodoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Todo
     */
    omit?: TodoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TodoInclude<ExtArgs> | null
    /**
     * Filter, which Todos to fetch.
     */
    where?: TodoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Todos to fetch.
     */
    orderBy?: TodoOrderByWithRelationInput | TodoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Todos.
     */
    cursor?: TodoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Todos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Todos.
     */
    skip?: number
    distinct?: TodoScalarFieldEnum | TodoScalarFieldEnum[]
  }

  /**
   * Todo create
   */
  export type TodoCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Todo
     */
    select?: TodoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Todo
     */
    omit?: TodoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TodoInclude<ExtArgs> | null
    /**
     * The data needed to create a Todo.
     */
    data: XOR<TodoCreateInput, TodoUncheckedCreateInput>
  }

  /**
   * Todo createMany
   */
  export type TodoCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Todos.
     */
    data: TodoCreateManyInput | TodoCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Todo createManyAndReturn
   */
  export type TodoCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Todo
     */
    select?: TodoSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Todo
     */
    omit?: TodoOmit<ExtArgs> | null
    /**
     * The data used to create many Todos.
     */
    data: TodoCreateManyInput | TodoCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TodoIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Todo update
   */
  export type TodoUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Todo
     */
    select?: TodoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Todo
     */
    omit?: TodoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TodoInclude<ExtArgs> | null
    /**
     * The data needed to update a Todo.
     */
    data: XOR<TodoUpdateInput, TodoUncheckedUpdateInput>
    /**
     * Choose, which Todo to update.
     */
    where: TodoWhereUniqueInput
  }

  /**
   * Todo updateMany
   */
  export type TodoUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Todos.
     */
    data: XOR<TodoUpdateManyMutationInput, TodoUncheckedUpdateManyInput>
    /**
     * Filter which Todos to update
     */
    where?: TodoWhereInput
    /**
     * Limit how many Todos to update.
     */
    limit?: number
  }

  /**
   * Todo updateManyAndReturn
   */
  export type TodoUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Todo
     */
    select?: TodoSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Todo
     */
    omit?: TodoOmit<ExtArgs> | null
    /**
     * The data used to update Todos.
     */
    data: XOR<TodoUpdateManyMutationInput, TodoUncheckedUpdateManyInput>
    /**
     * Filter which Todos to update
     */
    where?: TodoWhereInput
    /**
     * Limit how many Todos to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TodoIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Todo upsert
   */
  export type TodoUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Todo
     */
    select?: TodoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Todo
     */
    omit?: TodoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TodoInclude<ExtArgs> | null
    /**
     * The filter to search for the Todo to update in case it exists.
     */
    where: TodoWhereUniqueInput
    /**
     * In case the Todo found by the `where` argument doesn't exist, create a new Todo with this data.
     */
    create: XOR<TodoCreateInput, TodoUncheckedCreateInput>
    /**
     * In case the Todo was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TodoUpdateInput, TodoUncheckedUpdateInput>
  }

  /**
   * Todo delete
   */
  export type TodoDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Todo
     */
    select?: TodoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Todo
     */
    omit?: TodoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TodoInclude<ExtArgs> | null
    /**
     * Filter which Todo to delete.
     */
    where: TodoWhereUniqueInput
  }

  /**
   * Todo deleteMany
   */
  export type TodoDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Todos to delete
     */
    where?: TodoWhereInput
    /**
     * Limit how many Todos to delete.
     */
    limit?: number
  }

  /**
   * Todo.timerSessions
   */
  export type Todo$timerSessionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimerSession
     */
    select?: TimerSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TimerSession
     */
    omit?: TimerSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimerSessionInclude<ExtArgs> | null
    where?: TimerSessionWhereInput
    orderBy?: TimerSessionOrderByWithRelationInput | TimerSessionOrderByWithRelationInput[]
    cursor?: TimerSessionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TimerSessionScalarFieldEnum | TimerSessionScalarFieldEnum[]
  }

  /**
   * Todo.parent
   */
  export type Todo$parentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Todo
     */
    select?: TodoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Todo
     */
    omit?: TodoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TodoInclude<ExtArgs> | null
    where?: TodoWhereInput
  }

  /**
   * Todo.subTasks
   */
  export type Todo$subTasksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Todo
     */
    select?: TodoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Todo
     */
    omit?: TodoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TodoInclude<ExtArgs> | null
    where?: TodoWhereInput
    orderBy?: TodoOrderByWithRelationInput | TodoOrderByWithRelationInput[]
    cursor?: TodoWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TodoScalarFieldEnum | TodoScalarFieldEnum[]
  }

  /**
   * Todo.tags
   */
  export type Todo$tagsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tag
     */
    select?: TagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tag
     */
    omit?: TagOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TagInclude<ExtArgs> | null
    where?: TagWhereInput
    orderBy?: TagOrderByWithRelationInput | TagOrderByWithRelationInput[]
    cursor?: TagWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TagScalarFieldEnum | TagScalarFieldEnum[]
  }

  /**
   * Todo without action
   */
  export type TodoDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Todo
     */
    select?: TodoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Todo
     */
    omit?: TodoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TodoInclude<ExtArgs> | null
  }


  /**
   * Model Tag
   */

  export type AggregateTag = {
    _count: TagCountAggregateOutputType | null
    _min: TagMinAggregateOutputType | null
    _max: TagMaxAggregateOutputType | null
  }

  export type TagMinAggregateOutputType = {
    id: string | null
    name: string | null
    color: string | null
    userId: string | null
  }

  export type TagMaxAggregateOutputType = {
    id: string | null
    name: string | null
    color: string | null
    userId: string | null
  }

  export type TagCountAggregateOutputType = {
    id: number
    name: number
    color: number
    userId: number
    _all: number
  }


  export type TagMinAggregateInputType = {
    id?: true
    name?: true
    color?: true
    userId?: true
  }

  export type TagMaxAggregateInputType = {
    id?: true
    name?: true
    color?: true
    userId?: true
  }

  export type TagCountAggregateInputType = {
    id?: true
    name?: true
    color?: true
    userId?: true
    _all?: true
  }

  export type TagAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Tag to aggregate.
     */
    where?: TagWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tags to fetch.
     */
    orderBy?: TagOrderByWithRelationInput | TagOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TagWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tags from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tags.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Tags
    **/
    _count?: true | TagCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TagMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TagMaxAggregateInputType
  }

  export type GetTagAggregateType<T extends TagAggregateArgs> = {
        [P in keyof T & keyof AggregateTag]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTag[P]>
      : GetScalarType<T[P], AggregateTag[P]>
  }




  export type TagGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TagWhereInput
    orderBy?: TagOrderByWithAggregationInput | TagOrderByWithAggregationInput[]
    by: TagScalarFieldEnum[] | TagScalarFieldEnum
    having?: TagScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TagCountAggregateInputType | true
    _min?: TagMinAggregateInputType
    _max?: TagMaxAggregateInputType
  }

  export type TagGroupByOutputType = {
    id: string
    name: string
    color: string
    userId: string
    _count: TagCountAggregateOutputType | null
    _min: TagMinAggregateOutputType | null
    _max: TagMaxAggregateOutputType | null
  }

  type GetTagGroupByPayload<T extends TagGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TagGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TagGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TagGroupByOutputType[P]>
            : GetScalarType<T[P], TagGroupByOutputType[P]>
        }
      >
    >


  export type TagSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    color?: boolean
    userId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    todos?: boolean | Tag$todosArgs<ExtArgs>
    _count?: boolean | TagCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tag"]>

  export type TagSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    color?: boolean
    userId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tag"]>

  export type TagSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    color?: boolean
    userId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tag"]>

  export type TagSelectScalar = {
    id?: boolean
    name?: boolean
    color?: boolean
    userId?: boolean
  }

  export type TagOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "color" | "userId", ExtArgs["result"]["tag"]>
  export type TagInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    todos?: boolean | Tag$todosArgs<ExtArgs>
    _count?: boolean | TagCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type TagIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type TagIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $TagPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Tag"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      todos: Prisma.$TodoPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      color: string
      userId: string
    }, ExtArgs["result"]["tag"]>
    composites: {}
  }

  type TagGetPayload<S extends boolean | null | undefined | TagDefaultArgs> = $Result.GetResult<Prisma.$TagPayload, S>

  type TagCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TagFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TagCountAggregateInputType | true
    }

  export interface TagDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Tag'], meta: { name: 'Tag' } }
    /**
     * Find zero or one Tag that matches the filter.
     * @param {TagFindUniqueArgs} args - Arguments to find a Tag
     * @example
     * // Get one Tag
     * const tag = await prisma.tag.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TagFindUniqueArgs>(args: SelectSubset<T, TagFindUniqueArgs<ExtArgs>>): Prisma__TagClient<$Result.GetResult<Prisma.$TagPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Tag that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TagFindUniqueOrThrowArgs} args - Arguments to find a Tag
     * @example
     * // Get one Tag
     * const tag = await prisma.tag.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TagFindUniqueOrThrowArgs>(args: SelectSubset<T, TagFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TagClient<$Result.GetResult<Prisma.$TagPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Tag that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TagFindFirstArgs} args - Arguments to find a Tag
     * @example
     * // Get one Tag
     * const tag = await prisma.tag.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TagFindFirstArgs>(args?: SelectSubset<T, TagFindFirstArgs<ExtArgs>>): Prisma__TagClient<$Result.GetResult<Prisma.$TagPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Tag that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TagFindFirstOrThrowArgs} args - Arguments to find a Tag
     * @example
     * // Get one Tag
     * const tag = await prisma.tag.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TagFindFirstOrThrowArgs>(args?: SelectSubset<T, TagFindFirstOrThrowArgs<ExtArgs>>): Prisma__TagClient<$Result.GetResult<Prisma.$TagPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Tags that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TagFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Tags
     * const tags = await prisma.tag.findMany()
     * 
     * // Get first 10 Tags
     * const tags = await prisma.tag.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const tagWithIdOnly = await prisma.tag.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TagFindManyArgs>(args?: SelectSubset<T, TagFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TagPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Tag.
     * @param {TagCreateArgs} args - Arguments to create a Tag.
     * @example
     * // Create one Tag
     * const Tag = await prisma.tag.create({
     *   data: {
     *     // ... data to create a Tag
     *   }
     * })
     * 
     */
    create<T extends TagCreateArgs>(args: SelectSubset<T, TagCreateArgs<ExtArgs>>): Prisma__TagClient<$Result.GetResult<Prisma.$TagPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Tags.
     * @param {TagCreateManyArgs} args - Arguments to create many Tags.
     * @example
     * // Create many Tags
     * const tag = await prisma.tag.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TagCreateManyArgs>(args?: SelectSubset<T, TagCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Tags and returns the data saved in the database.
     * @param {TagCreateManyAndReturnArgs} args - Arguments to create many Tags.
     * @example
     * // Create many Tags
     * const tag = await prisma.tag.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Tags and only return the `id`
     * const tagWithIdOnly = await prisma.tag.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TagCreateManyAndReturnArgs>(args?: SelectSubset<T, TagCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TagPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Tag.
     * @param {TagDeleteArgs} args - Arguments to delete one Tag.
     * @example
     * // Delete one Tag
     * const Tag = await prisma.tag.delete({
     *   where: {
     *     // ... filter to delete one Tag
     *   }
     * })
     * 
     */
    delete<T extends TagDeleteArgs>(args: SelectSubset<T, TagDeleteArgs<ExtArgs>>): Prisma__TagClient<$Result.GetResult<Prisma.$TagPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Tag.
     * @param {TagUpdateArgs} args - Arguments to update one Tag.
     * @example
     * // Update one Tag
     * const tag = await prisma.tag.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TagUpdateArgs>(args: SelectSubset<T, TagUpdateArgs<ExtArgs>>): Prisma__TagClient<$Result.GetResult<Prisma.$TagPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Tags.
     * @param {TagDeleteManyArgs} args - Arguments to filter Tags to delete.
     * @example
     * // Delete a few Tags
     * const { count } = await prisma.tag.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TagDeleteManyArgs>(args?: SelectSubset<T, TagDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tags.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TagUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Tags
     * const tag = await prisma.tag.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TagUpdateManyArgs>(args: SelectSubset<T, TagUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tags and returns the data updated in the database.
     * @param {TagUpdateManyAndReturnArgs} args - Arguments to update many Tags.
     * @example
     * // Update many Tags
     * const tag = await prisma.tag.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Tags and only return the `id`
     * const tagWithIdOnly = await prisma.tag.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TagUpdateManyAndReturnArgs>(args: SelectSubset<T, TagUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TagPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Tag.
     * @param {TagUpsertArgs} args - Arguments to update or create a Tag.
     * @example
     * // Update or create a Tag
     * const tag = await prisma.tag.upsert({
     *   create: {
     *     // ... data to create a Tag
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Tag we want to update
     *   }
     * })
     */
    upsert<T extends TagUpsertArgs>(args: SelectSubset<T, TagUpsertArgs<ExtArgs>>): Prisma__TagClient<$Result.GetResult<Prisma.$TagPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Tags.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TagCountArgs} args - Arguments to filter Tags to count.
     * @example
     * // Count the number of Tags
     * const count = await prisma.tag.count({
     *   where: {
     *     // ... the filter for the Tags we want to count
     *   }
     * })
    **/
    count<T extends TagCountArgs>(
      args?: Subset<T, TagCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TagCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Tag.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TagAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TagAggregateArgs>(args: Subset<T, TagAggregateArgs>): Prisma.PrismaPromise<GetTagAggregateType<T>>

    /**
     * Group by Tag.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TagGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TagGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TagGroupByArgs['orderBy'] }
        : { orderBy?: TagGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TagGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTagGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Tag model
   */
  readonly fields: TagFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Tag.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TagClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    todos<T extends Tag$todosArgs<ExtArgs> = {}>(args?: Subset<T, Tag$todosArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TodoPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Tag model
   */
  interface TagFieldRefs {
    readonly id: FieldRef<"Tag", 'String'>
    readonly name: FieldRef<"Tag", 'String'>
    readonly color: FieldRef<"Tag", 'String'>
    readonly userId: FieldRef<"Tag", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Tag findUnique
   */
  export type TagFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tag
     */
    select?: TagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tag
     */
    omit?: TagOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TagInclude<ExtArgs> | null
    /**
     * Filter, which Tag to fetch.
     */
    where: TagWhereUniqueInput
  }

  /**
   * Tag findUniqueOrThrow
   */
  export type TagFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tag
     */
    select?: TagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tag
     */
    omit?: TagOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TagInclude<ExtArgs> | null
    /**
     * Filter, which Tag to fetch.
     */
    where: TagWhereUniqueInput
  }

  /**
   * Tag findFirst
   */
  export type TagFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tag
     */
    select?: TagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tag
     */
    omit?: TagOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TagInclude<ExtArgs> | null
    /**
     * Filter, which Tag to fetch.
     */
    where?: TagWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tags to fetch.
     */
    orderBy?: TagOrderByWithRelationInput | TagOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Tags.
     */
    cursor?: TagWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tags from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tags.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tags.
     */
    distinct?: TagScalarFieldEnum | TagScalarFieldEnum[]
  }

  /**
   * Tag findFirstOrThrow
   */
  export type TagFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tag
     */
    select?: TagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tag
     */
    omit?: TagOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TagInclude<ExtArgs> | null
    /**
     * Filter, which Tag to fetch.
     */
    where?: TagWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tags to fetch.
     */
    orderBy?: TagOrderByWithRelationInput | TagOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Tags.
     */
    cursor?: TagWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tags from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tags.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tags.
     */
    distinct?: TagScalarFieldEnum | TagScalarFieldEnum[]
  }

  /**
   * Tag findMany
   */
  export type TagFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tag
     */
    select?: TagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tag
     */
    omit?: TagOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TagInclude<ExtArgs> | null
    /**
     * Filter, which Tags to fetch.
     */
    where?: TagWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tags to fetch.
     */
    orderBy?: TagOrderByWithRelationInput | TagOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Tags.
     */
    cursor?: TagWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tags from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tags.
     */
    skip?: number
    distinct?: TagScalarFieldEnum | TagScalarFieldEnum[]
  }

  /**
   * Tag create
   */
  export type TagCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tag
     */
    select?: TagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tag
     */
    omit?: TagOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TagInclude<ExtArgs> | null
    /**
     * The data needed to create a Tag.
     */
    data: XOR<TagCreateInput, TagUncheckedCreateInput>
  }

  /**
   * Tag createMany
   */
  export type TagCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Tags.
     */
    data: TagCreateManyInput | TagCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Tag createManyAndReturn
   */
  export type TagCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tag
     */
    select?: TagSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Tag
     */
    omit?: TagOmit<ExtArgs> | null
    /**
     * The data used to create many Tags.
     */
    data: TagCreateManyInput | TagCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TagIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Tag update
   */
  export type TagUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tag
     */
    select?: TagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tag
     */
    omit?: TagOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TagInclude<ExtArgs> | null
    /**
     * The data needed to update a Tag.
     */
    data: XOR<TagUpdateInput, TagUncheckedUpdateInput>
    /**
     * Choose, which Tag to update.
     */
    where: TagWhereUniqueInput
  }

  /**
   * Tag updateMany
   */
  export type TagUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Tags.
     */
    data: XOR<TagUpdateManyMutationInput, TagUncheckedUpdateManyInput>
    /**
     * Filter which Tags to update
     */
    where?: TagWhereInput
    /**
     * Limit how many Tags to update.
     */
    limit?: number
  }

  /**
   * Tag updateManyAndReturn
   */
  export type TagUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tag
     */
    select?: TagSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Tag
     */
    omit?: TagOmit<ExtArgs> | null
    /**
     * The data used to update Tags.
     */
    data: XOR<TagUpdateManyMutationInput, TagUncheckedUpdateManyInput>
    /**
     * Filter which Tags to update
     */
    where?: TagWhereInput
    /**
     * Limit how many Tags to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TagIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Tag upsert
   */
  export type TagUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tag
     */
    select?: TagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tag
     */
    omit?: TagOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TagInclude<ExtArgs> | null
    /**
     * The filter to search for the Tag to update in case it exists.
     */
    where: TagWhereUniqueInput
    /**
     * In case the Tag found by the `where` argument doesn't exist, create a new Tag with this data.
     */
    create: XOR<TagCreateInput, TagUncheckedCreateInput>
    /**
     * In case the Tag was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TagUpdateInput, TagUncheckedUpdateInput>
  }

  /**
   * Tag delete
   */
  export type TagDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tag
     */
    select?: TagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tag
     */
    omit?: TagOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TagInclude<ExtArgs> | null
    /**
     * Filter which Tag to delete.
     */
    where: TagWhereUniqueInput
  }

  /**
   * Tag deleteMany
   */
  export type TagDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Tags to delete
     */
    where?: TagWhereInput
    /**
     * Limit how many Tags to delete.
     */
    limit?: number
  }

  /**
   * Tag.todos
   */
  export type Tag$todosArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Todo
     */
    select?: TodoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Todo
     */
    omit?: TodoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TodoInclude<ExtArgs> | null
    where?: TodoWhereInput
    orderBy?: TodoOrderByWithRelationInput | TodoOrderByWithRelationInput[]
    cursor?: TodoWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TodoScalarFieldEnum | TodoScalarFieldEnum[]
  }

  /**
   * Tag without action
   */
  export type TagDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tag
     */
    select?: TagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tag
     */
    omit?: TagOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TagInclude<ExtArgs> | null
  }


  /**
   * Model Suggestion
   */

  export type AggregateSuggestion = {
    _count: SuggestionCountAggregateOutputType | null
    _min: SuggestionMinAggregateOutputType | null
    _max: SuggestionMaxAggregateOutputType | null
  }

  export type SuggestionMinAggregateOutputType = {
    id: string | null
    suggestionType: $Enums.SuggestionType | null
    content: string | null
    createdAt: Date | null
    forDate: Date | null
    isAccepted: boolean | null
    userId: string | null
  }

  export type SuggestionMaxAggregateOutputType = {
    id: string | null
    suggestionType: $Enums.SuggestionType | null
    content: string | null
    createdAt: Date | null
    forDate: Date | null
    isAccepted: boolean | null
    userId: string | null
  }

  export type SuggestionCountAggregateOutputType = {
    id: number
    suggestionType: number
    content: number
    createdAt: number
    forDate: number
    isAccepted: number
    userId: number
    _all: number
  }


  export type SuggestionMinAggregateInputType = {
    id?: true
    suggestionType?: true
    content?: true
    createdAt?: true
    forDate?: true
    isAccepted?: true
    userId?: true
  }

  export type SuggestionMaxAggregateInputType = {
    id?: true
    suggestionType?: true
    content?: true
    createdAt?: true
    forDate?: true
    isAccepted?: true
    userId?: true
  }

  export type SuggestionCountAggregateInputType = {
    id?: true
    suggestionType?: true
    content?: true
    createdAt?: true
    forDate?: true
    isAccepted?: true
    userId?: true
    _all?: true
  }

  export type SuggestionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Suggestion to aggregate.
     */
    where?: SuggestionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Suggestions to fetch.
     */
    orderBy?: SuggestionOrderByWithRelationInput | SuggestionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SuggestionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Suggestions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Suggestions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Suggestions
    **/
    _count?: true | SuggestionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SuggestionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SuggestionMaxAggregateInputType
  }

  export type GetSuggestionAggregateType<T extends SuggestionAggregateArgs> = {
        [P in keyof T & keyof AggregateSuggestion]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSuggestion[P]>
      : GetScalarType<T[P], AggregateSuggestion[P]>
  }




  export type SuggestionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SuggestionWhereInput
    orderBy?: SuggestionOrderByWithAggregationInput | SuggestionOrderByWithAggregationInput[]
    by: SuggestionScalarFieldEnum[] | SuggestionScalarFieldEnum
    having?: SuggestionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SuggestionCountAggregateInputType | true
    _min?: SuggestionMinAggregateInputType
    _max?: SuggestionMaxAggregateInputType
  }

  export type SuggestionGroupByOutputType = {
    id: string
    suggestionType: $Enums.SuggestionType
    content: string
    createdAt: Date
    forDate: Date
    isAccepted: boolean
    userId: string
    _count: SuggestionCountAggregateOutputType | null
    _min: SuggestionMinAggregateOutputType | null
    _max: SuggestionMaxAggregateOutputType | null
  }

  type GetSuggestionGroupByPayload<T extends SuggestionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SuggestionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SuggestionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SuggestionGroupByOutputType[P]>
            : GetScalarType<T[P], SuggestionGroupByOutputType[P]>
        }
      >
    >


  export type SuggestionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    suggestionType?: boolean
    content?: boolean
    createdAt?: boolean
    forDate?: boolean
    isAccepted?: boolean
    userId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["suggestion"]>

  export type SuggestionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    suggestionType?: boolean
    content?: boolean
    createdAt?: boolean
    forDate?: boolean
    isAccepted?: boolean
    userId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["suggestion"]>

  export type SuggestionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    suggestionType?: boolean
    content?: boolean
    createdAt?: boolean
    forDate?: boolean
    isAccepted?: boolean
    userId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["suggestion"]>

  export type SuggestionSelectScalar = {
    id?: boolean
    suggestionType?: boolean
    content?: boolean
    createdAt?: boolean
    forDate?: boolean
    isAccepted?: boolean
    userId?: boolean
  }

  export type SuggestionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "suggestionType" | "content" | "createdAt" | "forDate" | "isAccepted" | "userId", ExtArgs["result"]["suggestion"]>
  export type SuggestionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type SuggestionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type SuggestionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $SuggestionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Suggestion"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      suggestionType: $Enums.SuggestionType
      content: string
      createdAt: Date
      forDate: Date
      isAccepted: boolean
      userId: string
    }, ExtArgs["result"]["suggestion"]>
    composites: {}
  }

  type SuggestionGetPayload<S extends boolean | null | undefined | SuggestionDefaultArgs> = $Result.GetResult<Prisma.$SuggestionPayload, S>

  type SuggestionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SuggestionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SuggestionCountAggregateInputType | true
    }

  export interface SuggestionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Suggestion'], meta: { name: 'Suggestion' } }
    /**
     * Find zero or one Suggestion that matches the filter.
     * @param {SuggestionFindUniqueArgs} args - Arguments to find a Suggestion
     * @example
     * // Get one Suggestion
     * const suggestion = await prisma.suggestion.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SuggestionFindUniqueArgs>(args: SelectSubset<T, SuggestionFindUniqueArgs<ExtArgs>>): Prisma__SuggestionClient<$Result.GetResult<Prisma.$SuggestionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Suggestion that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SuggestionFindUniqueOrThrowArgs} args - Arguments to find a Suggestion
     * @example
     * // Get one Suggestion
     * const suggestion = await prisma.suggestion.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SuggestionFindUniqueOrThrowArgs>(args: SelectSubset<T, SuggestionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SuggestionClient<$Result.GetResult<Prisma.$SuggestionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Suggestion that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SuggestionFindFirstArgs} args - Arguments to find a Suggestion
     * @example
     * // Get one Suggestion
     * const suggestion = await prisma.suggestion.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SuggestionFindFirstArgs>(args?: SelectSubset<T, SuggestionFindFirstArgs<ExtArgs>>): Prisma__SuggestionClient<$Result.GetResult<Prisma.$SuggestionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Suggestion that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SuggestionFindFirstOrThrowArgs} args - Arguments to find a Suggestion
     * @example
     * // Get one Suggestion
     * const suggestion = await prisma.suggestion.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SuggestionFindFirstOrThrowArgs>(args?: SelectSubset<T, SuggestionFindFirstOrThrowArgs<ExtArgs>>): Prisma__SuggestionClient<$Result.GetResult<Prisma.$SuggestionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Suggestions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SuggestionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Suggestions
     * const suggestions = await prisma.suggestion.findMany()
     * 
     * // Get first 10 Suggestions
     * const suggestions = await prisma.suggestion.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const suggestionWithIdOnly = await prisma.suggestion.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SuggestionFindManyArgs>(args?: SelectSubset<T, SuggestionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SuggestionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Suggestion.
     * @param {SuggestionCreateArgs} args - Arguments to create a Suggestion.
     * @example
     * // Create one Suggestion
     * const Suggestion = await prisma.suggestion.create({
     *   data: {
     *     // ... data to create a Suggestion
     *   }
     * })
     * 
     */
    create<T extends SuggestionCreateArgs>(args: SelectSubset<T, SuggestionCreateArgs<ExtArgs>>): Prisma__SuggestionClient<$Result.GetResult<Prisma.$SuggestionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Suggestions.
     * @param {SuggestionCreateManyArgs} args - Arguments to create many Suggestions.
     * @example
     * // Create many Suggestions
     * const suggestion = await prisma.suggestion.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SuggestionCreateManyArgs>(args?: SelectSubset<T, SuggestionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Suggestions and returns the data saved in the database.
     * @param {SuggestionCreateManyAndReturnArgs} args - Arguments to create many Suggestions.
     * @example
     * // Create many Suggestions
     * const suggestion = await prisma.suggestion.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Suggestions and only return the `id`
     * const suggestionWithIdOnly = await prisma.suggestion.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SuggestionCreateManyAndReturnArgs>(args?: SelectSubset<T, SuggestionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SuggestionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Suggestion.
     * @param {SuggestionDeleteArgs} args - Arguments to delete one Suggestion.
     * @example
     * // Delete one Suggestion
     * const Suggestion = await prisma.suggestion.delete({
     *   where: {
     *     // ... filter to delete one Suggestion
     *   }
     * })
     * 
     */
    delete<T extends SuggestionDeleteArgs>(args: SelectSubset<T, SuggestionDeleteArgs<ExtArgs>>): Prisma__SuggestionClient<$Result.GetResult<Prisma.$SuggestionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Suggestion.
     * @param {SuggestionUpdateArgs} args - Arguments to update one Suggestion.
     * @example
     * // Update one Suggestion
     * const suggestion = await prisma.suggestion.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SuggestionUpdateArgs>(args: SelectSubset<T, SuggestionUpdateArgs<ExtArgs>>): Prisma__SuggestionClient<$Result.GetResult<Prisma.$SuggestionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Suggestions.
     * @param {SuggestionDeleteManyArgs} args - Arguments to filter Suggestions to delete.
     * @example
     * // Delete a few Suggestions
     * const { count } = await prisma.suggestion.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SuggestionDeleteManyArgs>(args?: SelectSubset<T, SuggestionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Suggestions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SuggestionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Suggestions
     * const suggestion = await prisma.suggestion.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SuggestionUpdateManyArgs>(args: SelectSubset<T, SuggestionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Suggestions and returns the data updated in the database.
     * @param {SuggestionUpdateManyAndReturnArgs} args - Arguments to update many Suggestions.
     * @example
     * // Update many Suggestions
     * const suggestion = await prisma.suggestion.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Suggestions and only return the `id`
     * const suggestionWithIdOnly = await prisma.suggestion.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SuggestionUpdateManyAndReturnArgs>(args: SelectSubset<T, SuggestionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SuggestionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Suggestion.
     * @param {SuggestionUpsertArgs} args - Arguments to update or create a Suggestion.
     * @example
     * // Update or create a Suggestion
     * const suggestion = await prisma.suggestion.upsert({
     *   create: {
     *     // ... data to create a Suggestion
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Suggestion we want to update
     *   }
     * })
     */
    upsert<T extends SuggestionUpsertArgs>(args: SelectSubset<T, SuggestionUpsertArgs<ExtArgs>>): Prisma__SuggestionClient<$Result.GetResult<Prisma.$SuggestionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Suggestions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SuggestionCountArgs} args - Arguments to filter Suggestions to count.
     * @example
     * // Count the number of Suggestions
     * const count = await prisma.suggestion.count({
     *   where: {
     *     // ... the filter for the Suggestions we want to count
     *   }
     * })
    **/
    count<T extends SuggestionCountArgs>(
      args?: Subset<T, SuggestionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SuggestionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Suggestion.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SuggestionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SuggestionAggregateArgs>(args: Subset<T, SuggestionAggregateArgs>): Prisma.PrismaPromise<GetSuggestionAggregateType<T>>

    /**
     * Group by Suggestion.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SuggestionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SuggestionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SuggestionGroupByArgs['orderBy'] }
        : { orderBy?: SuggestionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SuggestionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSuggestionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Suggestion model
   */
  readonly fields: SuggestionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Suggestion.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SuggestionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Suggestion model
   */
  interface SuggestionFieldRefs {
    readonly id: FieldRef<"Suggestion", 'String'>
    readonly suggestionType: FieldRef<"Suggestion", 'SuggestionType'>
    readonly content: FieldRef<"Suggestion", 'String'>
    readonly createdAt: FieldRef<"Suggestion", 'DateTime'>
    readonly forDate: FieldRef<"Suggestion", 'DateTime'>
    readonly isAccepted: FieldRef<"Suggestion", 'Boolean'>
    readonly userId: FieldRef<"Suggestion", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Suggestion findUnique
   */
  export type SuggestionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suggestion
     */
    select?: SuggestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Suggestion
     */
    omit?: SuggestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SuggestionInclude<ExtArgs> | null
    /**
     * Filter, which Suggestion to fetch.
     */
    where: SuggestionWhereUniqueInput
  }

  /**
   * Suggestion findUniqueOrThrow
   */
  export type SuggestionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suggestion
     */
    select?: SuggestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Suggestion
     */
    omit?: SuggestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SuggestionInclude<ExtArgs> | null
    /**
     * Filter, which Suggestion to fetch.
     */
    where: SuggestionWhereUniqueInput
  }

  /**
   * Suggestion findFirst
   */
  export type SuggestionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suggestion
     */
    select?: SuggestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Suggestion
     */
    omit?: SuggestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SuggestionInclude<ExtArgs> | null
    /**
     * Filter, which Suggestion to fetch.
     */
    where?: SuggestionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Suggestions to fetch.
     */
    orderBy?: SuggestionOrderByWithRelationInput | SuggestionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Suggestions.
     */
    cursor?: SuggestionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Suggestions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Suggestions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Suggestions.
     */
    distinct?: SuggestionScalarFieldEnum | SuggestionScalarFieldEnum[]
  }

  /**
   * Suggestion findFirstOrThrow
   */
  export type SuggestionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suggestion
     */
    select?: SuggestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Suggestion
     */
    omit?: SuggestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SuggestionInclude<ExtArgs> | null
    /**
     * Filter, which Suggestion to fetch.
     */
    where?: SuggestionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Suggestions to fetch.
     */
    orderBy?: SuggestionOrderByWithRelationInput | SuggestionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Suggestions.
     */
    cursor?: SuggestionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Suggestions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Suggestions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Suggestions.
     */
    distinct?: SuggestionScalarFieldEnum | SuggestionScalarFieldEnum[]
  }

  /**
   * Suggestion findMany
   */
  export type SuggestionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suggestion
     */
    select?: SuggestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Suggestion
     */
    omit?: SuggestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SuggestionInclude<ExtArgs> | null
    /**
     * Filter, which Suggestions to fetch.
     */
    where?: SuggestionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Suggestions to fetch.
     */
    orderBy?: SuggestionOrderByWithRelationInput | SuggestionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Suggestions.
     */
    cursor?: SuggestionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Suggestions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Suggestions.
     */
    skip?: number
    distinct?: SuggestionScalarFieldEnum | SuggestionScalarFieldEnum[]
  }

  /**
   * Suggestion create
   */
  export type SuggestionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suggestion
     */
    select?: SuggestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Suggestion
     */
    omit?: SuggestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SuggestionInclude<ExtArgs> | null
    /**
     * The data needed to create a Suggestion.
     */
    data: XOR<SuggestionCreateInput, SuggestionUncheckedCreateInput>
  }

  /**
   * Suggestion createMany
   */
  export type SuggestionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Suggestions.
     */
    data: SuggestionCreateManyInput | SuggestionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Suggestion createManyAndReturn
   */
  export type SuggestionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suggestion
     */
    select?: SuggestionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Suggestion
     */
    omit?: SuggestionOmit<ExtArgs> | null
    /**
     * The data used to create many Suggestions.
     */
    data: SuggestionCreateManyInput | SuggestionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SuggestionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Suggestion update
   */
  export type SuggestionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suggestion
     */
    select?: SuggestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Suggestion
     */
    omit?: SuggestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SuggestionInclude<ExtArgs> | null
    /**
     * The data needed to update a Suggestion.
     */
    data: XOR<SuggestionUpdateInput, SuggestionUncheckedUpdateInput>
    /**
     * Choose, which Suggestion to update.
     */
    where: SuggestionWhereUniqueInput
  }

  /**
   * Suggestion updateMany
   */
  export type SuggestionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Suggestions.
     */
    data: XOR<SuggestionUpdateManyMutationInput, SuggestionUncheckedUpdateManyInput>
    /**
     * Filter which Suggestions to update
     */
    where?: SuggestionWhereInput
    /**
     * Limit how many Suggestions to update.
     */
    limit?: number
  }

  /**
   * Suggestion updateManyAndReturn
   */
  export type SuggestionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suggestion
     */
    select?: SuggestionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Suggestion
     */
    omit?: SuggestionOmit<ExtArgs> | null
    /**
     * The data used to update Suggestions.
     */
    data: XOR<SuggestionUpdateManyMutationInput, SuggestionUncheckedUpdateManyInput>
    /**
     * Filter which Suggestions to update
     */
    where?: SuggestionWhereInput
    /**
     * Limit how many Suggestions to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SuggestionIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Suggestion upsert
   */
  export type SuggestionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suggestion
     */
    select?: SuggestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Suggestion
     */
    omit?: SuggestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SuggestionInclude<ExtArgs> | null
    /**
     * The filter to search for the Suggestion to update in case it exists.
     */
    where: SuggestionWhereUniqueInput
    /**
     * In case the Suggestion found by the `where` argument doesn't exist, create a new Suggestion with this data.
     */
    create: XOR<SuggestionCreateInput, SuggestionUncheckedCreateInput>
    /**
     * In case the Suggestion was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SuggestionUpdateInput, SuggestionUncheckedUpdateInput>
  }

  /**
   * Suggestion delete
   */
  export type SuggestionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suggestion
     */
    select?: SuggestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Suggestion
     */
    omit?: SuggestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SuggestionInclude<ExtArgs> | null
    /**
     * Filter which Suggestion to delete.
     */
    where: SuggestionWhereUniqueInput
  }

  /**
   * Suggestion deleteMany
   */
  export type SuggestionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Suggestions to delete
     */
    where?: SuggestionWhereInput
    /**
     * Limit how many Suggestions to delete.
     */
    limit?: number
  }

  /**
   * Suggestion without action
   */
  export type SuggestionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suggestion
     */
    select?: SuggestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Suggestion
     */
    omit?: SuggestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SuggestionInclude<ExtArgs> | null
  }


  /**
   * Model TimerSession
   */

  export type AggregateTimerSession = {
    _count: TimerSessionCountAggregateOutputType | null
    _avg: TimerSessionAvgAggregateOutputType | null
    _sum: TimerSessionSumAggregateOutputType | null
    _min: TimerSessionMinAggregateOutputType | null
    _max: TimerSessionMaxAggregateOutputType | null
  }

  export type TimerSessionAvgAggregateOutputType = {
    duration: number | null
  }

  export type TimerSessionSumAggregateOutputType = {
    duration: number | null
  }

  export type TimerSessionMinAggregateOutputType = {
    id: string | null
    startedAt: Date | null
    endedAt: Date | null
    duration: number | null
    todoId: string | null
  }

  export type TimerSessionMaxAggregateOutputType = {
    id: string | null
    startedAt: Date | null
    endedAt: Date | null
    duration: number | null
    todoId: string | null
  }

  export type TimerSessionCountAggregateOutputType = {
    id: number
    startedAt: number
    endedAt: number
    duration: number
    todoId: number
    _all: number
  }


  export type TimerSessionAvgAggregateInputType = {
    duration?: true
  }

  export type TimerSessionSumAggregateInputType = {
    duration?: true
  }

  export type TimerSessionMinAggregateInputType = {
    id?: true
    startedAt?: true
    endedAt?: true
    duration?: true
    todoId?: true
  }

  export type TimerSessionMaxAggregateInputType = {
    id?: true
    startedAt?: true
    endedAt?: true
    duration?: true
    todoId?: true
  }

  export type TimerSessionCountAggregateInputType = {
    id?: true
    startedAt?: true
    endedAt?: true
    duration?: true
    todoId?: true
    _all?: true
  }

  export type TimerSessionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TimerSession to aggregate.
     */
    where?: TimerSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TimerSessions to fetch.
     */
    orderBy?: TimerSessionOrderByWithRelationInput | TimerSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TimerSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TimerSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TimerSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TimerSessions
    **/
    _count?: true | TimerSessionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TimerSessionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TimerSessionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TimerSessionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TimerSessionMaxAggregateInputType
  }

  export type GetTimerSessionAggregateType<T extends TimerSessionAggregateArgs> = {
        [P in keyof T & keyof AggregateTimerSession]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTimerSession[P]>
      : GetScalarType<T[P], AggregateTimerSession[P]>
  }




  export type TimerSessionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TimerSessionWhereInput
    orderBy?: TimerSessionOrderByWithAggregationInput | TimerSessionOrderByWithAggregationInput[]
    by: TimerSessionScalarFieldEnum[] | TimerSessionScalarFieldEnum
    having?: TimerSessionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TimerSessionCountAggregateInputType | true
    _avg?: TimerSessionAvgAggregateInputType
    _sum?: TimerSessionSumAggregateInputType
    _min?: TimerSessionMinAggregateInputType
    _max?: TimerSessionMaxAggregateInputType
  }

  export type TimerSessionGroupByOutputType = {
    id: string
    startedAt: Date
    endedAt: Date | null
    duration: number | null
    todoId: string
    _count: TimerSessionCountAggregateOutputType | null
    _avg: TimerSessionAvgAggregateOutputType | null
    _sum: TimerSessionSumAggregateOutputType | null
    _min: TimerSessionMinAggregateOutputType | null
    _max: TimerSessionMaxAggregateOutputType | null
  }

  type GetTimerSessionGroupByPayload<T extends TimerSessionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TimerSessionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TimerSessionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TimerSessionGroupByOutputType[P]>
            : GetScalarType<T[P], TimerSessionGroupByOutputType[P]>
        }
      >
    >


  export type TimerSessionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    startedAt?: boolean
    endedAt?: boolean
    duration?: boolean
    todoId?: boolean
    todo?: boolean | TodoDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["timerSession"]>

  export type TimerSessionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    startedAt?: boolean
    endedAt?: boolean
    duration?: boolean
    todoId?: boolean
    todo?: boolean | TodoDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["timerSession"]>

  export type TimerSessionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    startedAt?: boolean
    endedAt?: boolean
    duration?: boolean
    todoId?: boolean
    todo?: boolean | TodoDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["timerSession"]>

  export type TimerSessionSelectScalar = {
    id?: boolean
    startedAt?: boolean
    endedAt?: boolean
    duration?: boolean
    todoId?: boolean
  }

  export type TimerSessionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "startedAt" | "endedAt" | "duration" | "todoId", ExtArgs["result"]["timerSession"]>
  export type TimerSessionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    todo?: boolean | TodoDefaultArgs<ExtArgs>
  }
  export type TimerSessionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    todo?: boolean | TodoDefaultArgs<ExtArgs>
  }
  export type TimerSessionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    todo?: boolean | TodoDefaultArgs<ExtArgs>
  }

  export type $TimerSessionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TimerSession"
    objects: {
      todo: Prisma.$TodoPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      startedAt: Date
      endedAt: Date | null
      duration: number | null
      todoId: string
    }, ExtArgs["result"]["timerSession"]>
    composites: {}
  }

  type TimerSessionGetPayload<S extends boolean | null | undefined | TimerSessionDefaultArgs> = $Result.GetResult<Prisma.$TimerSessionPayload, S>

  type TimerSessionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TimerSessionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TimerSessionCountAggregateInputType | true
    }

  export interface TimerSessionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TimerSession'], meta: { name: 'TimerSession' } }
    /**
     * Find zero or one TimerSession that matches the filter.
     * @param {TimerSessionFindUniqueArgs} args - Arguments to find a TimerSession
     * @example
     * // Get one TimerSession
     * const timerSession = await prisma.timerSession.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TimerSessionFindUniqueArgs>(args: SelectSubset<T, TimerSessionFindUniqueArgs<ExtArgs>>): Prisma__TimerSessionClient<$Result.GetResult<Prisma.$TimerSessionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one TimerSession that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TimerSessionFindUniqueOrThrowArgs} args - Arguments to find a TimerSession
     * @example
     * // Get one TimerSession
     * const timerSession = await prisma.timerSession.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TimerSessionFindUniqueOrThrowArgs>(args: SelectSubset<T, TimerSessionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TimerSessionClient<$Result.GetResult<Prisma.$TimerSessionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TimerSession that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TimerSessionFindFirstArgs} args - Arguments to find a TimerSession
     * @example
     * // Get one TimerSession
     * const timerSession = await prisma.timerSession.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TimerSessionFindFirstArgs>(args?: SelectSubset<T, TimerSessionFindFirstArgs<ExtArgs>>): Prisma__TimerSessionClient<$Result.GetResult<Prisma.$TimerSessionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TimerSession that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TimerSessionFindFirstOrThrowArgs} args - Arguments to find a TimerSession
     * @example
     * // Get one TimerSession
     * const timerSession = await prisma.timerSession.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TimerSessionFindFirstOrThrowArgs>(args?: SelectSubset<T, TimerSessionFindFirstOrThrowArgs<ExtArgs>>): Prisma__TimerSessionClient<$Result.GetResult<Prisma.$TimerSessionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more TimerSessions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TimerSessionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TimerSessions
     * const timerSessions = await prisma.timerSession.findMany()
     * 
     * // Get first 10 TimerSessions
     * const timerSessions = await prisma.timerSession.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const timerSessionWithIdOnly = await prisma.timerSession.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TimerSessionFindManyArgs>(args?: SelectSubset<T, TimerSessionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TimerSessionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a TimerSession.
     * @param {TimerSessionCreateArgs} args - Arguments to create a TimerSession.
     * @example
     * // Create one TimerSession
     * const TimerSession = await prisma.timerSession.create({
     *   data: {
     *     // ... data to create a TimerSession
     *   }
     * })
     * 
     */
    create<T extends TimerSessionCreateArgs>(args: SelectSubset<T, TimerSessionCreateArgs<ExtArgs>>): Prisma__TimerSessionClient<$Result.GetResult<Prisma.$TimerSessionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many TimerSessions.
     * @param {TimerSessionCreateManyArgs} args - Arguments to create many TimerSessions.
     * @example
     * // Create many TimerSessions
     * const timerSession = await prisma.timerSession.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TimerSessionCreateManyArgs>(args?: SelectSubset<T, TimerSessionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TimerSessions and returns the data saved in the database.
     * @param {TimerSessionCreateManyAndReturnArgs} args - Arguments to create many TimerSessions.
     * @example
     * // Create many TimerSessions
     * const timerSession = await prisma.timerSession.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TimerSessions and only return the `id`
     * const timerSessionWithIdOnly = await prisma.timerSession.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TimerSessionCreateManyAndReturnArgs>(args?: SelectSubset<T, TimerSessionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TimerSessionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a TimerSession.
     * @param {TimerSessionDeleteArgs} args - Arguments to delete one TimerSession.
     * @example
     * // Delete one TimerSession
     * const TimerSession = await prisma.timerSession.delete({
     *   where: {
     *     // ... filter to delete one TimerSession
     *   }
     * })
     * 
     */
    delete<T extends TimerSessionDeleteArgs>(args: SelectSubset<T, TimerSessionDeleteArgs<ExtArgs>>): Prisma__TimerSessionClient<$Result.GetResult<Prisma.$TimerSessionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one TimerSession.
     * @param {TimerSessionUpdateArgs} args - Arguments to update one TimerSession.
     * @example
     * // Update one TimerSession
     * const timerSession = await prisma.timerSession.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TimerSessionUpdateArgs>(args: SelectSubset<T, TimerSessionUpdateArgs<ExtArgs>>): Prisma__TimerSessionClient<$Result.GetResult<Prisma.$TimerSessionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more TimerSessions.
     * @param {TimerSessionDeleteManyArgs} args - Arguments to filter TimerSessions to delete.
     * @example
     * // Delete a few TimerSessions
     * const { count } = await prisma.timerSession.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TimerSessionDeleteManyArgs>(args?: SelectSubset<T, TimerSessionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TimerSessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TimerSessionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TimerSessions
     * const timerSession = await prisma.timerSession.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TimerSessionUpdateManyArgs>(args: SelectSubset<T, TimerSessionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TimerSessions and returns the data updated in the database.
     * @param {TimerSessionUpdateManyAndReturnArgs} args - Arguments to update many TimerSessions.
     * @example
     * // Update many TimerSessions
     * const timerSession = await prisma.timerSession.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more TimerSessions and only return the `id`
     * const timerSessionWithIdOnly = await prisma.timerSession.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TimerSessionUpdateManyAndReturnArgs>(args: SelectSubset<T, TimerSessionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TimerSessionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one TimerSession.
     * @param {TimerSessionUpsertArgs} args - Arguments to update or create a TimerSession.
     * @example
     * // Update or create a TimerSession
     * const timerSession = await prisma.timerSession.upsert({
     *   create: {
     *     // ... data to create a TimerSession
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TimerSession we want to update
     *   }
     * })
     */
    upsert<T extends TimerSessionUpsertArgs>(args: SelectSubset<T, TimerSessionUpsertArgs<ExtArgs>>): Prisma__TimerSessionClient<$Result.GetResult<Prisma.$TimerSessionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of TimerSessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TimerSessionCountArgs} args - Arguments to filter TimerSessions to count.
     * @example
     * // Count the number of TimerSessions
     * const count = await prisma.timerSession.count({
     *   where: {
     *     // ... the filter for the TimerSessions we want to count
     *   }
     * })
    **/
    count<T extends TimerSessionCountArgs>(
      args?: Subset<T, TimerSessionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TimerSessionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TimerSession.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TimerSessionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TimerSessionAggregateArgs>(args: Subset<T, TimerSessionAggregateArgs>): Prisma.PrismaPromise<GetTimerSessionAggregateType<T>>

    /**
     * Group by TimerSession.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TimerSessionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TimerSessionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TimerSessionGroupByArgs['orderBy'] }
        : { orderBy?: TimerSessionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TimerSessionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTimerSessionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TimerSession model
   */
  readonly fields: TimerSessionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TimerSession.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TimerSessionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    todo<T extends TodoDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TodoDefaultArgs<ExtArgs>>): Prisma__TodoClient<$Result.GetResult<Prisma.$TodoPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TimerSession model
   */
  interface TimerSessionFieldRefs {
    readonly id: FieldRef<"TimerSession", 'String'>
    readonly startedAt: FieldRef<"TimerSession", 'DateTime'>
    readonly endedAt: FieldRef<"TimerSession", 'DateTime'>
    readonly duration: FieldRef<"TimerSession", 'Int'>
    readonly todoId: FieldRef<"TimerSession", 'String'>
  }
    

  // Custom InputTypes
  /**
   * TimerSession findUnique
   */
  export type TimerSessionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimerSession
     */
    select?: TimerSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TimerSession
     */
    omit?: TimerSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimerSessionInclude<ExtArgs> | null
    /**
     * Filter, which TimerSession to fetch.
     */
    where: TimerSessionWhereUniqueInput
  }

  /**
   * TimerSession findUniqueOrThrow
   */
  export type TimerSessionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimerSession
     */
    select?: TimerSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TimerSession
     */
    omit?: TimerSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimerSessionInclude<ExtArgs> | null
    /**
     * Filter, which TimerSession to fetch.
     */
    where: TimerSessionWhereUniqueInput
  }

  /**
   * TimerSession findFirst
   */
  export type TimerSessionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimerSession
     */
    select?: TimerSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TimerSession
     */
    omit?: TimerSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimerSessionInclude<ExtArgs> | null
    /**
     * Filter, which TimerSession to fetch.
     */
    where?: TimerSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TimerSessions to fetch.
     */
    orderBy?: TimerSessionOrderByWithRelationInput | TimerSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TimerSessions.
     */
    cursor?: TimerSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TimerSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TimerSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TimerSessions.
     */
    distinct?: TimerSessionScalarFieldEnum | TimerSessionScalarFieldEnum[]
  }

  /**
   * TimerSession findFirstOrThrow
   */
  export type TimerSessionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimerSession
     */
    select?: TimerSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TimerSession
     */
    omit?: TimerSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimerSessionInclude<ExtArgs> | null
    /**
     * Filter, which TimerSession to fetch.
     */
    where?: TimerSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TimerSessions to fetch.
     */
    orderBy?: TimerSessionOrderByWithRelationInput | TimerSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TimerSessions.
     */
    cursor?: TimerSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TimerSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TimerSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TimerSessions.
     */
    distinct?: TimerSessionScalarFieldEnum | TimerSessionScalarFieldEnum[]
  }

  /**
   * TimerSession findMany
   */
  export type TimerSessionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimerSession
     */
    select?: TimerSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TimerSession
     */
    omit?: TimerSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimerSessionInclude<ExtArgs> | null
    /**
     * Filter, which TimerSessions to fetch.
     */
    where?: TimerSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TimerSessions to fetch.
     */
    orderBy?: TimerSessionOrderByWithRelationInput | TimerSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TimerSessions.
     */
    cursor?: TimerSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TimerSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TimerSessions.
     */
    skip?: number
    distinct?: TimerSessionScalarFieldEnum | TimerSessionScalarFieldEnum[]
  }

  /**
   * TimerSession create
   */
  export type TimerSessionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimerSession
     */
    select?: TimerSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TimerSession
     */
    omit?: TimerSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimerSessionInclude<ExtArgs> | null
    /**
     * The data needed to create a TimerSession.
     */
    data: XOR<TimerSessionCreateInput, TimerSessionUncheckedCreateInput>
  }

  /**
   * TimerSession createMany
   */
  export type TimerSessionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TimerSessions.
     */
    data: TimerSessionCreateManyInput | TimerSessionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TimerSession createManyAndReturn
   */
  export type TimerSessionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimerSession
     */
    select?: TimerSessionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TimerSession
     */
    omit?: TimerSessionOmit<ExtArgs> | null
    /**
     * The data used to create many TimerSessions.
     */
    data: TimerSessionCreateManyInput | TimerSessionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimerSessionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * TimerSession update
   */
  export type TimerSessionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimerSession
     */
    select?: TimerSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TimerSession
     */
    omit?: TimerSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimerSessionInclude<ExtArgs> | null
    /**
     * The data needed to update a TimerSession.
     */
    data: XOR<TimerSessionUpdateInput, TimerSessionUncheckedUpdateInput>
    /**
     * Choose, which TimerSession to update.
     */
    where: TimerSessionWhereUniqueInput
  }

  /**
   * TimerSession updateMany
   */
  export type TimerSessionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TimerSessions.
     */
    data: XOR<TimerSessionUpdateManyMutationInput, TimerSessionUncheckedUpdateManyInput>
    /**
     * Filter which TimerSessions to update
     */
    where?: TimerSessionWhereInput
    /**
     * Limit how many TimerSessions to update.
     */
    limit?: number
  }

  /**
   * TimerSession updateManyAndReturn
   */
  export type TimerSessionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimerSession
     */
    select?: TimerSessionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TimerSession
     */
    omit?: TimerSessionOmit<ExtArgs> | null
    /**
     * The data used to update TimerSessions.
     */
    data: XOR<TimerSessionUpdateManyMutationInput, TimerSessionUncheckedUpdateManyInput>
    /**
     * Filter which TimerSessions to update
     */
    where?: TimerSessionWhereInput
    /**
     * Limit how many TimerSessions to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimerSessionIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * TimerSession upsert
   */
  export type TimerSessionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimerSession
     */
    select?: TimerSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TimerSession
     */
    omit?: TimerSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimerSessionInclude<ExtArgs> | null
    /**
     * The filter to search for the TimerSession to update in case it exists.
     */
    where: TimerSessionWhereUniqueInput
    /**
     * In case the TimerSession found by the `where` argument doesn't exist, create a new TimerSession with this data.
     */
    create: XOR<TimerSessionCreateInput, TimerSessionUncheckedCreateInput>
    /**
     * In case the TimerSession was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TimerSessionUpdateInput, TimerSessionUncheckedUpdateInput>
  }

  /**
   * TimerSession delete
   */
  export type TimerSessionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimerSession
     */
    select?: TimerSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TimerSession
     */
    omit?: TimerSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimerSessionInclude<ExtArgs> | null
    /**
     * Filter which TimerSession to delete.
     */
    where: TimerSessionWhereUniqueInput
  }

  /**
   * TimerSession deleteMany
   */
  export type TimerSessionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TimerSessions to delete
     */
    where?: TimerSessionWhereInput
    /**
     * Limit how many TimerSessions to delete.
     */
    limit?: number
  }

  /**
   * TimerSession without action
   */
  export type TimerSessionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimerSession
     */
    select?: TimerSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TimerSession
     */
    omit?: TimerSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimerSessionInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    email: 'email',
    name: 'name',
    password: 'password',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    xp: 'xp',
    level: 'level',
    streak: 'streak',
    lastActiveDate: 'lastActiveDate'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const TodoScalarFieldEnum: {
    id: 'id',
    title: 'title',
    description: 'description',
    isCompleted: 'isCompleted',
    createdAt: 'createdAt',
    dueDate: 'dueDate',
    completedAt: 'completedAt',
    priority: 'priority',
    isAiSuggested: 'isAiSuggested',
    estimatedTime: 'estimatedTime',
    timeSpent: 'timeSpent',
    sortOrder: 'sortOrder',
    recurrence: 'recurrence',
    recurrenceEndDate: 'recurrenceEndDate',
    parentId: 'parentId',
    userId: 'userId'
  };

  export type TodoScalarFieldEnum = (typeof TodoScalarFieldEnum)[keyof typeof TodoScalarFieldEnum]


  export const TagScalarFieldEnum: {
    id: 'id',
    name: 'name',
    color: 'color',
    userId: 'userId'
  };

  export type TagScalarFieldEnum = (typeof TagScalarFieldEnum)[keyof typeof TagScalarFieldEnum]


  export const SuggestionScalarFieldEnum: {
    id: 'id',
    suggestionType: 'suggestionType',
    content: 'content',
    createdAt: 'createdAt',
    forDate: 'forDate',
    isAccepted: 'isAccepted',
    userId: 'userId'
  };

  export type SuggestionScalarFieldEnum = (typeof SuggestionScalarFieldEnum)[keyof typeof SuggestionScalarFieldEnum]


  export const TimerSessionScalarFieldEnum: {
    id: 'id',
    startedAt: 'startedAt',
    endedAt: 'endedAt',
    duration: 'duration',
    todoId: 'todoId'
  };

  export type TimerSessionScalarFieldEnum = (typeof TimerSessionScalarFieldEnum)[keyof typeof TimerSessionScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Priority'
   */
  export type EnumPriorityFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Priority'>
    


  /**
   * Reference to a field of type 'Priority[]'
   */
  export type ListEnumPriorityFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Priority[]'>
    


  /**
   * Reference to a field of type 'Recurrence'
   */
  export type EnumRecurrenceFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Recurrence'>
    


  /**
   * Reference to a field of type 'Recurrence[]'
   */
  export type ListEnumRecurrenceFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Recurrence[]'>
    


  /**
   * Reference to a field of type 'SuggestionType'
   */
  export type EnumSuggestionTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SuggestionType'>
    


  /**
   * Reference to a field of type 'SuggestionType[]'
   */
  export type ListEnumSuggestionTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SuggestionType[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    email?: StringFilter<"User"> | string
    name?: StringNullableFilter<"User"> | string | null
    password?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    xp?: IntFilter<"User"> | number
    level?: IntFilter<"User"> | number
    streak?: IntFilter<"User"> | number
    lastActiveDate?: DateTimeNullableFilter<"User"> | Date | string | null
    todos?: TodoListRelationFilter
    suggestions?: SuggestionListRelationFilter
    tags?: TagListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrderInput | SortOrder
    password?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    xp?: SortOrder
    level?: SortOrder
    streak?: SortOrder
    lastActiveDate?: SortOrderInput | SortOrder
    todos?: TodoOrderByRelationAggregateInput
    suggestions?: SuggestionOrderByRelationAggregateInput
    tags?: TagOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    name?: StringNullableFilter<"User"> | string | null
    password?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    xp?: IntFilter<"User"> | number
    level?: IntFilter<"User"> | number
    streak?: IntFilter<"User"> | number
    lastActiveDate?: DateTimeNullableFilter<"User"> | Date | string | null
    todos?: TodoListRelationFilter
    suggestions?: SuggestionListRelationFilter
    tags?: TagListRelationFilter
  }, "id" | "email">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrderInput | SortOrder
    password?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    xp?: SortOrder
    level?: SortOrder
    streak?: SortOrder
    lastActiveDate?: SortOrderInput | SortOrder
    _count?: UserCountOrderByAggregateInput
    _avg?: UserAvgOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
    _sum?: UserSumOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    email?: StringWithAggregatesFilter<"User"> | string
    name?: StringNullableWithAggregatesFilter<"User"> | string | null
    password?: StringNullableWithAggregatesFilter<"User"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    xp?: IntWithAggregatesFilter<"User"> | number
    level?: IntWithAggregatesFilter<"User"> | number
    streak?: IntWithAggregatesFilter<"User"> | number
    lastActiveDate?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
  }

  export type TodoWhereInput = {
    AND?: TodoWhereInput | TodoWhereInput[]
    OR?: TodoWhereInput[]
    NOT?: TodoWhereInput | TodoWhereInput[]
    id?: StringFilter<"Todo"> | string
    title?: StringFilter<"Todo"> | string
    description?: StringNullableFilter<"Todo"> | string | null
    isCompleted?: BoolFilter<"Todo"> | boolean
    createdAt?: DateTimeFilter<"Todo"> | Date | string
    dueDate?: DateTimeNullableFilter<"Todo"> | Date | string | null
    completedAt?: DateTimeNullableFilter<"Todo"> | Date | string | null
    priority?: EnumPriorityFilter<"Todo"> | $Enums.Priority
    isAiSuggested?: BoolFilter<"Todo"> | boolean
    estimatedTime?: IntNullableFilter<"Todo"> | number | null
    timeSpent?: IntNullableFilter<"Todo"> | number | null
    sortOrder?: IntNullableFilter<"Todo"> | number | null
    recurrence?: EnumRecurrenceFilter<"Todo"> | $Enums.Recurrence
    recurrenceEndDate?: DateTimeNullableFilter<"Todo"> | Date | string | null
    parentId?: StringNullableFilter<"Todo"> | string | null
    userId?: StringFilter<"Todo"> | string
    timerSessions?: TimerSessionListRelationFilter
    parent?: XOR<TodoNullableScalarRelationFilter, TodoWhereInput> | null
    subTasks?: TodoListRelationFilter
    tags?: TagListRelationFilter
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type TodoOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    isCompleted?: SortOrder
    createdAt?: SortOrder
    dueDate?: SortOrderInput | SortOrder
    completedAt?: SortOrderInput | SortOrder
    priority?: SortOrder
    isAiSuggested?: SortOrder
    estimatedTime?: SortOrderInput | SortOrder
    timeSpent?: SortOrderInput | SortOrder
    sortOrder?: SortOrderInput | SortOrder
    recurrence?: SortOrder
    recurrenceEndDate?: SortOrderInput | SortOrder
    parentId?: SortOrderInput | SortOrder
    userId?: SortOrder
    timerSessions?: TimerSessionOrderByRelationAggregateInput
    parent?: TodoOrderByWithRelationInput
    subTasks?: TodoOrderByRelationAggregateInput
    tags?: TagOrderByRelationAggregateInput
    user?: UserOrderByWithRelationInput
  }

  export type TodoWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TodoWhereInput | TodoWhereInput[]
    OR?: TodoWhereInput[]
    NOT?: TodoWhereInput | TodoWhereInput[]
    title?: StringFilter<"Todo"> | string
    description?: StringNullableFilter<"Todo"> | string | null
    isCompleted?: BoolFilter<"Todo"> | boolean
    createdAt?: DateTimeFilter<"Todo"> | Date | string
    dueDate?: DateTimeNullableFilter<"Todo"> | Date | string | null
    completedAt?: DateTimeNullableFilter<"Todo"> | Date | string | null
    priority?: EnumPriorityFilter<"Todo"> | $Enums.Priority
    isAiSuggested?: BoolFilter<"Todo"> | boolean
    estimatedTime?: IntNullableFilter<"Todo"> | number | null
    timeSpent?: IntNullableFilter<"Todo"> | number | null
    sortOrder?: IntNullableFilter<"Todo"> | number | null
    recurrence?: EnumRecurrenceFilter<"Todo"> | $Enums.Recurrence
    recurrenceEndDate?: DateTimeNullableFilter<"Todo"> | Date | string | null
    parentId?: StringNullableFilter<"Todo"> | string | null
    userId?: StringFilter<"Todo"> | string
    timerSessions?: TimerSessionListRelationFilter
    parent?: XOR<TodoNullableScalarRelationFilter, TodoWhereInput> | null
    subTasks?: TodoListRelationFilter
    tags?: TagListRelationFilter
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type TodoOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    isCompleted?: SortOrder
    createdAt?: SortOrder
    dueDate?: SortOrderInput | SortOrder
    completedAt?: SortOrderInput | SortOrder
    priority?: SortOrder
    isAiSuggested?: SortOrder
    estimatedTime?: SortOrderInput | SortOrder
    timeSpent?: SortOrderInput | SortOrder
    sortOrder?: SortOrderInput | SortOrder
    recurrence?: SortOrder
    recurrenceEndDate?: SortOrderInput | SortOrder
    parentId?: SortOrderInput | SortOrder
    userId?: SortOrder
    _count?: TodoCountOrderByAggregateInput
    _avg?: TodoAvgOrderByAggregateInput
    _max?: TodoMaxOrderByAggregateInput
    _min?: TodoMinOrderByAggregateInput
    _sum?: TodoSumOrderByAggregateInput
  }

  export type TodoScalarWhereWithAggregatesInput = {
    AND?: TodoScalarWhereWithAggregatesInput | TodoScalarWhereWithAggregatesInput[]
    OR?: TodoScalarWhereWithAggregatesInput[]
    NOT?: TodoScalarWhereWithAggregatesInput | TodoScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Todo"> | string
    title?: StringWithAggregatesFilter<"Todo"> | string
    description?: StringNullableWithAggregatesFilter<"Todo"> | string | null
    isCompleted?: BoolWithAggregatesFilter<"Todo"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"Todo"> | Date | string
    dueDate?: DateTimeNullableWithAggregatesFilter<"Todo"> | Date | string | null
    completedAt?: DateTimeNullableWithAggregatesFilter<"Todo"> | Date | string | null
    priority?: EnumPriorityWithAggregatesFilter<"Todo"> | $Enums.Priority
    isAiSuggested?: BoolWithAggregatesFilter<"Todo"> | boolean
    estimatedTime?: IntNullableWithAggregatesFilter<"Todo"> | number | null
    timeSpent?: IntNullableWithAggregatesFilter<"Todo"> | number | null
    sortOrder?: IntNullableWithAggregatesFilter<"Todo"> | number | null
    recurrence?: EnumRecurrenceWithAggregatesFilter<"Todo"> | $Enums.Recurrence
    recurrenceEndDate?: DateTimeNullableWithAggregatesFilter<"Todo"> | Date | string | null
    parentId?: StringNullableWithAggregatesFilter<"Todo"> | string | null
    userId?: StringWithAggregatesFilter<"Todo"> | string
  }

  export type TagWhereInput = {
    AND?: TagWhereInput | TagWhereInput[]
    OR?: TagWhereInput[]
    NOT?: TagWhereInput | TagWhereInput[]
    id?: StringFilter<"Tag"> | string
    name?: StringFilter<"Tag"> | string
    color?: StringFilter<"Tag"> | string
    userId?: StringFilter<"Tag"> | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    todos?: TodoListRelationFilter
  }

  export type TagOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    color?: SortOrder
    userId?: SortOrder
    user?: UserOrderByWithRelationInput
    todos?: TodoOrderByRelationAggregateInput
  }

  export type TagWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    name_userId?: TagNameUserIdCompoundUniqueInput
    AND?: TagWhereInput | TagWhereInput[]
    OR?: TagWhereInput[]
    NOT?: TagWhereInput | TagWhereInput[]
    name?: StringFilter<"Tag"> | string
    color?: StringFilter<"Tag"> | string
    userId?: StringFilter<"Tag"> | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    todos?: TodoListRelationFilter
  }, "id" | "name_userId">

  export type TagOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    color?: SortOrder
    userId?: SortOrder
    _count?: TagCountOrderByAggregateInput
    _max?: TagMaxOrderByAggregateInput
    _min?: TagMinOrderByAggregateInput
  }

  export type TagScalarWhereWithAggregatesInput = {
    AND?: TagScalarWhereWithAggregatesInput | TagScalarWhereWithAggregatesInput[]
    OR?: TagScalarWhereWithAggregatesInput[]
    NOT?: TagScalarWhereWithAggregatesInput | TagScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Tag"> | string
    name?: StringWithAggregatesFilter<"Tag"> | string
    color?: StringWithAggregatesFilter<"Tag"> | string
    userId?: StringWithAggregatesFilter<"Tag"> | string
  }

  export type SuggestionWhereInput = {
    AND?: SuggestionWhereInput | SuggestionWhereInput[]
    OR?: SuggestionWhereInput[]
    NOT?: SuggestionWhereInput | SuggestionWhereInput[]
    id?: StringFilter<"Suggestion"> | string
    suggestionType?: EnumSuggestionTypeFilter<"Suggestion"> | $Enums.SuggestionType
    content?: StringFilter<"Suggestion"> | string
    createdAt?: DateTimeFilter<"Suggestion"> | Date | string
    forDate?: DateTimeFilter<"Suggestion"> | Date | string
    isAccepted?: BoolFilter<"Suggestion"> | boolean
    userId?: StringFilter<"Suggestion"> | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type SuggestionOrderByWithRelationInput = {
    id?: SortOrder
    suggestionType?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    forDate?: SortOrder
    isAccepted?: SortOrder
    userId?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type SuggestionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SuggestionWhereInput | SuggestionWhereInput[]
    OR?: SuggestionWhereInput[]
    NOT?: SuggestionWhereInput | SuggestionWhereInput[]
    suggestionType?: EnumSuggestionTypeFilter<"Suggestion"> | $Enums.SuggestionType
    content?: StringFilter<"Suggestion"> | string
    createdAt?: DateTimeFilter<"Suggestion"> | Date | string
    forDate?: DateTimeFilter<"Suggestion"> | Date | string
    isAccepted?: BoolFilter<"Suggestion"> | boolean
    userId?: StringFilter<"Suggestion"> | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type SuggestionOrderByWithAggregationInput = {
    id?: SortOrder
    suggestionType?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    forDate?: SortOrder
    isAccepted?: SortOrder
    userId?: SortOrder
    _count?: SuggestionCountOrderByAggregateInput
    _max?: SuggestionMaxOrderByAggregateInput
    _min?: SuggestionMinOrderByAggregateInput
  }

  export type SuggestionScalarWhereWithAggregatesInput = {
    AND?: SuggestionScalarWhereWithAggregatesInput | SuggestionScalarWhereWithAggregatesInput[]
    OR?: SuggestionScalarWhereWithAggregatesInput[]
    NOT?: SuggestionScalarWhereWithAggregatesInput | SuggestionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Suggestion"> | string
    suggestionType?: EnumSuggestionTypeWithAggregatesFilter<"Suggestion"> | $Enums.SuggestionType
    content?: StringWithAggregatesFilter<"Suggestion"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Suggestion"> | Date | string
    forDate?: DateTimeWithAggregatesFilter<"Suggestion"> | Date | string
    isAccepted?: BoolWithAggregatesFilter<"Suggestion"> | boolean
    userId?: StringWithAggregatesFilter<"Suggestion"> | string
  }

  export type TimerSessionWhereInput = {
    AND?: TimerSessionWhereInput | TimerSessionWhereInput[]
    OR?: TimerSessionWhereInput[]
    NOT?: TimerSessionWhereInput | TimerSessionWhereInput[]
    id?: StringFilter<"TimerSession"> | string
    startedAt?: DateTimeFilter<"TimerSession"> | Date | string
    endedAt?: DateTimeNullableFilter<"TimerSession"> | Date | string | null
    duration?: IntNullableFilter<"TimerSession"> | number | null
    todoId?: StringFilter<"TimerSession"> | string
    todo?: XOR<TodoScalarRelationFilter, TodoWhereInput>
  }

  export type TimerSessionOrderByWithRelationInput = {
    id?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrderInput | SortOrder
    duration?: SortOrderInput | SortOrder
    todoId?: SortOrder
    todo?: TodoOrderByWithRelationInput
  }

  export type TimerSessionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TimerSessionWhereInput | TimerSessionWhereInput[]
    OR?: TimerSessionWhereInput[]
    NOT?: TimerSessionWhereInput | TimerSessionWhereInput[]
    startedAt?: DateTimeFilter<"TimerSession"> | Date | string
    endedAt?: DateTimeNullableFilter<"TimerSession"> | Date | string | null
    duration?: IntNullableFilter<"TimerSession"> | number | null
    todoId?: StringFilter<"TimerSession"> | string
    todo?: XOR<TodoScalarRelationFilter, TodoWhereInput>
  }, "id">

  export type TimerSessionOrderByWithAggregationInput = {
    id?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrderInput | SortOrder
    duration?: SortOrderInput | SortOrder
    todoId?: SortOrder
    _count?: TimerSessionCountOrderByAggregateInput
    _avg?: TimerSessionAvgOrderByAggregateInput
    _max?: TimerSessionMaxOrderByAggregateInput
    _min?: TimerSessionMinOrderByAggregateInput
    _sum?: TimerSessionSumOrderByAggregateInput
  }

  export type TimerSessionScalarWhereWithAggregatesInput = {
    AND?: TimerSessionScalarWhereWithAggregatesInput | TimerSessionScalarWhereWithAggregatesInput[]
    OR?: TimerSessionScalarWhereWithAggregatesInput[]
    NOT?: TimerSessionScalarWhereWithAggregatesInput | TimerSessionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TimerSession"> | string
    startedAt?: DateTimeWithAggregatesFilter<"TimerSession"> | Date | string
    endedAt?: DateTimeNullableWithAggregatesFilter<"TimerSession"> | Date | string | null
    duration?: IntNullableWithAggregatesFilter<"TimerSession"> | number | null
    todoId?: StringWithAggregatesFilter<"TimerSession"> | string
  }

  export type UserCreateInput = {
    id?: string
    email: string
    name?: string | null
    password?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    xp?: number
    level?: number
    streak?: number
    lastActiveDate?: Date | string | null
    todos?: TodoCreateNestedManyWithoutUserInput
    suggestions?: SuggestionCreateNestedManyWithoutUserInput
    tags?: TagCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    email: string
    name?: string | null
    password?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    xp?: number
    level?: number
    streak?: number
    lastActiveDate?: Date | string | null
    todos?: TodoUncheckedCreateNestedManyWithoutUserInput
    suggestions?: SuggestionUncheckedCreateNestedManyWithoutUserInput
    tags?: TagUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    xp?: IntFieldUpdateOperationsInput | number
    level?: IntFieldUpdateOperationsInput | number
    streak?: IntFieldUpdateOperationsInput | number
    lastActiveDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    todos?: TodoUpdateManyWithoutUserNestedInput
    suggestions?: SuggestionUpdateManyWithoutUserNestedInput
    tags?: TagUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    xp?: IntFieldUpdateOperationsInput | number
    level?: IntFieldUpdateOperationsInput | number
    streak?: IntFieldUpdateOperationsInput | number
    lastActiveDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    todos?: TodoUncheckedUpdateManyWithoutUserNestedInput
    suggestions?: SuggestionUncheckedUpdateManyWithoutUserNestedInput
    tags?: TagUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    email: string
    name?: string | null
    password?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    xp?: number
    level?: number
    streak?: number
    lastActiveDate?: Date | string | null
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    xp?: IntFieldUpdateOperationsInput | number
    level?: IntFieldUpdateOperationsInput | number
    streak?: IntFieldUpdateOperationsInput | number
    lastActiveDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    xp?: IntFieldUpdateOperationsInput | number
    level?: IntFieldUpdateOperationsInput | number
    streak?: IntFieldUpdateOperationsInput | number
    lastActiveDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type TodoCreateInput = {
    id?: string
    title: string
    description?: string | null
    isCompleted?: boolean
    createdAt?: Date | string
    dueDate?: Date | string | null
    completedAt?: Date | string | null
    priority?: $Enums.Priority
    isAiSuggested?: boolean
    estimatedTime?: number | null
    timeSpent?: number | null
    sortOrder?: number | null
    recurrence?: $Enums.Recurrence
    recurrenceEndDate?: Date | string | null
    timerSessions?: TimerSessionCreateNestedManyWithoutTodoInput
    parent?: TodoCreateNestedOneWithoutSubTasksInput
    subTasks?: TodoCreateNestedManyWithoutParentInput
    tags?: TagCreateNestedManyWithoutTodosInput
    user: UserCreateNestedOneWithoutTodosInput
  }

  export type TodoUncheckedCreateInput = {
    id?: string
    title: string
    description?: string | null
    isCompleted?: boolean
    createdAt?: Date | string
    dueDate?: Date | string | null
    completedAt?: Date | string | null
    priority?: $Enums.Priority
    isAiSuggested?: boolean
    estimatedTime?: number | null
    timeSpent?: number | null
    sortOrder?: number | null
    recurrence?: $Enums.Recurrence
    recurrenceEndDate?: Date | string | null
    parentId?: string | null
    userId: string
    timerSessions?: TimerSessionUncheckedCreateNestedManyWithoutTodoInput
    subTasks?: TodoUncheckedCreateNestedManyWithoutParentInput
    tags?: TagUncheckedCreateNestedManyWithoutTodosInput
  }

  export type TodoUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isCompleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    priority?: EnumPriorityFieldUpdateOperationsInput | $Enums.Priority
    isAiSuggested?: BoolFieldUpdateOperationsInput | boolean
    estimatedTime?: NullableIntFieldUpdateOperationsInput | number | null
    timeSpent?: NullableIntFieldUpdateOperationsInput | number | null
    sortOrder?: NullableIntFieldUpdateOperationsInput | number | null
    recurrence?: EnumRecurrenceFieldUpdateOperationsInput | $Enums.Recurrence
    recurrenceEndDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    timerSessions?: TimerSessionUpdateManyWithoutTodoNestedInput
    parent?: TodoUpdateOneWithoutSubTasksNestedInput
    subTasks?: TodoUpdateManyWithoutParentNestedInput
    tags?: TagUpdateManyWithoutTodosNestedInput
    user?: UserUpdateOneRequiredWithoutTodosNestedInput
  }

  export type TodoUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isCompleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    priority?: EnumPriorityFieldUpdateOperationsInput | $Enums.Priority
    isAiSuggested?: BoolFieldUpdateOperationsInput | boolean
    estimatedTime?: NullableIntFieldUpdateOperationsInput | number | null
    timeSpent?: NullableIntFieldUpdateOperationsInput | number | null
    sortOrder?: NullableIntFieldUpdateOperationsInput | number | null
    recurrence?: EnumRecurrenceFieldUpdateOperationsInput | $Enums.Recurrence
    recurrenceEndDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
    timerSessions?: TimerSessionUncheckedUpdateManyWithoutTodoNestedInput
    subTasks?: TodoUncheckedUpdateManyWithoutParentNestedInput
    tags?: TagUncheckedUpdateManyWithoutTodosNestedInput
  }

  export type TodoCreateManyInput = {
    id?: string
    title: string
    description?: string | null
    isCompleted?: boolean
    createdAt?: Date | string
    dueDate?: Date | string | null
    completedAt?: Date | string | null
    priority?: $Enums.Priority
    isAiSuggested?: boolean
    estimatedTime?: number | null
    timeSpent?: number | null
    sortOrder?: number | null
    recurrence?: $Enums.Recurrence
    recurrenceEndDate?: Date | string | null
    parentId?: string | null
    userId: string
  }

  export type TodoUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isCompleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    priority?: EnumPriorityFieldUpdateOperationsInput | $Enums.Priority
    isAiSuggested?: BoolFieldUpdateOperationsInput | boolean
    estimatedTime?: NullableIntFieldUpdateOperationsInput | number | null
    timeSpent?: NullableIntFieldUpdateOperationsInput | number | null
    sortOrder?: NullableIntFieldUpdateOperationsInput | number | null
    recurrence?: EnumRecurrenceFieldUpdateOperationsInput | $Enums.Recurrence
    recurrenceEndDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type TodoUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isCompleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    priority?: EnumPriorityFieldUpdateOperationsInput | $Enums.Priority
    isAiSuggested?: BoolFieldUpdateOperationsInput | boolean
    estimatedTime?: NullableIntFieldUpdateOperationsInput | number | null
    timeSpent?: NullableIntFieldUpdateOperationsInput | number | null
    sortOrder?: NullableIntFieldUpdateOperationsInput | number | null
    recurrence?: EnumRecurrenceFieldUpdateOperationsInput | $Enums.Recurrence
    recurrenceEndDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type TagCreateInput = {
    id?: string
    name: string
    color?: string
    user: UserCreateNestedOneWithoutTagsInput
    todos?: TodoCreateNestedManyWithoutTagsInput
  }

  export type TagUncheckedCreateInput = {
    id?: string
    name: string
    color?: string
    userId: string
    todos?: TodoUncheckedCreateNestedManyWithoutTagsInput
  }

  export type TagUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    user?: UserUpdateOneRequiredWithoutTagsNestedInput
    todos?: TodoUpdateManyWithoutTagsNestedInput
  }

  export type TagUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    todos?: TodoUncheckedUpdateManyWithoutTagsNestedInput
  }

  export type TagCreateManyInput = {
    id?: string
    name: string
    color?: string
    userId: string
  }

  export type TagUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
  }

  export type TagUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type SuggestionCreateInput = {
    id?: string
    suggestionType: $Enums.SuggestionType
    content: string
    createdAt?: Date | string
    forDate: Date | string
    isAccepted?: boolean
    user: UserCreateNestedOneWithoutSuggestionsInput
  }

  export type SuggestionUncheckedCreateInput = {
    id?: string
    suggestionType: $Enums.SuggestionType
    content: string
    createdAt?: Date | string
    forDate: Date | string
    isAccepted?: boolean
    userId: string
  }

  export type SuggestionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    suggestionType?: EnumSuggestionTypeFieldUpdateOperationsInput | $Enums.SuggestionType
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    forDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isAccepted?: BoolFieldUpdateOperationsInput | boolean
    user?: UserUpdateOneRequiredWithoutSuggestionsNestedInput
  }

  export type SuggestionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    suggestionType?: EnumSuggestionTypeFieldUpdateOperationsInput | $Enums.SuggestionType
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    forDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isAccepted?: BoolFieldUpdateOperationsInput | boolean
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type SuggestionCreateManyInput = {
    id?: string
    suggestionType: $Enums.SuggestionType
    content: string
    createdAt?: Date | string
    forDate: Date | string
    isAccepted?: boolean
    userId: string
  }

  export type SuggestionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    suggestionType?: EnumSuggestionTypeFieldUpdateOperationsInput | $Enums.SuggestionType
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    forDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isAccepted?: BoolFieldUpdateOperationsInput | boolean
  }

  export type SuggestionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    suggestionType?: EnumSuggestionTypeFieldUpdateOperationsInput | $Enums.SuggestionType
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    forDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isAccepted?: BoolFieldUpdateOperationsInput | boolean
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type TimerSessionCreateInput = {
    id?: string
    startedAt: Date | string
    endedAt?: Date | string | null
    duration?: number | null
    todo: TodoCreateNestedOneWithoutTimerSessionsInput
  }

  export type TimerSessionUncheckedCreateInput = {
    id?: string
    startedAt: Date | string
    endedAt?: Date | string | null
    duration?: number | null
    todoId: string
  }

  export type TimerSessionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    duration?: NullableIntFieldUpdateOperationsInput | number | null
    todo?: TodoUpdateOneRequiredWithoutTimerSessionsNestedInput
  }

  export type TimerSessionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    duration?: NullableIntFieldUpdateOperationsInput | number | null
    todoId?: StringFieldUpdateOperationsInput | string
  }

  export type TimerSessionCreateManyInput = {
    id?: string
    startedAt: Date | string
    endedAt?: Date | string | null
    duration?: number | null
    todoId: string
  }

  export type TimerSessionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    duration?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type TimerSessionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    duration?: NullableIntFieldUpdateOperationsInput | number | null
    todoId?: StringFieldUpdateOperationsInput | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type TodoListRelationFilter = {
    every?: TodoWhereInput
    some?: TodoWhereInput
    none?: TodoWhereInput
  }

  export type SuggestionListRelationFilter = {
    every?: SuggestionWhereInput
    some?: SuggestionWhereInput
    none?: SuggestionWhereInput
  }

  export type TagListRelationFilter = {
    every?: TagWhereInput
    some?: TagWhereInput
    none?: TagWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type TodoOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SuggestionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TagOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    password?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    xp?: SortOrder
    level?: SortOrder
    streak?: SortOrder
    lastActiveDate?: SortOrder
  }

  export type UserAvgOrderByAggregateInput = {
    xp?: SortOrder
    level?: SortOrder
    streak?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    password?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    xp?: SortOrder
    level?: SortOrder
    streak?: SortOrder
    lastActiveDate?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    password?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    xp?: SortOrder
    level?: SortOrder
    streak?: SortOrder
    lastActiveDate?: SortOrder
  }

  export type UserSumOrderByAggregateInput = {
    xp?: SortOrder
    level?: SortOrder
    streak?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type EnumPriorityFilter<$PrismaModel = never> = {
    equals?: $Enums.Priority | EnumPriorityFieldRefInput<$PrismaModel>
    in?: $Enums.Priority[] | ListEnumPriorityFieldRefInput<$PrismaModel>
    notIn?: $Enums.Priority[] | ListEnumPriorityFieldRefInput<$PrismaModel>
    not?: NestedEnumPriorityFilter<$PrismaModel> | $Enums.Priority
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type EnumRecurrenceFilter<$PrismaModel = never> = {
    equals?: $Enums.Recurrence | EnumRecurrenceFieldRefInput<$PrismaModel>
    in?: $Enums.Recurrence[] | ListEnumRecurrenceFieldRefInput<$PrismaModel>
    notIn?: $Enums.Recurrence[] | ListEnumRecurrenceFieldRefInput<$PrismaModel>
    not?: NestedEnumRecurrenceFilter<$PrismaModel> | $Enums.Recurrence
  }

  export type TimerSessionListRelationFilter = {
    every?: TimerSessionWhereInput
    some?: TimerSessionWhereInput
    none?: TimerSessionWhereInput
  }

  export type TodoNullableScalarRelationFilter = {
    is?: TodoWhereInput | null
    isNot?: TodoWhereInput | null
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type TimerSessionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TodoCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    isCompleted?: SortOrder
    createdAt?: SortOrder
    dueDate?: SortOrder
    completedAt?: SortOrder
    priority?: SortOrder
    isAiSuggested?: SortOrder
    estimatedTime?: SortOrder
    timeSpent?: SortOrder
    sortOrder?: SortOrder
    recurrence?: SortOrder
    recurrenceEndDate?: SortOrder
    parentId?: SortOrder
    userId?: SortOrder
  }

  export type TodoAvgOrderByAggregateInput = {
    estimatedTime?: SortOrder
    timeSpent?: SortOrder
    sortOrder?: SortOrder
  }

  export type TodoMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    isCompleted?: SortOrder
    createdAt?: SortOrder
    dueDate?: SortOrder
    completedAt?: SortOrder
    priority?: SortOrder
    isAiSuggested?: SortOrder
    estimatedTime?: SortOrder
    timeSpent?: SortOrder
    sortOrder?: SortOrder
    recurrence?: SortOrder
    recurrenceEndDate?: SortOrder
    parentId?: SortOrder
    userId?: SortOrder
  }

  export type TodoMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    isCompleted?: SortOrder
    createdAt?: SortOrder
    dueDate?: SortOrder
    completedAt?: SortOrder
    priority?: SortOrder
    isAiSuggested?: SortOrder
    estimatedTime?: SortOrder
    timeSpent?: SortOrder
    sortOrder?: SortOrder
    recurrence?: SortOrder
    recurrenceEndDate?: SortOrder
    parentId?: SortOrder
    userId?: SortOrder
  }

  export type TodoSumOrderByAggregateInput = {
    estimatedTime?: SortOrder
    timeSpent?: SortOrder
    sortOrder?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type EnumPriorityWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Priority | EnumPriorityFieldRefInput<$PrismaModel>
    in?: $Enums.Priority[] | ListEnumPriorityFieldRefInput<$PrismaModel>
    notIn?: $Enums.Priority[] | ListEnumPriorityFieldRefInput<$PrismaModel>
    not?: NestedEnumPriorityWithAggregatesFilter<$PrismaModel> | $Enums.Priority
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPriorityFilter<$PrismaModel>
    _max?: NestedEnumPriorityFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type EnumRecurrenceWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Recurrence | EnumRecurrenceFieldRefInput<$PrismaModel>
    in?: $Enums.Recurrence[] | ListEnumRecurrenceFieldRefInput<$PrismaModel>
    notIn?: $Enums.Recurrence[] | ListEnumRecurrenceFieldRefInput<$PrismaModel>
    not?: NestedEnumRecurrenceWithAggregatesFilter<$PrismaModel> | $Enums.Recurrence
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRecurrenceFilter<$PrismaModel>
    _max?: NestedEnumRecurrenceFilter<$PrismaModel>
  }

  export type TagNameUserIdCompoundUniqueInput = {
    name: string
    userId: string
  }

  export type TagCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    color?: SortOrder
    userId?: SortOrder
  }

  export type TagMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    color?: SortOrder
    userId?: SortOrder
  }

  export type TagMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    color?: SortOrder
    userId?: SortOrder
  }

  export type EnumSuggestionTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.SuggestionType | EnumSuggestionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.SuggestionType[] | ListEnumSuggestionTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.SuggestionType[] | ListEnumSuggestionTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumSuggestionTypeFilter<$PrismaModel> | $Enums.SuggestionType
  }

  export type SuggestionCountOrderByAggregateInput = {
    id?: SortOrder
    suggestionType?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    forDate?: SortOrder
    isAccepted?: SortOrder
    userId?: SortOrder
  }

  export type SuggestionMaxOrderByAggregateInput = {
    id?: SortOrder
    suggestionType?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    forDate?: SortOrder
    isAccepted?: SortOrder
    userId?: SortOrder
  }

  export type SuggestionMinOrderByAggregateInput = {
    id?: SortOrder
    suggestionType?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    forDate?: SortOrder
    isAccepted?: SortOrder
    userId?: SortOrder
  }

  export type EnumSuggestionTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SuggestionType | EnumSuggestionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.SuggestionType[] | ListEnumSuggestionTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.SuggestionType[] | ListEnumSuggestionTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumSuggestionTypeWithAggregatesFilter<$PrismaModel> | $Enums.SuggestionType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSuggestionTypeFilter<$PrismaModel>
    _max?: NestedEnumSuggestionTypeFilter<$PrismaModel>
  }

  export type TodoScalarRelationFilter = {
    is?: TodoWhereInput
    isNot?: TodoWhereInput
  }

  export type TimerSessionCountOrderByAggregateInput = {
    id?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrder
    duration?: SortOrder
    todoId?: SortOrder
  }

  export type TimerSessionAvgOrderByAggregateInput = {
    duration?: SortOrder
  }

  export type TimerSessionMaxOrderByAggregateInput = {
    id?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrder
    duration?: SortOrder
    todoId?: SortOrder
  }

  export type TimerSessionMinOrderByAggregateInput = {
    id?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrder
    duration?: SortOrder
    todoId?: SortOrder
  }

  export type TimerSessionSumOrderByAggregateInput = {
    duration?: SortOrder
  }

  export type TodoCreateNestedManyWithoutUserInput = {
    create?: XOR<TodoCreateWithoutUserInput, TodoUncheckedCreateWithoutUserInput> | TodoCreateWithoutUserInput[] | TodoUncheckedCreateWithoutUserInput[]
    connectOrCreate?: TodoCreateOrConnectWithoutUserInput | TodoCreateOrConnectWithoutUserInput[]
    createMany?: TodoCreateManyUserInputEnvelope
    connect?: TodoWhereUniqueInput | TodoWhereUniqueInput[]
  }

  export type SuggestionCreateNestedManyWithoutUserInput = {
    create?: XOR<SuggestionCreateWithoutUserInput, SuggestionUncheckedCreateWithoutUserInput> | SuggestionCreateWithoutUserInput[] | SuggestionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SuggestionCreateOrConnectWithoutUserInput | SuggestionCreateOrConnectWithoutUserInput[]
    createMany?: SuggestionCreateManyUserInputEnvelope
    connect?: SuggestionWhereUniqueInput | SuggestionWhereUniqueInput[]
  }

  export type TagCreateNestedManyWithoutUserInput = {
    create?: XOR<TagCreateWithoutUserInput, TagUncheckedCreateWithoutUserInput> | TagCreateWithoutUserInput[] | TagUncheckedCreateWithoutUserInput[]
    connectOrCreate?: TagCreateOrConnectWithoutUserInput | TagCreateOrConnectWithoutUserInput[]
    createMany?: TagCreateManyUserInputEnvelope
    connect?: TagWhereUniqueInput | TagWhereUniqueInput[]
  }

  export type TodoUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<TodoCreateWithoutUserInput, TodoUncheckedCreateWithoutUserInput> | TodoCreateWithoutUserInput[] | TodoUncheckedCreateWithoutUserInput[]
    connectOrCreate?: TodoCreateOrConnectWithoutUserInput | TodoCreateOrConnectWithoutUserInput[]
    createMany?: TodoCreateManyUserInputEnvelope
    connect?: TodoWhereUniqueInput | TodoWhereUniqueInput[]
  }

  export type SuggestionUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<SuggestionCreateWithoutUserInput, SuggestionUncheckedCreateWithoutUserInput> | SuggestionCreateWithoutUserInput[] | SuggestionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SuggestionCreateOrConnectWithoutUserInput | SuggestionCreateOrConnectWithoutUserInput[]
    createMany?: SuggestionCreateManyUserInputEnvelope
    connect?: SuggestionWhereUniqueInput | SuggestionWhereUniqueInput[]
  }

  export type TagUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<TagCreateWithoutUserInput, TagUncheckedCreateWithoutUserInput> | TagCreateWithoutUserInput[] | TagUncheckedCreateWithoutUserInput[]
    connectOrCreate?: TagCreateOrConnectWithoutUserInput | TagCreateOrConnectWithoutUserInput[]
    createMany?: TagCreateManyUserInputEnvelope
    connect?: TagWhereUniqueInput | TagWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type TodoUpdateManyWithoutUserNestedInput = {
    create?: XOR<TodoCreateWithoutUserInput, TodoUncheckedCreateWithoutUserInput> | TodoCreateWithoutUserInput[] | TodoUncheckedCreateWithoutUserInput[]
    connectOrCreate?: TodoCreateOrConnectWithoutUserInput | TodoCreateOrConnectWithoutUserInput[]
    upsert?: TodoUpsertWithWhereUniqueWithoutUserInput | TodoUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: TodoCreateManyUserInputEnvelope
    set?: TodoWhereUniqueInput | TodoWhereUniqueInput[]
    disconnect?: TodoWhereUniqueInput | TodoWhereUniqueInput[]
    delete?: TodoWhereUniqueInput | TodoWhereUniqueInput[]
    connect?: TodoWhereUniqueInput | TodoWhereUniqueInput[]
    update?: TodoUpdateWithWhereUniqueWithoutUserInput | TodoUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: TodoUpdateManyWithWhereWithoutUserInput | TodoUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: TodoScalarWhereInput | TodoScalarWhereInput[]
  }

  export type SuggestionUpdateManyWithoutUserNestedInput = {
    create?: XOR<SuggestionCreateWithoutUserInput, SuggestionUncheckedCreateWithoutUserInput> | SuggestionCreateWithoutUserInput[] | SuggestionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SuggestionCreateOrConnectWithoutUserInput | SuggestionCreateOrConnectWithoutUserInput[]
    upsert?: SuggestionUpsertWithWhereUniqueWithoutUserInput | SuggestionUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: SuggestionCreateManyUserInputEnvelope
    set?: SuggestionWhereUniqueInput | SuggestionWhereUniqueInput[]
    disconnect?: SuggestionWhereUniqueInput | SuggestionWhereUniqueInput[]
    delete?: SuggestionWhereUniqueInput | SuggestionWhereUniqueInput[]
    connect?: SuggestionWhereUniqueInput | SuggestionWhereUniqueInput[]
    update?: SuggestionUpdateWithWhereUniqueWithoutUserInput | SuggestionUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: SuggestionUpdateManyWithWhereWithoutUserInput | SuggestionUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: SuggestionScalarWhereInput | SuggestionScalarWhereInput[]
  }

  export type TagUpdateManyWithoutUserNestedInput = {
    create?: XOR<TagCreateWithoutUserInput, TagUncheckedCreateWithoutUserInput> | TagCreateWithoutUserInput[] | TagUncheckedCreateWithoutUserInput[]
    connectOrCreate?: TagCreateOrConnectWithoutUserInput | TagCreateOrConnectWithoutUserInput[]
    upsert?: TagUpsertWithWhereUniqueWithoutUserInput | TagUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: TagCreateManyUserInputEnvelope
    set?: TagWhereUniqueInput | TagWhereUniqueInput[]
    disconnect?: TagWhereUniqueInput | TagWhereUniqueInput[]
    delete?: TagWhereUniqueInput | TagWhereUniqueInput[]
    connect?: TagWhereUniqueInput | TagWhereUniqueInput[]
    update?: TagUpdateWithWhereUniqueWithoutUserInput | TagUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: TagUpdateManyWithWhereWithoutUserInput | TagUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: TagScalarWhereInput | TagScalarWhereInput[]
  }

  export type TodoUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<TodoCreateWithoutUserInput, TodoUncheckedCreateWithoutUserInput> | TodoCreateWithoutUserInput[] | TodoUncheckedCreateWithoutUserInput[]
    connectOrCreate?: TodoCreateOrConnectWithoutUserInput | TodoCreateOrConnectWithoutUserInput[]
    upsert?: TodoUpsertWithWhereUniqueWithoutUserInput | TodoUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: TodoCreateManyUserInputEnvelope
    set?: TodoWhereUniqueInput | TodoWhereUniqueInput[]
    disconnect?: TodoWhereUniqueInput | TodoWhereUniqueInput[]
    delete?: TodoWhereUniqueInput | TodoWhereUniqueInput[]
    connect?: TodoWhereUniqueInput | TodoWhereUniqueInput[]
    update?: TodoUpdateWithWhereUniqueWithoutUserInput | TodoUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: TodoUpdateManyWithWhereWithoutUserInput | TodoUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: TodoScalarWhereInput | TodoScalarWhereInput[]
  }

  export type SuggestionUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<SuggestionCreateWithoutUserInput, SuggestionUncheckedCreateWithoutUserInput> | SuggestionCreateWithoutUserInput[] | SuggestionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SuggestionCreateOrConnectWithoutUserInput | SuggestionCreateOrConnectWithoutUserInput[]
    upsert?: SuggestionUpsertWithWhereUniqueWithoutUserInput | SuggestionUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: SuggestionCreateManyUserInputEnvelope
    set?: SuggestionWhereUniqueInput | SuggestionWhereUniqueInput[]
    disconnect?: SuggestionWhereUniqueInput | SuggestionWhereUniqueInput[]
    delete?: SuggestionWhereUniqueInput | SuggestionWhereUniqueInput[]
    connect?: SuggestionWhereUniqueInput | SuggestionWhereUniqueInput[]
    update?: SuggestionUpdateWithWhereUniqueWithoutUserInput | SuggestionUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: SuggestionUpdateManyWithWhereWithoutUserInput | SuggestionUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: SuggestionScalarWhereInput | SuggestionScalarWhereInput[]
  }

  export type TagUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<TagCreateWithoutUserInput, TagUncheckedCreateWithoutUserInput> | TagCreateWithoutUserInput[] | TagUncheckedCreateWithoutUserInput[]
    connectOrCreate?: TagCreateOrConnectWithoutUserInput | TagCreateOrConnectWithoutUserInput[]
    upsert?: TagUpsertWithWhereUniqueWithoutUserInput | TagUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: TagCreateManyUserInputEnvelope
    set?: TagWhereUniqueInput | TagWhereUniqueInput[]
    disconnect?: TagWhereUniqueInput | TagWhereUniqueInput[]
    delete?: TagWhereUniqueInput | TagWhereUniqueInput[]
    connect?: TagWhereUniqueInput | TagWhereUniqueInput[]
    update?: TagUpdateWithWhereUniqueWithoutUserInput | TagUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: TagUpdateManyWithWhereWithoutUserInput | TagUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: TagScalarWhereInput | TagScalarWhereInput[]
  }

  export type TimerSessionCreateNestedManyWithoutTodoInput = {
    create?: XOR<TimerSessionCreateWithoutTodoInput, TimerSessionUncheckedCreateWithoutTodoInput> | TimerSessionCreateWithoutTodoInput[] | TimerSessionUncheckedCreateWithoutTodoInput[]
    connectOrCreate?: TimerSessionCreateOrConnectWithoutTodoInput | TimerSessionCreateOrConnectWithoutTodoInput[]
    createMany?: TimerSessionCreateManyTodoInputEnvelope
    connect?: TimerSessionWhereUniqueInput | TimerSessionWhereUniqueInput[]
  }

  export type TodoCreateNestedOneWithoutSubTasksInput = {
    create?: XOR<TodoCreateWithoutSubTasksInput, TodoUncheckedCreateWithoutSubTasksInput>
    connectOrCreate?: TodoCreateOrConnectWithoutSubTasksInput
    connect?: TodoWhereUniqueInput
  }

  export type TodoCreateNestedManyWithoutParentInput = {
    create?: XOR<TodoCreateWithoutParentInput, TodoUncheckedCreateWithoutParentInput> | TodoCreateWithoutParentInput[] | TodoUncheckedCreateWithoutParentInput[]
    connectOrCreate?: TodoCreateOrConnectWithoutParentInput | TodoCreateOrConnectWithoutParentInput[]
    createMany?: TodoCreateManyParentInputEnvelope
    connect?: TodoWhereUniqueInput | TodoWhereUniqueInput[]
  }

  export type TagCreateNestedManyWithoutTodosInput = {
    create?: XOR<TagCreateWithoutTodosInput, TagUncheckedCreateWithoutTodosInput> | TagCreateWithoutTodosInput[] | TagUncheckedCreateWithoutTodosInput[]
    connectOrCreate?: TagCreateOrConnectWithoutTodosInput | TagCreateOrConnectWithoutTodosInput[]
    connect?: TagWhereUniqueInput | TagWhereUniqueInput[]
  }

  export type UserCreateNestedOneWithoutTodosInput = {
    create?: XOR<UserCreateWithoutTodosInput, UserUncheckedCreateWithoutTodosInput>
    connectOrCreate?: UserCreateOrConnectWithoutTodosInput
    connect?: UserWhereUniqueInput
  }

  export type TimerSessionUncheckedCreateNestedManyWithoutTodoInput = {
    create?: XOR<TimerSessionCreateWithoutTodoInput, TimerSessionUncheckedCreateWithoutTodoInput> | TimerSessionCreateWithoutTodoInput[] | TimerSessionUncheckedCreateWithoutTodoInput[]
    connectOrCreate?: TimerSessionCreateOrConnectWithoutTodoInput | TimerSessionCreateOrConnectWithoutTodoInput[]
    createMany?: TimerSessionCreateManyTodoInputEnvelope
    connect?: TimerSessionWhereUniqueInput | TimerSessionWhereUniqueInput[]
  }

  export type TodoUncheckedCreateNestedManyWithoutParentInput = {
    create?: XOR<TodoCreateWithoutParentInput, TodoUncheckedCreateWithoutParentInput> | TodoCreateWithoutParentInput[] | TodoUncheckedCreateWithoutParentInput[]
    connectOrCreate?: TodoCreateOrConnectWithoutParentInput | TodoCreateOrConnectWithoutParentInput[]
    createMany?: TodoCreateManyParentInputEnvelope
    connect?: TodoWhereUniqueInput | TodoWhereUniqueInput[]
  }

  export type TagUncheckedCreateNestedManyWithoutTodosInput = {
    create?: XOR<TagCreateWithoutTodosInput, TagUncheckedCreateWithoutTodosInput> | TagCreateWithoutTodosInput[] | TagUncheckedCreateWithoutTodosInput[]
    connectOrCreate?: TagCreateOrConnectWithoutTodosInput | TagCreateOrConnectWithoutTodosInput[]
    connect?: TagWhereUniqueInput | TagWhereUniqueInput[]
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type EnumPriorityFieldUpdateOperationsInput = {
    set?: $Enums.Priority
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type EnumRecurrenceFieldUpdateOperationsInput = {
    set?: $Enums.Recurrence
  }

  export type TimerSessionUpdateManyWithoutTodoNestedInput = {
    create?: XOR<TimerSessionCreateWithoutTodoInput, TimerSessionUncheckedCreateWithoutTodoInput> | TimerSessionCreateWithoutTodoInput[] | TimerSessionUncheckedCreateWithoutTodoInput[]
    connectOrCreate?: TimerSessionCreateOrConnectWithoutTodoInput | TimerSessionCreateOrConnectWithoutTodoInput[]
    upsert?: TimerSessionUpsertWithWhereUniqueWithoutTodoInput | TimerSessionUpsertWithWhereUniqueWithoutTodoInput[]
    createMany?: TimerSessionCreateManyTodoInputEnvelope
    set?: TimerSessionWhereUniqueInput | TimerSessionWhereUniqueInput[]
    disconnect?: TimerSessionWhereUniqueInput | TimerSessionWhereUniqueInput[]
    delete?: TimerSessionWhereUniqueInput | TimerSessionWhereUniqueInput[]
    connect?: TimerSessionWhereUniqueInput | TimerSessionWhereUniqueInput[]
    update?: TimerSessionUpdateWithWhereUniqueWithoutTodoInput | TimerSessionUpdateWithWhereUniqueWithoutTodoInput[]
    updateMany?: TimerSessionUpdateManyWithWhereWithoutTodoInput | TimerSessionUpdateManyWithWhereWithoutTodoInput[]
    deleteMany?: TimerSessionScalarWhereInput | TimerSessionScalarWhereInput[]
  }

  export type TodoUpdateOneWithoutSubTasksNestedInput = {
    create?: XOR<TodoCreateWithoutSubTasksInput, TodoUncheckedCreateWithoutSubTasksInput>
    connectOrCreate?: TodoCreateOrConnectWithoutSubTasksInput
    upsert?: TodoUpsertWithoutSubTasksInput
    disconnect?: TodoWhereInput | boolean
    delete?: TodoWhereInput | boolean
    connect?: TodoWhereUniqueInput
    update?: XOR<XOR<TodoUpdateToOneWithWhereWithoutSubTasksInput, TodoUpdateWithoutSubTasksInput>, TodoUncheckedUpdateWithoutSubTasksInput>
  }

  export type TodoUpdateManyWithoutParentNestedInput = {
    create?: XOR<TodoCreateWithoutParentInput, TodoUncheckedCreateWithoutParentInput> | TodoCreateWithoutParentInput[] | TodoUncheckedCreateWithoutParentInput[]
    connectOrCreate?: TodoCreateOrConnectWithoutParentInput | TodoCreateOrConnectWithoutParentInput[]
    upsert?: TodoUpsertWithWhereUniqueWithoutParentInput | TodoUpsertWithWhereUniqueWithoutParentInput[]
    createMany?: TodoCreateManyParentInputEnvelope
    set?: TodoWhereUniqueInput | TodoWhereUniqueInput[]
    disconnect?: TodoWhereUniqueInput | TodoWhereUniqueInput[]
    delete?: TodoWhereUniqueInput | TodoWhereUniqueInput[]
    connect?: TodoWhereUniqueInput | TodoWhereUniqueInput[]
    update?: TodoUpdateWithWhereUniqueWithoutParentInput | TodoUpdateWithWhereUniqueWithoutParentInput[]
    updateMany?: TodoUpdateManyWithWhereWithoutParentInput | TodoUpdateManyWithWhereWithoutParentInput[]
    deleteMany?: TodoScalarWhereInput | TodoScalarWhereInput[]
  }

  export type TagUpdateManyWithoutTodosNestedInput = {
    create?: XOR<TagCreateWithoutTodosInput, TagUncheckedCreateWithoutTodosInput> | TagCreateWithoutTodosInput[] | TagUncheckedCreateWithoutTodosInput[]
    connectOrCreate?: TagCreateOrConnectWithoutTodosInput | TagCreateOrConnectWithoutTodosInput[]
    upsert?: TagUpsertWithWhereUniqueWithoutTodosInput | TagUpsertWithWhereUniqueWithoutTodosInput[]
    set?: TagWhereUniqueInput | TagWhereUniqueInput[]
    disconnect?: TagWhereUniqueInput | TagWhereUniqueInput[]
    delete?: TagWhereUniqueInput | TagWhereUniqueInput[]
    connect?: TagWhereUniqueInput | TagWhereUniqueInput[]
    update?: TagUpdateWithWhereUniqueWithoutTodosInput | TagUpdateWithWhereUniqueWithoutTodosInput[]
    updateMany?: TagUpdateManyWithWhereWithoutTodosInput | TagUpdateManyWithWhereWithoutTodosInput[]
    deleteMany?: TagScalarWhereInput | TagScalarWhereInput[]
  }

  export type UserUpdateOneRequiredWithoutTodosNestedInput = {
    create?: XOR<UserCreateWithoutTodosInput, UserUncheckedCreateWithoutTodosInput>
    connectOrCreate?: UserCreateOrConnectWithoutTodosInput
    upsert?: UserUpsertWithoutTodosInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutTodosInput, UserUpdateWithoutTodosInput>, UserUncheckedUpdateWithoutTodosInput>
  }

  export type TimerSessionUncheckedUpdateManyWithoutTodoNestedInput = {
    create?: XOR<TimerSessionCreateWithoutTodoInput, TimerSessionUncheckedCreateWithoutTodoInput> | TimerSessionCreateWithoutTodoInput[] | TimerSessionUncheckedCreateWithoutTodoInput[]
    connectOrCreate?: TimerSessionCreateOrConnectWithoutTodoInput | TimerSessionCreateOrConnectWithoutTodoInput[]
    upsert?: TimerSessionUpsertWithWhereUniqueWithoutTodoInput | TimerSessionUpsertWithWhereUniqueWithoutTodoInput[]
    createMany?: TimerSessionCreateManyTodoInputEnvelope
    set?: TimerSessionWhereUniqueInput | TimerSessionWhereUniqueInput[]
    disconnect?: TimerSessionWhereUniqueInput | TimerSessionWhereUniqueInput[]
    delete?: TimerSessionWhereUniqueInput | TimerSessionWhereUniqueInput[]
    connect?: TimerSessionWhereUniqueInput | TimerSessionWhereUniqueInput[]
    update?: TimerSessionUpdateWithWhereUniqueWithoutTodoInput | TimerSessionUpdateWithWhereUniqueWithoutTodoInput[]
    updateMany?: TimerSessionUpdateManyWithWhereWithoutTodoInput | TimerSessionUpdateManyWithWhereWithoutTodoInput[]
    deleteMany?: TimerSessionScalarWhereInput | TimerSessionScalarWhereInput[]
  }

  export type TodoUncheckedUpdateManyWithoutParentNestedInput = {
    create?: XOR<TodoCreateWithoutParentInput, TodoUncheckedCreateWithoutParentInput> | TodoCreateWithoutParentInput[] | TodoUncheckedCreateWithoutParentInput[]
    connectOrCreate?: TodoCreateOrConnectWithoutParentInput | TodoCreateOrConnectWithoutParentInput[]
    upsert?: TodoUpsertWithWhereUniqueWithoutParentInput | TodoUpsertWithWhereUniqueWithoutParentInput[]
    createMany?: TodoCreateManyParentInputEnvelope
    set?: TodoWhereUniqueInput | TodoWhereUniqueInput[]
    disconnect?: TodoWhereUniqueInput | TodoWhereUniqueInput[]
    delete?: TodoWhereUniqueInput | TodoWhereUniqueInput[]
    connect?: TodoWhereUniqueInput | TodoWhereUniqueInput[]
    update?: TodoUpdateWithWhereUniqueWithoutParentInput | TodoUpdateWithWhereUniqueWithoutParentInput[]
    updateMany?: TodoUpdateManyWithWhereWithoutParentInput | TodoUpdateManyWithWhereWithoutParentInput[]
    deleteMany?: TodoScalarWhereInput | TodoScalarWhereInput[]
  }

  export type TagUncheckedUpdateManyWithoutTodosNestedInput = {
    create?: XOR<TagCreateWithoutTodosInput, TagUncheckedCreateWithoutTodosInput> | TagCreateWithoutTodosInput[] | TagUncheckedCreateWithoutTodosInput[]
    connectOrCreate?: TagCreateOrConnectWithoutTodosInput | TagCreateOrConnectWithoutTodosInput[]
    upsert?: TagUpsertWithWhereUniqueWithoutTodosInput | TagUpsertWithWhereUniqueWithoutTodosInput[]
    set?: TagWhereUniqueInput | TagWhereUniqueInput[]
    disconnect?: TagWhereUniqueInput | TagWhereUniqueInput[]
    delete?: TagWhereUniqueInput | TagWhereUniqueInput[]
    connect?: TagWhereUniqueInput | TagWhereUniqueInput[]
    update?: TagUpdateWithWhereUniqueWithoutTodosInput | TagUpdateWithWhereUniqueWithoutTodosInput[]
    updateMany?: TagUpdateManyWithWhereWithoutTodosInput | TagUpdateManyWithWhereWithoutTodosInput[]
    deleteMany?: TagScalarWhereInput | TagScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutTagsInput = {
    create?: XOR<UserCreateWithoutTagsInput, UserUncheckedCreateWithoutTagsInput>
    connectOrCreate?: UserCreateOrConnectWithoutTagsInput
    connect?: UserWhereUniqueInput
  }

  export type TodoCreateNestedManyWithoutTagsInput = {
    create?: XOR<TodoCreateWithoutTagsInput, TodoUncheckedCreateWithoutTagsInput> | TodoCreateWithoutTagsInput[] | TodoUncheckedCreateWithoutTagsInput[]
    connectOrCreate?: TodoCreateOrConnectWithoutTagsInput | TodoCreateOrConnectWithoutTagsInput[]
    connect?: TodoWhereUniqueInput | TodoWhereUniqueInput[]
  }

  export type TodoUncheckedCreateNestedManyWithoutTagsInput = {
    create?: XOR<TodoCreateWithoutTagsInput, TodoUncheckedCreateWithoutTagsInput> | TodoCreateWithoutTagsInput[] | TodoUncheckedCreateWithoutTagsInput[]
    connectOrCreate?: TodoCreateOrConnectWithoutTagsInput | TodoCreateOrConnectWithoutTagsInput[]
    connect?: TodoWhereUniqueInput | TodoWhereUniqueInput[]
  }

  export type UserUpdateOneRequiredWithoutTagsNestedInput = {
    create?: XOR<UserCreateWithoutTagsInput, UserUncheckedCreateWithoutTagsInput>
    connectOrCreate?: UserCreateOrConnectWithoutTagsInput
    upsert?: UserUpsertWithoutTagsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutTagsInput, UserUpdateWithoutTagsInput>, UserUncheckedUpdateWithoutTagsInput>
  }

  export type TodoUpdateManyWithoutTagsNestedInput = {
    create?: XOR<TodoCreateWithoutTagsInput, TodoUncheckedCreateWithoutTagsInput> | TodoCreateWithoutTagsInput[] | TodoUncheckedCreateWithoutTagsInput[]
    connectOrCreate?: TodoCreateOrConnectWithoutTagsInput | TodoCreateOrConnectWithoutTagsInput[]
    upsert?: TodoUpsertWithWhereUniqueWithoutTagsInput | TodoUpsertWithWhereUniqueWithoutTagsInput[]
    set?: TodoWhereUniqueInput | TodoWhereUniqueInput[]
    disconnect?: TodoWhereUniqueInput | TodoWhereUniqueInput[]
    delete?: TodoWhereUniqueInput | TodoWhereUniqueInput[]
    connect?: TodoWhereUniqueInput | TodoWhereUniqueInput[]
    update?: TodoUpdateWithWhereUniqueWithoutTagsInput | TodoUpdateWithWhereUniqueWithoutTagsInput[]
    updateMany?: TodoUpdateManyWithWhereWithoutTagsInput | TodoUpdateManyWithWhereWithoutTagsInput[]
    deleteMany?: TodoScalarWhereInput | TodoScalarWhereInput[]
  }

  export type TodoUncheckedUpdateManyWithoutTagsNestedInput = {
    create?: XOR<TodoCreateWithoutTagsInput, TodoUncheckedCreateWithoutTagsInput> | TodoCreateWithoutTagsInput[] | TodoUncheckedCreateWithoutTagsInput[]
    connectOrCreate?: TodoCreateOrConnectWithoutTagsInput | TodoCreateOrConnectWithoutTagsInput[]
    upsert?: TodoUpsertWithWhereUniqueWithoutTagsInput | TodoUpsertWithWhereUniqueWithoutTagsInput[]
    set?: TodoWhereUniqueInput | TodoWhereUniqueInput[]
    disconnect?: TodoWhereUniqueInput | TodoWhereUniqueInput[]
    delete?: TodoWhereUniqueInput | TodoWhereUniqueInput[]
    connect?: TodoWhereUniqueInput | TodoWhereUniqueInput[]
    update?: TodoUpdateWithWhereUniqueWithoutTagsInput | TodoUpdateWithWhereUniqueWithoutTagsInput[]
    updateMany?: TodoUpdateManyWithWhereWithoutTagsInput | TodoUpdateManyWithWhereWithoutTagsInput[]
    deleteMany?: TodoScalarWhereInput | TodoScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutSuggestionsInput = {
    create?: XOR<UserCreateWithoutSuggestionsInput, UserUncheckedCreateWithoutSuggestionsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSuggestionsInput
    connect?: UserWhereUniqueInput
  }

  export type EnumSuggestionTypeFieldUpdateOperationsInput = {
    set?: $Enums.SuggestionType
  }

  export type UserUpdateOneRequiredWithoutSuggestionsNestedInput = {
    create?: XOR<UserCreateWithoutSuggestionsInput, UserUncheckedCreateWithoutSuggestionsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSuggestionsInput
    upsert?: UserUpsertWithoutSuggestionsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutSuggestionsInput, UserUpdateWithoutSuggestionsInput>, UserUncheckedUpdateWithoutSuggestionsInput>
  }

  export type TodoCreateNestedOneWithoutTimerSessionsInput = {
    create?: XOR<TodoCreateWithoutTimerSessionsInput, TodoUncheckedCreateWithoutTimerSessionsInput>
    connectOrCreate?: TodoCreateOrConnectWithoutTimerSessionsInput
    connect?: TodoWhereUniqueInput
  }

  export type TodoUpdateOneRequiredWithoutTimerSessionsNestedInput = {
    create?: XOR<TodoCreateWithoutTimerSessionsInput, TodoUncheckedCreateWithoutTimerSessionsInput>
    connectOrCreate?: TodoCreateOrConnectWithoutTimerSessionsInput
    upsert?: TodoUpsertWithoutTimerSessionsInput
    connect?: TodoWhereUniqueInput
    update?: XOR<XOR<TodoUpdateToOneWithWhereWithoutTimerSessionsInput, TodoUpdateWithoutTimerSessionsInput>, TodoUncheckedUpdateWithoutTimerSessionsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedEnumPriorityFilter<$PrismaModel = never> = {
    equals?: $Enums.Priority | EnumPriorityFieldRefInput<$PrismaModel>
    in?: $Enums.Priority[] | ListEnumPriorityFieldRefInput<$PrismaModel>
    notIn?: $Enums.Priority[] | ListEnumPriorityFieldRefInput<$PrismaModel>
    not?: NestedEnumPriorityFilter<$PrismaModel> | $Enums.Priority
  }

  export type NestedEnumRecurrenceFilter<$PrismaModel = never> = {
    equals?: $Enums.Recurrence | EnumRecurrenceFieldRefInput<$PrismaModel>
    in?: $Enums.Recurrence[] | ListEnumRecurrenceFieldRefInput<$PrismaModel>
    notIn?: $Enums.Recurrence[] | ListEnumRecurrenceFieldRefInput<$PrismaModel>
    not?: NestedEnumRecurrenceFilter<$PrismaModel> | $Enums.Recurrence
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedEnumPriorityWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Priority | EnumPriorityFieldRefInput<$PrismaModel>
    in?: $Enums.Priority[] | ListEnumPriorityFieldRefInput<$PrismaModel>
    notIn?: $Enums.Priority[] | ListEnumPriorityFieldRefInput<$PrismaModel>
    not?: NestedEnumPriorityWithAggregatesFilter<$PrismaModel> | $Enums.Priority
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPriorityFilter<$PrismaModel>
    _max?: NestedEnumPriorityFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumRecurrenceWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Recurrence | EnumRecurrenceFieldRefInput<$PrismaModel>
    in?: $Enums.Recurrence[] | ListEnumRecurrenceFieldRefInput<$PrismaModel>
    notIn?: $Enums.Recurrence[] | ListEnumRecurrenceFieldRefInput<$PrismaModel>
    not?: NestedEnumRecurrenceWithAggregatesFilter<$PrismaModel> | $Enums.Recurrence
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRecurrenceFilter<$PrismaModel>
    _max?: NestedEnumRecurrenceFilter<$PrismaModel>
  }

  export type NestedEnumSuggestionTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.SuggestionType | EnumSuggestionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.SuggestionType[] | ListEnumSuggestionTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.SuggestionType[] | ListEnumSuggestionTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumSuggestionTypeFilter<$PrismaModel> | $Enums.SuggestionType
  }

  export type NestedEnumSuggestionTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SuggestionType | EnumSuggestionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.SuggestionType[] | ListEnumSuggestionTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.SuggestionType[] | ListEnumSuggestionTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumSuggestionTypeWithAggregatesFilter<$PrismaModel> | $Enums.SuggestionType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSuggestionTypeFilter<$PrismaModel>
    _max?: NestedEnumSuggestionTypeFilter<$PrismaModel>
  }

  export type TodoCreateWithoutUserInput = {
    id?: string
    title: string
    description?: string | null
    isCompleted?: boolean
    createdAt?: Date | string
    dueDate?: Date | string | null
    completedAt?: Date | string | null
    priority?: $Enums.Priority
    isAiSuggested?: boolean
    estimatedTime?: number | null
    timeSpent?: number | null
    sortOrder?: number | null
    recurrence?: $Enums.Recurrence
    recurrenceEndDate?: Date | string | null
    timerSessions?: TimerSessionCreateNestedManyWithoutTodoInput
    parent?: TodoCreateNestedOneWithoutSubTasksInput
    subTasks?: TodoCreateNestedManyWithoutParentInput
    tags?: TagCreateNestedManyWithoutTodosInput
  }

  export type TodoUncheckedCreateWithoutUserInput = {
    id?: string
    title: string
    description?: string | null
    isCompleted?: boolean
    createdAt?: Date | string
    dueDate?: Date | string | null
    completedAt?: Date | string | null
    priority?: $Enums.Priority
    isAiSuggested?: boolean
    estimatedTime?: number | null
    timeSpent?: number | null
    sortOrder?: number | null
    recurrence?: $Enums.Recurrence
    recurrenceEndDate?: Date | string | null
    parentId?: string | null
    timerSessions?: TimerSessionUncheckedCreateNestedManyWithoutTodoInput
    subTasks?: TodoUncheckedCreateNestedManyWithoutParentInput
    tags?: TagUncheckedCreateNestedManyWithoutTodosInput
  }

  export type TodoCreateOrConnectWithoutUserInput = {
    where: TodoWhereUniqueInput
    create: XOR<TodoCreateWithoutUserInput, TodoUncheckedCreateWithoutUserInput>
  }

  export type TodoCreateManyUserInputEnvelope = {
    data: TodoCreateManyUserInput | TodoCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type SuggestionCreateWithoutUserInput = {
    id?: string
    suggestionType: $Enums.SuggestionType
    content: string
    createdAt?: Date | string
    forDate: Date | string
    isAccepted?: boolean
  }

  export type SuggestionUncheckedCreateWithoutUserInput = {
    id?: string
    suggestionType: $Enums.SuggestionType
    content: string
    createdAt?: Date | string
    forDate: Date | string
    isAccepted?: boolean
  }

  export type SuggestionCreateOrConnectWithoutUserInput = {
    where: SuggestionWhereUniqueInput
    create: XOR<SuggestionCreateWithoutUserInput, SuggestionUncheckedCreateWithoutUserInput>
  }

  export type SuggestionCreateManyUserInputEnvelope = {
    data: SuggestionCreateManyUserInput | SuggestionCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type TagCreateWithoutUserInput = {
    id?: string
    name: string
    color?: string
    todos?: TodoCreateNestedManyWithoutTagsInput
  }

  export type TagUncheckedCreateWithoutUserInput = {
    id?: string
    name: string
    color?: string
    todos?: TodoUncheckedCreateNestedManyWithoutTagsInput
  }

  export type TagCreateOrConnectWithoutUserInput = {
    where: TagWhereUniqueInput
    create: XOR<TagCreateWithoutUserInput, TagUncheckedCreateWithoutUserInput>
  }

  export type TagCreateManyUserInputEnvelope = {
    data: TagCreateManyUserInput | TagCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type TodoUpsertWithWhereUniqueWithoutUserInput = {
    where: TodoWhereUniqueInput
    update: XOR<TodoUpdateWithoutUserInput, TodoUncheckedUpdateWithoutUserInput>
    create: XOR<TodoCreateWithoutUserInput, TodoUncheckedCreateWithoutUserInput>
  }

  export type TodoUpdateWithWhereUniqueWithoutUserInput = {
    where: TodoWhereUniqueInput
    data: XOR<TodoUpdateWithoutUserInput, TodoUncheckedUpdateWithoutUserInput>
  }

  export type TodoUpdateManyWithWhereWithoutUserInput = {
    where: TodoScalarWhereInput
    data: XOR<TodoUpdateManyMutationInput, TodoUncheckedUpdateManyWithoutUserInput>
  }

  export type TodoScalarWhereInput = {
    AND?: TodoScalarWhereInput | TodoScalarWhereInput[]
    OR?: TodoScalarWhereInput[]
    NOT?: TodoScalarWhereInput | TodoScalarWhereInput[]
    id?: StringFilter<"Todo"> | string
    title?: StringFilter<"Todo"> | string
    description?: StringNullableFilter<"Todo"> | string | null
    isCompleted?: BoolFilter<"Todo"> | boolean
    createdAt?: DateTimeFilter<"Todo"> | Date | string
    dueDate?: DateTimeNullableFilter<"Todo"> | Date | string | null
    completedAt?: DateTimeNullableFilter<"Todo"> | Date | string | null
    priority?: EnumPriorityFilter<"Todo"> | $Enums.Priority
    isAiSuggested?: BoolFilter<"Todo"> | boolean
    estimatedTime?: IntNullableFilter<"Todo"> | number | null
    timeSpent?: IntNullableFilter<"Todo"> | number | null
    sortOrder?: IntNullableFilter<"Todo"> | number | null
    recurrence?: EnumRecurrenceFilter<"Todo"> | $Enums.Recurrence
    recurrenceEndDate?: DateTimeNullableFilter<"Todo"> | Date | string | null
    parentId?: StringNullableFilter<"Todo"> | string | null
    userId?: StringFilter<"Todo"> | string
  }

  export type SuggestionUpsertWithWhereUniqueWithoutUserInput = {
    where: SuggestionWhereUniqueInput
    update: XOR<SuggestionUpdateWithoutUserInput, SuggestionUncheckedUpdateWithoutUserInput>
    create: XOR<SuggestionCreateWithoutUserInput, SuggestionUncheckedCreateWithoutUserInput>
  }

  export type SuggestionUpdateWithWhereUniqueWithoutUserInput = {
    where: SuggestionWhereUniqueInput
    data: XOR<SuggestionUpdateWithoutUserInput, SuggestionUncheckedUpdateWithoutUserInput>
  }

  export type SuggestionUpdateManyWithWhereWithoutUserInput = {
    where: SuggestionScalarWhereInput
    data: XOR<SuggestionUpdateManyMutationInput, SuggestionUncheckedUpdateManyWithoutUserInput>
  }

  export type SuggestionScalarWhereInput = {
    AND?: SuggestionScalarWhereInput | SuggestionScalarWhereInput[]
    OR?: SuggestionScalarWhereInput[]
    NOT?: SuggestionScalarWhereInput | SuggestionScalarWhereInput[]
    id?: StringFilter<"Suggestion"> | string
    suggestionType?: EnumSuggestionTypeFilter<"Suggestion"> | $Enums.SuggestionType
    content?: StringFilter<"Suggestion"> | string
    createdAt?: DateTimeFilter<"Suggestion"> | Date | string
    forDate?: DateTimeFilter<"Suggestion"> | Date | string
    isAccepted?: BoolFilter<"Suggestion"> | boolean
    userId?: StringFilter<"Suggestion"> | string
  }

  export type TagUpsertWithWhereUniqueWithoutUserInput = {
    where: TagWhereUniqueInput
    update: XOR<TagUpdateWithoutUserInput, TagUncheckedUpdateWithoutUserInput>
    create: XOR<TagCreateWithoutUserInput, TagUncheckedCreateWithoutUserInput>
  }

  export type TagUpdateWithWhereUniqueWithoutUserInput = {
    where: TagWhereUniqueInput
    data: XOR<TagUpdateWithoutUserInput, TagUncheckedUpdateWithoutUserInput>
  }

  export type TagUpdateManyWithWhereWithoutUserInput = {
    where: TagScalarWhereInput
    data: XOR<TagUpdateManyMutationInput, TagUncheckedUpdateManyWithoutUserInput>
  }

  export type TagScalarWhereInput = {
    AND?: TagScalarWhereInput | TagScalarWhereInput[]
    OR?: TagScalarWhereInput[]
    NOT?: TagScalarWhereInput | TagScalarWhereInput[]
    id?: StringFilter<"Tag"> | string
    name?: StringFilter<"Tag"> | string
    color?: StringFilter<"Tag"> | string
    userId?: StringFilter<"Tag"> | string
  }

  export type TimerSessionCreateWithoutTodoInput = {
    id?: string
    startedAt: Date | string
    endedAt?: Date | string | null
    duration?: number | null
  }

  export type TimerSessionUncheckedCreateWithoutTodoInput = {
    id?: string
    startedAt: Date | string
    endedAt?: Date | string | null
    duration?: number | null
  }

  export type TimerSessionCreateOrConnectWithoutTodoInput = {
    where: TimerSessionWhereUniqueInput
    create: XOR<TimerSessionCreateWithoutTodoInput, TimerSessionUncheckedCreateWithoutTodoInput>
  }

  export type TimerSessionCreateManyTodoInputEnvelope = {
    data: TimerSessionCreateManyTodoInput | TimerSessionCreateManyTodoInput[]
    skipDuplicates?: boolean
  }

  export type TodoCreateWithoutSubTasksInput = {
    id?: string
    title: string
    description?: string | null
    isCompleted?: boolean
    createdAt?: Date | string
    dueDate?: Date | string | null
    completedAt?: Date | string | null
    priority?: $Enums.Priority
    isAiSuggested?: boolean
    estimatedTime?: number | null
    timeSpent?: number | null
    sortOrder?: number | null
    recurrence?: $Enums.Recurrence
    recurrenceEndDate?: Date | string | null
    timerSessions?: TimerSessionCreateNestedManyWithoutTodoInput
    parent?: TodoCreateNestedOneWithoutSubTasksInput
    tags?: TagCreateNestedManyWithoutTodosInput
    user: UserCreateNestedOneWithoutTodosInput
  }

  export type TodoUncheckedCreateWithoutSubTasksInput = {
    id?: string
    title: string
    description?: string | null
    isCompleted?: boolean
    createdAt?: Date | string
    dueDate?: Date | string | null
    completedAt?: Date | string | null
    priority?: $Enums.Priority
    isAiSuggested?: boolean
    estimatedTime?: number | null
    timeSpent?: number | null
    sortOrder?: number | null
    recurrence?: $Enums.Recurrence
    recurrenceEndDate?: Date | string | null
    parentId?: string | null
    userId: string
    timerSessions?: TimerSessionUncheckedCreateNestedManyWithoutTodoInput
    tags?: TagUncheckedCreateNestedManyWithoutTodosInput
  }

  export type TodoCreateOrConnectWithoutSubTasksInput = {
    where: TodoWhereUniqueInput
    create: XOR<TodoCreateWithoutSubTasksInput, TodoUncheckedCreateWithoutSubTasksInput>
  }

  export type TodoCreateWithoutParentInput = {
    id?: string
    title: string
    description?: string | null
    isCompleted?: boolean
    createdAt?: Date | string
    dueDate?: Date | string | null
    completedAt?: Date | string | null
    priority?: $Enums.Priority
    isAiSuggested?: boolean
    estimatedTime?: number | null
    timeSpent?: number | null
    sortOrder?: number | null
    recurrence?: $Enums.Recurrence
    recurrenceEndDate?: Date | string | null
    timerSessions?: TimerSessionCreateNestedManyWithoutTodoInput
    subTasks?: TodoCreateNestedManyWithoutParentInput
    tags?: TagCreateNestedManyWithoutTodosInput
    user: UserCreateNestedOneWithoutTodosInput
  }

  export type TodoUncheckedCreateWithoutParentInput = {
    id?: string
    title: string
    description?: string | null
    isCompleted?: boolean
    createdAt?: Date | string
    dueDate?: Date | string | null
    completedAt?: Date | string | null
    priority?: $Enums.Priority
    isAiSuggested?: boolean
    estimatedTime?: number | null
    timeSpent?: number | null
    sortOrder?: number | null
    recurrence?: $Enums.Recurrence
    recurrenceEndDate?: Date | string | null
    userId: string
    timerSessions?: TimerSessionUncheckedCreateNestedManyWithoutTodoInput
    subTasks?: TodoUncheckedCreateNestedManyWithoutParentInput
    tags?: TagUncheckedCreateNestedManyWithoutTodosInput
  }

  export type TodoCreateOrConnectWithoutParentInput = {
    where: TodoWhereUniqueInput
    create: XOR<TodoCreateWithoutParentInput, TodoUncheckedCreateWithoutParentInput>
  }

  export type TodoCreateManyParentInputEnvelope = {
    data: TodoCreateManyParentInput | TodoCreateManyParentInput[]
    skipDuplicates?: boolean
  }

  export type TagCreateWithoutTodosInput = {
    id?: string
    name: string
    color?: string
    user: UserCreateNestedOneWithoutTagsInput
  }

  export type TagUncheckedCreateWithoutTodosInput = {
    id?: string
    name: string
    color?: string
    userId: string
  }

  export type TagCreateOrConnectWithoutTodosInput = {
    where: TagWhereUniqueInput
    create: XOR<TagCreateWithoutTodosInput, TagUncheckedCreateWithoutTodosInput>
  }

  export type UserCreateWithoutTodosInput = {
    id?: string
    email: string
    name?: string | null
    password?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    xp?: number
    level?: number
    streak?: number
    lastActiveDate?: Date | string | null
    suggestions?: SuggestionCreateNestedManyWithoutUserInput
    tags?: TagCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutTodosInput = {
    id?: string
    email: string
    name?: string | null
    password?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    xp?: number
    level?: number
    streak?: number
    lastActiveDate?: Date | string | null
    suggestions?: SuggestionUncheckedCreateNestedManyWithoutUserInput
    tags?: TagUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutTodosInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutTodosInput, UserUncheckedCreateWithoutTodosInput>
  }

  export type TimerSessionUpsertWithWhereUniqueWithoutTodoInput = {
    where: TimerSessionWhereUniqueInput
    update: XOR<TimerSessionUpdateWithoutTodoInput, TimerSessionUncheckedUpdateWithoutTodoInput>
    create: XOR<TimerSessionCreateWithoutTodoInput, TimerSessionUncheckedCreateWithoutTodoInput>
  }

  export type TimerSessionUpdateWithWhereUniqueWithoutTodoInput = {
    where: TimerSessionWhereUniqueInput
    data: XOR<TimerSessionUpdateWithoutTodoInput, TimerSessionUncheckedUpdateWithoutTodoInput>
  }

  export type TimerSessionUpdateManyWithWhereWithoutTodoInput = {
    where: TimerSessionScalarWhereInput
    data: XOR<TimerSessionUpdateManyMutationInput, TimerSessionUncheckedUpdateManyWithoutTodoInput>
  }

  export type TimerSessionScalarWhereInput = {
    AND?: TimerSessionScalarWhereInput | TimerSessionScalarWhereInput[]
    OR?: TimerSessionScalarWhereInput[]
    NOT?: TimerSessionScalarWhereInput | TimerSessionScalarWhereInput[]
    id?: StringFilter<"TimerSession"> | string
    startedAt?: DateTimeFilter<"TimerSession"> | Date | string
    endedAt?: DateTimeNullableFilter<"TimerSession"> | Date | string | null
    duration?: IntNullableFilter<"TimerSession"> | number | null
    todoId?: StringFilter<"TimerSession"> | string
  }

  export type TodoUpsertWithoutSubTasksInput = {
    update: XOR<TodoUpdateWithoutSubTasksInput, TodoUncheckedUpdateWithoutSubTasksInput>
    create: XOR<TodoCreateWithoutSubTasksInput, TodoUncheckedCreateWithoutSubTasksInput>
    where?: TodoWhereInput
  }

  export type TodoUpdateToOneWithWhereWithoutSubTasksInput = {
    where?: TodoWhereInput
    data: XOR<TodoUpdateWithoutSubTasksInput, TodoUncheckedUpdateWithoutSubTasksInput>
  }

  export type TodoUpdateWithoutSubTasksInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isCompleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    priority?: EnumPriorityFieldUpdateOperationsInput | $Enums.Priority
    isAiSuggested?: BoolFieldUpdateOperationsInput | boolean
    estimatedTime?: NullableIntFieldUpdateOperationsInput | number | null
    timeSpent?: NullableIntFieldUpdateOperationsInput | number | null
    sortOrder?: NullableIntFieldUpdateOperationsInput | number | null
    recurrence?: EnumRecurrenceFieldUpdateOperationsInput | $Enums.Recurrence
    recurrenceEndDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    timerSessions?: TimerSessionUpdateManyWithoutTodoNestedInput
    parent?: TodoUpdateOneWithoutSubTasksNestedInput
    tags?: TagUpdateManyWithoutTodosNestedInput
    user?: UserUpdateOneRequiredWithoutTodosNestedInput
  }

  export type TodoUncheckedUpdateWithoutSubTasksInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isCompleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    priority?: EnumPriorityFieldUpdateOperationsInput | $Enums.Priority
    isAiSuggested?: BoolFieldUpdateOperationsInput | boolean
    estimatedTime?: NullableIntFieldUpdateOperationsInput | number | null
    timeSpent?: NullableIntFieldUpdateOperationsInput | number | null
    sortOrder?: NullableIntFieldUpdateOperationsInput | number | null
    recurrence?: EnumRecurrenceFieldUpdateOperationsInput | $Enums.Recurrence
    recurrenceEndDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
    timerSessions?: TimerSessionUncheckedUpdateManyWithoutTodoNestedInput
    tags?: TagUncheckedUpdateManyWithoutTodosNestedInput
  }

  export type TodoUpsertWithWhereUniqueWithoutParentInput = {
    where: TodoWhereUniqueInput
    update: XOR<TodoUpdateWithoutParentInput, TodoUncheckedUpdateWithoutParentInput>
    create: XOR<TodoCreateWithoutParentInput, TodoUncheckedCreateWithoutParentInput>
  }

  export type TodoUpdateWithWhereUniqueWithoutParentInput = {
    where: TodoWhereUniqueInput
    data: XOR<TodoUpdateWithoutParentInput, TodoUncheckedUpdateWithoutParentInput>
  }

  export type TodoUpdateManyWithWhereWithoutParentInput = {
    where: TodoScalarWhereInput
    data: XOR<TodoUpdateManyMutationInput, TodoUncheckedUpdateManyWithoutParentInput>
  }

  export type TagUpsertWithWhereUniqueWithoutTodosInput = {
    where: TagWhereUniqueInput
    update: XOR<TagUpdateWithoutTodosInput, TagUncheckedUpdateWithoutTodosInput>
    create: XOR<TagCreateWithoutTodosInput, TagUncheckedCreateWithoutTodosInput>
  }

  export type TagUpdateWithWhereUniqueWithoutTodosInput = {
    where: TagWhereUniqueInput
    data: XOR<TagUpdateWithoutTodosInput, TagUncheckedUpdateWithoutTodosInput>
  }

  export type TagUpdateManyWithWhereWithoutTodosInput = {
    where: TagScalarWhereInput
    data: XOR<TagUpdateManyMutationInput, TagUncheckedUpdateManyWithoutTodosInput>
  }

  export type UserUpsertWithoutTodosInput = {
    update: XOR<UserUpdateWithoutTodosInput, UserUncheckedUpdateWithoutTodosInput>
    create: XOR<UserCreateWithoutTodosInput, UserUncheckedCreateWithoutTodosInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutTodosInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutTodosInput, UserUncheckedUpdateWithoutTodosInput>
  }

  export type UserUpdateWithoutTodosInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    xp?: IntFieldUpdateOperationsInput | number
    level?: IntFieldUpdateOperationsInput | number
    streak?: IntFieldUpdateOperationsInput | number
    lastActiveDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    suggestions?: SuggestionUpdateManyWithoutUserNestedInput
    tags?: TagUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutTodosInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    xp?: IntFieldUpdateOperationsInput | number
    level?: IntFieldUpdateOperationsInput | number
    streak?: IntFieldUpdateOperationsInput | number
    lastActiveDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    suggestions?: SuggestionUncheckedUpdateManyWithoutUserNestedInput
    tags?: TagUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateWithoutTagsInput = {
    id?: string
    email: string
    name?: string | null
    password?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    xp?: number
    level?: number
    streak?: number
    lastActiveDate?: Date | string | null
    todos?: TodoCreateNestedManyWithoutUserInput
    suggestions?: SuggestionCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutTagsInput = {
    id?: string
    email: string
    name?: string | null
    password?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    xp?: number
    level?: number
    streak?: number
    lastActiveDate?: Date | string | null
    todos?: TodoUncheckedCreateNestedManyWithoutUserInput
    suggestions?: SuggestionUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutTagsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutTagsInput, UserUncheckedCreateWithoutTagsInput>
  }

  export type TodoCreateWithoutTagsInput = {
    id?: string
    title: string
    description?: string | null
    isCompleted?: boolean
    createdAt?: Date | string
    dueDate?: Date | string | null
    completedAt?: Date | string | null
    priority?: $Enums.Priority
    isAiSuggested?: boolean
    estimatedTime?: number | null
    timeSpent?: number | null
    sortOrder?: number | null
    recurrence?: $Enums.Recurrence
    recurrenceEndDate?: Date | string | null
    timerSessions?: TimerSessionCreateNestedManyWithoutTodoInput
    parent?: TodoCreateNestedOneWithoutSubTasksInput
    subTasks?: TodoCreateNestedManyWithoutParentInput
    user: UserCreateNestedOneWithoutTodosInput
  }

  export type TodoUncheckedCreateWithoutTagsInput = {
    id?: string
    title: string
    description?: string | null
    isCompleted?: boolean
    createdAt?: Date | string
    dueDate?: Date | string | null
    completedAt?: Date | string | null
    priority?: $Enums.Priority
    isAiSuggested?: boolean
    estimatedTime?: number | null
    timeSpent?: number | null
    sortOrder?: number | null
    recurrence?: $Enums.Recurrence
    recurrenceEndDate?: Date | string | null
    parentId?: string | null
    userId: string
    timerSessions?: TimerSessionUncheckedCreateNestedManyWithoutTodoInput
    subTasks?: TodoUncheckedCreateNestedManyWithoutParentInput
  }

  export type TodoCreateOrConnectWithoutTagsInput = {
    where: TodoWhereUniqueInput
    create: XOR<TodoCreateWithoutTagsInput, TodoUncheckedCreateWithoutTagsInput>
  }

  export type UserUpsertWithoutTagsInput = {
    update: XOR<UserUpdateWithoutTagsInput, UserUncheckedUpdateWithoutTagsInput>
    create: XOR<UserCreateWithoutTagsInput, UserUncheckedCreateWithoutTagsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutTagsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutTagsInput, UserUncheckedUpdateWithoutTagsInput>
  }

  export type UserUpdateWithoutTagsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    xp?: IntFieldUpdateOperationsInput | number
    level?: IntFieldUpdateOperationsInput | number
    streak?: IntFieldUpdateOperationsInput | number
    lastActiveDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    todos?: TodoUpdateManyWithoutUserNestedInput
    suggestions?: SuggestionUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutTagsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    xp?: IntFieldUpdateOperationsInput | number
    level?: IntFieldUpdateOperationsInput | number
    streak?: IntFieldUpdateOperationsInput | number
    lastActiveDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    todos?: TodoUncheckedUpdateManyWithoutUserNestedInput
    suggestions?: SuggestionUncheckedUpdateManyWithoutUserNestedInput
  }

  export type TodoUpsertWithWhereUniqueWithoutTagsInput = {
    where: TodoWhereUniqueInput
    update: XOR<TodoUpdateWithoutTagsInput, TodoUncheckedUpdateWithoutTagsInput>
    create: XOR<TodoCreateWithoutTagsInput, TodoUncheckedCreateWithoutTagsInput>
  }

  export type TodoUpdateWithWhereUniqueWithoutTagsInput = {
    where: TodoWhereUniqueInput
    data: XOR<TodoUpdateWithoutTagsInput, TodoUncheckedUpdateWithoutTagsInput>
  }

  export type TodoUpdateManyWithWhereWithoutTagsInput = {
    where: TodoScalarWhereInput
    data: XOR<TodoUpdateManyMutationInput, TodoUncheckedUpdateManyWithoutTagsInput>
  }

  export type UserCreateWithoutSuggestionsInput = {
    id?: string
    email: string
    name?: string | null
    password?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    xp?: number
    level?: number
    streak?: number
    lastActiveDate?: Date | string | null
    todos?: TodoCreateNestedManyWithoutUserInput
    tags?: TagCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutSuggestionsInput = {
    id?: string
    email: string
    name?: string | null
    password?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    xp?: number
    level?: number
    streak?: number
    lastActiveDate?: Date | string | null
    todos?: TodoUncheckedCreateNestedManyWithoutUserInput
    tags?: TagUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutSuggestionsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutSuggestionsInput, UserUncheckedCreateWithoutSuggestionsInput>
  }

  export type UserUpsertWithoutSuggestionsInput = {
    update: XOR<UserUpdateWithoutSuggestionsInput, UserUncheckedUpdateWithoutSuggestionsInput>
    create: XOR<UserCreateWithoutSuggestionsInput, UserUncheckedCreateWithoutSuggestionsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutSuggestionsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutSuggestionsInput, UserUncheckedUpdateWithoutSuggestionsInput>
  }

  export type UserUpdateWithoutSuggestionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    xp?: IntFieldUpdateOperationsInput | number
    level?: IntFieldUpdateOperationsInput | number
    streak?: IntFieldUpdateOperationsInput | number
    lastActiveDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    todos?: TodoUpdateManyWithoutUserNestedInput
    tags?: TagUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutSuggestionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    xp?: IntFieldUpdateOperationsInput | number
    level?: IntFieldUpdateOperationsInput | number
    streak?: IntFieldUpdateOperationsInput | number
    lastActiveDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    todos?: TodoUncheckedUpdateManyWithoutUserNestedInput
    tags?: TagUncheckedUpdateManyWithoutUserNestedInput
  }

  export type TodoCreateWithoutTimerSessionsInput = {
    id?: string
    title: string
    description?: string | null
    isCompleted?: boolean
    createdAt?: Date | string
    dueDate?: Date | string | null
    completedAt?: Date | string | null
    priority?: $Enums.Priority
    isAiSuggested?: boolean
    estimatedTime?: number | null
    timeSpent?: number | null
    sortOrder?: number | null
    recurrence?: $Enums.Recurrence
    recurrenceEndDate?: Date | string | null
    parent?: TodoCreateNestedOneWithoutSubTasksInput
    subTasks?: TodoCreateNestedManyWithoutParentInput
    tags?: TagCreateNestedManyWithoutTodosInput
    user: UserCreateNestedOneWithoutTodosInput
  }

  export type TodoUncheckedCreateWithoutTimerSessionsInput = {
    id?: string
    title: string
    description?: string | null
    isCompleted?: boolean
    createdAt?: Date | string
    dueDate?: Date | string | null
    completedAt?: Date | string | null
    priority?: $Enums.Priority
    isAiSuggested?: boolean
    estimatedTime?: number | null
    timeSpent?: number | null
    sortOrder?: number | null
    recurrence?: $Enums.Recurrence
    recurrenceEndDate?: Date | string | null
    parentId?: string | null
    userId: string
    subTasks?: TodoUncheckedCreateNestedManyWithoutParentInput
    tags?: TagUncheckedCreateNestedManyWithoutTodosInput
  }

  export type TodoCreateOrConnectWithoutTimerSessionsInput = {
    where: TodoWhereUniqueInput
    create: XOR<TodoCreateWithoutTimerSessionsInput, TodoUncheckedCreateWithoutTimerSessionsInput>
  }

  export type TodoUpsertWithoutTimerSessionsInput = {
    update: XOR<TodoUpdateWithoutTimerSessionsInput, TodoUncheckedUpdateWithoutTimerSessionsInput>
    create: XOR<TodoCreateWithoutTimerSessionsInput, TodoUncheckedCreateWithoutTimerSessionsInput>
    where?: TodoWhereInput
  }

  export type TodoUpdateToOneWithWhereWithoutTimerSessionsInput = {
    where?: TodoWhereInput
    data: XOR<TodoUpdateWithoutTimerSessionsInput, TodoUncheckedUpdateWithoutTimerSessionsInput>
  }

  export type TodoUpdateWithoutTimerSessionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isCompleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    priority?: EnumPriorityFieldUpdateOperationsInput | $Enums.Priority
    isAiSuggested?: BoolFieldUpdateOperationsInput | boolean
    estimatedTime?: NullableIntFieldUpdateOperationsInput | number | null
    timeSpent?: NullableIntFieldUpdateOperationsInput | number | null
    sortOrder?: NullableIntFieldUpdateOperationsInput | number | null
    recurrence?: EnumRecurrenceFieldUpdateOperationsInput | $Enums.Recurrence
    recurrenceEndDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    parent?: TodoUpdateOneWithoutSubTasksNestedInput
    subTasks?: TodoUpdateManyWithoutParentNestedInput
    tags?: TagUpdateManyWithoutTodosNestedInput
    user?: UserUpdateOneRequiredWithoutTodosNestedInput
  }

  export type TodoUncheckedUpdateWithoutTimerSessionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isCompleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    priority?: EnumPriorityFieldUpdateOperationsInput | $Enums.Priority
    isAiSuggested?: BoolFieldUpdateOperationsInput | boolean
    estimatedTime?: NullableIntFieldUpdateOperationsInput | number | null
    timeSpent?: NullableIntFieldUpdateOperationsInput | number | null
    sortOrder?: NullableIntFieldUpdateOperationsInput | number | null
    recurrence?: EnumRecurrenceFieldUpdateOperationsInput | $Enums.Recurrence
    recurrenceEndDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
    subTasks?: TodoUncheckedUpdateManyWithoutParentNestedInput
    tags?: TagUncheckedUpdateManyWithoutTodosNestedInput
  }

  export type TodoCreateManyUserInput = {
    id?: string
    title: string
    description?: string | null
    isCompleted?: boolean
    createdAt?: Date | string
    dueDate?: Date | string | null
    completedAt?: Date | string | null
    priority?: $Enums.Priority
    isAiSuggested?: boolean
    estimatedTime?: number | null
    timeSpent?: number | null
    sortOrder?: number | null
    recurrence?: $Enums.Recurrence
    recurrenceEndDate?: Date | string | null
    parentId?: string | null
  }

  export type SuggestionCreateManyUserInput = {
    id?: string
    suggestionType: $Enums.SuggestionType
    content: string
    createdAt?: Date | string
    forDate: Date | string
    isAccepted?: boolean
  }

  export type TagCreateManyUserInput = {
    id?: string
    name: string
    color?: string
  }

  export type TodoUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isCompleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    priority?: EnumPriorityFieldUpdateOperationsInput | $Enums.Priority
    isAiSuggested?: BoolFieldUpdateOperationsInput | boolean
    estimatedTime?: NullableIntFieldUpdateOperationsInput | number | null
    timeSpent?: NullableIntFieldUpdateOperationsInput | number | null
    sortOrder?: NullableIntFieldUpdateOperationsInput | number | null
    recurrence?: EnumRecurrenceFieldUpdateOperationsInput | $Enums.Recurrence
    recurrenceEndDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    timerSessions?: TimerSessionUpdateManyWithoutTodoNestedInput
    parent?: TodoUpdateOneWithoutSubTasksNestedInput
    subTasks?: TodoUpdateManyWithoutParentNestedInput
    tags?: TagUpdateManyWithoutTodosNestedInput
  }

  export type TodoUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isCompleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    priority?: EnumPriorityFieldUpdateOperationsInput | $Enums.Priority
    isAiSuggested?: BoolFieldUpdateOperationsInput | boolean
    estimatedTime?: NullableIntFieldUpdateOperationsInput | number | null
    timeSpent?: NullableIntFieldUpdateOperationsInput | number | null
    sortOrder?: NullableIntFieldUpdateOperationsInput | number | null
    recurrence?: EnumRecurrenceFieldUpdateOperationsInput | $Enums.Recurrence
    recurrenceEndDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    timerSessions?: TimerSessionUncheckedUpdateManyWithoutTodoNestedInput
    subTasks?: TodoUncheckedUpdateManyWithoutParentNestedInput
    tags?: TagUncheckedUpdateManyWithoutTodosNestedInput
  }

  export type TodoUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isCompleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    priority?: EnumPriorityFieldUpdateOperationsInput | $Enums.Priority
    isAiSuggested?: BoolFieldUpdateOperationsInput | boolean
    estimatedTime?: NullableIntFieldUpdateOperationsInput | number | null
    timeSpent?: NullableIntFieldUpdateOperationsInput | number | null
    sortOrder?: NullableIntFieldUpdateOperationsInput | number | null
    recurrence?: EnumRecurrenceFieldUpdateOperationsInput | $Enums.Recurrence
    recurrenceEndDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type SuggestionUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    suggestionType?: EnumSuggestionTypeFieldUpdateOperationsInput | $Enums.SuggestionType
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    forDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isAccepted?: BoolFieldUpdateOperationsInput | boolean
  }

  export type SuggestionUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    suggestionType?: EnumSuggestionTypeFieldUpdateOperationsInput | $Enums.SuggestionType
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    forDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isAccepted?: BoolFieldUpdateOperationsInput | boolean
  }

  export type SuggestionUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    suggestionType?: EnumSuggestionTypeFieldUpdateOperationsInput | $Enums.SuggestionType
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    forDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isAccepted?: BoolFieldUpdateOperationsInput | boolean
  }

  export type TagUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    todos?: TodoUpdateManyWithoutTagsNestedInput
  }

  export type TagUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    todos?: TodoUncheckedUpdateManyWithoutTagsNestedInput
  }

  export type TagUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
  }

  export type TimerSessionCreateManyTodoInput = {
    id?: string
    startedAt: Date | string
    endedAt?: Date | string | null
    duration?: number | null
  }

  export type TodoCreateManyParentInput = {
    id?: string
    title: string
    description?: string | null
    isCompleted?: boolean
    createdAt?: Date | string
    dueDate?: Date | string | null
    completedAt?: Date | string | null
    priority?: $Enums.Priority
    isAiSuggested?: boolean
    estimatedTime?: number | null
    timeSpent?: number | null
    sortOrder?: number | null
    recurrence?: $Enums.Recurrence
    recurrenceEndDate?: Date | string | null
    userId: string
  }

  export type TimerSessionUpdateWithoutTodoInput = {
    id?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    duration?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type TimerSessionUncheckedUpdateWithoutTodoInput = {
    id?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    duration?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type TimerSessionUncheckedUpdateManyWithoutTodoInput = {
    id?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    duration?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type TodoUpdateWithoutParentInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isCompleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    priority?: EnumPriorityFieldUpdateOperationsInput | $Enums.Priority
    isAiSuggested?: BoolFieldUpdateOperationsInput | boolean
    estimatedTime?: NullableIntFieldUpdateOperationsInput | number | null
    timeSpent?: NullableIntFieldUpdateOperationsInput | number | null
    sortOrder?: NullableIntFieldUpdateOperationsInput | number | null
    recurrence?: EnumRecurrenceFieldUpdateOperationsInput | $Enums.Recurrence
    recurrenceEndDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    timerSessions?: TimerSessionUpdateManyWithoutTodoNestedInput
    subTasks?: TodoUpdateManyWithoutParentNestedInput
    tags?: TagUpdateManyWithoutTodosNestedInput
    user?: UserUpdateOneRequiredWithoutTodosNestedInput
  }

  export type TodoUncheckedUpdateWithoutParentInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isCompleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    priority?: EnumPriorityFieldUpdateOperationsInput | $Enums.Priority
    isAiSuggested?: BoolFieldUpdateOperationsInput | boolean
    estimatedTime?: NullableIntFieldUpdateOperationsInput | number | null
    timeSpent?: NullableIntFieldUpdateOperationsInput | number | null
    sortOrder?: NullableIntFieldUpdateOperationsInput | number | null
    recurrence?: EnumRecurrenceFieldUpdateOperationsInput | $Enums.Recurrence
    recurrenceEndDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    userId?: StringFieldUpdateOperationsInput | string
    timerSessions?: TimerSessionUncheckedUpdateManyWithoutTodoNestedInput
    subTasks?: TodoUncheckedUpdateManyWithoutParentNestedInput
    tags?: TagUncheckedUpdateManyWithoutTodosNestedInput
  }

  export type TodoUncheckedUpdateManyWithoutParentInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isCompleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    priority?: EnumPriorityFieldUpdateOperationsInput | $Enums.Priority
    isAiSuggested?: BoolFieldUpdateOperationsInput | boolean
    estimatedTime?: NullableIntFieldUpdateOperationsInput | number | null
    timeSpent?: NullableIntFieldUpdateOperationsInput | number | null
    sortOrder?: NullableIntFieldUpdateOperationsInput | number | null
    recurrence?: EnumRecurrenceFieldUpdateOperationsInput | $Enums.Recurrence
    recurrenceEndDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type TagUpdateWithoutTodosInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    user?: UserUpdateOneRequiredWithoutTagsNestedInput
  }

  export type TagUncheckedUpdateWithoutTodosInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type TagUncheckedUpdateManyWithoutTodosInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type TodoUpdateWithoutTagsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isCompleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    priority?: EnumPriorityFieldUpdateOperationsInput | $Enums.Priority
    isAiSuggested?: BoolFieldUpdateOperationsInput | boolean
    estimatedTime?: NullableIntFieldUpdateOperationsInput | number | null
    timeSpent?: NullableIntFieldUpdateOperationsInput | number | null
    sortOrder?: NullableIntFieldUpdateOperationsInput | number | null
    recurrence?: EnumRecurrenceFieldUpdateOperationsInput | $Enums.Recurrence
    recurrenceEndDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    timerSessions?: TimerSessionUpdateManyWithoutTodoNestedInput
    parent?: TodoUpdateOneWithoutSubTasksNestedInput
    subTasks?: TodoUpdateManyWithoutParentNestedInput
    user?: UserUpdateOneRequiredWithoutTodosNestedInput
  }

  export type TodoUncheckedUpdateWithoutTagsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isCompleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    priority?: EnumPriorityFieldUpdateOperationsInput | $Enums.Priority
    isAiSuggested?: BoolFieldUpdateOperationsInput | boolean
    estimatedTime?: NullableIntFieldUpdateOperationsInput | number | null
    timeSpent?: NullableIntFieldUpdateOperationsInput | number | null
    sortOrder?: NullableIntFieldUpdateOperationsInput | number | null
    recurrence?: EnumRecurrenceFieldUpdateOperationsInput | $Enums.Recurrence
    recurrenceEndDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
    timerSessions?: TimerSessionUncheckedUpdateManyWithoutTodoNestedInput
    subTasks?: TodoUncheckedUpdateManyWithoutParentNestedInput
  }

  export type TodoUncheckedUpdateManyWithoutTagsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isCompleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    priority?: EnumPriorityFieldUpdateOperationsInput | $Enums.Priority
    isAiSuggested?: BoolFieldUpdateOperationsInput | boolean
    estimatedTime?: NullableIntFieldUpdateOperationsInput | number | null
    timeSpent?: NullableIntFieldUpdateOperationsInput | number | null
    sortOrder?: NullableIntFieldUpdateOperationsInput | number | null
    recurrence?: EnumRecurrenceFieldUpdateOperationsInput | $Enums.Recurrence
    recurrenceEndDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}