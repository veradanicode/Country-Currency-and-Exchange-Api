const axios = require('axios');
const fs = require('fs');
const path = require('path');

const Country = require('../model/country');
const Status = require('../model/status');
const { createSummaryImage } = require('../utils/image');

const COUNTRIES_API = process.env.EXTERNAL_COUNTRIES_API;
const EXCHANGE_API = process.env.EXCHANGE_RATES_API;
const CACHE_IMAGE_PATH = process.env.CACHE_IMAGE_PATH || './cache/summary.png';

function randomMultiplier() {
  return Math.floor(Math.random() * 1001) + 1000; // 1000–2000
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const FetchAllCountries = async (req, res) => {
  try {
    console.log('⚙️ Refresh started...');
    if (!COUNTRIES_API || !EXCHANGE_API) {
      return res.status(500).json({ error: 'Server misconfigured: external API URLs missing' });
    }

    // Fetch both external APIs
    let countriesResp, exchangeResp;
    console.log('🌍 Fetching external APIs...');
    try {
      [countriesResp, exchangeResp] = await Promise.all([
        axios.get(COUNTRIES_API, { timeout: 15000 }),
        axios.get(EXCHANGE_API, { timeout: 15000 })
      ]);
      console.log('🌍 something external APIs...');
    } catch (err) {
      console.error('External API error:', err.message);
      return res.status(503).json({
        error: 'External data source unavailable',
        details: 'Could not fetch data from Countries API or Exchange Rates API'
      });
    }

    if (!countriesResp?.data || !exchangeResp?.data) {
      return res.status(503).json({ error: 'External data source unavailable' });
    }
    console.log('🌍 huii external APIs...');
    const countriesData = countriesResp.data;
    const exchangeData = exchangeResp.data;
    const rates = exchangeData?.rates || {};

    const bulkOps = [];
    const now = new Date();

    for (const c of countriesData) {
      const name = c.name;
      const population = typeof c.population === 'number' ? c.population : null;

      if (!name || population === null || population <= 0) continue;

      let currency_code = null;
      if (Array.isArray(c.currencies) && c.currencies.length > 0) {
        currency_code = c.currencies[0]?.code || null;
      }

      let exchange_rate = null;
      let estimated_gdp = null;

      if (!currency_code) {
        exchange_rate = null;
        estimated_gdp = 0;
      } else {
        const rate = rates[currency_code];
        if (!rate) {
          exchange_rate = null;
          estimated_gdp = null;
        } else {
          exchange_rate = rate;
          const multiplier = randomMultiplier();
          estimated_gdp = exchange_rate === 0 ? null : (population * multiplier) / exchange_rate;
        }
      }

      const updateDoc = {
        name,
        capital: c.capital || null,
        region: c.region || null,
        population,
        currency_code,
        exchange_rate,
        estimated_gdp,
        flag_url: c.flag || null,
        last_refreshed_at: now
      };

      const filter = { name: new RegExp(`^${escapeRegExp(name)}$`, 'i') };

      bulkOps.push({
        updateOne: {
          filter,
          update: { $set: updateDoc },
          upsert: true
        }
      });
    }

    if (bulkOps.length > 0) {
      await Country.bulkWrite(bulkOps);
    }

    await Status.findOneAndUpdate({}, { last_refreshed_at: now }, { upsert: true });

    // Fetch data for summary
    const allCountries = await Country.find();
    const totalCountries = allCountries.length;

    const top5 = allCountries
      .filter(c => c.estimated_gdp)
      .sort((a, b) => b.estimated_gdp - a.estimated_gdp)
      .slice(0, 5);

    // Ensure cache dir exists
    const cacheDir = path.dirname(CACHE_IMAGE_PATH);
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    await createSummaryImage({
        total: totalCountries,
        topCountries: top5.map(x => ({ name: x.name, estimated_gdp: x.estimated_gdp })), // ✅ correct key
        timestamp: now,
        outPath: CACHE_IMAGE_PATH
});


    return res.json({ message: 'Refresh complete', total_countries: totalCountries, last_refreshed_at: now.toISOString() });
  } catch (err) {
    console.error('❌ Refresh error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Get all countries (with optional filters)
const GetAllCountries = async (req, res) => {
  try {
    const { region, currency_code, sortBy, order } = req.query;

    // Build filter
    const filter = {};
    if (region) filter.region = new RegExp(`^${region}$`, 'i');
    if (currency_code) filter.currency_code = new RegExp(`^${currency_code}$`, 'i');

    // Sort logic (default: name ascending)
    const sort = {};
    if (sortBy) {
      sort[sortBy] = order === 'desc' ? -1 : 1;
    } else {
      sort.name = 1;
    }

    const countries = await Country.find(filter).sort(sort);

    res.json({
      total: countries.length,
      countries
    });
  } catch (err) {
    console.error('❌ GetAllCountries error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};


// Get single country by name
const GetCountryByName = async (req, res) => {
  try {
    const { name } = req.params;

    if (!name) {
      return res.status(400).json({ error: 'Country name is required' });
    }

    // Case-insensitive match
    const country = await Country.findOne({
      name: new RegExp(`^${name}$`, 'i')
    });

    if (!country) {
      return res.status(404).json({ error: 'Country not found' });
    }

    res.json(country);
  } catch (err) {
    console.error('❌ GetCountryByName error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Update a country by name
const UpdateCountry = async (req, res) => {
  try {
    const { name } = req.params;
    const updates = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Country name is required' });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No update fields provided' });
    }

    const updatedCountry = await Country.findOneAndUpdate(
      { name: new RegExp(`^${name}$`, 'i') },
      { $set: updates },
      { new: true }
    );

    if (!updatedCountry) {
      return res.status(404).json({ error: 'Country not found' });
    }

    res.json({
      message: '✅ Country updated successfully',
      country: updatedCountry
    });
  } catch (err) {
    console.error('❌ UpdateCountry error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Delete a country by name
const DeleteCountry = async (req, res) => {
  try {
    const { name } = req.params;
    if (!name) return res.status(400).json({ error: 'Country name is required' });

    const deleted = await Country.findOneAndDelete({ name: new RegExp(`^${name}$`, 'i') });
    if (!deleted) return res.status(404).json({ error: 'Country not found' });

    return res.json({ message: 'Country deleted' });
  } catch (err) {
    console.error('❌ DeleteCountry error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

const ServeImage = async (req, res) => {
  try {
    const imagePath = path.resolve(process.env.CACHE_IMAGE_PATH || './cache/summary.png');
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: 'Summary image not found' });
    }
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
