const fs = require("fs");
import express from "express";
import bodyParser from "body-parser";
import { Task } from "./types/Task";
import { ChildProcess } from "child_process";
import {Message} from "./types/Message";
import {TaskResponse} from "./types/TaskResponse";
const fork = require("child_process").fork;
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const filePath = path.resolve(__dirname, "result.txt");
const lockPath = path.resolve(__dirname, "result.txt.lock");

const workerProcess = path.resolve("worker.js");
const port = 3000;

let workers: {
  busy: Record<string,ChildProcess>;
  available: Record<string,ChildProcess>;
} = {
  busy: {},
  available: {},
};



const filePathExists = fs.existsSync(filePath);
const lockPathExists = fs.existsSync(lockPath);
if(!filePathExists){
  fs.openSync(filePath, 'w')
}
if(!lockPathExists){
  fs.openSync(lockPath, 'w')
}
const app = express();
app.use(bodyParser.json());

app.get("/statistics", (req, res) => {
  res.send("statistics was called");
});

app.post("/messages", (req, res) => {

  const {body: {message}} = req;

  console.log(`Server received new message [${message}]`);

  let child;
  const options = {
    // detached: true,
    // silent: false,
  };

  const task: Task = {
    id: uuidv4(),
    body: message
  };

  console.log(`created new task`, task);

  let availableWorkers = Object.values(workers.available);
  if (availableWorkers.length > 0) {
    console.log(`has [${availableWorkers.length}] worm workers`);
    child = availableWorkers.pop();
    console.log(`using worm worker: [${child.pid}] for the task`);
    delete workers.available[child.pid];
    workers.busy[child.pid] = child;
  } else {
    console.log(`no worm for the task, spinning new worker`);
    child = fork(workerProcess, [], options);
  }

  workers.busy[child.pid] = child;
  child.send(task);


  child.on("message", (message: TaskResponse) => {
    console.log(message);
    const { status, id } = message;
    if (status === "DONE") {
      console.log(`Worker[${child.pid}] finished Task[${id}] adding it to available pool`);
      delete workers.available[child.pid];
      workers.available[child.pid] = child;
    }
  });
  child.on("exit", (exitCode) => {
    console.log("exit from child:", exitCode);
    delete workers.available[child.pid];
    delete workers.busy[child.pid];
  });

  res.send("messages was called");
});
app.listen(port, (err) => {
  if (err) {
    return console.error(err);
  }
  console.log(`server is listening on ${port}`);
});

