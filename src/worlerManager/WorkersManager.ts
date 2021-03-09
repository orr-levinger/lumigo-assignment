import { Task } from "../types/Task";
import { TaskResponse } from "../types/TaskResponse";
import { ChildProcess } from "child_process";

const fork = require("child_process").fork;
const path = require("path");

const workerProcess = path.resolve(__dirname, "worker.js");

let invocations = 0;
let failures = 0;

let workers: {
  busy: Record<string, ChildProcess>;
  available: Record<string, ChildProcess>;
} = {
  busy: {},
  available: {},
};

export const getStatistics = () => {
  let busyArray = Object.values(workers.busy);
  let wormArray = Object.values(workers.available);
  return {
    active_instances: busyArray.length + wormArray.length,
    total_invocation: invocations,
    busy: busyArray.length,
    worm: wormArray.length,
    failures,
  };
};

export const assignTask = (task: Task) => {
  let child;
  const options = {
    detached: true,
    silent: false,
  };
  invocations++;
  let availableWorkers = Object.values(workers.available);

  if (availableWorkers.length > 0) {
    console.log(`has [${availableWorkers.length}] worm workers`);
    child = availableWorkers.pop();
    delete workers.available[child.pid];
    console.log(`using worm worker: [${child.pid}] for the task`);
    workers.busy[child.pid] = child;
  } else {
    console.log(`no worm for the task, spinning new worker`);
    child = fork(workerProcess, [], options);
    child.on("message", (message: TaskResponse) => {
      const { status, id, body, error, retries } = message;
      switch (status) {
        case "DONE":
          console.log(
            `Worker[${child.pid}] finished Task[${id}] adding it to available pool`
          );
          delete workers.busy[child.pid];
          workers.available[child.pid] = child;
          break;
        case "ERROR":
          delete workers.busy[child.pid];
          workers.available[child.pid] = child;
          console.error(`Worker [${child.pid}] failed with error`, error);
          if (retries > 0) {
            console.log(
              `Retrying [${retries}] more times in [${process.env.RETRY_DELAY}] milliseconds`
            );
            setTimeout(() => {
              assignTask({
                body,
                id,
                retries: retries - 1,
              });
            }, Number(process.env.RETRY_DELAY));
          } else {
            failures++;
            console.warn(`Task failed after [${retries}] attempts... `);
          }
          break;
        default:
          console.log(message);
      }
    });
  }

  workers.busy[child.pid] = child;
  child.send(task);

  child.on("exit", (exitCode) => {
    console.log("exit from child:", exitCode);
    delete workers.available[child.pid];
    delete workers.busy[child.pid];
  });
};
