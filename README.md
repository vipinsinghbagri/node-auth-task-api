# Minimal Node.js REST API Project

## Overview
A lightweight REST API with authentication, role-based access, and CRUD,
plus a simple frontend to test APIs.

## Tech Stack
- Node.js
- Express
- MongoDB Atlas
- JWT Authentication
- Vanilla HTML/CSS/JS

## Setup
1. Create MongoDB Atlas cluster
2. Add `.env` file
3. Install dependencies:
   npm install express mongoose bcryptjs jsonwebtoken cors dotenv
4. Run:
   node server.js
5. Open frontend HTML files in browser

## API Endpoints
- POST /api/v1/register
- POST /api/v1/login
- GET /api/v1/tasks
- POST /api/v1/tasks
- PUT /api/v1/tasks/:id
- DELETE /api/v1/tasks/:id

## Sample .env
MONGODB_URI=your_atlas_uri
JWT_SECRET=your_secret

## Scalability Note
Stateless JWT auth allows horizontal scaling.
MongoDB Atlas supports sharding and managed scaling.
