import Joi from 'joi';

export const signUpSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  fullName: Joi.string().min(2).max(100).required(),
});

export const signInSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

export const updateProfileSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).optional(),
  bio: Joi.string().max(500).optional().allow(null, ''),
  location: Joi.string().max(200).optional().allow(null, ''),
});
