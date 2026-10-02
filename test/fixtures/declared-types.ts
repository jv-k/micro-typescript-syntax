  // Declared type names and type parameters get the type colour.
  class Foo<T> extends Bar {}
//^^^^^ statement.class
//      ^^^ type
//         ^ symbol.operator
//          ^ type
//             ^^^^^^^ statement
  interface Props<T, U extends K> { a: T }
//^^^^^^^^^ statement
//          ^^^^^ type
//                ^ type
//                 ^ symbol.punctuation
//                   ^ type
//                     ^^^^^^^ statement
  type Handler<E> = (e: E) => void;
//^^^^ statement.const
//     ^^^^^^^ type
//             ^ type
//                ^ symbol.operator
  enum Dir { Up } const enum Mode {}
//^^^^ statement
//     ^^^ type
//                ^^^^^ statement.const
//                           ^^^^ type
  declare namespace NS {}
//        ^^^^^^^^^ statement
//                  ^^ type
  function id<T>(x: T): T { return x; }
//^^^^^^^^ statement.function
//         ^^ identifier.function
//           ^ symbol.operator
//            ^ type
  const C = class extends Base {};
//          ^^^^^ statement.class
//                ^^^^^^^ statement
  className; classes; interfaces;
//^^^^^^^^^ default
//           ^^^^^^^ default
