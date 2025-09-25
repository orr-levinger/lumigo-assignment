# lumigo-assignment

Instructions to execute the assigment:
```
npm install
npm run start
```

End points:
```
GET localhost:{SERVER_PORT}/statistics
POST localhost:{SERVER_PORT}/tasks
```

Env variables:
```
SERVER_PORT - HTTP server port
WORKER_TIMEOUT - the time the worker needs to be idle before it is cleaned up
TASK_SIMULATED_DURATION - Simulated duration (ms) per task attempt
TASK_SIMULATED_ERROR_PERCENTAGE - Simulated task error percentage
TASK_ERROR_RETRY_DELAY - delay (ms) between retries
TASK_MAX_RETRIES - maximum retry attempts per task
```
