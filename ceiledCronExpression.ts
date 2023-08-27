import parser from "cron-parser";

// command line arg: cron syntax: "45 3,9,15 * * *"
// parse cron syntax and return array of ceiled utc hours
function main() {
  const cronExpression = process.argv[2];
  console.log(ceiledCron(cronExpression));
}

function ceiledCron(cronExpression: string): string {
  const interval = parser.parseExpression(cronExpression, {
    utc: true,
  });
  let fields = JSON.parse(JSON.stringify(interval.fields));
  fields.minute = [0];
  fields.hour = fields.hour.map((h) => h + 1);
  return parser.fieldsToExpression(fields).stringify();
}

main();
