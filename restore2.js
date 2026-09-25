const fs = require('fs');
const readline = require('readline');

async function extract() {
  const fileStream = fs.createReadStream('C:/Users/Giovani/.gemini/antigravity/brain/5bf0d215-2460-45a1-a24b-390216ecf99f/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream });

  for await (const line of rl) {
    const obj = JSON.parse(line);
    if (obj.tool_responses) {
        for (let resp of obj.tool_responses) {
            if (resp.response && resp.response.output && resp.response.output.includes('executeTransaction = async function')) {
                fs.writeFileSync('app_restored.js', resp.response.output);
                console.log('Found it!');
                return;
            }
        }
    }
  }
}
extract();
