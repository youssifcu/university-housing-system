// simple helpers for consistent JSON responses

exports.success = (res, data = null, message = 'Success', status = 200) => {
  const body = { message };
  if (data !== null) body.data = data;
  res.status(status).json(body);
};

exports.error = (res, message = 'Error', status = 500, err = null) => {
  const body = { message };
  if (err !== null) body.error = err;
  res.status(status).json(body);
};
