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
  process.env.WORKER_TIMEOUT = process.env.WORKER_TIMEOUT || "10000";
  process.env.TASK_SIMULATED_DURATION = process.env.TASK_SIMULATED_DURATION || "5000";
  process.env.PORT = process.env.PORT || "3000";
  process.env.RETRY_DELAY = process.env.RETRY_DELAY || "3000";
  process.env.RETRIES = process.env.RETRIES || "3";
};

