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
