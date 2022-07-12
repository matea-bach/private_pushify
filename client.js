const WebSocketClient = require("ws");
require("dotenv").config();
const axios = require("axios").default;
const fs = require("fs");

//Sending HTTP requests with Axios is as simple as giving an object to the axios() function that contains all of the configuration options and data
//TODO:set intervals, now it waits and then logs messages like crazy instead having a wait time in between every message

const {
  APPID_INTAKE,
  URL,
  TIMEOUT,
  FILE,
  CLIENT_TOKEN,
  OUTPUT_TOKEN,
  DLQ_TOKEN,
  INTAKE_TOKEN,
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
        const msgBody = msg.message;
        if (!isValidURL(msgBody)) {
          sendMsg(msgBody, DLQ_TOKEN);
          deleteMsg(msg.id, CLIENT_TOKEN);
          continue;
        }
        if (!alreadyInFile(msgBody)) {
          fs.appendFileSync(FILE, msgBody + "\n", { flag: "a+" });
        }
        sendMsg(msgBody, OUTPUT_TOKEN);
        deleteMsg(msg.id, CLIENT_TOKEN);
      }
    })
    .catch((err) => {
      console.log("Response error", err);
    });
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
    .catch((err) => console.log("fn sendMsg", err.response));
};

const deleteMsg = function (msgId, token) {
  axios
    .delete(`${URL}/message/${msgId}`, {
      headers: { "X-Gotify-Key": token },
    })
    .then(console.log("Deleting message with id:", msgId))
    .catch((err) => {
      console.log("deleteMsg error", err.response.status);
    });
};
