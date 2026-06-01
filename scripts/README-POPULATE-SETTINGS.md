# Populate Business Settings Script

This script automatically populates default business settings data into the database. This is useful for initial setup or resetting settings to default values.

## 📋 What It Does

The script populates the following business settings:
- Header Logo URL
- Footer Logo URL
- About Us Description
- Copyright Text
- Contact Phone
- Contact Email
- Contact Address
- Social Media Links (Facebook, Instagram, Twitter, YouTube)

## 🚀 How to Run

### Option 1: Using npm script (Recommended)
```bash
npm run populate-settings
```

### Option 2: Direct node command
```bash
node scripts/populate-business-settings.js
```

## ⚙️ Requirements

1. Make sure your `.env` file is properly configured with:
   - `MONGODB_URI` - Your MongoDB connection string
   - `DB_NAME` - Your database name (defaults to `practicum_db` if not set)

2. Ensure MongoDB is accessible and running

## 📝 Default Values

The script will populate these default values:

```javascript
{
  header_logo: '/uploads/logo.png',
  footer_logo: '/uploads/logo.png',
  about_us_description: 'Like Telecom is your trusted partner for premium telecommunications products...',
  frontend_copyright_text: '© 2024 Like Telecom. All rights reserved.',
  contact_phone: '+8801234567890',
  contact_email: 'info@liketelecom.com',
  contact_address: '123 Main Street, Dhaka, Bangladesh',
  facebook_link: 'https://www.facebook.com/liketelecom',
  instagram_link: 'https://www.instagram.com/liketelecom',
  twitter_link: 'https://www.twitter.com/liketelecom',
  youtube_link: 'https://www.youtube.com/liketelecom',
}
```

## 🔄 Behavior

- **If setting exists**: Updates the value
- **If setting doesn't exist**: Creates new setting
- **Safe to run multiple times**: Won't duplicate data

## ✅ Success Output

```
🔄 Connecting to MongoDB...
✅ Connected to MongoDB
📦 Database: practicum_db

📝 Populating business settings...

✅ Inserted: header_logo = /uploads/logo.png
✅ Inserted: footer_logo = /uploads/logo.png
...
============================================================
✅ Successfully populated business settings!
   - Inserted: 11 settings
   - Updated: 0 settings
============================================================

💡 You can now update these settings from the admin panel:
   http://localhost:5000/admin/settings
```

## 🔧 Customizing Default Values

To change the default values, edit `scripts/populate-business-settings.js` and modify the `defaultSettings` object.

## 📝 Notes

- All settings are stored in the `business_settings` collection
- Settings can be updated from the admin panel at `/admin/settings`
- The script uses `upsert` so it's safe to run multiple times
- Existing settings will be updated, new settings will be inserted

