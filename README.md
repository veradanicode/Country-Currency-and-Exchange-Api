# 🌍 Country Currency & Exchange API

A RESTful API that fetches country and currency data from external sources, stores them in MongoDB, and provides CRUD operations along with exchange rate–based GDP estimations.  
Built with **Node.js**, **Express**, and **MongoDB**.

---

## 🚀 Features

- 🌐 Fetch and refresh country data from an external API  
- 💱 Fetch live exchange rates and calculate estimated GDPs  
- 🧾 CRUD operations for countries  
- 🔍 Filter and sort countries by region or currency  
- 🧩 Status endpoint showing total countries and last refresh date  
- 🖼️ Auto-generated summary image of top 5 GDP countries  
- 🧠 Secure and optimized with Helmet, CORS, and Morgan  

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-------------|
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| External APIs | [RESTCountries](https://restcountries.com/) & [ExchangeRate API](https://api.exchangerate-api.com/) |
| Utilities | dotenv, axios, helmet, cors, morgan |
| Image Processing | Jimp |

---

## ⚙️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/CountryCurrencyExchangeAPI.git
   cd CountryCurrencyExchangeAPI
   ```
2.**Install dependencies**
```bash
npm install

```
**Create a .env file in the project root:**
```bash
MONGO_URI=your_mongodb_connection_string
PORT=5000
EXTERNAL_COUNTRIES_API=https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies
EXCHANGE_RATES_API=https://api.exchangerate-api.com/v4/latest/USD
CACHE_IMAGE_PATH=./cache/summary.png
```

**Run the server**
```bash
npm start

```

**Server will run on http://localhost:5000**

📡 API Endpoints
---
🔁 Refresh Country Data
---
POST /countries/refresh
Fetches data from both external APIs and updates MongoDB.

Response:
```json
{
  "message": "Refresh complete",
  "total_countries": 248,
  "last_refreshed_at": "2025-10-29T20:30:40.995Z"
}
```
🌍 Get All Countries
---
GET /countries

Query Parameters:
```yaml
Name	Type	Description
region	string	Filter by region (e.g. Europe)
currency_code	string	Filter by currency code (e.g. USD)
sortBy	string	Sort field (e.g. population, estimated_gdp)
order	string	Sort order (asc or desc)
```
Response:
```json
{
  "total": 248,
  "countries": [...]
}
```
🔎 Get Country by Name
---
GET /countries/:name

Example:
/countries/Nigeria

Response:
```json
{
  "name": "Nigeria",
  "capital": "Abuja",
  "region": "Africa",
  "population": 206139589,
  "currency_code": "NGN",
  "exchange_rate": 1536.23,
  "estimated_gdp": 274000000000,
  "flag_url": "https://restcountries.com/data/nga.svg"
}
```
✏️ Update Country
---
PUT /countries/:name

Request Body:
```json
{
  "population": 210000000,
  "region": "West Africa"
}

```
Response:
```json
{
  "message": "✅ Country updated successfully",
  "country": { ... }
}
```
🗑️ Delete Country
---
DELETE /countries/:name

Response:
```json
{ "message": "Country deleted" }
```
📈 Get Status

GET /status

Response:
```json
{
  "total_countries": 248,
  "last_refreshed_at": "2025-10-29T20:30:40.995Z"
}
```
🖼️ Get Summary Image
---
GET /countries/image

Displays a cached summary PNG image showing total countries and top 5 GDPs.

🧠 Folder Structure
---
```json
CountryCurrencyExchangeAPI/
│
├── controllers/
│   └── country-controller.js
│
├── database/
│   └── db.js
│
├── model/
│   ├── country.js
│   └── status.js
│
├── routes/
│   └── country-routes.js
│
├── utils/
│   └── image.js
│
├── cache/
│   └── summary.png
│
├── .env
├── server.js
└── package.json
```
🧾 Example .env File
---
```bash
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/countries
PORT=5000
EXTERNAL_COUNTRIES_API=https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies
EXCHANGE_RATES_API=https://api.exchangerate-api.com/v4/latest/USD
CACHE_IMAGE_PATH=./cache/summary.png
```
🧪 Testing with Postman
---
You can test the following routes easily:
```json
Method	Endpoint	Description
POST	/countries/refresh	Fetch & store country data
GET	/countries	Retrieve all countries
GET	/countries/:name	Get one country
PUT	/countries/:name	Update country
DELETE	/countries/:name	Delete country
GET	/status	Get API status
GET	/countries/image	Get summary image
```
💡 Author
---
**Vera Daniel**
**Full-Stack Developer | Backend Wizards Cohort**
📧 veradanicode@gmail.com

🐙 GitHub: veradanicode

💼 LinkedIn: vera-daniel-4a6942299