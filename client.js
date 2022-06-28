const WebSocketClient = require("ws");
require("dotenv").config();
const axios = require("axios").default;
const fs = require("fs");

//Sending HTTP requests with Axios is as simple as giving an object to the axios() function that contains all of the configuration options and data
//TODO:set intervals, now it waits and then logs messages like crazy instead having a wait time in between every message

const { APPID_INTAKE, APPID_OUTPUT, APPID_DLQ, URL, TIMEOUT, TOKEN, FILE } =
  process.env;

async function main() {
  await axios
    .get(`${URL}/application/${APPID_INTAKE}/message`, {
      timeout: TIMEOUT,
      headers: {
        "Content-Type": "application/json",
        "X-Gotify-Key": TOKEN,
        Connection: "Upgrade",
        Upgrade: "websocket",
      },
    })
    .then((response) => {
      const messages = response.data.messages;
      messages.forEach((msg) => {
        const eachMsg = msg.message;
        alreadyInFile(eachMsg);
        fs.appendFileSync(FILE, eachMsg + "\n", { flag: "a+" });
      });
    })
    .catch((err) => {
      console.log(err.response ? err.response.data : err);
    });
}
main();

const alreadyInFile = function (msgBody) {
  const data = fs.readFileSync(FILE, { encoding: "utf8" });
  const eachLine = data.split(/\n/);
  for (const line of eachLine.entries()) {
    if (line[1] === msgBody) {
      return true;
    }
  }
  return false;
};
alreadyInFile();

//Another (simpler) method would be to read the entire file into a buffer, convert it to a string, split the string on your line-terminator to produce an array of lines, and then iterate over the array, as in:
// const buf = fs.readFileSync("./messages.txt");
// buf
//   .toString()
//   .split(/\n/)
//   .forEach(function (line) {
//     console.log("BUF", line);
//   });
