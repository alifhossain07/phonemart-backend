# Complete Setup Guide - Like Telecom Backend

This is a comprehensive step-by-step guide to get your Express.js + MongoDB backend server running from scratch.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Install Node.js](#step-1-install-nodejs)
3. [Step 2: Clone/Navigate to Project](#step-2-clonenavigate-to-project)
4. [Step 3: Install Dependencies](#step-3-install-dependencies)
5. [Step 4: Create Environment File](#step-4-create-environment-file)
6. [Step 5: Configure MongoDB Connection](#step-5-configure-mongodb-connection)
7. [Step 6: Generate Security Keys](#step-6-generate-security-keys)
8. [Step 7: Create Admin User](#step-7-create-admin-user)
9. [Step 8: Start the Server](#step-8-start-the-server)
10. [Step 9: Test the Server](#step-9-test-the-server)
11. [Step 10: Access Admin Panel](#step-10-access-admin-panel)
12. [Step 11: Configure Frontend](#step-11-configure-frontend)
13. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, make sure you have:
- ✅ A computer with Windows/Mac/Linux
- ✅ Internet connection
- ✅ MongoDB Atlas account (free tier is fine)
- ✅ Text editor (VS Code, Notepad++, etc.)

---

## Step 1: Install Node.js

### Check if Node.js is installed:
Open your terminal/command prompt and run:
```bash
node --version
npm --version
```

### If Node.js is NOT installed:

**For Windows:**
1. Go to https://nodejs.org/
2. Download the LTS version (recommended)
3. Run the installer
4. Follow the installation wizard
5. Restart your computer

**For Mac:**
```bash
# Using Homebrew
brew install node
```

**For Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install nodejs npm
```

### Verify Installation:
```bash
node --version  # Should show v14.x.x or higher
npm --version   # Should show 6.x.x or higher
```

---

## Step 2: Clone/Navigate to Project

### Option A: If you already have the project folder
```bash
cd "E:\Development\Development\Web Development\Practicum Project\Like Telecom\like-telecom-backend-new"
```

### Option B: If you need to navigate from current location
```bash
# Windows PowerShell
cd "E:\Development\Development\Web Development\Practicum Project\Like Telecom\like-telecom-backend-new"

# Windows CMD
cd /d "E:\Development\Development\Web Development\Practicum Project\Like Telecom\like-telecom-backend-new"

# Mac/Linux
cd "/path/to/like-telecom-backend-new"
```

### Verify you're in the right folder:
```bash
# You should see files like: package.json, server.js, etc.
dir    # Windows
ls     # Mac/Linux
```

---

## Step 3: Install Dependencies

Install all required packages:

```bash
npm install
```

**What this does:**
- Downloads and installs all packages listed in `package.json`
- Creates a `node_modules` folder
- This may take 1-3 minutes

**Expected output:**
```
added 150 packages, and audited 151 packages in 45s
```

**If you get errors:**
- Make sure you have internet connection
- Try: `npm install --legacy-peer-deps`
- Or: `npm cache clean --force` then `npm install`

---

## Step 4: Create Environment File

### Create `.env` file in the project root:

**Windows (PowerShell):**
```powershell
New-Item -Path .env -ItemType File
```

**Windows (CMD):**
```cmd
type nul > .env
```

**Mac/Linux:**
```bash
touch .env
```

### Or manually:
1. Open your text editor
2. Create a new file
3. Save it as `.env` (with the dot at the beginning) in the project root folder
4. Make sure it's saved as `.env` not `.env.txt`

---

## Step 5: Configure MongoDB Connection

### Your MongoDB Atlas credentials are already provided:

**MongoDB Connection String:**
```
mongodb+srv://alif_iubat_practicum:RLNdrbIRM07ZvG8H@basicsexploring.cgr22.mongodb.net/?appName=basicsExploring
```

**Database Name:**
```
practicum_db
```

### Add to `.env` file:

Open the `.env` file you just created and add:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://alif_iubat_practicum:RLNdrbIRM07ZvG8H@basicsexploring.cgr22.mongodb.net/?appName=basicsExploring
DB_NAME=practicum_db
```

**Important Notes:**
- ✅ The connection string is already configured
- ✅ Database name is `practicum_db`
- ✅ No need to create the database manually - it will be created automatically

---

## Step 6: Generate Security Keys

You need to create two security keys:
1. **JWT_SECRET** - For user authentication tokens
2. **SYSTEM_KEY** - For API authentication

### Method 1: Using Node.js (Recommended)

Open terminal in the project folder and run:

```bash
# Generate JWT Secret
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate System Key
node -e "console.log('SYSTEM_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```

**Example output:**
```
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
SYSTEM_KEY=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3
```

### Method 2: Using Online Generator

1. Go to: https://randomkeygen.com/
2. Use "CodeIgniter Encryption Keys" section
3. Copy a 32-character key
4. Use it for both JWT_SECRET and SYSTEM_KEY (or generate two different ones)

### Method 3: Manual (Simple but less secure)

You can use any long random string:
```
JWT_SECRET=like-telecom-jwt-secret-key-2024-production
SYSTEM_KEY=like-telecom-api-system-key-2024-secure
```

### Add to `.env` file:

Add these lines to your `.env` file:

```env
# JWT Configuration
JWT_SECRET=your-generated-jwt-secret-here
JWT_EXPIRE=7d

# System Key (for API authentication)
SYSTEM_KEY=your-generated-system-key-here
```

**Complete `.env` file should look like:**

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://alif_iubat_practicum:RLNdrbIRM07ZvG8H@basicsexploring.cgr22.mongodb.net/?appName=basicsExploring
DB_NAME=practicum_db

# JWT Configuration
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
JWT_EXPIRE=7d

# System Key (for API authentication)
SYSTEM_KEY=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3
```

**⚠️ Important:**
- Replace the example keys with your generated keys
- Keep these keys SECRET - never share them
- Use the SAME SYSTEM_KEY in your frontend `.env.local` file

---

## Step 7: Create Admin User

You need to create an admin user to access the admin panel.

### Option 1: Using the Script (Recommended)

Run this command:

```bash
npm run create-admin
```

**Default credentials created:**
- Email: `admin@example.com`
- Password: `admin123`
- Name: `Admin User`

### Option 2: Custom Admin User

To create admin with custom details:

```bash
npm run create-admin your-email@example.com your-password "Your Name"
```

**Example:**
```bash
npm run create-admin admin@liketelecom.com MySecurePass123 "Admin User"
```

### Option 3: Manual Creation (If script doesn't work)

1. Open MongoDB Atlas dashboard
2. Go to your database `practicum_db`
3. Open `users` collection
4. Click "Insert Document"
5. Add this document:

```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "<hashed-password>",
  "phone": null,
  "role": "admin",
  "created_at": new Date(),
  "updated_at": new Date()
}
```

**To hash the password:**
Run this in Node.js:
```bash
node -e "const bcrypt=require('bcryptjs');bcrypt.hash('your-password',10).then(h=>console.log('Hashed:',h))"
```

Copy the hashed password and use it in the document above.

---

## Step 8: Start the Server

### Development Mode (with auto-reload):

```bash
npm run dev
```

**Expected output:**
```
✅ MongoDB connected successfully
📦 Database: practicum_db
✅ Database indexes created
🚀 Server running on port 5000
📱 API Base URL: http://localhost:5000/api/v2
👨‍💼 Admin Panel: http://localhost:5000/admin
```

### Production Mode:

```bash
npm start
```

**If you see errors:**
- Check that MongoDB connection is correct
- Verify `.env` file exists and has all required variables
- Make sure port 5000 is not already in use

**To stop the server:**
- Press `Ctrl + C` in the terminal

---

## Step 9: Test the Server

### Test 1: Health Check

Open your browser and go to:
```
http://localhost:5000/health
```

**Expected response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

### Test 2: API Endpoint (with System Key)

**Using Browser:**
This won't work because we need headers. Use the methods below.

**Using PowerShell (Windows):**
```powershell
$headers = @{
    "System-Key" = "your-system-key-here"
    "Accept" = "application/json"
}
Invoke-RestMethod -Uri "http://localhost:5000/api/v2/categories" -Headers $headers
```

**Using curl (Mac/Linux):**
```bash
curl -H "System-Key: your-system-key-here" \
     -H "Accept: application/json" \
     http://localhost:5000/api/v2/categories
```

**Replace `your-system-key-here` with your actual SYSTEM_KEY from `.env`**

**Expected response:**
```json
{
  "success": true,
  "data": []
}
```

### Test 3: Using Postman

1. Download Postman: https://www.postman.com/downloads/
2. Create a new request
3. URL: `http://localhost:5000/api/v2/categories`
4. Method: `GET`
5. Headers tab:
   - Key: `System-Key`
   - Value: `your-system-key-here` (from `.env`)
6. Click "Send"

---

## Step 10: Access Admin Panel

### Step 10.1: Open Admin Login Page

Open your browser and go to:
```
http://localhost:5000/admin/login
```

### Step 10.2: Login

**If you used the default script:**
- Email: `admin@example.com`
- Password: `admin123`

**If you created custom admin:**
- Use the email and password you specified

### Step 10.3: Access Dashboard

After successful login, you'll be redirected to:
```
http://localhost:5000/admin/dashboard
```

**You should see:**
- Statistics cards (Products, Orders, Users, etc.)
- Quick action buttons
- Sidebar navigation

### Step 10.4: Change Admin Password (Recommended)

1. Go to MongoDB Atlas
2. Find your admin user in `users` collection
3. Generate new hashed password:
   ```bash
   node -e "const bcrypt=require('bcryptjs');bcrypt.hash('new-secure-password',10).then(h=>console.log(h))"
   ```
4. Update the `password` field in the user document

---

## Step 11: Configure Frontend

### Step 11.1: Navigate to Frontend Folder

```bash
cd "../like-telecom-frontend"
```

### Step 11.2: Create/Update `.env.local` file

Create or open `.env.local` in the frontend folder:

```env
API_BASE=http://localhost:5000/api/v2
SYSTEM_KEY=your-system-key-here
```

**⚠️ Important:**
- `SYSTEM_KEY` must be the **SAME** as in backend `.env`
- `API_BASE` points to your backend server

### Step 11.3: Restart Frontend Server

If your frontend is running:
1. Stop it (Ctrl + C)
2. Restart it:
   ```bash
   npm run dev
   ```

### Step 11.4: Test Frontend Connection

1. Open your frontend in browser
2. Try to load products/categories
3. Check browser console for any errors
4. Verify API calls are going to `http://localhost:5000/api/v2`

---

## Troubleshooting

### Problem 1: "MongoDB connection error"

**Solutions:**
- ✅ Verify MongoDB URI in `.env` is correct
- ✅ Check internet connection
- ✅ Verify MongoDB Atlas allows connections from your IP (Network Access in Atlas)
- ✅ Make sure database name is `practicum_db`

**Check MongoDB Atlas:**
1. Go to MongoDB Atlas dashboard
2. Click "Network Access"
3. Add your current IP address (or use `0.0.0.0/0` for development)
4. Wait 2-3 minutes for changes to apply

### Problem 2: "Port 5000 already in use"

**Solutions:**
- Change PORT in `.env` to another number (e.g., `5001`)
- Or kill the process using port 5000:
  ```bash
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <PID_NUMBER> /F
  
  # Mac/Linux
  lsof -ti:5000 | xargs kill
  ```

### Problem 3: "Cannot find module" errors

**Solutions:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules  # Mac/Linux
rmdir /s node_modules  # Windows CMD
del /s /q node_modules  # Windows PowerShell

npm install
```

### Problem 4: "Invalid system key" error

**Solutions:**
- ✅ Verify `SYSTEM_KEY` in backend `.env` matches frontend `.env.local`
- ✅ Restart both servers after changing `.env` files
- ✅ Check for extra spaces in the key

### Problem 5: "Admin login not working"

**Solutions:**
- ✅ Verify admin user exists in database
- ✅ Check user has `role: "admin"`
- ✅ Verify password is correctly hashed
- ✅ Try creating admin again: `npm run create-admin`

### Problem 6: "JWT_SECRET is not defined"

**Solutions:**
- ✅ Make sure `.env` file exists in project root
- ✅ Verify `.env` has `JWT_SECRET=` line
- ✅ Restart server after adding to `.env`
- ✅ Check for typos in variable names

### Problem 7: API returns empty data

**This is normal!** The database is empty. You need to:
1. Login to admin panel
2. Add products, categories, brands
3. Then API will return data

---

## Quick Reference

### Important URLs:
- **API Base:** `http://localhost:5000/api/v2`
- **Admin Panel:** `http://localhost:5000/admin`
- **Health Check:** `http://localhost:5000/health`

### Important Files:
- **Backend Config:** `like-telecom-backend-new/.env`
- **Frontend Config:** `like-telecom-frontend/.env.local`

### Important Commands:
```bash
npm install              # Install dependencies
npm run dev              # Start development server
npm run create-admin     # Create admin user
npm start                # Start production server
```

### Default Admin Credentials (if using script):
- Email: `admin@example.com`
- Password: `admin123`

**⚠️ Change password after first login!**

---

## Next Steps

1. ✅ Server is running
2. ✅ Admin panel is accessible
3. ✅ Add your first product via admin panel
4. ✅ Create categories and brands
5. ✅ Test API endpoints
6. ✅ Connect frontend to backend
7. ✅ Start building your e-commerce platform!

---

## Need Help?

If you encounter any issues:
1. Check the error message in terminal
2. Review the Troubleshooting section above
3. Verify all environment variables are set correctly
4. Make sure MongoDB connection is working
5. Check that all dependencies are installed

---

## Security Checklist

Before going to production:
- [ ] Change `JWT_SECRET` to a strong random key
- [ ] Change `SYSTEM_KEY` to a strong random key
- [ ] Change default admin password
- [ ] Use HTTPS instead of HTTP
- [ ] Restrict MongoDB Atlas network access
- [ ] Never commit `.env` file to git
- [ ] Use environment-specific keys for production

---

**🎉 Congratulations! Your backend server is now running!**

