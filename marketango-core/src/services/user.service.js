'use strict';

const UserModel = require('../models/user.model');

async function getAll() {
  return UserModel.findAll();
}

async function getById(id) {
  const user = await UserModel.findById(id);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return user;
}

async function update(id, fields) {
  await getById(id);
  return UserModel.update(id, fields);
}

async function remove(id) {
  await getById(id);
  await UserModel.remove(id);
}

module.exports = { getAll, getById, update, remove };
