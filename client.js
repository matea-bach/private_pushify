const WebSocketClient = require("ws");
require("dotenv").config();
const axios = require("axios").default;
const fs = require("fs");

//Sending HTTP requests with Axios is as simple as giving an object to the axios() function that contains all of the configuration options and data
//TODO:set intervals, now it waits and then logs messages like crazy instead having a wait time in between every message

const {
  APPID_INTAKE,
  APPID_OUTPUT,
  APPID_DLQ,
  URL,
  TIMEOUT,
  FILE,
  CLIENT_TOKEN,
  OUTPUT_TOKEN,
  DLQ_TOKEN,
} = process.env;

async function main() {
  await axios
    .get(`${URL}/application/${APPID_INTAKE}/message`, {
      timeout: TIMEOUT,
      headers: {
        "Content-Type": "application/json",
        "X-Gotify-Key": CLIENT_TOKEN,
        Connection: "Upgrade",
        Upgrade: "websocket",
      },
    })
    .then((response) => {
      const { messages } = response.data;
      for (const msg of messages) {
        const eachMsg = msg.message;
        const msgId = msg.id;
        if (!isValidURL(eachMsg)) {
          sendMsg(eachMsg, DLQ_TOKEN);
          continue;
        }
        if (!alreadyInFile(eachMsg)) {
          fs.appendFileSync(FILE, eachMsg + "\n", { flag: "a+" });
        }
        sendMsg(eachMsg, OUTPUT_TOKEN);
        deleteMsg(msgId);
      }
    })
    .catch((err) => console.log(err.code));
}
main();

//checking for duplicates
const alreadyInFile = function (msgBody) {
  const data = fs.readFileSync(FILE, { encoding: "utf8" });
  const eachLine = data.split(/\n/);
  for (const line of eachLine.entries()) {
    if (line[1] === msgBody) {
      console.log(`Skipping message ${msgBody}`);
      return true;
    }
  }
  return false;
};

const isValidURL = function (url) {
  const expression = /(http|https):\/\//;
  const regex = new RegExp(expression);
  if (url.match(regex)) {
    return true;
  }
  console.log(`Isn't valid URL ${url}`);
  return false;
};

const sendMsg = (message, token) => {
  axios
    .post(`${URL}/message`, { message }, { headers: { "X-Gotify-Key": token } })
    .then(console.log("sendMsg", message))
    .catch((err) => console.log(err));
};

//GOAL:Remove processed messages from input application
// After a message is processed, it should be deleted from the input queue.

// "Processed" means any of the following:
// 1. Saved to the output file
// 2. Found to be a duplicate and skipped
// 3. Found to be invalid and sent to the DLQ

const deleteMsg = function (msgId) {
  axios
    .delete(`${URL}/messsage/:${16}`)
    .then(console.log("Delete message with id:", msgId))
    .catch((err) => {
      console.log(err);
    });
};
