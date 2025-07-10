const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const { pool } = require('../config/db');

// GET /donor-form
router.get('/donor-form', ensureAuthenticated, async (req, res) => {
  const { id } = req.user;
  try {
    const donorResult = await pool.query('SELECT * FROM donors WHERE user_id = $1', [id]);
    const donor = donorResult.rows[0] || null;
    res.render('donor-form', { user: req.user, donor, editable: false });
  } catch (err) {
    console.error(err);
    res.render('donor-form', {
      user: req.user,
      donor: null,
      error_msg: 'Error loading donor data',
      editable: false,
    });
  }
});

// POST /donor-form
router.post('/donor-form', ensureAuthenticated, async (req, res) => {
  const userId = req.user.id;
  const {
    full_name,
    age,
    gender,
    blood_group,
    phone_number,
    city,
    latitude,
    longitude,
    available
  } = req.body;

  const isAvailable = available === 'on' ? true : false;

  try {
    const existing = await pool.query('SELECT id FROM donors WHERE user_id = $1', [userId]);

    if (existing.rowCount > 0) {
      // Update existing profile
      await pool.query(
        `UPDATE donors
         SET full_name = $1, age = $2, gender = $3, blood_group = $4,
             phone = $5, city = $6, address = ST_SetSRID(ST_MakePoint($7, $8), 4326), available = $9
         WHERE user_id = $10`,
        [full_name, age, gender, blood_group, phone_number, city, longitude, latitude, isAvailable, userId]
      );
    } else {
      // Create new profile
      await pool.query(
        `INSERT INTO donors
         (user_id, full_name, age, gender, blood_group, phone, city, address, available)
         VALUES ($1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($8, $9), 4326), $10)`,
        [userId, full_name, age, gender, blood_group, phone_number, city, longitude, latitude, isAvailable]
      );
    }

    req.flash('success_msg', 'Your donors profile has been saved.');
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Donor form error:', err);
    req.flash('error_msg', 'Error saving donor profile.');
    res.redirect('/donor-form');
  }
});

// GET /donor-search
router.get('/donor-search', ensureAuthenticated, (req, res) => {
  res.render('donor-search', { user: req.user, donors: [] });
});

// POST /donor-search
router.post('/donor-search', ensureAuthenticated, async (req, res) => {
  const { blood_group, city } = req.body;

  try {
    const result = await pool.query(
      `SELECT * FROM donors
       WHERE blood_group = $1 AND LOWER(city) = LOWER($2) AND available = TRUE`,
      [blood_group, city]
    );

    res.render('donor-search', {
      user: req.user,
      donors: result.rows,
    });
  } catch (err) {
    console.error('Error fetching donors:', err);
    req.flash('error_msg', 'Error fetching donor list');
    res.redirect('/donor-search');
  }
});

// POST /update-profile
router.post('/update-profile', ensureAuthenticated, async (req, res) => {
  const { fullname, bloodgroup, phone, city, available } = req.body;
  const userId = req.user.id;

  const isAvailable = available === 'on' ? true : false;

  try {
    const existing = await pool.query('SELECT * FROM donors WHERE user_id = $1', [userId]);

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE donors
         SET full_name = $1, blood_group = $2, phone = $3, city = $4, available = $5
         WHERE user_id = $6`,
        [fullname, bloodgroup, phone, city, isAvailable, userId]
      );
    } else {
      await pool.query(
        `INSERT INTO donors (user_id, full_name, blood_group, phone, city, available)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, fullname, bloodgroup, phone, city, isAvailable]
      );
    }

    req.flash('success_msg', 'Profile updated successfully!');
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Profile update error:', err);
    req.flash('error_msg', 'Something went wrong. Please try again.');
    res.redirect('/dashboard');
  }
});

router.get('/donor-list', ensureAuthenticated, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT donors.*, users.id AS user_id 
      FROM donors 
      JOIN users ON donors.user_id = users.id
    `);
    res.render('donor-list', { donors: result.rows });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to fetch donors');
    res.redirect('/dashboard');
  }
});

module.exports = router;
