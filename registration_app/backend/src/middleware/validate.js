// Server-side input validation for registration
function validateRegistration(req, res, next) {
  const { name, phone, email, password } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters.');
  }

  const phoneRegex = /^\+?[0-9\s\-().]{7,20}$/;
  if (!phone || !phoneRegex.test(phone.trim())) {
    errors.push('Phone must be 7-20 digits (spaces, dashes, parentheses allowed).');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters.');
  }

  if (errors.length > 0) {
    return res.status(422).json({ errors });
  }

  // Normalise so routes don't have to trim again
  req.body.name  = name.trim();
  req.body.phone = phone.trim();
  req.body.email = email.trim().toLowerCase();

  next();
}

module.exports = { validateRegistration };
