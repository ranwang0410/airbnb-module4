const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');


const { setTokenCookie, restoreUser, requireAuth,requireRole} = require('../../utils/auth');
const { Booking,Review, ReviewImage, Spot, SpotImage, User } = require('../../db/models');

const router = express.Router();


// GET ALL SPOT
router.get('/', async (req, res, next) =>{
    try{
        const spots = await Spot.findAll({





            include:[
                {
                    model:SpotImage,
                            attributes:['url'],
                            where:{preview:true},
                            required:false
                },{
                model:Review,
                attributes:['stars']
            }]
        });

        const body = {
            Spots: spots.map(ele=>{
                const avgRating = ele.Reviews.length > 0 ? (ele.Reviews.reduce((acc,review) => acc + review.stars, 0) / ele.Reviews.length).toFixed(2) : null;
                return{
                    id:ele.id,
                    ownerId:ele.ownerId,
                    address:ele.address,
                    city:ele.city,
                    state:ele.state,
                    country:ele.country,
                    lat:ele.lat,
                    lng:ele.lng,
                    name:ele.name,
                    description:ele.description,
                    price:ele.price,
                    createdAt:ele.createdAt,
                    updatedAt:ele.updatedAt,
                    avgRating:avgRating,
                    previewImage:ele.SpotImage ? ele.SpotImage.url : null
                }
            })
        };
        return res.json(body);

    }catch(err){
        next(err)
    }
});

//get all spots owned by the current user
router.get('/current', async (req,res,next)=>{
    try{
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const userId = req.user.id;

        const spots = await Spot.findAll({
            where:{
                ownerId:userId
            },
            include:[
                {
                    model:SpotImage,
                    where:
                    {
                    preview:true
                },
                required:false
            },
                {
                model:Review,
                attributes:['stars']
            }]
        })
        const body = {
            Spots: spots.map(ele=>{
                const avgRating = ele.Reviews.length > 0 ? (ele.Reviews.reduce((acc,review) => acc + review.stars, 0) / ele.Reviews.length).toFixed(2) : null;
                const previewImage = (ele.SpotImages && ele.SpotImages[0]) ? ele.SpotImages[0].url : null;
                return{
                    id:ele.id,
                    ownerId:ele.ownerId,
                    address:ele.address,
                    city:ele.city,
                    state:ele.state,
                    country:ele.country,
                    lat:ele.lat,
                    lng:ele.lng,
                    name:ele.name,
                    description:ele.description,
                    price:ele.price,
                    createdAt:ele.createdAt,
                    updatedAt:ele.updatedAt,
                    avgRating:avgRating,
                    previewImage: previewImage
                }
            })
        };
        return res.json(body)
    }catch(err){
        next(err)
    }

})
//Get details of a Spot from an id
router.get('/:id',async (req, res, next)=>{
    try{
        const spotId = req.params.id;

        const spot = await Spot.findByPk(spotId,{
            include:[
                {
                    model:SpotImage,
                    attributes:['id','url','preview']
                },
                {
                    model:User,
                    as:'Owner',
                    attributes:['id', 'firstName', 'lastName']
                },
                {
                    model:Review
                }
            ]
        });
        if(!spot){
            return res.status(404).json({
                message:"Spot couldn't be found"
            })
        }
        const numReviews = spot.Reviews ? spot.Reviews.length : 0;
        const avgStarRating = numReviews > 0 ? (spot.Reviews.reduce((acc,review)=>acc+review.stars,0)/numReviews).toFixed(2) : null;

            const body = {
                    id:spot.id,
                    ownerId:spot.ownerId,
                    address:spot.address,
                    city:spot.city,
                    state:spot.state,
                    country:spot.country,
                    lat:spot.lat,
                    lng:spot.lng,
                    name:spot.name,
                    description:spot.description,
                    price:spot.price,
                    createdAt:spot.createdAt,
                    updatedAt:spot.updatedAt,
                    numReviews:numReviews,
                    avgRating:avgStarRating,

                    SpotImages:spot.SpotImages,
                    Owner:{
                        id:spot.Owner.id,
                        firstName:spot.Owner.firstName,
                        lastName:spot.Owner.lastName
                    }
                }
        return res.json(body);
    }catch(err){
        next(err)
    }
})

