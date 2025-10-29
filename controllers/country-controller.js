const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Country = require('../model/country');
const Status = require('../model/status');
const { createSummaryImage } = require('../utils/image');

const COUNTRIES_API = process.env.EXTERNAL_COUNTRIES_API || 'https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies';
const EXCHANGE_API = process.env.EXCHANGE_RATES_API || 'https://open.er-api.com/v6/latest/USD';
const CACHE_IMAGE_PATH = process.env.CACHE_IMAGE_PATH || './cache/summary.png';

// Utility helpers
function randomMultiplier() {
  return Math.floor(Math.random() * 1001) + 1000; // 1000–2000
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// =========================================
// REFRESH: Fetch and store all countries
// =========================================
const FetchAllCountries = async (req, res) => {
  try {
    console.log('⚙️ Refresh started...');

    // Fetch from both APIs
    const [countriesResp, exchangeResp] = await Promise.all([
      axios.get(COUNTRIES_API, { timeout: 15000 }),
      axios.get(EXCHANGE_API, { timeout: 15000 })
    ]);

    const countriesData = countriesResp.data;
    const exchangeData = exchangeResp.data;
    const rates = exchangeData?.rates || {};

    if (!Array.isArray(countriesData) || Object.keys(rates).length === 0) {
      return res.status(503).json({ error: 'Invalid response from external APIs' });
    }

    console.log(`🌍 Received ${countriesData.length} countries`);

    // Prepare data for bulk upsert
    const now = new Date();
    const bulkOps = [];

    for (const c of countriesData) {
      if (!c.name || typeof c.population !== 'number' || c.population <= 0) continue;

      const currency_code = Array.isArray(c.currencies) && c.currencies[0]?.code ? c.currencies[0].code : null;
      const rate = rates[currency_code];
      const exchange_rate = rate || null;
      const multiplier = randomMultiplier();
      const estimated_gdp = exchange_rate ? (c.population * multiplier) / exchange_rate : null;

      const updateDoc = {
        name: c.name,
        capital: c.capital || null,
        region: c.region || null,
        population: c.population,
        currency_code,
        exchange_rate,
        estimated_gdp,
        flag_url: c.flag || null,
        last_refreshed_at: now
      };

      bulkOps.push({
        updateOne: {
          filter: { name: new RegExp(`^${escapeRegExp(c.name)}$`, 'i') },
          update: { $set: updateDoc },
          upsert: true
        }
      });
    }

    if (bulkOps.length === 0) {
      return res.status(500).json({ error: 'No valid countries to store' });
    }

    // Store all countries
    await Country.bulkWrite(bulkOps);
    console.log(`✅ Stored/updated ${bulkOps.length} countries`);

    // Update refresh status
    await Status.findOneAndUpdate({}, { last_refreshed_at: now }, { upsert: true });

    // Generate summary image
    const allCountries = await Country.find();
    const totalCountries = allCountries.length;

    const top5 = allCountries
      .filter(c => c.estimated_gdp)
      .sort((a, b) => b.estimated_gdp - a.estimated_gdp)
      .slice(0, 5);

    const cacheDir = path.dirname(CACHE_IMAGE_PATH);
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    await createSummaryImage({
      total: totalCountries,
      topCountries: top5.map(x => ({ name: x.name, estimated_gdp: x.estimated_gdp })),
      timestamp: now,
      outPath: CACHE_IMAGE_PATH
    });

    return res.status(200).json({
      message: 'Refresh complete',
      total_countries: totalCountries,
      last_refreshed_at: now.toISOString()
    });
  } catch (err) {
    console.error('❌ Refresh error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// =========================================
// GET: All countries (with filters/sorting)
// =========================================
const GetAllCountries = async (req, res) => {
  try {
    const { region, currency_code, sortBy, order } = req.query;

    const filter = {};
    if (region) filter.region = new RegExp(`^${region}$`, 'i');
    if (currency_code) filter.currency_code = new RegExp(`^${currency_code}$`, 'i');

    const sort = {};
    if (sortBy) sort[sortBy] = order === 'desc' ? -1 : 1;
    else sort.name = 1;

    const countries = await Country.find(filter).sort(sort);

    if (!Array.isArray(countries) || countries.length === 0)
      return res.status(404).json({ error: 'No countries found' });

    res.status(200).json(countries);
  } catch (err) {
    console.error('❌ GetAllCountries error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// =========================================
// GET: Single country
// =========================================
const GetCountryByName = async (req, res) => {
  try {
    const { name } = req.params;
    if (!name) return res.status(400).json({ error: 'Country name is required' });

    const country = await Country.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (!country) return res.status(404).json({ error: 'Country not found' });

    res.status(200).json(country);
  } catch (err) {
    console.error('❌ GetCountryByName error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// =========================================
// UPDATE: Single country
// =========================================
const UpdateCountry = async (req, res) => {
  try {
    const { name } = req.params;
    const updates = req.body;

    if (!name) return res.status(400).json({ error: 'Country name is required' });
    if (!updates || Object.keys(updates).length === 0)
      return res.status(400).json({ error: 'No update fields provided' });

    const updated = await Country.findOneAndUpdate(
      { name: new RegExp(`^${name}$`, 'i') },
      { $set: updates },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Country not found' });

    res.status(200).json({ message: '✅ Country updated successfully', country: updated });
  } catch (err) {
    console.error('❌ UpdateCountry error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// =========================================
// DELETE: Single country
// =========================================
const DeleteCountry = async (req, res) => {
  try {
    const { name } = req.params;
    if (!name) return res.status(400).json({ error: 'Country name is required' });

    const deleted = await Country.findOneAndDelete({ name: new RegExp(`^${name}$`, 'i') });
    if (!deleted) return res.status(404).json({ error: 'Country not found' });

    res.status(200).json({ message: 'Country deleted' });
  } catch (err) {
    console.error('❌ DeleteCountry error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// =========================================
// IMAGE: Serve cached summary image
// =========================================
const ServeImage = async (req, res) => {
  try {
    const imagePath = path.resolve(CACHE_IMAGE_PATH);
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: 'Summary image not found' });
    }
    res.setHeader('Content-Type', 'image/png');
    return res.sendFile(imagePath);
  } catch (err) {
    console.error('❌ ServeImage error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

module.exports = {
  FetchAllCountries,
  GetAllCountries,
  GetCountryByName,
  UpdateCountry,
  DeleteCountry,
  ServeImage
};
