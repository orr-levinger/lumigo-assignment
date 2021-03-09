import * as WorkersManager from "../worlerManager/WorkersManager";

export const getStatistics = (req, res, next) => {
  try {
    const statistics = WorkersManager.getStatistics();
    res.send(statistics);
  } catch (err) {
    next(err);
  }
};
