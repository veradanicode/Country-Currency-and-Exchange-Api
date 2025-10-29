const mongoose=require('mongoose');

const Country=mongoose.Schema({
    name:{
        type:String,
        required:true,
        index:true
    },
    capital:{type:String},
    region:{type:String},
    population:{
        type:Number,
        required:true
    },
    currency_code:{
        type:String,
        required:true,
        index:true
    },
    exchange_rate:{
        type:Number,
        required:true
    },
    estimated_gdp:{
        type:Number,
        required:true
    },
    flag_url:{type:String},
    last_refreshed_at:{
        type:Date,
        default:Date.now()
    }


},{timestamps:true})

module.exports=mongoose.model('Country',Country);