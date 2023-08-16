import crypto from "crypto";
export function getRandomIndex(length: number) {
  let array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % length;
}
