# lumigo-assignment

Instructions to execute the assigment:
```
npm install
npm run start
```

End points:
```
GET localhost:{PORT}/v1/statistics
POST localhost:{PORT}/v1/messages
```

Env variables:
```
WORKER_TIMEOUT - the time the worker need to be idle before it is cleaned up
TASK_SIMULATED_DURATION - the length of each task
PORT - the port to use
RETRY_DELAY - delay between failed tasks
RETRIES - number of retries of failed task
```
