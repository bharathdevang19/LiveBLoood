# 🩸 LiveBloooood – Real-time Blood Donation Tracking System

A full-stack Node.js application for managing and tracking blood donations and requests in real time. Built using **Express.js**, **Passport.js**, **Socket.io**, and **PostgreSQL**, this platform allows users to register, authenticate (via email or social login), and receive live updates related to blood donation activities.

---

## 🚀 Features

- 🧑‍💼 **User Authentication**
  - Local authentication with email/password
  - Google and Facebook login via Passport.js
- 🔁 **Session Management**
  - Sessions handled with `express-session` and stored in PostgreSQL
- 🌐 **Real-time Updates**
  - Blood donation requests and status updates with **Socket.io**
- 🎨 **EJS Templating**
  - Clean, dynamic HTML views using EJS
- 🧾 **Form Handling & Flash Messages**
  - With `body-parser`, `connect-flash`, and `method-override`

---

## 🛠️ Tech Stack

| Category      | Tech                                |
|---------------|-------------------------------------|
| Backend       | Node.js, Express.js                 |
| Auth          | Passport.js, OAuth2 (Google)        |
| Real-time     | Socket.io                           |
| View Engine   | EJS                                 |
| Database      | PostgreSQL                          |       
| Environment   | dotenv                              |

---

## 📁 Project Structure

tracking_project/
├── config/ # DB and Passport configurations
├── public/ # Static assets
├── routes/ # Route handlers
├── views/ # EJS templates
├── server.js # Entry point
├── package.json
└── .env # Environment variables


---

## 📦 Installation

1. **Clone the Repository**

```bash
git clone https://github.com/your-username/LiveBloooood.git
cd LiveBloooood/tracking_project

2.Install dependies
npm install

3.create a .env file
PORT=3000
DATABASE_URL=your_postgres_connection_string
SESSION_SECRET=your_session_secret
CLIENT_ORIGIN=http://localhost:3000
GOOGLE_CLIENT=your_client_id
GOOGLE_SECRET=your_client_secret

4. run the server
npm start

✅ Usage
Register a user via the signup form
Log in using local auth or social login
Send/receive live updates via WebSockets
Submit or respond to blood donation requests

🧪 Future Improvements
Admin dashboard for hospitals and blood banks
Mobile app integration
Geo-location based donor matching
Automated notifications & SMS alerts

🤝 Contributing
Contributions are welcome! Please open issues or submit pull requests.

🙋‍♂️ Author
Developed by Bharath

---
Let me know if you'd like me to customize the author details or add badges (like GitHub actions, last commit, etc.). I can also insert this directly into the existing `README.md` if you’d like.




