# Quick Start - Sehat Setu Backend

## 🚀 Get Running in 5 Minutes

### 1. Install Dependencies (1 min)
```bash
cd backend
npm install
```

### 2. Setup Environment (1 min)
```bash
# Copy example env file
cp .env.example .env
```

Edit `.env` and add:
```env
MONGO_URI=mongodb://localhost:27017/sehat-setu
JWT_SECRET=my_secret_key_123
JWT_REFRESH_SECRET=my_refresh_secret_456
```

### 3. Start MongoDB (1 min)

**Already have MongoDB?**
- It should be running automatically

**Don't have MongoDB?**
- Download: https://www.mongodb.com/try/download/community
- Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

### 4. Start Server (1 min)
```bash
npm run dev
```

You should see:
```
✅ MongoDB Connected Successfully
🚀 Server running on port 3000
```

### 5. Test It (1 min)

Open browser: http://localhost:3000/api/health

You should see:
```json
{
  "status": "success",
  "message": "Sehat Setu API is running"
}
```

## ✅ Done! Your backend is running!

Now open your frontend with Live Server and test the login/register functionality.

## 🔧 Common Issues

**"Cannot connect to MongoDB"**
- Install MongoDB or use Atlas
- Check MONGO_URI in .env

**"Port 3000 already in use"**
- Change PORT=3001 in .env

**"Module not found"**
- Run `npm install` again

## 📝 Next Steps

1. Open frontend with Live Server
2. Go to login page
3. Register a new account
4. Login and test features

For detailed documentation, see:
- [SETUP_GUIDE.md](../SETUP_GUIDE.md) - Complete setup guide
- [README.md](README.md) - Full API documentation
