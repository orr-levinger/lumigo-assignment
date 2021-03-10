import * as WorkersManager from "../worlerManager/WorkersManager";

export const getStatistics = (req, res, next) => {
  try {
    const statistics = WorkersManager.getStatistics();
    res.status(200).send(statistics);
  } catch (err) {
    next(err);
  }
};
