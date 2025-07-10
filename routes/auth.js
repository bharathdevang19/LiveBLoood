const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const passport = require('passport');
const { ensureAuthenticated } = require('../middleware/auth');

router.get("/", ensureAuthenticated, (req, res) => {
  res.redirect('/dashboard');
});

// Register Page - GET
router.get('/register', (req, res) => {
  res.render('register', {
    error_msg: req.flash('error_msg'),
    success_msg: req.flash('success_msg')
  });
});

// REGISTER - POST
router.post('/register', async (req, res) => {
  const { email, username, password, confirmpassword } = req.body;
  let errors = [];

  if (!email || !username || !password || !confirmpassword) {
    errors.push('Please fill in all fields');
  }

  if (password !== confirmpassword) {
    errors.push('Passwords do not match');
  }

  if (password.length < 6) {
    errors.push('Password should be at least 6 characters');
  }

  if (errors.length > 0) {
    return res.render('register', {
      error_msg: errors.join(', '),
      success_msg: null
    });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length > 0) {
      return res.render('register', {
        error_msg: 'Email is already registered',
        success_msg: null
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (email, username, password) VALUES ($1, $2, $3)',
      [email, username, hashedPassword]
    );

    return res.render('register', {
      success_msg: 'You are now registered. Please login.',
      error_msg: null
    });
  } catch (err) {
    console.error(err);
    res.render('register', {
      error_msg: 'Something went wrong. Please try again.',
      success_msg: null
    });
  }
});

// Login Page - GET
router.get('/login', (req, res) => {
  res.render('login', {
    error_msg: req.flash('error_msg'),
    success_msg: req.flash('success_msg')
  });
});

// Login Handler - POST
router.post('/login', (req, res, next) => {
  passport.authenticate('local', function(err, user, info) {
    console.log('Auth result:', { err, user, info });
    if (err) return next(err);
    if (!user) {
      req.flash('error_msg', info.message || 'Invalid credentials');
      return res.redirect('/login');
    }
    req.logIn(user, function(err) {
      if (err) return next(err);
      req.flash('success_msg', 'You are now logged in.');
      return res.redirect('/dashboard');
    });
  })(req, res, next);
});


// Google OAuth login
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Callback from Google
router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', failureFlash: true }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

// Logout
router.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/login');
  });
});

module.exports = router;