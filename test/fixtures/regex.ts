  const r = /ab+c/gi;
//          ^^^^^^^^ constant.string.regex
  const m = s.match(/(\d+)\/x/);
//                  ^^ constant.string.regex
//                    ^^ constant.specialChar
//                        ^^ constant.specialChar
  return /a[/]b/i.test(s);
//       ^^^^^^^^ constant.string.regex
  const q = a / b / c; const r2 = a/b/c;
//            ^^^^^ !constant.string.regex
//                                 ^^^ !constant.string.regex
  const y = arr[i]/n/2; const mid = (w + 1)/2 + (h - 1)/3;
//                ^^^ !constant.string.regex
//                                        ^^^^^^^^^^^^^^ !constant.string.regex
  s.replace(/(\d+)/g, x).split(/,/);
//          ^^ constant.string.regex
//                ^^ constant.string.regex
//                             ^^^ constant.string.regex
  if (/[a-z]/i.test(x) || /b/.test(y)) {}
//    ^^^^^^^^ constant.string.regex
//                        ^^^ constant.string.regex
  if (ok) /re/.test(s);
//        ^^^^ constant.string.regex KNOWN-GAP
  const gt = /a>b/;
//           ^^^^^ constant.string.regex KNOWN-GAP
