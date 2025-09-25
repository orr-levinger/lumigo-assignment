import { Task } from "../types/Task";
import { TaskResponse } from "../types/TaskResponse";
import { ChildProcess } from "child_process";
import * as os from "os";

const fork = require("child_process").fork;
const path = require("path");

const workerProcess = path.resolve(__dirname, "worker.js");

// Get maximum number of CPUs
const MAX_WORKERS = os.cpus().length;

let invocations = 0;
let failures = 0;
let successes = 0;
let totalRetries = 0;
let totalProcessingTime = 0;
let completedTasks = 0;

// Task queue for when all workers are busy
const taskQueue: Task[] = [];

let workers: {
  busy: Record<string, ChildProcess>;
  available: Record<string, ChildProcess>;
} = {
  busy: {},
  available: {},
};

export const getStatistics = () => {
  let busyArray = Object.values(workers.busy);
  let availableArray = Object.values(workers.available);
  return {
    tasksProcessed: successes + failures,
    taskRetries: totalRetries,
    tasksSucceeded: successes,
    tasksFailed: failures,
    averageProcessingTime: completedTasks > 0 ? totalProcessingTime / completedTasks : 0,
    currentQueueLength: taskQueue.length,
    idleWorkersCount: availableArray.length,
    hotWorkersCount: busyArray.length
  };
};

const processNextTask = () => {
  if (taskQueue.length > 0) {
    const nextTask = taskQueue.shift()!;
    console.log(`Processing queued task [${nextTask.id}], ${taskQueue.length} tasks remaining in queue`);
    executeTask(nextTask);
  }
};

const executeTask = (task: Task) => {
  let child;
  const options = {
    detached: true,
    silent: false,
  };
  const startTime = Date.now();
  
  let availableWorkers = Object.values(workers.available);

  if (availableWorkers.length > 0) {
    console.log(`has [${availableWorkers.length}] available workers`);
    child = availableWorkers.pop();
    delete workers.available[child!.pid];
    console.log(`using available worker: [${child!.pid}] for the task`);
    workers.busy[child!.pid] = child!;
  } else {
    console.log(`no available workers, creating new worker`);
    child = fork(workerProcess, [], options);
    workers.busy[child.pid] = child;
  }

  child!.on("message", (message: TaskResponse) => {
    const { status, id, body, error, retries } = message;
    switch (status) {
      case "DONE":
        const processingTime = Date.now() - startTime;
        totalProcessingTime += processingTime;
        completedTasks++;
        successes++;
        console.log(
          `Worker[${child!.pid}] finished Task[${id}] in ${processingTime}ms, adding it to available pool`
        );
        delete workers.busy[child!.pid];
        workers.available[child!.pid] = child!;
        // Process next queued task
        processNextTask();
        break;
      case "ERROR":
        delete workers.busy[child!.pid];
        workers.available[child!.pid] = child!;
        console.error(`Worker [${child!.pid}] failed with error`, error);
        if (retries > 0) {
          totalRetries++;
          console.log(
            `Retrying [${retries}] more times in [${process.env.TASK_ERROR_RETRY_DELAY}] milliseconds`
          );
          setTimeout(() => {
            assignTask({
              body,
              id,
              retries: retries - 1,
            });
          }, Number(process.env.TASK_ERROR_RETRY_DELAY));
        } else {
          failures++;
          console.warn(`Task failed after all retry attempts...`);
        }
        // Process next queued task
        processNextTask();
        break;
      default:
        console.log(message);
    }
  });

  child!.on("exit", (exitCode) => {
    console.log("exit from child:", exitCode);
    delete workers.available[child!.pid];
    delete workers.busy[child!.pid];
    // Process next queued task when worker exits
    processNextTask();
  });

  child!.send(task);
};

export const assignTask = (task: Task) => {
  invocations++;
  const totalWorkers = Object.keys(workers.busy).length + Object.keys(workers.available).length;
  
  // If we have available workers, use them immediately
  if (Object.keys(workers.available).length > 0) {
    console.log(`Assigning task [${task.id}] to available worker`);
    executeTask(task);
  }
  // If we haven't reached the CPU limit, create a new worker
  else if (totalWorkers < MAX_WORKERS) {
    console.log(`Creating new worker for task [${task.id}] (${totalWorkers + 1}/${MAX_WORKERS} workers)`);
    executeTask(task);
  }
  // All workers are busy and we're at the limit, queue the task
  else {
    console.log(`All ${MAX_WORKERS} workers busy, queuing task [${task.id}]. Queue size: ${taskQueue.length + 1}`);
    taskQueue.push(task);
  }
};
