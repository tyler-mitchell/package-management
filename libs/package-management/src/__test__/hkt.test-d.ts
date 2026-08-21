import type * as h from "free-types";
import type * as hk from "free-types/experimental";

interface A {
  a: 1;
}
interface B {
  a: 1;
  b: 2;
}
interface C {
  a: 1;
  b: 2;
  c: 3;
}
interface D {
  a: 1;
  b: 2;
  c: 3;
  d: 4;
}

type $A = hk.From<A>;
type $B = hk.From<B, ["a", "b"]>;
type $C = hk.From<C, ["a", "b", "c"]>;
type $D = hk.From<D, ["a", "b", "c", "d"]>;
