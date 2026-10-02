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
  function pick<K extends A | B>(k: K) {}
//              ^ type
//                          ^ symbol.operator
//                            ^ type
  function on<F extends (e: E) => void>(f: F) {}
//            ^ type
  const C = class extends Base {};
//          ^^^^^ statement.class
//                ^^^^^^^ statement
  className; classes; interfaces;
//^^^^^^^^^ default
//           ^^^^^^^ default
  // A method's type parameters get the type colour too.
  lookAhead<T>(callback: () => T): T;
//          ^ type
  scanRange<T, U extends K>(start: number): void {}
//         ^ symbol.operator
//          ^ type
//           ^ symbol.punctuation
//             ^ type
//               ^^^^^^^ statement
//                       ^ type
  ok = a < b && c > (d);
//     ^ default
//         ^ default
//              ^ default
