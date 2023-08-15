import { Eta } from "eta";
// list of options: https://eta.js.org/docs/api/configuration
const eta = new Eta({ useWith: true });

export function render(template: string): string {
  // ideas:
  // - light/dark mode
  // - weather
  // - news headline
  // - current song
  // - moon phase
  // - random art style (e.g. impressionism, cubism, surrealism, etc.)
  // - random architecture style (e.g. brutalism, etc.)
  // - random art epoche (e.g. renaissance, baroque, etc.)
  // - random midjourney look (e.g. octane render)
  // - random artist (e.g. picasso, etc.)
  // - random designer (e.g. dieter rams, etc.)
  // - random human emotion
  // - random facial expression
  // - gpt
  // - gpt generated categories, like `randomColors`
  return eta.renderString(template, {
    random: randomElement,
    color: randomElement(colorNames),
    season: season(new Date().getMonth()),
    dayOfWeek: new Date().toLocaleString("default", { weekday: "long" }),
    monthCEST: new Date().toLocaleString("default", {
      month: "long",
      timeZone: "Europe/Paris",
    }),
    dayOfWeekCEST: new Date().toLocaleString("default", {
      weekday: "long",
      timeZone: "Europe/Paris",
    }),
    dayPeriodCEST: dayPeriod(new Date().getUTCHours() + 2),
    timeOfDayCEST: new Date().getUTCHours() + 2,
  });
}

function dayPeriod(hourUTC: number): string {
  if (hourUTC >= 5 && hourUTC <= 11) {
    return "morning";
  } else if (hourUTC >= 12 && hourUTC <= 13) {
    return "noon";
  } else if (hourUTC >= 14 && hourUTC <= 17) {
    return "afternoon";
  } else if (hourUTC >= 18 && hourUTC <= 21) {
    return "evening";
  } else {
    return "night";
  }
}

// generic function to return a random element from an array
function randomElement<T>(array: Array<T>): T {
  return array[Math.floor(Math.random() * array.length)];
}

function season(month: number): string {
  if (month >= 2 && month <= 4) {
    return "spring";
  } else if (month >= 5 && month <= 7) {
    return "summer";
  } else if (month >= 8 && month <= 10) {
    return "autumn";
  } else {
    return "winter";
  }
}

var colorNames = [
  "Alizarin",
  "Amber",
  "Amethyst",
  "Apricot",
  "Aqua",
  "Aquamarine",
  "Azure",
  "Beige",
  "Bisque",
  "Black",
  "Blue",
  "Blush",
  "Bronze",
  "Brown",
  "Burgundy",
  "Byzantium",
  "Carmine",
  "Cerulean",
  "Champagne",
  "Charcoal",
  "Chartreuse",
  "Chocolate",
  "Cobalt",
  "Copper",
  "Coral",
  "Cornflower",
  "Crimson",
  "Cyan",
  "Emerald",
  "Fuchsia",
  "Gold",
  "Gray",
  "Green",
  "Harlequin",
  "Indigo",
  "Ivory",
  "Jade",
  "Lavender",
  "Lemon",
  "Lilac",
  "Lime",
  "Magenta",
  "Maroon",
  "Mauve",
  "Navy",
  "Ochre",
  "Olive",
  "Orange",
  "Orchid",
  "Peach",
  "Pearl",
  "Periwinkle",
  "Pink",
  "Plum",
  "Puce",
  "Purple",
  "Raspberry",
  "Red",
  "Rose",
  "Ruby",
  "Salmon",
  "Sapphire",
  "Scarlet",
  "Silver",
  "SkyBlue",
  "Slate",
  "Tan",
  "Taupe",
  "Teal",
  "Turquoise",
  "Ultramarine",
  "Violet",
  "Viridian",
  "White",
  "Yellow",
  "Zinc",
  "Mint",
  "Cherry",
  "Cinnabar",
  "Citrine",
  "Cream",
  "Eggplant",
  "Flame",
  "Honeydew",
  "Khaki",
  "LimeGreen",
  "Mango",
  "Melon",
  "Mustard",
  "Myrtle",
  "Nectarine",
  "OliveDrab",
  "Papaya",
  "Pistachio",
  "Rust",
  "Saffron",
  "Sangria",
  "SlateBlue",
  "SlateGray",
  "Snow",
  "SteelBlue",
  "Straw",
  "Sunset",
  "Tangerine",
  "Thistle",
  "Tomato",
  "Vanilla",
  "Wheat",
  "Wine",
  "Yam",
  "Zaffre",
];
