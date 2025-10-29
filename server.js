require('dotenv').config()
const express=require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const connectDB=require('./database/db')
const countriesRouter = require('./routes/country-routes');
const Status=require('./model/status')
const Country=require('./model/country')

const app=express();

//middlewares
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));

//connect database
connectDB();

//routes
app.use('/countries',countriesRouter)

// status endpoint 
app.get('/status', async (req, res) => {
  try {
    const total = await Country.countDocuments();
    const statusDoc = await Status.findOne({});
    return res.json({
      total_countries: total,
      last_refreshed_at: statusDoc ? statusDoc.last_refreshed_at.toISOString() : null
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


const PORT=process.env.PORT|| 5000
app.listen(PORT,()=>{
    console.log(`Server is running  on port ${PORT}`);
})