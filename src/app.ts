import express from "express";
import bodyParser from "body-parser";
import {init} from "./init";
import errorHandler from "./middlewares/errorHandler";
import notFound from "./middlewares/notFound";
import AppRouter from "./router/appRouter";

init();

const app = express();
app.use(bodyParser.json());
app.use(notFound);
app.use(errorHandler);
app.use("/v1", AppRouter);


app.listen(Number(process.env.PORT), (err) => {
  if (err) {
    return console.error(err);
  }
  console.log(`server is listening on ${Number(process.env.PORT)}`);
});

