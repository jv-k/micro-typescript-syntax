  x = 1; // line comment
//       ^^^^^^^^^^^^^^^ comment
  y = 2; // TODO: fix FIXME XXX
//          ^^^^^ todo
//                    ^^^^^ todo
//                          ^^^ todo
  const re = /\/\//; // after regex
//           ^^^^^^ !comment
//                   ^^^^^^^^ comment
  if (/^\/\//.test(u)) { x = 1; } // real
//                       ^^^^^^ !comment
//                                ^^^^^^^ comment
  url = 'http://x';
//            ^^^ !comment
  /* block TODO
//^^^^^^^^ comment
//         ^^^^ todo
   * @param a doc
// ^^^^^^^^^^^^^^ identifier
   */ z = 3;
// ^^ comment
//    ^ default
