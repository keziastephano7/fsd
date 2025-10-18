# Social App

Simple local dev instructions

Prerequisites:
- Node.js (v16+)
- MongoDB running locally (or use Atlas)

Backend
1. cd backend
2. cp .env.example .env
3. npm install
4. npm start
   - Server runs at http://localhost:5000

Frontend
1. cd frontend/client
2. npm install
3. npm start
   - App runs at http://localhost:3000

Notes
- Place your JWT secret and MongoDB connection string in the backend .env file (see .env.example).
- Uploaded images are saved to backend/uploads/ (local dev). Do not commit that folder.
