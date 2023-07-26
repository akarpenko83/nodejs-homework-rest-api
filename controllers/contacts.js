const { HttpError, ctrlWrapper } = require('../helpers');
const Joi = require('joi');
const contactsOperations = require('../models/contacts');

const addSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^\+38-\d{3}-\d{3}-\d{2}-\d{2}$/)
    .required(),
});

const listContacts = async (_, res, next) => {
  const contacts = await contactsOperations.listContacts();
  res.json(contacts);
};

const getContactById = async (req, res, next) => {
  const response = await contactsOperations.getContactById(
    req.params.contactId,
  );
  if (!response) {
    throw HttpError(404, 'Not Found');
  }
  res.status(200).json(response);
};

const addContact = async (req, res, next) => {
  const { error } = addSchema.validate(req.body);
  if (error) {
    throw HttpError(400, error.message);
  }
  const newContact = await contactsOperations.addContact(
    req.body,
  );
  res.status(201).json(newContact);
  if (!newContact) {
    throw HttpError(404, 'Unable to add contact');
  }
};

const removeContact = async (req, res, next) => {
  const response = await contactsOperations.removeContact(
    req.params.contactId,
  );
  if (!response) {
    throw HttpError(404, 'Not Found');
  }
  res.status(200).json({ message: 'contact deleted' });
};
const updateContact = async (req, res, next) => {
  const { error } = addSchema.validate(req.body);
  if (error) {
    throw HttpError(400, error.message);
  }
  const updatedContact =
    await contactsOperations.updateContact(
      req.params.contactId,
      req.body,
    );

  if (!updatedContact) {
    throw HttpError(404, 'Not Found');
  }
  res.status(200).json(updatedContact);
};

module.exports = {
  listContacts: ctrlWrapper(listContacts),
  getContactById: ctrlWrapper(getContactById),
  addContact: ctrlWrapper(addContact),
  removeContact: ctrlWrapper(removeContact),
  updateContact: ctrlWrapper(updateContact),
};
