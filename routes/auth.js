const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../config/database');
const { sanitizeUser } = require('../utils/helpers');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Login (mobile + password only)
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({
        result: false,
        message: 'Mobile number and password are required'
      });
    }

    const db = getDB();
    const user = await db.collection('users').findOne({ phone, role: 'customer' });

    if (!user) {
      return res.status(401).json({
        result: false,
        message: 'Invalid mobile number or password'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        result: false,
        message: 'Invalid mobile number or password'
      });
    }

    // Generate token with 30 minutes expiry
    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '30m' } // 30 minutes
    );

    const userData = sanitizeUser(user);

    return res.json({
      result: true,
      success: true,
      message: 'Login successful',
      access_token: token,
      token_type: 'Bearer',
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      result: false,
      message: 'Login failed'
    });
  }
});

// Registration (mobile-based)
router.post('/register', async (req, res) => {
  try {
    const { name, phone, password, confirm_password } = req.body;

    // Validation
    if (!name || !phone || !password || !confirm_password) {
      return res.status(400).json({
        result: false,
        message: 'Name, mobile number, password, and confirm password are required'
      });
    }

    if (password !== confirm_password) {
      return res.status(400).json({
        result: false,
        message: 'Password and confirm password do not match'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        result: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Validate mobile number format (11 digits)
    if (!/^\d{11}$/.test(phone)) {
      return res.status(400).json({
        result: false,
        message: 'Mobile number must be 11 digits'
      });
    }

    const db = getDB();

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ phone });

    if (existingUser) {
      return res.status(400).json({
        result: false,
        message: 'User with this mobile number already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    // Don't include email field if it's null to avoid unique index conflicts
    const newUser = {
      name,
      phone,
      password: hashedPassword,
      role: 'customer',
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await db.collection('users').insertOne(newUser);
    const user = await db.collection('users').findOne({ _id: result.insertedId });

    // Generate token with 30 minutes expiry
    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '30m' } // 30 minutes
    );

    const userData = sanitizeUser(user);

    return res.status(201).json({
      result: true,
      success: true,
      message: 'Registration successful',
      access_token: token,
      token_type: 'Bearer',
      user: userData
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      result: false,
      message: 'Registration failed'
    });
  }
});

// Signup (alias for register - same as register endpoint)
router.post('/signup', async (req, res) => {
  try {
    const { name, phone, password, confirm_password } = req.body;

    // Validation
    if (!name || !phone || !password || !confirm_password) {
      return res.status(400).json({
        result: false,
        message: 'Name, mobile number, password, and confirm password are required'
      });
    }

    if (password !== confirm_password) {
      return res.status(400).json({
        result: false,
        message: 'Password and confirm password do not match'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        result: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Validate mobile number format (11 digits)
    if (!/^\d{11}$/.test(phone)) {
      return res.status(400).json({
        result: false,
        message: 'Mobile number must be 11 digits'
      });
    }

    const db = getDB();

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ phone });

    if (existingUser) {
      return res.status(400).json({
        result: false,
        message: 'User with this mobile number already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    // Don't include email field if it's null to avoid unique index conflicts
    const newUser = {
      name,
      phone,
      password: hashedPassword,
      role: 'customer',
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await db.collection('users').insertOne(newUser);
    const user = await db.collection('users').findOne({ _id: result.insertedId });

    // Generate token with 30 minutes expiry
    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '30m' } // 30 minutes
    );

    const userData = sanitizeUser(user);

    return res.status(201).json({
      result: true,
      success: true,
      message: 'Signup successful',
      access_token: token,
      token_type: 'Bearer',
      user: userData
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      result: false,
      message: 'Signup failed'
    });
  }
});

// Get user info (requires auth)
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const user = await db.collection('users').findOne({ _id: req.user._id });
    
    if (!user) {
      return res.status(404).json({
        result: false,
        message: 'User not found'
      });
    }

    const userData = sanitizeUser(user);

    return res.json({
      result: true,
      data: userData
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      result: false,
      message: 'Failed to get user info'
    });
  }
});

// Get user info by access token (alternative endpoint)
router.post('/info', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        result: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const db = getDB();
    const user = await db.collection('users').findOne({ _id: decoded.userId });
    
    if (!user) {
      return res.status(404).json({
        result: false,
        message: 'User not found'
      });
    }

    const userData = sanitizeUser(user);

    return res.json(userData); // Frontend expects user data directly for /info endpoint
  } catch (error) {
    return res.status(401).json({
      result: false,
      message: 'Invalid or expired token'
    });
  }
});

// Logout (POST method for frontend compatibility)
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // But we can log the logout action if needed
    return res.json({
      result: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      result: false,
      message: 'Logout failed'
    });
  }
});

