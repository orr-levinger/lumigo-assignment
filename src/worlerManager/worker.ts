const fs = require("fs");
const path = require("path");
const lockFile = require("lockfile");
import { Task } from "../types/Task";
import { TaskResponse } from "../types/TaskResponse";

const filePath = path.resolve(__dirname,'../', "result.txt");
const lockPath = path.resolve(__dirname,'../', "result.txt.lock");

const lockOptions = {
  wait: 1000,
  stale: 5000,
  retries: 100,
  retryWait: 1000,
};

let timeout;

const workerTimeout = () => {
  return setTimeout(() => {
    console.log(`[${process.pid}] exit since it was idle for too long...`);
    process.exit();
  }, Number(process.env.WORKER_TIMEOUT));
};

const resetTimeout = () => {
  clearTimeout(timeout);
};

if (process.send) {
  process.send(`Child [${process.pid}] started...`);
}

process.on("message", async (message: Task) => {
  if (timeout) {
    resetTimeout();
  }
  setTimeout(() => {
    try {

      // Just to simulate an ERROR
      if(message.body === "ERROR"){
        throw new Error("Worker throw an intentional error");
      }
      console.log("message from parent:", message);
      writeToFile(message.body);
      const taskResponse: TaskResponse = {
        id: message.id,
        status: "DONE",
        body: message.body,
        retries: message.retries
      };
      process.send!(taskResponse);
      timeout = workerTimeout();
    } catch (e) {
      const taskResponse: TaskResponse = {
        id: message.id,
        status: "ERROR",
        error: e.message  || `Unknown error from worker [${process.pid}]`,
        body: message.body,
        retries: message.retries
      };
      process.send!(taskResponse);
    }
  }, Number(process.env.TASK_SIMULATED_DURATION));
});

const writeToFile = (message: string) => {
  lockFile.lock(lockPath, lockOptions, (error) => {
    if (error) {
      console.error(error);
      throw error;
    }

    console.log("writing message to file", message);

    fs.appendFileSync(
      filePath,
      `${message}\n`,
      "utf8"
    );

    lockFile.unlock(lockPath, (error) => {
      if (error) {
        console.error(error);
        throw error;
      }
    });
  });
};
