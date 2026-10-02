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
