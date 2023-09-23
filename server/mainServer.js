const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const app = express();
const port = 3001; // Change this to any desired port number

app.use(bodyParser.json());
app.use(cors());

// API endpoint to perform the search operation
app.get('/api/search', (req, res) => {
  const key = req.query.key;
  const value = req.query.value;

  if (!key || !value) {
    return res.status(400).json({ error: 'Both key and value are required.' });
  }

  fs.readFile('./data.json', 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Error reading data from JSON file.' });
    }

    try {
      const jsonData = JSON.parse(data);
      const results = findDataByKeyValue(jsonData, key, value);
      return res.json(results);
    } catch (error) {
      return res.status(500).json({ error: error.message});
    }
  });
});


// API endpoint to get the best food truck
app.get('/api/best-truck', (req, res) => {
    const userLatitude = parseFloat(req.query.lat);
    const userLongitude = parseFloat(req.query.lon);
  
    if (isNaN(userLatitude) || isNaN(userLongitude)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }
  

    fs.readFile('./data.json', 'utf8', (err, data) => {
        if (err) {
          return res.status(500).json({ error: 'Error reading data from JSON file.' });
        }
        const foodTrucks = JSON.parse(data);
        const bestTruck = findBestTruck(userLatitude, userLongitude, foodTrucks);
        if (bestTruck) {
        res.json(bestTruck);
        } else {
        res.status(404).json({ message: 'No approved food trucks found.' });
        }
    });
  });


  // In-memory data store to simulate food truck storage
let foodTrucks = [];


// API endpoint to add or update a food truck
app.post('/api/add-truck', (req, res) => {
  const { id, name, facilityType, address, foodItems, expiryDate, status } = req.body;

  if (!id || !name || !facilityType || !address || !foodItems || !expiryDate || !status) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const existingTruckIndex = foodTrucks.findIndex((truck) => truck.locationid === id);

  if (existingTruckIndex !== -1) {
    // Update the existing food truck
    foodTrucks[existingTruckIndex] = {
      id,
      name,
      facilityType,
      address,
      foodItems,
      expiryDate,
      status,
    };
    res.json({ message: 'Food truck updated successfully.' });
  } else {
    // Add a new food truck
    foodTrucks.push({
      id,
      name,
      facilityType,
      address,
      foodItems,
      expiryDate,
      status,
    });
    res.json({ message: 'Food truck added successfully.' });
  }
});


// Helper function to find data based on key-value pairs
function findDataByKeyValue(data, key, value) {
   
  if (Array.isArray(data)) {
    let results = [];
    for (const item of data) {
      if (typeof item === 'object') {
        if ((String(item[key])).toLowerCase().includes(value)) {
          results.push(item);
        } else {
          const nestedResults = findDataByKeyValue(Object.values(item), key, value);
          if (nestedResults.length > 0) {
            results = results.concat(nestedResults);
          }
        }
      }
    }
    return results;
  } else if (typeof data === 'object') {
    return findDataByKeyValue(Object.values(data), key, value);
  } else {
    return [];
  }
}

// Function to find the best food truck (replace this with your actual logic)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
  
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
  
    return distance; // Distance in km
  }
  
  function findBestTruck(userLatitude, userLongitude, foodTrucks) {

    const trucksArray = Array.isArray(foodTrucks) ? foodTrucks : Array.from(foodTrucks);

    if (foodTrucks.length === 0) {
      return null;
    }
  
    let closestTruck = null;
    let closestDistance = Infinity;

    const approvedTrucks = trucksArray.filter((truck) => truck.Status.toLowerCase() === 'approved');

    if (approvedTrucks.length === 0) {
        return null;
    }
  
    for (const truck of approvedTrucks) {
      const truckLatitude = truck.Latitude; // Replace "Latitude" with the actual field name in your data
      const truckLongitude = truck.Longitude; // Replace "Longitude" with the actual field name in your data
  
      const distance = calculateDistance(
        userLatitude,
        userLongitude,
        truckLatitude,
        truckLongitude
      );
  
      if (distance < closestDistance) {
        closestTruck = truck;
        closestDistance = distance;
      }
    }
  
    return closestTruck;
  }
  



// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
