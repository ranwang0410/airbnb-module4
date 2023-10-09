const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');


const { setTokenCookie, restoreUser, requireAuth,requireRole} = require('../../utils/auth');
const { Booking,Review, ReviewImage, Spot, SpotImage, User } = require('../../db/models');

const router = express.Router();
router.delete('./:imageId',requireAuth,async(req,res,next)=>{
    try{
    const imageId = req.params.imageId;
    const reviewImage = await ReviewImage.findByPk(imageId);
    if(!reviewImage){
        return res.status(404).json({
            message: "Review Image couldn't be found"
        });
    }

    const review = await Review.findByPk(reviewImage.reviewId);
    if(review.userId !== req.user.id){
        return res.status(403).json({message:"Forbidden"})
    }
    await review.destory();
    await reviewImage.destory();
    return res.json({
        message:'Successfully deleted'
    })
    }catch(err){
        next(err)
    }
})
module.exports = router;
