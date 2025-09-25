import express from "express";
import bodyParser from "body-parser";
import {init} from "./init";
import errorHandler from "./middlewares/errorHandler";
import notFound from "./middlewares/notFound";
import * as MessageController from "./controler/MessageController";
import * as StatisticsController from "./controler/StatisticsController";

init();

const app = express();
app.use(bodyParser.json());

app.post('/tasks', MessageController.postMessage);
app.get('/statistics', StatisticsController.getStatistics);
app.use(notFound);
app.use(errorHandler);

app.listen(Number(process.env.SERVER_PORT), (err) => {
  if (err) {
    return console.error(err);
  }
  console.log(`server is listening on ${Number(process.env.SERVER_PORT)}`);
});

