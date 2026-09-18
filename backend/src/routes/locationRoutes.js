const express = require('express');
const router = express.Router();
const { INDIA_LOCATIONS } = require('../config/locations');
const { success } = require('../utils/apiResponse');

// Get all states
router.get('/states', (req, res) => {
  const states = INDIA_LOCATIONS.map((l) => l.state);
  return success(res, ['All India', ...states], 'States retrieved');
});

// Get districts for a state
router.get('/districts', (req, res) => {
  const { state } = req.query;
  if (!state || state === 'All India') {
    const allDistricts = INDIA_LOCATIONS.flatMap((l) => l.districts.map((d) => d.name));
    return success(res, allDistricts, 'Districts retrieved');
  }

  const found = INDIA_LOCATIONS.find((l) => l.state.toLowerCase() === state.toLowerCase());
  const districts = found ? found.districts.map((d) => d.name) : [];
  return success(res, districts, 'Districts retrieved');
});

// Get cities for a state and/or district
router.get('/cities', (req, res) => {
  const { state, district } = req.query;

  let districtsPool = [];
  if (state && state !== 'All India') {
    const found = INDIA_LOCATIONS.find((l) => l.state.toLowerCase() === state.toLowerCase());
    if (found) {
      districtsPool = found.districts;
    }
  } else {
    districtsPool = INDIA_LOCATIONS.flatMap((l) => l.districts);
  }

  if (district) {
    const dFound = districtsPool.find((d) => d.name.toLowerCase() === district.toLowerCase());
    const cities = dFound ? dFound.cities : [];
    return success(res, cities, 'Cities retrieved');
  }

  const allCities = districtsPool.flatMap((d) => d.cities);
  return success(res, Array.from(new Set(allCities)), 'Cities retrieved');
});

module.exports = router;
