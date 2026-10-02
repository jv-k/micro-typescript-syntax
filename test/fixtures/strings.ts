  a = "double \"esc\" end";
//    ^ constant.quotes
//     ^^^^^^ constant.string
//            ^^ constant.stringEscaped
//                       ^ constant.quotes
  b = 'single \'esc\' end';
//    ^ constant.quotes
//     ^^^^^^ constant.string
//            ^^ constant.stringEscaped
//                       ^ constant.quotes
  c = "unclosed
//     ^^^^^^^^ constant.string
  d = 1;
//    ^ constant.number
  e = 'unclosed
//     ^^^^^^^^ constant.string
  d = 2;
//    ^ constant.number
  <p>don't stop</p>; f = 'x';
//       ^^^^^^ !constant.string
//                        ^ constant.string
  g = '/a' + '/b';
//         ^ !constant.string
  const re = /["]/g; const s = "after regex";
//           ^^^^^^ constant.string.regex
//                              ^^^^^ constant.string
  const re2 = /[']/g; const s2 = 'after regex';
//            ^^^^^^ constant.string.regex
//                                ^^^^^ constant.string
