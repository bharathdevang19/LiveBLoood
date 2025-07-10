// routes/dashboard.js
const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const { pool } = require('../config/db');

// Haversine formula to calculate distance between lat/lng points
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const donorResult = await pool.query('SELECT * FROM donors WHERE user_id = $1', [userId]);
    const donorProfile = donorResult.rows[0] || null;
    res.render('dashboard', { user: req.user, donorProfile });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Something went wrong. Please try again.');
    res.redirect('/login');
  }
});

router.get('/search', async (req, res) => {
  const { bloodGroup, radius, latitude, longitude } = req.query;

  if (!bloodGroup || !radius || !latitude || !longitude) {
    return res.render('donor-search', {
      donors: [],
      latitude: null,
      longitude: null,
      error: 'Missing search parameters'
    });
  }

  try {
    const userLat = parseFloat(latitude);
    const userLng = parseFloat(longitude);
    const maxDistance = parseFloat(radius);

    // Fetch all donors with that blood group
    const result = await pool.query(
      `SELECT id , user_id, full_name, phone, blood_group, latitude, longitude, city FROM donors WHERE blood_group = $1`,
      [bloodGroup]
    );

    // Filter by distance using haversine formula
    const nearbyDonors = result.rows
      .map(donor => {
        if (donor.latitude && donor.longitude) {
          const distance = getDistanceFromLatLonInKm(
            userLat,
            userLng,
            parseFloat(donor.latitude),
            parseFloat(donor.longitude)
          );
          return { ...donor, distance };
        }
        return null;
      })
      .filter(donor => donor && donor.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance); // optional: sort by distance

    return res.render('donor-search', {
      donors: nearbyDonors,
      latitude: userLat,
      longitude: userLng,
      user: req.user || null
    });
  } catch (err) {
    console.error(err);
    res.render('donor-search', {
      donors: [],
      latitude: null,
      longitude: null,
      error: 'An error occurred while searching for donors.'
    });
  }
});


module.exports = router;