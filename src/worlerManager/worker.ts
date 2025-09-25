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
  retries: 3,
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

      // Simulate random failures based on TASK_SIMULATED_ERROR_PERCENTAGE environment variable
      const errorPercentage = parseFloat(process.env.TASK_SIMULATED_ERROR_PERCENTAGE || "0") / 100;
      if (errorPercentage > 0 && Math.random() < errorPercentage) {
        throw new Error(`Worker [${process.pid}] simulated failure (ERROR_PERCENTAGE: ${errorPercentage * 100}%)`);
      }
      console.log("message from parent:", message);
      writeToFile(message.id, message.body);
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

const writeToFile = (taskId: string, message: string) => {
  lockFile.lock(lockPath, lockOptions, (error) => {
    if (error) {
      console.error(error);
      throw error;
    }

    const timestamp = new Date().toISOString();
    const workerId = process.pid;
    const logEntry = `${timestamp} | Worker: ${workerId} | Task: ${taskId} | Message: ${message}`;
    
    console.log("writing log entry to file", logEntry);

    fs.appendFileSync(
      filePath,
      `${logEntry}\n`,
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
