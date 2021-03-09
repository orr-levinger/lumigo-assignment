import { Task } from "../types/Task";
import { TaskResponse } from "../types/TaskResponse";
import { ChildProcess } from "child_process";

const fork = require("child_process").fork;
const path = require("path");

const workerProcess = path.resolve(__dirname,"worker.js");

let invocations = 0;

let workers: {
  busy: Record<string, ChildProcess>;
  available: Record<string, ChildProcess>;
} = {
  busy: {},
  available: {},
};

export const getStatistics = () => {
  return {
    active_instances:
      Object.values(workers.busy).length +
      Object.values(workers.available).length,
    total_invocation: invocations,
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
    console.log(`using worm worker: [${child.pid}] for the task`);
    delete workers.available[child.pid];
    workers.busy[child.pid] = child;
  } else {
    console.log(`no worm for the task, spinning new worker`);
    child = fork(workerProcess, [], options);
    child.on("message", (message: TaskResponse) => {
      console.log(message);
      const { status, id, body, error } = message;
      switch (status) {
        case "DONE":
          console.log(
            `Worker[${child.pid}] finished Task[${id}] adding it to available pool`
          );
          delete workers.available[child.pid];
          workers.available[child.pid] = child;
          break;
        case "ERROR":
          console.error(`Worker [${child.pid}] failed with error`, error);
          assignTask({
            body: message.body,
            id: message.id,
          });
          setTimeout(() => {}, Number(process.env.RETRY_DELAY));
          break;
        default:
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
