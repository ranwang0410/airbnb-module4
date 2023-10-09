const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');


const { setTokenCookie, restoreUser, requireAuth,requireRole} = require('../../utils/auth');
const { Booking,Review, ReviewImage, Spot, SpotImage, User } = require('../../db/models');

const router = express.Router();

router.delete('/:imageId',requireAuth,async (req,res,next)=>{
    const imageId = req.params.imageId;
    try{
        const spotImage = await SpotImage.findByPk(imageId);

        if(!spotImage){
            return res.status(404).json({
                message:"Spot Image couldn't be found"
            })
        }

        const spot = await Spot.findByPk(spotImage.spotId);
        if(spot.ownerId !== req.user.id){
            return res.status(403).json({message:'Forbidden'})
        }

        await spotImage.destroy();
        return res.json({
            message:'Successfully deleted'
        })
    }catch(err){
        next(err)
    }
})
module.exports = router;
