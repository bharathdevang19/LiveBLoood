const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const { pool } = require('../config/db');

router.get('/chat-list', ensureAuthenticated, async (req, res) => {
  try {
    const { id: donorId } = req.user;

    const result = await pool.query(
      `SELECT DISTINCT u.id, u.username
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.receiver_id = $1`,
      [donorId]
    );

    const users = result.rows;
    res.render('chat-list', { user: req.user, users });
  } catch (err) {
    console.error(err);
    res.redirect('/dashboard');
  }
});



// Chat page between current user and donor
router.get('/:userId', ensureAuthenticated, async (req, res) => {
  const senderId = req.user.id;
  const receiverId = req.params.userId;

  try {
    const chatHistory = await pool.query(
      `SELECT * FROM messages 
       WHERE (sender_id = $1 AND receiver_id = $2) 
          OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC`,
      [senderId, receiverId]
    );

    const userResult = await pool.query('SELECT username FROM users WHERE id = $1', [receiverId]);
    const receiverName = userResult.rows[0]?.username || 'Donor';

    res.render('chat', {
      senderId,
      receiverId,
      receiverName,
      messages: chatHistory.rows
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Unable to load chat.');
    res.redirect('/dashboard');
  }
});

module.exports = router;
