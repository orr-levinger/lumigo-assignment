import express from "express";
import bodyParser from "body-parser";

import {init} from "./init";
import AppRouter from "./router/appRouter";

init();

const app = express();
app.use(bodyParser.json());
app.use("/v1", AppRouter);


app.listen(Number(process.env.PORT), (err) => {
  if (err) {
    return console.error(err);
  }
  console.log(`server is listening on ${Number(process.env.PORT)}`);
});

