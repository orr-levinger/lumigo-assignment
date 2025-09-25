const fs = require("fs");
const path = require("path");
const filePath = path.resolve(__dirname, "result.txt");
const lockPath = path.resolve(__dirname, "result.txt.lock");
export const init = () => {
  // service variables
  const filePathExists = fs.existsSync(filePath);
  const lockPathExists = fs.existsSync(lockPath);
  if(!filePathExists){
    fs.openSync(filePath, 'w')
  }
  if(!lockPathExists){
    fs.openSync(lockPath, 'w')
  }
  process.env.WORKER_TIMEOUT = process.env.WORKER_TIMEOUT || "60000";
  process.env.TASK_SIMULATED_DURATION = process.env.TASK_SIMULATED_DURATION || "15000";
  process.env.SERVER_PORT = process.env.SERVER_PORT || "3000";
  process.env.TASK_ERROR_RETRY_DELAY = process.env.TASK_ERROR_RETRY_DELAY || "3000";
  process.env.TASK_MAX_RETRIES = process.env.TASK_MAX_RETRIES || "3";
  process.env.TASK_SIMULATED_ERROR_PERCENTAGE = process.env.TASK_SIMULATED_ERROR_PERCENTAGE || "0.25";
};

