const axios=require('axios')

const FetchAllCountries=async(req,res)=>{
    try {
        const Countryresponse= await axios.fetch('https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies',{timeout:5000})
        const Exchange_rateresponse= await axios.fetch('https://open.er-api.com/v6/latest/USD',{timeout:5000})

        const country=Countryresponse.data.item;




    } catch (error) {
        
    }
}

module.exports={
    FetchAllCountries
}