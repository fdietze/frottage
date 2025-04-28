* backend muss id zurück geben
* specile day (oster):
  const today = new Date();
  const startDate = new Date('2025-04-18');
  const endDate = new Date('2025-04-22');

  if (today >= startDate && today <= endDate) {
    const prompts = [
      "easter egg vibes --chaos 10",
      "friendly but confused bunny hiding in a bush and peeking out, pastel colors --chaos 10",
      "funny chickens searching for the hidden and painted Easter eggs, comic style --chaos 10",
      "midjourney in a crazy easter egg adventure",
      "high dimensional easter egg --chaos 20",
      "Small cute bunny carrying a giant easter egg, pixar scene, cinematic --chaos 20",
    ];
    mjPrompt = prompts[getRandomIndex(prompts.length)];
  }
