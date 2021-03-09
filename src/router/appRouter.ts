const express = require('express');
const appRouter = express.Router();

import * as MessageController from "../controler/MessageController";
import * as StatisticsController from "../controler/StatisticsController";

appRouter.post('/messages', MessageController.postMessage);
appRouter.get('/statistics', StatisticsController.getStatistics);

export default appRouter;
