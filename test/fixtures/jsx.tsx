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
  const f = <>for in</>;
//            ^^^ default KNOWN-GAP
  const t = <p>text<b>x</b></p>;
//                  ^ statement.tag KNOWN-GAP
