  call(a[0], { b: c });
//    ^ symbol.brackets
//      ^ symbol.brackets
//        ^ symbol.brackets
//           ^ symbol.braces
//                  ^ symbol.braces
//                   ^ symbol.brackets
  x = a + b - c * d % e;
//  ^ symbol.operator
//      ^ symbol.operator
//          ^ symbol.operator
//              ^ symbol.operator
//                  ^ symbol.operator
  a.b, c; d;
// ^ symbol.punctuation
//   ^ symbol.punctuation
//      ^ symbol.punctuation
  !x && y || z ^ w | v & u ~ t;
//^ symbol.operator
//   ^^ symbol.operator
//        ^^ symbol.operator
//             ^ symbol.operator
//                         ^ symbol.operator
  x <= y >= z;
//  ^^ symbol.operator
//       ^^ symbol.operator
