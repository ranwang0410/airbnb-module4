const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');


const { setTokenCookie, restoreUser, requireAuth,requireRole} = require('../../utils/auth');
const { Booking,Review, ReviewImage, Spot, SpotImage, User } = require('../../db/models');

const router = express.Router();
router.use(restoreUser);
router.use(requireAuth);
// router.use(requireRole);

//1.Get all Reviews of the Current User
router.get('/current',requireAuth,async(req,res,next)=>{

    try{
        const userId = req.user.id;
        const reviews = await Review.findAll({
            where:{
                userId:userId
            },
            include:[
                {
                model:User,
                attributes:['id','firstName','lastName']
                },
                {
                    model:Spot,
                    attributes:['id','ownerId','address', 'city', 'state', 'country', 'lat', 'lng', 'name','price'],
                    include:{
                        model:SpotImage,
                        where:{preview:true},
                        required:false

                    }
                },
                {
                    model:ReviewImage,
                    as:'ReviewImages',
                    attributes:['id','url']
                }
            ]

        });

        const result = reviews.reduce((acc, review) => {
            if (!review.Spot) {
                return acc;
            }

            const reviewData = {
                id: review.id,
                userId: review.userId,
                spotId: review.spotId,
                review: review.review,
                stars: review.stars,
                createdAt: review.createdAt,
                updatedAt: review.updatedAt,
                User: {
                    id: review.User.id,
                    firstName: review.User.firstName,
                    lastName: review.User.lastName
                },
                Spot: {
                    id:review.Spot.id,
                    ownerId:review.Spot.ownerId,
                    address:review.Spot.address,
                    city:review.Spot.city,
                    state:review.Spot.state,
                    country:review.Spot.country,
                    lat:review.Spot.lat,
                    lng:review.Spot.lng,
                    name:review.Spot.name,
                    price:review.Spot.price,
                    previewImage: review.Spot.SpotImages.length > 0 ? review.Spot.SpotImages[0].url : null
                },
                ReviewImages: review.ReviewImages
            };

            acc.push(reviewData);
            return acc;
        }, []);

        return res.status(200).json({
            Reviews: result
        });

    }catch(err){
        next(err)
    }
});



const validateReview = [
    check('review')
    .notEmpty()
    .withMessage('Review text is required'),
    check('stars')
    .isInt({min:1,max:5})
    .withMessage('Stars must be an integer from 1 to 5'),
    handleValidationErrors
]

//4.Add an Image to a Review based on the Review's id

router.post('/:reviewId/images',requireAuth,async(req,res,next)=>{
    try{
        const reviewId = parseInt(req.params.reviewId, 10);
        const review = await Review.findByPk(reviewId)

        if (!review) {
            return res.status(404).json({
                message:"Review couldn't be found"
            })
        }

        const countImage = await ReviewImage.count({
            where:{
                reviewId:reviewId
            }
        })
        if(countImage >=10){
            return res.status(403).json({
                message:"Maximum number of images for this resource was reached"
            })
        }

        const imageUrl = req.body.url;
        const newImage = await ReviewImage.create({
            url:imageUrl,
            reviewId:reviewId
        });

        res.json({
            id:newImage.id,
            url:newImage.url
        })

    }catch(err){
        next(err)
    }
});

//5.Edit a Review
router.put('/:reviewId',requireAuth,validateReview,async (req,res,next)=>{
    try{
        const reviewId = parseInt(req.params.reviewId,10);
        const userId = req.user.id;
        const review = await Review.findByPk(reviewId);

        if(!review){
            return res.status(404).json({
                message:"Review couldn't be found"
            })
        }
        review.review = req.body.review;
        review.stars = req.body.stars;

        await review.save();
        res.json({
            id:review.id,
            userId:review.userId,
            spotId:review.spotId,
            review:review.review,
            stars:review.stars,
            createdAt:review.createdAt,
            updatedAt:review.updatedAt
        })
    }catch(err){
        next(err)
    }
})

//delete a review
router.delete('/:reviewId',requireAuth,async(req,res,next)=>{
    try{
        const reviewId = req.params.reviewId;
        const userId = req.user.id;
        const review = await Review.findByPk(reviewId);
        if(!review){
            return res.status(404).json({message:"Review couldn't be found"})
        }

         if(review.userId !== userId){
            return res.status(403).json({
                message: "Forbidden"
            });
         }

         await ReviewImage.destory({
            where:{
                reviewId:review.id
            }
         });
         await review.destory();

         return res.json({
            message:'Successfully deleted'
        })
    }catch(err){
        next(err)
    }
})
module.exports = router;
