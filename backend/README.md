# Sehat Setu Backend API

Complete Node.js + Express + MongoDB backend for the Sehat Setu healthcare platform.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Environment Variables

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/sehat-setu
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_REFRESH_EXPIRE=30d
FRONTEND_URL=http://127.0.0.1:5500
```

### 3. Setup MongoDB

**Option A: Local MongoDB**
- Install MongoDB from https://www.mongodb.com/try/download/community
- Start MongoDB service
- Use connection string: `mongodb://localhost:27017/sehat-setu`

**Option B: MongoDB Atlas (Recommended for production)**
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (free tier available)
3. Get connection string from "Connect" button
4. Replace `MONGO_URI` in `.env` with your Atlas connection string

### 4. Start the Server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server will run on `http://localhost:3000`

## 📁 Project Structure

```
backend/
├── models/           # Database models
│   ├── User.js       # User authentication model
│   ├── Patient.js    # Patient profile model
│   ├── Doctor.js     # Doctor profile model
│   └── Appointment.js # Appointment model
├── routes/           # API routes
│   ├── auth.js       # Authentication routes
│   ├── patients.js   # Patient routes
│   ├── doctors.js    # Doctor routes
│   ├── appointments.js # Appointment routes
│   └── contact.js    # Contact form routes
├── middleware/       # Custom middleware
│   └── auth.js       # JWT authentication middleware
├── server.js         # Main server file
├── package.json      # Dependencies
└── .env.example      # Environment variables template
```

## 🔌 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/register` | Register new user | Public |
| POST | `/login` | Login user | Public |
| GET | `/profile` | Get current user profile | Private |
| POST | `/refresh` | Refresh access token | Public |

### Patients (`/api/patients`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/me` | Get current patient profile | Private (Patient) |
| PUT | `/me` | Update patient profile | Private (Patient) |
| POST | `/me/medical-history` | Add medical history | Private (Patient) |
| POST | `/me/documents` | Add document | Private (Patient) |
| GET | `/:id` | Get patient by ID | Private (Doctor) |

### Doctors (`/api/doctors`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | Get all doctors | Public |
| GET | `/:id` | Get doctor by ID | Public |
| GET | `/me` | Get current doctor profile | Private (Doctor) |
| PUT | `/me` | Update doctor profile | Private (Doctor) |

### Appointments (`/api/appointments`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/` | Create appointment | Private (Patient) |
| GET | `/` | Get appointments | Private |
| GET | `/:id` | Get appointment by ID | Private |
| PUT | `/:id` | Update appointment | Private |
| DELETE | `/:id` | Cancel appointment | Private |

### Contact (`/api/contact`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/` | Submit contact form | Public |

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication.

**Login Flow:**
1. User sends credentials to `/api/auth/login`
2. Server returns `accessToken` and `refreshToken`
3. Client stores tokens in localStorage
4. Client includes `Authorization: Bearer <accessToken>` header in requests
5. When accessToken expires, use refreshToken to get new accessToken

**Example Request:**
```javascript
fetch('http://localhost:3000/api/patients/me', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('userToken'),
    'Content-Type': 'application/json'
  }
})
```

## 📝 Sample API Calls

### Register Patient
```javascript
const response = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'patient@example.com',
    password: 'password123',
    userType: 'patient',
    name: 'John Doe',
    phone: '+91 9876543210',
    dateOfBirth: '1990-01-01',
    gender: 'male',
    bloodGroup: 'O+'
  })
});
```

### Login
```javascript
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'patient@example.com',
    password: 'password123'
  })
});
const data = await response.json();
localStorage.setItem('userToken', data.tokens.accessToken);
```

### Create Appointment
```javascript
const response = await fetch('http://localhost:3000/api/appointments', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('userToken'),
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    doctorId: '507f1f77bcf86cd799439011',
    appointmentDate: '2024-03-15',
    appointmentTime: '10:00 AM',
    reason: 'Regular checkup',
    symptoms: ['fever', 'headache'],
    type: 'video'
  })
});
```

## 🧪 Testing the API

You can test the API using:
- **Postman**: Import the endpoints and test
- **Thunder Client** (VS Code extension)
- **cURL** commands
- Browser console (for GET requests)

**Health Check:**
```bash
curl http://localhost:3000/api/health
```

## 🔧 Troubleshooting

**MongoDB Connection Error:**
- Ensure MongoDB is running
- Check MONGO_URI in .env file
- For Atlas, whitelist your IP address

**Port Already in Use:**
- Change PORT in .env file
- Or kill the process using port 3000

**CORS Errors:**
- Ensure FRONTEND_URL in .env matches your frontend URL
- Check that frontend is running on the correct port

## 📦 Dependencies

- **express**: Web framework
- **mongoose**: MongoDB ODM
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variables
- **express-validator**: Input validation
- **multer**: File upload handling
- **cloudinary**: Cloud storage for files

## 🚀 Deployment

For production deployment:

1. Set `NODE_ENV=production` in .env
2. Use MongoDB Atlas for database
3. Deploy to platforms like:
   - Heroku
   - Railway
   - Render
   - AWS/Azure/GCP
   - DigitalOcean

## 📄 License

MIT
