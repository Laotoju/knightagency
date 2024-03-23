const mongoose=require("mongoose")

mongoose.connect("mongodb://localhost:27017/knightagency")
.then(()=>{
    console.log('mongoose connected');
})
.catch((e)=>{
    console.log('failed');
})

const logInSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    bookings: [{
        flight_number: String,
        destination: String,
        departure_date: Date,
        passenger_name: String,
        passport_number: String,
        email: String,
        phone: String
    }]
});

const LogInCollection=new mongoose.model('logincollection',logInSchema)

module.exports=LogInCollection