import { Eta } from "eta";
// list of options: https://eta.js.org/docs/api/configuration
const eta = new Eta();

export function render(template: string): string {
  // data can be time of day, light, month, season, weather mode etc
  return eta.renderString(template, { random: randomElement });
}

// generic function to return a random element from an array
export function randomElement<T>(array: Array<T>): T {
  return array[Math.floor(Math.random() * array.length)];
}