//create a spot
const validateCreateSpot = [
    check('address')
      .notEmpty()
      .withMessage('Street address is required'),
    check('city')
      .notEmpty()
      .withMessage('City is required'),
    check('state')
      .notEmpty()
      .withMessage('State is required'),
    check('country')
      .notEmpty()
      .withMessage('Country is required'),
    check('lat')
      .isNumeric()
      .withMessage('Latitude is not valid')
      .custom(value=>{
        if(value < -90 || value >90){
            throw new Error('erro lat')
        }
        return true
    }),
    check('lng')
      .isNumeric()
      .withMessage('Longitude is not valid')
      .custom(value=>{
        if(value < -180 || value >180){
            throw new Error('erro lng')
        }
        return true
      }),
    check('name')
      .isLength({ max: 50 })
      .withMessage('Name must be less than 50 characters'),
    check('description')
      .notEmpty()
      .withMessage('Description is required'),
    check('price')
    //   .notEmpty()
      .isNumeric()
      .withMessage('Price per day is required')
      .custom(value=>{
        if(value<=0){
            throw new Error('Pirce error')
        }
        return true
      }),
handleValidationErrors
  ];
router.post('/',requireAuth, validateCreateSpot,async (req,res,next)=>{
    try{
        const {address, city, state, country, lat, lng, name, description,price} = req.body;
        const newspot = await Spot.create({ownerId:req.user.id, address, city, state, country, lat, lng, name, description,price});

        return res.status(201).json({
            id:newspot.id,
            ownerId:newspot.ownerId,
            address:newspot.address,
            city:newspot.city,
            state:newspot.state,
            country:newspot.country,
            lat:newspot.lat,
            lng:newspot.lng,
            name:newspot.name,
            description:newspot.description,
            price:newspot.price,
            createdAt:newspot.createdAt,
            updatedAt:newspot.updatedAt
          });
    }catch(err){
        if (err instanceof Sequelize.ValidationError) {
            const errors = err.errors.map(e => e.message);
            return res.status(400).json({ errors });
        }
        next(err)
    }

});

//Add an Image to a Spot based on the Spot's id???-->spotImage?
router.post('/:spotId/images',requireAuth,async(req,res,next)=>{

        const spotId = parseInt(req.params.spotId, 10);

        const spot = await Spot.findByPk(spotId)

        const { id, url, preview } = req.body;

    if (id) {
        const existingImage = await SpotImage.findByPk(id);
        if (existingImage) {
            return res.status(400).json({
                message: "Spot couldn't be found"
            });
        }
    }

        try{

        const spotImage = await SpotImage.create({
            // spotId:spotId,
            url:url,
            preview:preview
        });
        res.json({
            id:spotImage.id,
            url:spotImage.url,
            preview:spotImage.preview
        })

    }catch(err){
        next(err)
    }
});

//Edit a Spot
const validateEditSpot = [
    check('address')
      .notEmpty()
      .withMessage('Street address is required'),
    check('city')
      .notEmpty()
      .withMessage('City is required'),
    check('state')
      .notEmpty()
      .withMessage('State is required'),
    check('country')
      .notEmpty()
      .withMessage('Country is required'),
    check('lat')
      .isDecimal()
      .withMessage('Latitude is not valid'),
    check('lng')
      .isDecimal()
      .withMessage('Longitude is not valid'),
    check('name')
      .isLength({ max: 50 })
      .withMessage('Name must be less than 50 characters'),
    check('description')
      .notEmpty()
      .withMessage('Description is required'),
    check('price')
      .notEmpty()
      .isDecimal()
      .withMessage('Price per day is required')

  ];
