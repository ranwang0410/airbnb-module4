// backend/routes/api/users.js
const express = require('express');
const bcrypt = require('bcryptjs');

const { check, validationResult } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { User } = require('../../db/models');

const router = express.Router();

const validateSignup = [
  check('email')
    .exists({ checkFalsy: true })
    .withMessage('Invalid email')
    .isEmail()
    .withMessage('Please provide a valid email.')
    .custom(async (email)=>{
      const user = await User.findOne({where:{email}});
      if(user){
        throw new Error('email must be unique')
      }
      return true
    })
    ,
  check('username')
    .exists({ checkFalsy: true })
    .withMessage('Username is required')
    .isLength({ min: 4 })
    .withMessage('Please provide a username with at least 4 characters.')
    .custom(async (username)=>{
      const user = await User.findOne({where:{username}});
      if(user){
        throw new Error('username must be unique')
      }
      return true
    }),
  check('firstName')
    .exists({checkFalsy:true})
    .withMessage('First Name is required'),
    check('lastName')
    .exists({checkFalsy:true})
    .withMessage('Last Name is required'),
  check('password')
    .exists({ checkFalsy: true })
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be 6 characters or more.'),
  handleValidationErrors
];
router.post(
    '/',
    validateSignup,
    async (req, res,next) => {
      const { email, password, username, firstName, lastName } = req.body;
      const errors = validationResult(req);
      if(!errors.isEmpty()){
        return res.status(400).json({
          message: 'Bad Request',
          errors: errors.mapped()
        })
    };


    try{
      const hashedPassword = bcrypt.hashSync(password,10);
      const user = await User.create({ email, username, hashedPassword,firstName, lastName });

      const safeUser = {
        id: user.id,
        firstName:user.firstName,
        lastName:user.lastName,
        email: user.email,
        username: user.username,

      };

      await setTokenCookie(res, safeUser);

      return res.json({
        user: safeUser
      });
    }catch(err){

      next(err);
    }


  })
module.exports = router;
