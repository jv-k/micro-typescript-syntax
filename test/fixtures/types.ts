  Array Boolean Date Error Function Map Math Number Object BigInt Enumerator
//^^^^^ type
//                                                                ^^^^^^^^^^ type
  Promise RegExp Set String Symbol WeakMap WeakSet
//^^^^^^^ type
//                                         ^^^^^^^ type
  Awaited Omit Parameters Partial Pick Readonly Record Required ReturnType
//^^^^^^^ type
//                                                              ^^^^^^^^^^ type
  let a: any, b: never, c: unknown, d: string;
//       ^^^ type.types
//               ^^^^^ type.types
//                         ^^^^^^^ type.types
//                                     ^^^^^^ type.types
  ComponentProps CSSProperties FC JSX ReactNode SetStateAction
//^^^^^^^^^^^^^^ type
//                                              ^^^^^^^^^^^^^^ type
  AppProps GetServerSideProps Metadata NextPage NextResponse
//^^^^^^^^ type
//                                              ^^^^^^^^^^^^ type
  const [s, setS] = useState(0); useRouter(); user(); reuseIt();
//                  ^^^^^^^^ identifier.function.hook
//                               ^^^^^^^^^ identifier.function.hook
//                                            ^^^^ default
//                                                    ^^^^^^^ default
  ArrayBuffer; MyPromise; class Foo {}
//^^^^^^^^^^^ default
//             ^^^^^^^^^ default