router.put('/:spotId',requireAuth,validateEditSpot,async(req,res,next)=>{
    try{
        const spotId = req.params.spotId;
        const spot = await Spot.findByPk(spotId);
        const {address, city, state, country, lat, lng, name, description,price} = req.body;
        const editspot = await spot.update({ address, city, state, country, lat, lng, name, description,price});

        return res.json({
            id:editspot.id,
            ownerId:editspot.ownerId,
            address:editspot.address,
            city:editspot.city,
            state:editspot.state,
            country:editspot.country,
            lat:editspot.lat,
            lng:editspot.lng,
            name:editspot.name,
            description:editspot.description,
            price:editspot.price,
            createdAt:editspot.createdAt,
            updatedAt:editspot.updatedAt
          });
    }catch(err){
        next(err)
    }
});

//delete spot
router.delete('/:spotId', requireAuth, async (req,res,next)=>{
    try{
        const spotId = parseInt(req.params.spotId, 10);
        const userId = req.user.id;
        const spot = await Spot.findByPk(spotId);
        if(!spot){
            return res.status(404).json({message:"Spot couldn't be found"})
        }
        if (spot.ownerId !== userId) {
            return res.status(403).json({
                message: "Forbidden"
            });
        }
        await Booking.destroy({ where: { spotId } });
        await SpotImage.destroy({ where: { spotId } });
        await Review.destroy({ where: { spotId } });

        await Spot.destroy({ where: { id: spotId } });

        return res.json({
            message:'Successfully deleted'
        })
    }catch(err){
        next(err)
    }
})


// 2. Get all Reviews by a Spot's id???
router.get('/:spotId/reviews', async (req, res, next) => {


    try{
        const spotId = req.params.spotId;
        const reviews = await Review.findAll({
            where:{
                spotId:spotId
            },
            include:[
                {
                    model:User,
                    attributes:['id','firstName','lastName']
                },
                {
                    model:ReviewImage,
                    attributes:['id','url'],
                    as:'ReviewImages'
                }
            ]
        });
        if(reviews.length === 0){
            return res.status(404).json({
                message:"Spot couldn't be found"
            })
        };

        const body = reviews.map(review => ({
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
                ReviewImages: review.ReviewImages
        }))

        return res.status(200).json({
            Reviews:body
        });

    }catch(err){
        next(err)
    }

});

//3.Create a Review for a Spot based on the Spot's id

