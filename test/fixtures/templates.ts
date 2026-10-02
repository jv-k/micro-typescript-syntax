  t = `a ${b} c`;
//    ^ constant.quotes
//     ^^ constant.string
//       ^^^^ constant.tplLiterals.expression
//             ^ constant.quotes
  u = `x ${fn({ a })} y`;
//       ^^^^^^^^^^^^ constant.tplLiterals.expression
  v = `line one
//     ^^^^^^^^ constant.string
    line two ${z}`;
//  ^^^^^^^^ constant.string
//           ^^^^ constant.tplLiterals.expression
  w = `esc \` ${q}`;
//         ^^ constant.stringEscaped
//            ^^^^ constant.tplLiterals.expression
  const re = /[`]/g; const s = `after regex`;
//           ^^^^^^ constant.string.regex
//                              ^^^^^ constant.string
  n = `${a({ b: { c } })}`;
//     ^^^^^^^^^^^^^^^^^^ constant.tplLiterals.expression KNOWN-GAP
