const express=require('express');
const router=express.Router();
const {FetchAllCountries,GetAllCountries,GetCountryByName,UpdateCountry, DeleteCountry,ServeImage}=require('../controllers/country-controller')
const path = require('path');
const fs = require('fs');
const validateCountry = require('../middleware/validateCountry')();


// POST /countries/refresh
router.post('/refresh', FetchAllCountries);

router.get('/image', async (req, res) => {
  const imagePath = path.join(__dirname, '../cache/summary.png');
  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({ error: 'Summary image not found' });
  }
  res.sendFile(imagePath);
});

 // GET /countries (filters & sort)
  router.get('/',GetAllCountries);

// // GET /countries/image
router.get('/image', ServeImage); 


// // GET /countries/:name
router.get('/:name',GetCountryByName);

router.put('/:name', validateCountry, UpdateCountry);


// // DELETE /countries/:name
router.delete('/:name', DeleteCountry);

module.exports=router;