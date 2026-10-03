  const e = <div className="x">hi {y}</div>;
//          ^ symbol.operator
//           ^^^ statement.tag
//               ^^^^^^^^^ identifier.attribute
//                        ^ symbol.operator
//                                   ^^ symbol.operator
//                                     ^^^ statement.tag
//                                ^ symbol.braces
  const c = <Card title="Home" onClick={go} />;
//           ^^^^ type.tag
//                             ^^^^^^^ identifier.attribute
//                                     ^ symbol.braces
  const l = <a.b x={1}></a.b>; const m = <Foo.Bar />;
//           ^^^ statement.tag
//                                        ^^^^^^^ type.tag
  const g: Array<T> = useState<T>(); a < b;
//         ^^^^^^^^ !statement.tag
//                            ^^^ !type.tag
  const b = <button type="button" as={Link}>x</button>;
//                  ^^^^ identifier.attribute
//                                ^^ identifier.attribute
  // Boolean attributes on the tag's line, before `>` or an attribute with a value.
  const d = <Close asChild>{b}</Close>; const i = <input disabled value={v} />;
//                 ^^^^^^^ identifier.attribute
//                        ^ symbol.operator
//                                                       ^^^^^^^^ identifier.attribute
//                                                                ^^^^^ identifier.attribute
//                                                                       ^ default
//                                                                          ^^ symbol.operator
  const r = <T extends Foo>(x: T) => x; const o = <Dialog open modal>x</Dialog>;
//             ^^^^^^^ statement
//                     ^^^ type
//                                                        ^^^^ identifier.attribute
//                                                             ^^^^^ identifier.attribute
  const f = <>for in</>;
//            ^^^ default KNOWN-GAP
  const t = <p>text<b>x</b></p>;
//                  ^ statement.tag KNOWN-GAP
  const q = <a href="x" download>y</a>; const h = <html
//                      ^^^^^^^^ identifier.attribute KNOWN-GAP
    suppressHydrationWarning
//  ^^^^^^^^^^^^^^^^^^^^^^^^ identifier.attribute KNOWN-GAP
  />;
