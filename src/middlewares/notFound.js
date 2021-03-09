export default (err, req, res, next) => {
  console.error({
   message: `Request to: ${req.originalUrl} - does not exist, return 404`
  });
  res.status(404).send({
    message: 'Not Found',
  });
  next();
};
