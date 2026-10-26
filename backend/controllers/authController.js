import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const createToken = (userId) => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured.');
  return jwt.sign({}, process.env.JWT_SECRET, { subject: userId.toString(), expiresIn: '7d' });
};

export const register = async (req, res) => {
  const { name, email, password, age } = req.body;
  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'Name is required.' });
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ message: 'A valid email is required.' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) {
    return res.status(409).json({ message: 'An account with this email already exists.' });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name: name.trim(), email: normalizedEmail, password: passwordHash, age });
  res.status(201).json({ user, token: createToken(user._id) });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Email or password is incorrect.' });
  }
  res.json({ user, token: createToken(user._id) });
};

export const getCurrentUser = async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: 'Account not found.' });
  res.json({ user });
};

export const updateProfile = async (req, res) => {
  const updates = {};
  if (typeof req.body.name === 'string') updates.name = req.body.name.trim();
  if (req.body.age !== undefined) updates.age = req.body.age;
  if (!Object.keys(updates).length) {
    return res.status(400).json({ message: 'Provide a name or age to update.' });
  }
  const user = await User.findByIdAndUpdate(req.userId, updates, {
    returnDocument: 'after',
    runValidators: true,
  });
  res.json({ user });
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ message: 'Provide your current password and a new password of at least 8 characters.' });
  }
  const user = await User.findById(req.userId).select('+password');
  if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
    return res.status(400).json({ message: 'Current password is incorrect.' });
  }
  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();
  res.json({ message: 'Password updated. Please sign in again on other devices.' });
};