const validateReview = [
    check('review')
    .notEmpty()
    .withMessage('Review text is required'),
    check('stars')
    .isInt({min:1,max:5})
    .withMessage('Stars must be an integer from 1 to 5'),
    handleValidationErrors
]
router.post('/:spotId/reviews',requireAuth,validateReview,async (req,res,next)=>{
    try{
        const spotId = parseInt(req.params.spotId,10);
        const userId = req.user.id;

        const spot = await Spot.findByPk(spotId);
        if(!spot){
            return res.status(404).json({
                message:"Spot couldn't be found"
            })
        }

        const existingReview = await Review.findOne({
            where:{
                userId:userId,
                spotId:spotId
            }
        })
        if(existingReview){
            return res.status(500).json({
                message:"User already has a review for this spot"
            })
        }

        const {review, stars} = req.body;
        const newReview = await Review.create({
            userId:userId,
            spotId:spotId,
            review:review,
            stars:stars
        });
        res.status(201).json({
            id:newReview.id,
            userId:newReview.userId,
            spotId:newReview.spotId,
            review:newReview.review,
            stars:newReview.stars,
            createdAt:newReview.createdAt,
            updatedAt:newReview.updatedAt
        })
    }catch(err){
        if (err instanceof Sequelize.ValidationError) {
            const errors = {};
            err.errors.forEach(e => errors[e.path] = e.message);
            return res.status(400).json({
                message: "Bad Request",
                errors: errors
            });
        }
        next(err)
    }
})
//Create a Booking from a Spot based on the Spot's id
const validatebooking =[
    check('startDate')
    .exists({checkFalsy:true})
    .withMessage('Error startDate'),
    check('endDate')
    .exists({checkFalsy:true})
    .withMessage('Error endDate'),
handleValidationErrors
];
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}
router.post('/:spotId/bookings',requireAuth,validatebooking,async(req,res,next)=>{
    try{
        const { startDate, endDate } = req.body;
        const spotId = parseInt(req.params.spotId, 10);

        const userId = req.user.id;

        if (new Date(endDate) <= new Date(startDate)) {
            return res.status(400).json({
                message: 'Bad Request',
                errors: {
                    endDate: "endDate cannot be on or before startDate"
                }
            });
        }

        const spot = await Spot.findByPk(spotId);
        if (!spot) {
            return res.status(404).json({
                message: "Spot couldn't be found"
            });
        }

        if (spot.ownerId === userId) {
            return res.status(403).json({ message: "You can't book your own spot" });
        }

        const existingBooking = await Booking.findOne({
        where: {
            spotId,
            [Op.or]: [
                { startDate: { [Op.between]: [startDate, endDate] } },
                { endDate: { [Op.between]: [startDate, endDate] } },
                { [Op.and]: [{ startDate: { [Op.lte]: startDate } }, { endDate: { [Op.gte]: endDate } }] }
            ]
        }
    });

    if (existingBooking) {
        return res.status(403).json({
            message: "Sorry, this spot is already booked for the specified dates",
            errors: {
                startDate: "Start date conflicts with an existing booking",
                endDate: "End date conflicts with an existing booking"
            }
        });
    }

    const newBooking = await Booking.create({
        spotId,
        userId,
        startDate,
        endDate
    });

    return res.status(200).json({
        id: newBooking.id,
        spotId: newBooking.spotId,
        userId: newBooking.userId,
        startDate: formatDate(newBooking.startDate),
        endDate: formatDate(newBooking.endDate),
        createdAt: newBooking.createdAt,
        updatedAt: newBooking.updatedAt
    });
    }catch(err){
        next(err)
    }
});

//Get all Bookings for a Spot based on the Spot's id
router.get('/:spotId/bookings',requireAuth,async(req,res,next)=>{
    try{
        const spotId = parseInt(req.params.spotId, 10);
        console.log("Requested Spot ID:", spotId);
        const userId = req.user.id;
        console.log("Fetching spot from database...");
        const spot = await Spot.findByPk(spotId);
        console.log("Fetched spot:", spot);
        if(!spot){
            return res.status(404).json({
                message: "Spot couldn't be found"
            });
        }

        if(spot.ownerId === userId){
            const bookings = await Booking.findAll({
                where :{spotId},
                include:[{
                    model:User,
                    attributes:['id','firstName','lastName']
                }]
            })
            return res.json({
                Booking:bookings.map(booking=>({
                    User:{
                        id:booking.User.id,
                        firstName:booking.User.firstName,
                        lastName:booking.User.lastName
                    },
                    id:booking.id,
                    spotId:booking.spotId,
                    userId:booking.userId,
                    startDate:formatDate(booking.startDate),
                    endDate:formatDate(booking.endDate),
                    createdAt:booking.createdAt,
                    updatedAt:booking.updatedAt
                }))
            })
        }else{
            const bookings = await Booking.findAll({
                where:{spotId},
                attributes:['spotId','startDate','endDate']
            })
            return res.json({

                Booking:bookings.map(booking=>({


                    spotId:booking.spotId,

                    startDate:formatDate(booking.startDate),
                    endDate:formatDate(booking.endDate),

                }))
            })
        }
    }catch(err){
        console.error("Error encountered:", err);
        next(err)
    }
})
module.exports = router;


