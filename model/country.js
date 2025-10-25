const mongoose=require('mongoose');

const Country=mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    capital:String,
    region:String,
    population:{
        type:Number,
        required:true
    },
    currency_code:{
        type:String,
        required:true
    },
    exchange_rate:{
        type:Number,
        required:true
    },
    estimated_gdp:{
        type:Number,
        required:true
    },
    flag_url:String,
    last_refreshed_at:{
        type:String,
        default:Date.now()
    }


})

module.exports=Country;