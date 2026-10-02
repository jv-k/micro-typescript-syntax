  x = 1_000 + 1.5 + 1e-3 + 2.5E+10 + 7.;
//    ^^^^^ constant.number
//            ^^^ constant.number
//                  ^^^^ constant.number
//                         ^^^^^^^ constant.number
//                                   ^^ constant.number
  y = .5 + .5e2;
//    ^^ constant.number
//         ^^^^ constant.number
  z = 0xFF_FF + 0b1010 + 0o777 + 10n + 0x1fn;
//    ^^^^^^^ constant.number
//              ^^^^^^ constant.number
//                       ^^^^^ constant.number
//                               ^^^ constant.number
//                                     ^^^^^ constant.number
  w = a1 + b2c + x.y;
//     ^ default
//          ^ default
