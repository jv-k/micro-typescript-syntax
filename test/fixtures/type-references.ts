  // Type names after extends and implements get the type colour.
  class A extends B implements C, D {}
//        ^^^^^^^ statement
//                ^ type
//                  ^^^^^^^^^^ statement
//                             ^ type
//                              ^ symbol.punctuation
//                                ^ type
  interface Opts extends util.Base<T>, Other {}
//                            ^^^^ type
//                                     ^^^^^ type
  type F<T> = T extends Box ? T : never;
//                      ^^^ type
//                          ^ symbol.operator

  // Annotation types get the type colour; the names before them stay plain.
  const kind: CommentKind = x; let pending!: Token;
//      ^^^^ identifier.const
//            ^^^^^^^^^^^ type
//                                 ^^^^^^^ default
//                                        ^ symbol.operator
//                                           ^^^^^ type
  function scan(text: string, flags: TokenFlags): SyntaxKind | undefined {}
//              ^^^^ default
//                            ^^^^^ default
//                                   ^^^^^^^^^^ type
//                                                ^^^^^^^^^^ type
//                                                           ^ symbol.operator
//                                                             ^^^^^^^^^ constant
  interface S { def: CheckDef; error?: errors.ErrorMap<never>; }
//              ^^^ default
//                   ^^^^^^^^ type
//                             ^^^^^ default
//                                            ^^^^^^^^ type
//                                                     ^^^^^ type.types
  getToken(): SyntaxKind; check(p: util.Payload<T>): Map<K, V[]>;
//            ^^^^^^^^^^ type
//                              ^ default
//                                      ^^^^^^^ type
//                                              ^ type
//                                                       ^ type
//                                                        ^ symbol.punctuation
//                                                          ^ type
  function Item({ a, b }: ItemProps & Extra) {}
//                ^ default
//                        ^^^^^^^^^ type
//                                  ^ symbol.operator
//                                    ^^^^^ type
  const m: Record<string, Kind> = {}; v = x satisfies Cfg;
//                        ^^^^ type
//                                          ^^^^^^^^^ statement
//                                                    ^^^ type
  f(x: VariantProps<typeof variants>); xs.map((x: Item) => x);
//     ^^^^^^^^^^^^ type
//                  ^^^^^^ statement
//                         ^^^^^^^^ default
//                                                ^^^^ type
  // Values after a colon stay plain: object literals, ternaries, labels.
  return ok ? a : Kind; x = { a: b, c: Kind.A, d: e };
//                ^^^^ default
//                               ^ default
//                                     ^^^^ default
//                                          ^ default
//                                                ^ default
  switch (k) { case Kind.A: foo(); }
//                          ^^^ default
    abstract: SyntaxKind.AbstractKeyword,
//            ^^^^^^^^^^ default
//                       ^^^^^^^^^^^^^^^ default

  // The right-hand side of a type alias.
  export type Kind = SyntaxKind.EndOfFile | Ns.A<T> | keyof typeof obj;
//                              ^^^^^^^^^ type
//                                        ^ symbol.operator
//                                             ^ type
//                                                    ^^^^^ statement
//                                                          ^^^^^^ statement
//                                                                 ^^^ default
  type U = | Left | Right;
//           ^^^^ type
//                  ^^^^^ type

  // Type arguments of a call, with `|` or `&` between spaces.
  const Ctx = React.createContext<Props | null>(null); f<A & B>(x);
//                                ^^^^^ type
//                                      ^ symbol.operator
//                                        ^^^^ constant
//                                                       ^ type
//                                                           ^ type
  ok = a<b || c>(d); ok = a<b|c>(d);
//       ^ default
//            ^ default
//                          ^ default
  f(
    token: Kind,
//         ^^^^ type KNOWN-GAP
  );
  const fn = (a: Arg): Ret => a;
//               ^^^ type KNOWN-GAP
