const express = require('express');
const { getDB } = require('../config/database');
const { toObjectId } = require('../utils/helpers');

const router = express.Router();

// Get countries
router.get('/countries', async (req, res) => {
  try {
    const db = getDB();
    const countries = await db.collection('countries')
      .find({})
      .sort({ name: 1 })
      .toArray();

    const formattedCountries = countries.map(c => ({
      id: c._id.toString(),
      name: c.name,
      code: c.code || null
    }));

    return res.json({
      success: true,
      data: formattedCountries,
      status: 200
    });
  } catch (error) {
    console.error('Get countries error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get countries'
    });
  }
});

// Get states by country
router.get('/states-by-country/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.query;
    const db = getDB();

    let query = { country_id: toObjectId(id) };
    
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }

    const states = await db.collection('states')
      .find(query)
      .sort({ name: 1 })
      .toArray();

    const formattedStates = states.map(s => ({
      id: s._id.toString(),
      name: s.name,
      country_id: s.country_id?.toString() || null
    }));

    return res.json({
      success: true,
      data: formattedStates
    });
  } catch (error) {
    console.error('Get states error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get states'
    });
  }
});

// Get states (for areas endpoint)
router.get('/states', async (req, res) => {
  try {
    const { name } = req.query;
    const db = getDB();

    let query = {};
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }

    const states = await db.collection('states')
      .find(query)
      .sort({ name: 1 })
      .toArray();

    const formattedStates = states.map(s => ({
      id: s._id.toString(),
      name: s.name,
      country_id: s.country_id?.toString() || null
    }));

    return res.json({
      success: true,
      data: formattedStates
    });
  } catch (error) {
    console.error('Get states error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get states'
    });
  }
});

// Get cities by state
router.get('/cities-by-state/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const cities = await db.collection('cities')
      .find({ state_id: toObjectId(id) })
      .sort({ name: 1 })
      .toArray();

    const formattedCities = cities.map(c => ({
      id: c._id.toString(),
      name: c.name,
      state_id: c.state_id?.toString() || null
    }));

    return res.json({
      success: true,
      data: formattedCities
    });
  } catch (error) {
    console.error('Get cities error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get cities'
    });
  }
});

// Get areas by city
router.get('/areas-by-city/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const areas = await db.collection('areas')
      .find({ city_id: toObjectId(id) })
      .sort({ name: 1 })
      .toArray();

    const formattedAreas = areas.map(a => ({
      id: a._id.toString(),
      name: a.name,
      city_id: a.city_id?.toString() || null
    }));

    return res.json({
      success: true,
      data: formattedAreas
    });
  } catch (error) {
    console.error('Get areas error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get areas'
    });
  }
});

module.exports = router;

