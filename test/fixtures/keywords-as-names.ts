  item.type; p.catch(); a. new; x.this;
//     ^^^^ default
//             ^^^^^ default
//                         ^^^ default
//                                ^^^^ default
//            ^ symbol.punctuation
  x = { type: 'a', default: 1, from?: 2 };
//      ^^^^ default
//                 ^^^^^^^ default
//                             ^^^^ default
//                                 ^ symbol.operator
//                                  ^ symbol.operator
  variants = {
    default: "bg-primary",
//  ^^^^^^^ default
//         ^ symbol.operator
  };
  module.exports = y; type.x; from.y;
//^^^^^^ default
//                    ^^^^ default
//                            ^^^^ default
//                        ^ symbol.punctuation
  of(1); get(url); from (x);
//^^ default
//       ^^^ default
//                 ^^^^ default
//  ^ symbol.brackets
  x.enum; y = { enum: 1 };
//  ^^^^ default
//              ^^^^ default
  // `type` as a variable is a plain name.
  return type; if (type === x) {} f(type, type); type = 1; x = [type];
//       ^^^^ default
//                 ^^^^ default
//                                  ^^^^ default
//                                        ^^^^ default
//                                               ^^^^ default
//                                                              ^^^^ default
//           ^ symbol.punctuation
//                      ^^^ symbol.operator
//                           ^ symbol.brackets
//                                                                  ^ symbol.brackets
  export type { A }; import type B from 'b'; type T = U;
//       ^^^^ statement.const
//                          ^^^^ statement.const
//                                           ^^^^ statement.const
  // Keyword-named keys stay plain names; ternaries keep their colours.
  x = { super: 1, this: 2, void: 3 };
//      ^^^^^ default
//                ^^^^ default
//                         ^^^^ default
//              ^ symbol.punctuation
//                    ^ symbol.operator
  y = { null: 1, true: 2, undefined: 3, NaN: 4 };
//      ^^^^ default
//               ^^^^ default
//                        ^^^^^^^^^ default
//                                      ^^^ default
  z = { any: 1, string?: 2, const: 3, let: 4, var: 5, function: 6 };
//      ^^^ default
//              ^^^^^^ default
//                    ^ symbol.operator
//                          ^^^^^ default
//                                    ^^^ default
//                                            ^^^ default
//                                                    ^^^^^^^^ default
    null: SyntaxKind.NullKeyword,
//  ^^^^ default
  ok ? null : this; f(a, b ? true : false);
//     ^^^^ constant
//            ^^^^ statement
//                           ^^^^ constant.bool.true
//                                  ^^^^^ constant.bool.false
  switch (k) { case null: break; }
//                  ^^^^ constant
  // A keyword inside a name with `$` is not a keyword.
  core.$constructor<Z>(x); y = $type + $if + type$ + $null;
//     ^^^^^^^^^^^^ default
//                             ^^^^^ default
//                                     ^^^ default
//                                           ^^^^^ default
//                                                   ^^^^^ default
  const $el = 1; const $type = 2;
//      ^^^ identifier.const
//               ^^^^^ statement.const
  // A ternary arm at the start of a line is not a key.
  const v = flag ?
    null :
//  ^^^^ constant
    undefined;
  type T<U> = U extends string ?
    never :
//  ^^^^^ type.types
    U;
  const w = ok ?
    this :
//  ^^^^ statement
    that;
  // A declared name that starts with `$` and a keyword keeps its colour.
  export function $constructor<T>(a: T) {}
//                ^^^^^^^^^^^^ identifier.function
  function $if() {} export const $type = 2;
//         ^^^ identifier.function
//                               ^^^^^ identifier.const
//                         ^^^^^ statement.const
  x = $const + $let + var$ + $function;
//    ^^^^^^ default
//             ^^^^ default
//                    ^^^^ default
//                           ^^^^^^^^^ default
