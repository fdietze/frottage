import parser from "cron-parser";

// command line arg: cron syntax: "45 3,9,15 * * *"
// parse cron syntax and return array of ceiled utc hours
function main() {
  const cronExpression = process.argv[2];
  const hoursUTC = listOfCronHours(cronExpression);
  const ceiledHoursUTC = hoursUTC.map((hour) => (hour + 1) % 24);
  console.log(JSON.stringify(ceiledHoursUTC));
}

function listOfCronHours(cronExpression: string): number[] {
  // cron expression is in UTC
  const interval = parser.parseExpression(cronExpression, {
    iterator: true,
    utc: true,
  });
  // iterate until encountering a duplicate number
  const hours: Set<number> = new Set();
  while (true) {
    const { value, done } = interval.next();
    // console.log(value.toDate());
    if (done) {
      break;
    }
    const hour = value.toDate().getUTCHours();
    if (hours.has(hour)) {
      break;
    }
    hours.add(hour);
  }

  const sortedHours = Array.from(hours).sort((a, b) => a - b);
  return sortedHours;
}

main();
