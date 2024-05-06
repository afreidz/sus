import fs from "node:fs";
import { PrismaClient } from "@prisma/client";

const orm = new PrismaClient();

function importAndParseJSON(filename) {
  try {
    // Read the contents of the JSON file
    const jsonData = fs.readFileSync(filename, "utf8");

    // Parse the JSON data into an object
    const jsonObject = JSON.parse(jsonData);

    return jsonObject;
  } catch (error) {
    console.error(
      "Error occurred while importing and parsing the JSON file:",
      error
    );
    return null;
  }
}

const transcript = importAndParseJSON("./convos/alex-johnson-convo.json");

await orm.transcriptionSegment.createMany({
  data: transcript,
});
