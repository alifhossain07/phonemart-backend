# Quick Setup Guide

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Configure Environment
Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development

# MongoDB Atlas Connection (Already configured)
MONGODB_URI=mongodb+srv://alif_iubat_practicum:RLNdrbIRM07ZvG8H@basicsexploring.cgr22.mongodb.net/?appName=basicsExploring
DB_NAME=practicum_db

# JWT Configuration (Change these!)
JWT_SECRET=change-this-to-a-random-secret-key-in-production
JWT_EXPIRE=7d

# System Key (Change this!)
SYSTEM_KEY=change-this-to-a-random-system-key-in-production
```

## Step 3: Create Admin User
Run the script to create an admin user:

```bash
npm run create-admin
```

Or with custom details:
```bash
npm run create-admin admin@example.com admin123 "Admin Name"
```

Default credentials:
- Email: `admin@example.com`
- Password: `admin123`

**⚠️ Change the password after first login!**

## Step 4: Start the Server

### Development (with auto-reload):
```bash
npm run dev
```

### Production:
```bash
npm start
```

## Step 5: Access the Application

- **API Base URL:** `http://localhost:5000/api/v2`
- **Admin Panel:** `http://localhost:5000/admin`
  - Login with the admin credentials you created

## Step 6: Update Frontend Configuration

In your Next.js frontend `.env.local` file, update:

```env
API_BASE=http://localhost:5000
SYSTEM_KEY=change-this-to-a-random-system-key-in-production
```

**Important:** 
- The `API_BASE` should be just the base URL (without `/api/v2`)
- The frontend automatically adds `/api/v2` to construct the full API endpoint URLs
- Make sure the `SYSTEM_KEY` matches the one in the backend `.env` file!

**For Production:**
```env
API_BASE=https://phonemartadmin.alif-hossain.me
SYSTEM_KEY=your-production-system-key
```

## Troubleshooting

### Can't connect to MongoDB
- Verify the MongoDB Atlas connection string is correct
- Check if your IP is whitelisted in MongoDB Atlas
- Verify the database name is `practicum_db`

### Admin login not working
- Make sure you created an admin user using `npm run create-admin`
- Verify the user has `role: "admin"` in the database
- Check the password is correct

### API returns 401 Unauthorized
- Verify the `System-Key` header is included in API requests
- Check that `SYSTEM_KEY` in backend `.env` matches the frontend `SYSTEM_KEY`

## Next Steps

1. Add your first product via the admin panel
2. Create categories and brands
3. Test the API endpoints
4. Update frontend to use the new backend

## Security Reminders

- ✅ Change `JWT_SECRET` to a strong random string
- ✅ Change `SYSTEM_KEY` to a strong random string  
- ✅ Change default admin password
- ✅ Use HTTPS in production
- ✅ Never commit `.env` file to git

