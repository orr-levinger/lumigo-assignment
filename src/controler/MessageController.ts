import {Task} from "../types/Task";
import {assignTask} from "../worlerManager/WorkersManager";

const { v4: uuidv4 } = require("uuid");

export const postMessage = (req, res, next) => {
  try {
    const {body: {message}} = req;
    console.log(`Server received new message [${message}]`);

    const task: Task = {
      id: uuidv4(),
      body: message,
      retries: Number(process.env.RETRIES),
    };

    console.log(`created new task`, task);
    assignTask(task);
    res.status(200).send("messages was called");
  } catch (err) {
    next(err);
  }
};
