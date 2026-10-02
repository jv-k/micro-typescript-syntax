  // Declared names: const, arrow functions, function declarations.
  const total = 1;
//      ^^^^^ identifier.const
  const fn = (a) => a;
//      ^^ identifier.function
//            ^ default
  const typed: Handler = async (e): Promise<void> => {};
//      ^^^^^ identifier.function
//             ^^^^^^^ default
//                              ^ default
  const obj = { onClick: (e: Event) => go(e) };
//              ^^^^^^^ identifier.function
//                           ^^^^^ !identifier.function
  withCb(a, cb = (x) => x);
//          ^^ identifier.function
//^^^^^^ default
  const inc = x => x + 1;
//      ^^^ identifier.function
  function named(a) {}
//^^^^^^^^ statement.function
//         ^^^^^ identifier.function
  function* gen() {}
//^^^^^^^^^ statement.function
//          ^^^ identifier.function
  const type = 'x'; const as = 1;
//^^^^^ statement.const
//      ^^^^ identifier.const
//                        ^^ identifier.const
  let get = 1; var from = 2;
//^^^ statement.let
//    ^^^ default
//             ^^^ statement.var
//                 ^^^^ default
  const f2 = (a = g()) => a;
//      ^^ identifier.function KNOWN-GAP
  ok ? a : (b) => b;
//     ^ default KNOWN-GAP
