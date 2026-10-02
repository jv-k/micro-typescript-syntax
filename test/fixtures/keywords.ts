  abstract class A extends B implements C {}
//^^^^^^^^ statement
//         ^^^^^ statement.class
//                 ^^^^^^^ statement
//                           ^^^^^^^^^^ statement
  async function f() { await g(); }
//^^^^^ statement
//                     ^^^^^ statement
  if (a) {} else {} for (k of o) {} while (x) {} do {}
//^^ statement
//          ^^^^ statement
//                  ^^^ statement
//                         ^^ statement
//                                  ^^^^^ statement
//                                               ^^ statement
  try {} catch (e) {} finally {} debugger;
//^^^ statement
//       ^^^^^ statement
//                    ^^^^^^^ statement
//                               ^^^^^^^^ statement
  switch (k) { case 1: break; }
//^^^^^^ statement
//             ^^^^ statement
//                     ^^^^^ statement
  switch (k) {
    default:
//  ^^^^^^^^ statement
      continue;
//    ^^^^^^^^ statement
    default: {
//  ^^^^^^^^ statement
//           ^ symbol.braces
    default: return;
//  ^^^^^^^^ statement
  }
  export default x;
//^^^^^^ statement
//       ^^^^^^^ statement
  import { a } from 'b';
//^^^^^^ statement
//             ^^^^ statement
  return new X(); throw e; delete o.p; typeof x; void 0; yield v;
//^^^^^^ statement
//       ^^^ statement
//                ^^^^^ statement
//                         ^^^^^^ statement
//                                     ^^^^^^ statement
//                                               ^^^^ statement
//                                                       ^^^^^ statement
  x instanceof Y; k in o; x as T; x satisfies T;
//  ^^^^^^^^^^ statement
//                  ^^ statement
//                          ^^ statement
//                                  ^^^^^^^^^ statement
  declare module 'm'; namespace N {} interface I {} enum E {}
//^^^^^^^ statement
//        ^^^^^^ statement
//                    ^^^^^^^^^ statement
//                                   ^^^^^^^^^ statement
//                                                  ^^^^ statement
  const enum Dir {}
//^^^^^ statement.const
//      ^^^^ statement
  public private protected readonly static override accessor
//^^^^^^ statement
//       ^^^^^^^ statement
//               ^^^^^^^^^ statement
//                         ^^^^^^^^ statement
//                                  ^^^^^^ statement
//                                         ^^^^^^^^ statement
//                                                  ^^^^^^^^ statement
  keyof T; infer U; asserts x is string; unique symbol;
//^^^^^ statement
//         ^^^^^ statement
//                  ^^^^^^^ statement
//                            ^^ statement
//                                       ^^^^^^ statement
  var a; let b; type T = U;
//^^^ statement.var
//       ^^^ statement.let
//              ^^^^ statement.const
  get x() {} set y(v) {} super.m(); this.n; with (o) {} using r = s;
//^^^ statement
//           ^^^ statement
//                       ^^^^^ statement
//                                  ^^^^ statement
//                                          ^^^^ statement
//                                                      ^^^^^ statement
  package p; constructor() {} require('x');
//^^^^^^^ statement
//           ^^^^^^^^^^^ statement
//                            ^^^^^^^ statement
