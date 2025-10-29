// middleware/validateCountry.js
module.exports = function validateCountry(requiredFields = ['name','population','currency_code']) {
  return (req, res, next) => {
    const errors = {};
    for (const field of requiredFields) {
      if (req.method === 'PUT' || req.method === 'POST') {
        // For update we allow partial updates; if you want strict enforce on PUT, keep this
        if (!req.body[field]) errors[field] = 'is required';
      }
    }
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    next();
  };
};
