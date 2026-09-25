const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:/Users/Giovani/.gemini/antigravity/brain/5bf0d215-2460-45a1-a24b-390216ecf99f/.system_generated/logs/transcript_full.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    try {
      const obj = JSON.parse(line);
      if (obj.tool_calls) {
         for (let call of obj.tool_calls) {
             if (call.name === "default_api:run_command" && call.arguments && call.arguments.CommandLine === "Get-Content app.js -Encoding UTF8") {
                 // The next step might be the response
             }
         }
      }
      if (obj.content && obj.content.includes("Get-Content app.js -Encoding UTF8") && obj.content.includes("window.executeTransaction")) {
          // This is the response
          const match = obj.content.match(/Output:\n([\s\S]+)/);
          if (match) {
             fs.writeFileSync('app_restored.js', match[1]);
             console.log("Restored!");
          }
      }
    } catch (e) {}
  }
}
processLineByLine();