// Logout (GET method for backward compatibility)
router.get('/logout', authMiddleware, async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // But we can log the logout action if needed
    return res.json({
      result: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      result: false,
      message: 'Logout failed'
    });
  }
});

// Update user profile (requires auth)
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, email, address, current_password, new_password, confirm_password } = req.body;
    const db = getDB();
    
    const user = await db.collection('users').findOne({ _id: req.user._id });
    
    if (!user) {
      return res.status(404).json({
        result: false,
        message: 'User not found'
      });
    }

    const updateData = {
      updated_at: new Date()
    };
    const unsetData = {};

    // Update name if provided
    if (name !== undefined) {
      // Handle null/undefined values
      if (name === null || name === undefined) {
        return res.status(400).json({
          result: false,
          message: 'Name cannot be empty'
        });
      }
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        return res.status(400).json({
          result: false,
          message: 'Name cannot be empty'
        });
      }
      updateData.name = trimmedName;
    }

    // Update phone if provided
    if (phone !== undefined) {
      // Handle null/undefined values
      if (phone === null || phone === undefined) {
        return res.status(400).json({
          result: false,
          message: 'Phone number cannot be empty'
        });
      }
      const trimmedPhone = String(phone).trim();
      if (!trimmedPhone) {
        return res.status(400).json({
          result: false,
          message: 'Phone number cannot be empty'
        });
      }
      if (!/^\d{11}$/.test(trimmedPhone)) {
        return res.status(400).json({
          result: false,
          message: 'Phone number must be 11 digits'
        });
      }
      // Check if phone is already taken by another user
      const existingUser = await db.collection('users').findOne({ 
        phone: trimmedPhone,
        _id: { $ne: req.user._id }
      });
      if (existingUser) {
        return res.status(400).json({
          result: false,
          message: 'Phone number already in use'
        });
      }
      updateData.phone = trimmedPhone;
    }

    // Update email if provided
    if (email !== undefined) {
      // Handle both null and empty string as "remove email"
      const trimmedEmail = email === null ? "" : String(email).trim();
      if (trimmedEmail) {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
          return res.status(400).json({
            result: false,
            message: 'Invalid email format'
          });
        }
        
        // Check if email is already taken by another user
        const existingUser = await db.collection('users').findOne({ 
          email: trimmedEmail.toLowerCase(),
          _id: { $ne: req.user._id }
        });
        if (existingUser) {
          return res.status(400).json({
            result: false,
            message: 'Email already in use'
          });
        }
        updateData.email = trimmedEmail.toLowerCase();
        // Remove from unset if it was previously unset
        delete unsetData.email;
      } else {
        // Remove email field if empty (don't set to null to avoid index conflicts)
        unsetData.email = "";
        delete updateData.email;
      }
    }

    // Update address if provided
    if (address !== undefined) {
      // Handle both null and string values
      if (address === null || address === undefined) {
        updateData.address = null;
      } else {
        updateData.address = String(address).trim() || null;
      }
    }

    // Update password if provided
    if (new_password) {
      if (!current_password) {
        return res.status(400).json({
          result: false,
          message: 'Current password is required to change password'
        });
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(current_password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          result: false,
          message: 'Current password is incorrect'
        });
      }

      if (new_password !== confirm_password) {
        return res.status(400).json({
          result: false,
          message: 'New password and confirm password do not match'
        });
      }

      if (new_password.length < 6) {
        return res.status(400).json({
          result: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      // Hash new password
      updateData.password = await bcrypt.hash(new_password, 10);
    }

    // Update user in database
    const updateOperation = { $set: updateData };
    if (Object.keys(unsetData).length > 0) {
      updateOperation.$unset = unsetData;
    }
    
    await db.collection('users').updateOne(
      { _id: req.user._id },
      updateOperation
    );

    // Fetch updated user
    const updatedUser = await db.collection('users').findOne({ _id: req.user._id });
    const userData = sanitizeUser(updatedUser);

    return res.json({
      result: true,
      success: true,
      message: 'Profile updated successfully',
      data: userData
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      result: false,
      message: 'Failed to update profile'
    });
  }
});

module.exports = router;

