const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const { pool } = require('./db');
require('dotenv').config();

module.exports = function (passport) {
  // Local strategy
  passport.use('local',new LocalStrategy({
    usernameField: 'email'
  }, async (email, password, done) => {
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) return done(null, false, { message: 'No user found with this email' });

      const user = result.rows[0];
      const match = await bcrypt.compare(password, user.password);
      if (!match) return done(null, false, { message: 'Incorrect password' });

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  // Google strategy
  passport.use('google',new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    const email = profile.emails[0].value;
    try {
      const userCheck = await pool.query(
        'SELECT * FROM users WHERE google_id = $1 OR email = $2',
        [profile.id, email]
      );

      if (userCheck.rows.length > 0) {
        return done(null, userCheck.rows[0]);
      } else {
        const newUser = await pool.query(
          'INSERT INTO users (google_id, email, username) VALUES ($1, $2, $3) RETURNING *',
          [profile.id, email, profile.displayName]
        );
        return done(null, newUser.rows[0]);
      }
    } catch (err) {
      return done(err, null);
    }
  }));

  // Serialize and deserialize
  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser(async (id, done) => {
    try {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      done(null, result.rows[0]);
    } catch (err) {
      done(err, null);
    }
  });
};
