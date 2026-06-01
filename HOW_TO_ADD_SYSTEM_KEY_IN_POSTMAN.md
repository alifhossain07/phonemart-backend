# 🔑 How to Add System-Key Header in Postman

## Step-by-Step Instructions

### Step 1: Get Your System Key

1. Open your Express backend `.env` file: `like-telecom-express/.env`
2. Find the line: `SYSTEM_KEY=...`
3. Copy the value after the `=` sign

**Example:**
```env
SYSTEM_KEY=my-secret-key-12345
```
Copy: `my-secret-key-12345`

---

### Step 2: Add Header in Postman

1. **In Postman, click on the "Headers" tab** (not Params!)
   - You should see tabs: "Params", "Authorization", **"Headers"**, "Body", etc.
   - Click on **"Headers"**

2. **Add the System-Key header:**
   - In the "Key" column, type: `System-Key`
   - In the "Value" column, paste your system key
   - Make sure the checkbox is **checked** (enabled)

3. **Also add Accept header (optional but recommended):**
   - Key: `Accept`
   - Value: `application/json`
   - Check the checkbox

---

## 📸 Visual Guide

**Headers Tab should look like this:**

| Key | Value | ✓ |
|-----|-------|---|
| System-Key | your-system-key-here | ☑ |
| Accept | application/json | ☑ |

---

## ✅ Complete Example

**Request Setup:**
- **Method:** `GET`
- **URL:** `http://localhost:5000/api/v2/categories`
- **Headers Tab:**
  - `System-Key`: `your-actual-system-key-from-env`
  - `Accept`: `application/json`

**Click Send** - You should now get a successful response!

---

## ⚠️ Common Mistakes

❌ **Wrong:** Adding it in "Params" tab (Query Parameters)
✅ **Correct:** Add it in "Headers" tab

❌ **Wrong:** Header name is `system-key` (lowercase)
✅ **Correct:** Header name is `System-Key` (capital S and K, with hyphen)

❌ **Wrong:** Using wrong system key value
✅ **Correct:** Copy the exact value from your `.env` file

❌ **Wrong:** Header checkbox is unchecked
✅ **Correct:** Make sure the checkbox is checked (enabled)

---

## 🔍 Verify Your System Key

If you're still getting "Invalid system key" error:

1. **Check your backend `.env` file:**
   ```bash
   # Open: like-telecom-express/.env
   # Look for: SYSTEM_KEY=...
   ```

2. **Check backend console:**
   - When you start the backend, it should show the API base URL
   - Make sure the backend is running

3. **Test with a simple request:**
   ```
   GET http://localhost:5000/health
   ```
   This doesn't need System-Key and should return: `{"status":"ok","message":"Server is running"}`

---

## 🎯 Quick Checklist

- [ ] Backend is running (`npm run dev` in `like-telecom-express`)
- [ ] Got System-Key from `.env` file
- [ ] Clicked on "Headers" tab (not Params!)
- [ ] Added `System-Key` header with correct value
- [ ] Checkbox is checked (enabled)
- [ ] Clicked "Send"

---

## 📝 Example Headers Configuration

```
Headers (2)
┌─────────────────┬─────────────────────────────────────┬─────┐
│ Key             │ Value                               │ ✓   │
├─────────────────┼─────────────────────────────────────┼─────┤
│ System-Key      │ my-secret-key-12345                 │ ☑   │
│ Accept          │ application/json                    │ ☑   │
└─────────────────┴─────────────────────────────────────┴─────┘
```

**Important:** The header name is case-sensitive! Use exactly: `System-Key`

