const { ctrlWrapper, HttpError, sendEmail } = require('../helpers');
const { User } = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const gravatar = require('gravatar');
const Jimp = require('jimp');
const path = require('path');
const fs = require('fs/promises');
const { nanoid } = require('nanoid');

const { SECRET_KEY, BASE_URL } = process.env;
const avatarsDir = path.join(__dirname, '../', 'public', 'avatars');

const registerCtrl = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    throw HttpError(409, 'Email in use');
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const avatarUrl = gravatar.url(email);
  const verificationToken = nanoid();
  const newUser = await User.create({
    ...req.body,
    password: hashedPassword,
    avatarUrl,
    verificationToken,
  });
  const verifyEmail = {
    to: email,
    html: `<html><a target="_blank" href='${BASE_URL}/api/auth/verify/${verificationToken}'>Click to verify email</a></html>`,
  };
  await sendEmail(verifyEmail);

  res.status(201).json({ user: { email: newUser.email, subscription: newUser.subscription } });
};
const getVerifiedCtrl = async (req, res) => {
  const { verificationToken } = req.params;
  const user = await User.findOne({ verificationToken });
  if (!user) {
    throw HttpError(401, 'Email not found');
  }
  await User.findByIdAndUpdate(user._id, { verify: true, verificationToken: null });
  res.status(200).json({ message: 'Email successfully verified' });
};
const resendVerifyCtrl = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(401, 'Email not found');
  }
  if (user.verify) {
    throw HttpError(401, 'Email already verified');
  }
  const verifyEmail = {
    to: email,
    html: `<html><a target="_blank" href='${BASE_URL}/api/auth/verify/${user.verificationToken}'>Click to verify email</a></html>`,
  };
  await sendEmail(verifyEmail);

  res.status(200).json({ message: 'Verify email send success' });
};
const loginCtrl = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(401, 'Email or password is not valid');
  }
  if (!user.verify) {
    throw HttpError(401, 'Email is not verified');
  }
  const comparePassword = await bcrypt.compare(password, user.password);
  if (!comparePassword) {
    throw HttpError(401, 'Email or password is not valid');
  }
  const payload = { id: user._id };
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '12h' });
  await User.findByIdAndUpdate(user._id, { token });
  res.status(200).json({ token, user: { email: user.email, subscription: user.subscription } });
};
const logoutCtrl = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: null });
  res.status(204).json({ message: 'Logout success' });
};
const getCurrentCtrl = (req, res) => {
  const { email, subscription } = req.user;
  res.json({ email, subscription });
};
const updateSubscriptionCtrl = async (req, res) => {
  const { _id, subscription } = req.user;
  const newSubscription = req.body.subscription;
  if (newSubscription === subscription) {
    throw HttpError(409, 'Invalid subscription');
  }
  const updatedSubscription = await User.findByIdAndUpdate(
    _id,
    { $set: { subscription: newSubscription } },
    { new: true },
  );
  if (!updatedSubscription) {
    throw HttpError(409, 'Not Found');
  }
  res.status(200).json({ message: `new subscription is ${updatedSubscription.subscription}` });
};
const updateAvatarCtrl = async (req, res) => {
  const { _id } = req.user;
  const { path: tempUpload, originalname } = req.file;
  const filename = `${_id}_${originalname}`;
  const resultUpload = path.join(avatarsDir, filename);
  await fs.rename(tempUpload, resultUpload);
  const image = await Jimp.read(resultUpload);
  await image.resize(250, 250).write(resultUpload);
  const avatarUrl = path.join('avatars', filename);
  await User.findByIdAndUpdate(_id, { avatarUrl });

  console.log(avatarUrl);
  res.json({ avatarUrl });
};

module.exports = {
  registerCtrl: ctrlWrapper(registerCtrl),
  loginCtrl: ctrlWrapper(loginCtrl),
  logoutCtrl: ctrlWrapper(logoutCtrl),
  getCurrentCtrl: ctrlWrapper(getCurrentCtrl),
  updateSubscriptionCtrl: ctrlWrapper(updateSubscriptionCtrl),
  updateAvatarCtrl: ctrlWrapper(updateAvatarCtrl),
  getVerifiedCtrl: ctrlWrapper(getVerifiedCtrl),
  resendVerifyCtrl: ctrlWrapper(resendVerifyCtrl),
};
