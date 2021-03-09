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
  }, 10000);
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
      console.log("message from parent:", message);
      writeToFile(message.body);
      const taskResponse: TaskResponse = {
        id: message.id,
        status: "DONE",
        body: message.body,
      };
      process.send!(taskResponse);
      timeout = workerTimeout();
    } catch (e) {
      const taskResponse: TaskResponse = {
        id: message.id,
        status: "ERROR",
        error: e,
        body: message.body,
      };
      process.send!(taskResponse);
    }
  }, 3000);
});

const writeToFile = (message: string) => {
  lockFile.lock(lockPath, lockOptions, (error) => {
    if (error) {
      console.error(error);
      throw error;
    }

    // Open existing JSON file
    const oldTest = fs.readFileSync(filePath, "utf8");
    // Merge object array with new data
    const newText = oldTest.concat(message);

    console.log("newText", newText);

    // Save new data to the existing JSON file
    fs.writeFileSync(
      filePath,
      `worker[${process.pid}] : ${newText}\r\n`,
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
