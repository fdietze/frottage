import * as crypto from "crypto";
export function getRandomIndex(length: number) {
  return randomInt(0, length - 1);
}

export function randomInt(min: number, max: number) {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return Math.floor(array[0] / (0xffffffff + 1) * (max - min + 1) + min);
}
