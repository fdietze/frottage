import { Eta } from "eta";
// list of options: https://eta.js.org/docs/api/configuration
const eta = new Eta({ useWith: true });

export function render(
  fileName: string,
  template: string,
  otherPrompts: Array<
    { fileName: string; renderedPrompt?: string; imageUrl?: string }
  >,
): string {
  // function throws, if dependencies are not yet available or template is invalid

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

  console.log(`rendering fileName '${fileName}': '${template}'`);
  const rendered = eta.renderString(template, {
    promptFrom: (
      fileName: string,
      transform: (original: string) => string = (x) => x,
    ) => {
      // , transform?: (string) => string
      // let transform = (x) => x;
      // this might crash and signal to the caller that the prompt dependencies does not exist (yet)
      console.log(
        `  looking for renderedPrompt from '${fileName}'...`,
      );
      const found: string | undefined = (otherPrompts.find((prompt) =>
        prompt.fileName == fileName && prompt.renderedPrompt != undefined
      ))?.renderedPrompt;
      if (!found) {
        throw new Error(`could not find renderedPrompt from '${fileName}'`);
      }
      return transform(found);
    },
    imageFrom: (
      fileName: string,
    ) => {
      // , transform?: (string) => string
      // let transform = (x) => x;
      // this might crash and signal to the caller that the prompt dependencies does not exist (yet)
      console.log(
        `  looking for imageUrl from '${fileName}'...`,
      );
      const found: string | undefined = (otherPrompts.find((prompt) =>
        prompt.fileName == fileName && prompt.imageUrl != undefined
      ))?.imageUrl;
      if (!found) {
        throw new Error(`could not find imageUrl from '${fileName}'`);
      }
      return found;
    },
    random: randomElement,
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
    colors: [
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
    ],
    animals: [
      "eagle",
      "dog",
      "cat",
      "elephant",
      "butterfly",
      "snail",
      "penguin",
      "panda",
      "tiger",
      "lion",
      "bear",
      "fox",
      "wolf",
      "whale",
      "shark",
      "dolphin",
      "fish",
      "horse",
      "cow",
      "octopus",
      "spider",
      "scorpion",
      "snake",
      "lizard",
      "frog",
    ],
    artStyles: [
      "Abstract",
      "Art Nouveau",
      "Baroque",
      "Bauhaus",
      "Byzantine",
      "Cubism",
      "Dada",
      "Expressionism",
      "Fauvism",
      "Futurism",
      "Gothic",
      "Graffiti",
      "Impressionism",
      "Japonism",
      "Kinetic Art",
      "Minimalism",
      "Modernism",
      "Naive Art (Primitivism)",
      "Neoclassicism",
      "Neo-Expressionism",
      "Op Art",
      "Pop Art",
      "Post-Impressionism",
      "Realism",
      "Renaissance",
      "Rococo",
      "Romanticism",
      "Surrealism",
      "Symbolism",
      "Tonalism",
      "Ukiyo-e",
      "Art Deco",
      "Conceptual Art",
      "Constructivism",
      "Art Brut (Raw Art)",
      "Pointillism",
      "Social Realism",
      "Suprematism",
      "Tachisme",
      "Photorealism",
      "Pre-Raphaelite",
      "Street Art",
      "Superflat",
      "Trompe-l'œil",
      "Young British Artists (YBAs)",
      "Arte Povera",
      "Digital Art",
      "Land Art",
      "Video Art",
      "Stuckism",
      "Romanesque",
      "Greek",
      "Roman",
      "Medieval",
      "Asian",
      "Islamic",
      "African",
      "Aboriginal",
      "Native American",
      "Oceanic",
    ],
    fruits: [
      "apple",
      "banana",
      "cherry",
      "date",
      "grape",
      "kiwi",
      "lemon",
      "mango",
      "orange",
      "peach",
      "pear",
      "plum",
      "pineapple",
      "raspberry",
      "strawberry",
      "watermelon",
      "blueberry",
      "blackberry",
      "grapefruit",
      "tangerine",
      "papaya",
      "melon",
      "apricot",
      "coconut",
      "lime",
    ],
    vegetables: [
      "carrot",
      "broccoli",
      "cauliflower",
      "pea",
      "green bean",
      "lettuce",
      "tomato",
      "potato",
      "onion",
      "bell pepper",
      "cabbage",
      "spinach",
      "kale",
      "zucchini",
      "cucumber",
      "corn",
      "asparagus",
      "celery",
      "eggplant",
      "garlic",
      "mushroom",
      "radish",
      "turnip",
      "beet",
      "brussels sprout",
    ],
    songTitles90s: [
      "Smells Like Teen Spirit",
      "Enter Sandman",
      "Wannabe",
      "No Rain",
      "Under the Bridge",
      "Don't Speak",
      "Black Hole Sun",
      "Killing Me Softly",
      "I Will Always Love You",
      "Losing My Religion",
      "Creep",
      "Unfinished Sympathy",
      "Bitter Sweet Symphony",
      "November Rain",
      "MMMBop",
      "Torn",
      "Black",
      "My Own Worst Enemy",
      "Baby One More Time",
      "I Want it That Way",
      "Waterfalls",
      "Don't Let Go (Love)",
      "California Love",
      "Ice Ice Baby",
      "Can't Touch This",
      "Gangsta's Paradise",
      "Wonderwall",
      "Song 2",
      "Vogue",
      "Jump Around",
      "Barbie Girl",
      "Tubthumping",
      "Macarena",
      "Smooth",
      "I'll Be Missing You",
      "All That She Wants",
      "Genie in a Bottle",
      "Summertime",
      "Karma Police",
      "...Baby One More Time",
      "The Sign",
      "Gotta Be",
      "My Own Worst Enemy",
      "Save Tonight",
      "Unbelievable",
      "I'll Make Love To You",
      "Whatta Man",
      "Mo Money Mo Problems",
      "It's All Coming Back to Me Now",
      "U Can't Touch This",
    ],
  });
  console.log(`  rendered: '${rendered}'`);
  return rendered;
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
