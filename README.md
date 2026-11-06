# Roadside-Assistance
Roadside Assistance
# RoadMate – Roadside Assistance System

## Project Overview

RoadMate is a web-based roadside assistance platform designed to help vehicle owners get quick and reliable assistance when they experience vehicle breakdowns or emergencies on the road.

The system connects customers with registered mechanics and towing service providers, making it easier to request roadside services, find nearby assistance, and manage service requests.

RoadMate also provides an administrative dashboard that allows administrators to manage customers, mechanics, service requests, and platform activities.

## Project Objectives

- Provide quick access to roadside assistance services.
- Connect customers with registered mechanics.
- Simplify the process of requesting vehicle repair and emergency services.
- Allow mechanics to manage their profiles and service requests.
- Provide administrators with centralized management facilities.
- Improve the accessibility and reliability of roadside assistance services.

## Main Features

### 1. Customer Module
- Customer registration and login.
- Customer dashboard.
- Find and search for mechanics.
- Request roadside assistance.
- Manage service requests.
- View notifications and profile information.

### 2. Mechanic Module
- Mechanic registration and login.
- Mechanic profile management.
- Admin verification and approval.
- Manage service availability.
- View and manage service requests.

### 3. Admin Module
- Separate administrator authentication.
- Admin dashboard.
- Manage registered customers.
- Block and unblock customer accounts.
- Manage mechanic accounts and verification.
- Monitor service requests and platform activities.

### 4. Roadside Assistance Services

The platform supports roadside assistance services such as:

- Puncture and tyre assistance.
- Battery jumpstart.
- Engine breakdown assistance.
- Emergency fuel delivery.
- Towing assistance.

## Security Features

RoadMate includes several security mechanisms to protect user accounts and system resources:

- **Password Hashing:** Uses bcrypt to securely hash passwords before storing them in the database.
- **JWT Authentication:** Uses JSON Web Tokens to authenticate users.
- **Role-Based Access Control:** Separates access permissions for customers, mechanics, and administrators.
- **Separate Admin Authentication:** Uses a dedicated authentication mechanism and JWT secret for administrators.
- **Mechanic Verification:** Requires administrator approval before mechanics can access approved mechanic functionalities.
- **Protected Routes:** Restricts access to protected frontend pages and backend API endpoints.
- **Request Ownership Validation:** Ensures customers can access their own service requests.

## Technologies Used

### Frontend
- React.js
- Vite
- JavaScript
- HTML5
- CSS3
- React Router
- Lucide React
- Leaflet / React Leaflet

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Token (JWT)
- bcryptjs
- CORS
- dotenv

### Development Tools
- Visual Studio Code
- MongoDB Atlas
- MongoDB Compass
- Git
- GitHub
- Postman

## Project Structure

```text
NEWRoad/
│
├── Frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api/
│   │   └── ...
│   └── package.json
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── .env
│   ├── server.js
│   └── package.json
│
└── README.md
```

## Database

RoadMate uses MongoDB as its database and Mongoose as its Object Data Modeling (ODM) library.

The database stores application information such as:

- Customer details.
- Mechanic details and verification status.
- Service requests.
- Administrator information.
- Other application-related records.

## Installation and Setup

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd NEWRoad
```

### 2. Frontend Setup

```bash
cd Frontend
npm install
npm run dev
```

### 3. Backend Setup

Open another terminal:

```bash
cd backend
npm install
npm run dev
```

### 4. Environment Variables

Create a `.env` file inside the backend folder and configure the required environment variables.

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
ADMIN_JWT_SECRET=your_admin_jwt_secret
ADMIN_JWT_EXPIRES_IN=1d
```

Use your own secure credentials. Do not upload the `.env` file or expose database passwords and JWT secrets on GitHub.

## Future Enhancements

- Real-time communication between customers and mechanics.
- Live mechanic location tracking.
- Online payment integration.
- Advanced service request tracking.
- Customer feedback and rating system.
- Improved notification functionality.

## Conclusion

RoadMate aims to make roadside assistance more accessible, efficient, and convenient by connecting vehicle owners with mechanics and towing service providers through a centralized web-based platform. It provides separate interfaces for customers, mechanics, and administrators to manage roadside assistance activities effectively.