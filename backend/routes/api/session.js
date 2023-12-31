// backend/routes/api/session.js
const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');


const { setTokenCookie, restoreUser } = require('../../utils/auth');
const { Booking,Review, ReviewImage, Spot, SpotImage, User  } = require('../../db/models');

const router = express.Router();


const validateLogin = [
  check('credential')
    .exists({ checkFalsy: true })
    .notEmpty()
    .withMessage('Email or username is required'),
  check('password')
    .exists({ checkFalsy: true })
    .withMessage('Password is required'),
  handleValidationErrors
];
// Log in
router.post(
    '/',
    validateLogin,
    async (req, res, next) => {
      try{
      const { credential, password } = req.body;

      const user = await User.unscoped().findOne({
        where: {
          [Op.or]: {
            username: credential,
            email: credential
          }
        }
      });
      //invilid credentials

      if (!user || !bcrypt.compareSync(password, user.hashedPassword.toString())) {

        const err = new Error();
        res.status(401).json({
          message:"Invalid credentials"
        })
        // err.status = 401;
        // // err.title = 'Login failed';
        // err.errors = { credential: 'Invalid credentials' };
        return next(err);
        // return res.status(401).json({
        //   "message":"Invalid credentials"
        // })
      }

      const safeUser = {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName:user.firstName,
        lastName:user.lastName
      };

      await setTokenCookie(res, safeUser);

      return res.json({
        user: safeUser
      });
    }catch(err){


      next(err)
    }
    }
  );

  // Log out
router.delete(
    '/',
    (_req, res) => {
      res.clearCookie('token');
      return res.json({ message: 'success' });
    }
  );

  // Restore session user
router.get(
    '/',
    (req, res) => {
      const { user } = req;
      if (user) {
        const safeUser = {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName:user.firstName,
          lastName:user.lastName
        };
        return res.json({
          user: safeUser
        });
      } else return res.json({ user: null });
    }
  );




module.exports = router;
