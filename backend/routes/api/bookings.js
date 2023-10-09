const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');


const { setTokenCookie, restoreUser, requireAuth,requireRole} = require('../../utils/auth');
const { Booking,Review, ReviewImage, Spot, SpotImage, User } = require('../../db/models');

const router = express.Router();

// router.use(restoreUser);
// router.use(requireAuth);
//Get all of the Current User's Booking
router.get('/current',requireAuth,async (req,res,next) => {
    try{
        const bookings = await Booking.findAll({
            where:{
                userId : req.user.id
            },
            include:[
                {
                    model:Spot,
                    attributes:{
                        exclude:['createdAt','updatedAt']},
                        include:[{
                            model:SpotImage,
                            attributes:['url'],
                            where:{preview:true},
                            required:false
                        }]
                    }

            ]


        })

        const result = bookings.reduce((acc, booking) => {
            if (!booking.Spot) {
                return acc;
            }
            const previewImage = (booking.SpotImages && booking.SpotImages[0]) ? booking.SpotImages[0].url : null;
            const bookingData = {
                id: booking.id,
                spotId: booking.spotId,

                Spot: {
                    id:booking.Spot.id,
                    ownerId:booking.Spot.ownerId,
                    address:booking.Spot.address,
                    city:booking.Spot.city,
                    state:booking.Spot.state,
                    country:booking.Spot.country,
                    lat:booking.Spot.lat,
                    lng:booking.Spot.lng,
                    name:booking.Spot.name,
                    price:booking.Spot.price,
                    previewImage: previewImage
                },
                ReviewImages: booking.ReviewImages,
                userId:booking.userId,
                startDate:booking.startDate,
                endDate:booking.endDate,
                createdAt:booking.createdAt,
                updatedAt:booking.updatedAt
            };

            acc.push(bookingData);
            return acc;
        }, []);
        return res.status(200).json({
            Bookings: result})
    }catch(err){
        next(err)
    }
} )

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
//Edit a booking
router.put('/:bookingId', requireAuth,validatebooking,async(req,res,next)=>{
    try{

        const { startDate, endDate } = req.body;
        const bookingId = parseInt(req.params.bookingId, 10);

        const userId = req.user.id;
        if (new Date(endDate) <= new Date(startDate)) {
            return res.status(400).json({
                message: 'Bad Request',
                errors: {
                    endDate: "endDate cannot be on or before startDate"
                }
            });
        }

        const bookings= await Booking.findByPk(bookingId);
        if (!bookings) {
            return res.status(404).json({
                message: "Booking couldn't be found"
            });
        }
        if(bookings.userId !== userId){
            return res.status(403).json({ message: "Past bookings can't be modified" });
        }

        const conflictingBooking = await Booking.findOne({
            where: {
                id: { [Op.ne]: bookingId },
                spotId: bookings.spotId,
                [Op.or]: [
                    { startDate: { [Op.between]: [startDate, endDate] } },
                    { endDate: { [Op.between]: [startDate, endDate] } },
                    { [Op.and]: [{ startDate: { [Op.lte]: startDate } }, { endDate: { [Op.gte]: endDate } }] }
                ]
            }
        });

        if (conflictingBooking) {
            return res.status(403).json({
                message: "Sorry, this spot is already booked for the specified dates",
                errors: {
                    startDate: "Start date conflicts with an existing booking",
                    endDate: "End date conflicts with an existing booking"
                }
            });
        }

        bookings.startDate = startDate;
        bookings.endDate = endDate;
        await bookings.save();

        return res.status(200).json({
            id: bookings.id,
            spotId: bookings.spotId,
            userId: bookings.userId,
            startDate: formatDate(bookings.startDate),
            endDate: formatDate(bookings.endDate),
            createdAt: bookings.createdAt,
            updatedAt: bookings.updatedAt
        });
    }catch(err){
        next(err)
    }
})

//delete booking
router.delete('/:bookingId',requireAuth,async(req,res,next)=>{
    try{
        const bookingId = req.params.bookingId;
        const userId = req.user.id;
        const booking = await Booking.findByPk(bookingId);

        if(!booking){
            return res.status(404).json({message:"Booking couldn't be found"});
        }

        const currentDate = new Date();
        if (booking.startDate <= currentDate) {
            return res.status(403).json({ message: "Bookings that have been started can't be deleted" });
        }

        const spot = await Spot.findByPk(booking.spotId);
        if(booking.userId !== req.user.id && spot.ownerId !== req.user.id){
            return res.status(403).json({
                message: "Forbidden"
            });
        }

        const reviews = await Review.findAll({
            where:{
                bookingId
            }
        })
        for(let review of reviews){
            await ReviewImage.destory({where:{reviewId:review.id}});
            await review.destory()
        }
        await booking.destory();

        return res.json({
            message:'Successfully deleted'
        })
    }catch(err){
        next(err)
    }
})


module.exports = router;
