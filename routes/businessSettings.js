const express = require('express');
const { getDB } = require('../config/database');

const router = express.Router();

// Get business settings
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const settings = await db.collection('business_settings')
      .find({})
      .toArray();

    // Convert array to object format expected by frontend
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.type] = setting.value;
    });

    // Ensure all required settings have defaults
    const defaultSettings = {
      footer_logo: null,
      about_us_description: '',
      frontend_copyright_text: '© 2024 Like Telecom. All rights reserved.',
      app_store_link: null,
      play_store_link: null,
      show_social_links: true,
      facebook_link: null,
      twitter_link: null,
      instagram_link: null,
      youtube_link: null,
      widget_one: null,
      widget_one_labels: [],
      widget_one_links: [],
      widget_two: null,
      widget_two_labels: [],
      widget_two_links: [],
      helpline_number: null,
      contact_address: '',
      payment_method_images: [],
      contact_email: null,
      contact_phone: null, // Maps to helpline_number in footer
      header_logo: null
    };

    // Merge defaults with actual settings
    const mergedSettings = { ...defaultSettings, ...settingsObj };

    // Format as array of { type, value } objects (expected by frontend)
    const formattedSettings = Object.keys(mergedSettings).map(key => ({
      type: key,
      value: mergedSettings[key]
    }));

    return res.json({
      success: true,
      data: formattedSettings
    });
  } catch (error) {
    console.error('Get business settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get business settings'
    });
  }
});

module.exports = router;

