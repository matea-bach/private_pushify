const WebSocket = require("ws");
const axios = require("axios").default;
const fs = require("fs");

require("dotenv").config();

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

let socket = new WebSocket(`wss://push.4redbuttons.dev/stream`, {
  headers: { "X-Gotify-Key": CLIENT_TOKEN },
});

socket.onopen = (event) => {
  console.log("Websocket connection opened:", event.data);
};

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log("Message received:", message);
  if (message.appid.toString() === APPID_INTAKE) {
    const msgBody = message.message;
    if (!isValidURL(msgBody)) {
      sendMsg(msgBody, DLQ_TOKEN);
      deleteMsg(message.id, CLIENT_TOKEN);
      return;
    }
    if (!alreadyInFile(msgBody)) {
      fs.appendFileSync(FILE, msgBody + "\n", { flag: "a+" });
    }
    sendMsg(msgBody, OUTPUT_TOKEN);
    deleteMsg(message.id, CLIENT_TOKEN);
  }
};

socket.onerror = (event) => {
  console.log("Websocket error:", event);
};

//checking for duplicates
const alreadyInFile = function (msgBody) {
  const data = fs.readFileSync(FILE, { encoding: "utf8" });
  const eachLine = data.split(/\n/);
  for (const line of eachLine.entries()) {
    if (line[1] === msgBody) {
      console.log(`Skipping message: ${msgBody}`);
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
    .post(
      `https://${URL}/message`,
      { message },
      { headers: { "X-Gotify-Key": token } }
    )
    .then(console.log("sendMsg", message))
    .catch((err) => console.log("Error sending message:", err));
};

const deleteMsg = function (msgId, token) {
  axios
    .delete(`https://${URL}/message/${msgId}`, {
      headers: { "X-Gotify-Key": token },
    })
    .then(console.log("Deleting message with id:", msgId))
    .catch((err) => {
      console.log("Error deleting message:", err);
    });
};
