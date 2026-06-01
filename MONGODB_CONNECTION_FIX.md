# MongoDB Connection Fix Guide

## Problem
You're getting a connection timeout error when trying to connect to MongoDB Atlas:
```
MongoServerSelectionError: connect ETIMEDOUT
ReplicaSetNoPrimary
```

## Solution Steps

### Step 1: Check MongoDB Atlas Network Access

1. **Go to MongoDB Atlas Dashboard:**
   - Visit: https://cloud.mongodb.com/
   - Login with your account

2. **Navigate to Network Access:**
   - Click on your cluster/project
   - Go to **"Network Access"** in the left sidebar
   - Or click: https://cloud.mongodb.com/v2#/security/network/whitelist

3. **Add Your IP Address:**
   - Click **"Add IP Address"** button
   - Choose one of these options:
     - **Option A (Recommended for Development):** Click **"Add Current IP Address"**
     - **Option B (Allow All - Less Secure):** Enter `0.0.0.0/0` to allow all IPs
   - Click **"Confirm"**

4. **Wait 2-3 minutes** for changes to take effect

### Step 2: Verify Connection String

Make sure your `.env` file has the correct connection string:

```env
MONGODB_URI=mongodb+srv://alif_iubat_practicum:RLNdrbIRM07ZvG8H@basicsexploring.cgr22.mongodb.net/?appName=basicsExploring
DB_NAME=practicum_db
```

**Important:** 
- Make sure there are no extra spaces
- Make sure the password is correct: `RLNdrbIRM07ZvG8H`
- Make sure the username is correct: `alif_iubat_practicum`

### Step 3: Check if Cluster is Running

1. **Go to MongoDB Atlas Dashboard**
2. **Click on "Clusters"** in the left sidebar
3. **Check your cluster status:**
   - If it shows **"Paused"** → Click **"Resume"** (free tier auto-pauses after inactivity)
   - Wait 2-3 minutes for cluster to resume
   - If it shows **"Running"** → Continue to next step

### Step 4: Test Connection

1. **Restart your server:**
   ```bash
   # Stop server (Ctrl + C)
   npm run dev
   ```

2. **Check the output:**
   - Should see: `✅ MongoDB connected successfully`
   - If still error, continue troubleshooting

### Step 5: Verify Database User

1. **Go to MongoDB Atlas Dashboard**
2. **Click "Database Access"** in left sidebar
3. **Verify user exists:**
   - Username: `alif_iubat_practicum`
   - Password: `RLNdrbIRM07ZvG8H`
   - If user doesn't exist, create it with "Read and write to any database" permissions

### Step 6: Check Firewall/Antivirus

- **Windows Firewall:** May be blocking the connection
  - Try temporarily disabling to test
  - Or add Node.js to firewall exceptions

- **Antivirus:** May be blocking MongoDB connections
  - Try temporarily disabling to test

### Step 7: Test Connection String Directly

You can test the connection using MongoDB Compass or `mongosh`:

**Using MongoDB Compass:**
1. Download: https://www.mongodb.com/try/download/compass
2. Paste connection string: `mongodb+srv://alif_iubat_practicum:RLNdrbIRM07ZvG8H@basicsexploring.cgr22.mongodb.net/?appName=basicsExploring`
3. Click "Connect"
4. If it connects, the issue is with your Node.js app
5. If it doesn't connect, the issue is with MongoDB Atlas configuration

## Quick Fix Checklist

- [ ] Added IP address to MongoDB Atlas Network Access
- [ ] Waited 2-3 minutes after adding IP
- [ ] Verified cluster is running (not paused)
- [ ] Checked `.env` file has correct MONGODB_URI
- [ ] Verified database user exists and has correct password
- [ ] Restarted the server after making changes
- [ ] Checked firewall/antivirus settings

## Still Not Working?

### Option 1: Use Local MongoDB (Alternative)

If MongoDB Atlas continues to have issues, you can use local MongoDB:

1. **Install MongoDB locally:**
   - Windows: https://www.mongodb.com/try/download/community
   - Mac: `brew install mongodb-community`
   - Linux: `sudo apt install mongodb`

2. **Update `.env`:**
   ```env
   MONGODB_URI=mongodb://localhost:27017
   DB_NAME=practicum_db
   ```

### Option 2: Get New Connection String

1. Go to MongoDB Atlas
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the new connection string
5. Update `.env` file

## Common Error Messages

### "ETIMEDOUT"
- **Cause:** Network access not configured or IP not whitelisted
- **Fix:** Add IP to Network Access in MongoDB Atlas

### "ReplicaSetNoPrimary"
- **Cause:** Can't find primary node in replica set
- **Fix:** Check cluster is running, verify connection string

### "Authentication failed"
- **Cause:** Wrong username/password
- **Fix:** Verify credentials in Database Access

### "Server selection timed out"
- **Cause:** Network/firewall blocking connection
- **Fix:** Check firewall, add IP to whitelist

## Need More Help?

- MongoDB Atlas Documentation: https://docs.atlas.mongodb.com/
- MongoDB Connection Troubleshooting: https://docs.atlas.mongodb.com/troubleshoot-connection/

