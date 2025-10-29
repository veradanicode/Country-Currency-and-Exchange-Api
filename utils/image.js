// utils/summaryImage.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function createSummaryImage({ total, topCountries, timestamp }) {
  try {
    const labels = topCountries.map(c => c.name);
    const data = topCountries.map(c => c.estimated_gdp.toFixed(2));

    const chartConfig = {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'Top 5 Countries by Estimated GDP', data }],
      },
      options: {
        title: {
          display: true,
          text: `🌍 Total: ${total} | Refreshed: ${new Date(timestamp).toLocaleString()}`,
          fontSize: 18,
        },
        legend: { display: false },
      },
    };

    const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}`;

    const response = await axios.get(chartUrl, { responseType: 'arraybuffer' });

    const cacheDir = path.join(__dirname, '../cache');
    fs.mkdirSync(cacheDir, { recursive: true });
    const outPath = path.join(cacheDir, 'summary.png');
    fs.writeFileSync(outPath, response.data);

    console.log('✅ Summary image created at:', outPath);
  } catch (error) {
    console.error('⚠️ Failed to create summary image:', error.message);
  }
}

module.exports = { createSummaryImage };
