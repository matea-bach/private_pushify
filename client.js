const WebSocketClient = require("ws");
require("dotenv").config();
const axios = require("axios").default;
const fs = require("fs");

// const path = "./process.env.FILE";
// console.log(path);

//Sending HTTP requests with Axios is as simple as giving an object to the axios() function that contains all of the configuration options and data
// axios({
//   method: "get",
//   url: url,
//   headers: {
//     "Content-Type": "application/json",
//     "X-Gotify-Key": process.env.TOKEN,
//     Connection: "Upgrade",
//     Upgrade: "websocket",
//   },
// })
//   .then((response) => {
//     const listOfMessages = response.data.messages;
//     listOfMessages.map((msg) => {
//       const eachMsg = msg.message + "\n";
//       fs.appendFileSync("messages.txt", eachMsg, { flag: "a+" });
//       console.log(eachMsg);
//     });
//   })
//   .catch((err) => console.log(err.reponse ? err.response.data : err));

const { APPID_INTAKE, APPID_OUTPUT, APPID_DLQ, URL } = process.env;

// const isDuplicate = function () {
//   const data = fs.readFileSync("./messages.txt", {
//     encoding: "utf8",
//     flag: "r",
//   });
//   console.log("Inside isDuplicate function", data);
// };

async function main() {
  while (true) {
    const hadErr = false;
    await axios
      .get(`${URL}/application/${APPID_INTAKE}/message`, {
        timeout: process.env.TIMEOUT,
        headers: {
          "Content-Type": "application/json",
          "X-Gotify-Key": process.env.TOKEN,
          Connection: "Upgrade",
          Upgrade: "websocket",
        },
      })
      .then((response) => {
        const listOfMessages = response.data.messages;
        listOfMessages.forEach((msg) => {
          const eachMsg = msg.message + "\n";
          fs.appendFileSync("messages.txt", eachMsg, { flag: "a+" });
          // console.log(eachMsg);
        });
      })
      .catch((err) => {
        console.log(err.response ? err.response.data : err);
        hadErr = true;
      });
  }
}
main();

//set intervals, now it waits and then logs messages like crazy instead having a wait time in between every message
//to do function already exist file / is duplicate... read file
//if it isnt a duplicate save in output

//I NEED A FUNCTION THAT IS GOING TO READFILE AND CHECK FOR DUPLICATES
//when I log an empty file .txt, I get the string from function
//ok,lets fill up the file now
//typeof data is a string

const alreadyInFile = function (msgBody) {
  const data = fs.readFileSync("./messages.txt", { encoding: "utf8" });
  const eachLine = data.split(/\n/);
  for (const line of eachLine.entries()) {
    console.log(line);
  }
};
alreadyInFile();

// for (let i = 0; i < eachLine.length; i++) {
//   if (eachLine[i]) console.log(eachLine[i]);
// }
//Another (simpler) method would be to read the entire file into a buffer, convert it to a string, split the string on your line-terminator to produce an array of lines, and then iterate over the array, as in:
// const buf = fs.readFileSync("./messages.txt");
// buf
//   .toString()
//   .split(/\n/)
//   .forEach(function (line) {
//     console.log("BUF", line);
//   });

// listOfMessages.forEach((msg) => {
//   fs.readFileSync("./messages.txt", { encoding: "utf8" });
//   for (const i in listOfMessages) {
//     if (listOfMessages[i].message === msg.message);
//     const eachMsg = msg.message + "\n";
//     fs.appendFileSync("messages.txt", eachMsg, { flag: "a+" });
//     console.log(">>>", listOfMessages[i].message);
//   }
// });
