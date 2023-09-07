const { Pool } = require('pg');
require('dotenv').config();

//Credentials to log on to the Database
const dbCredentials = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  database: process.env.DATABASE,
  port: process.env.DB_PORT
};

// Establish a connection to the Database
const pool = new Pool(dbCredentials);

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return pool
    .query(`SELECT * FROM users WHERE email like $1`, [email])
    .then((result) => {
      let resolvedUser = null;
      const user = result.rows[0];
      if (user && user.email.toLowerCase() === email.toLowerCase()) {
        resolvedUser = user;
      }
      return Promise.resolve(resolvedUser);
    })
    .catch((err) => {
      console.error('Error querying database:', err.message);
      throw err; // Rethrow the error to be handled elsewhere
    });
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool
    .query(`SELECT * FROM users WHERE id = $1`, [id])
    .then((result) => {
      let resolvedUser = null;
      const user = result.rows[0];
      if (user && user.id === id) {
        resolvedUser = user;
      }
      return Promise.resolve(resolvedUser);
    })
    .catch((err) => {
      console.error('Error querying database:', err.message);
      throw err; // Rethrow the error to be handled elsewhere
    });
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function(user) {
  return pool
    .query(`INSERT INTO users (name, email, password) 
    VALUES ($1, $2, $3) RETURNING *;`, [user.name, user.email, user.password])
    .then((result) => {
      const newUserAdded = result.rows[0];
      return Promise.resolve(newUserAdded);
    })
    .catch((err) => {
      console.error('Error adding user:', err.message);
      throw err; // Rethrow the error to be handled elsewhere
    });
};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  // Define all reservations made my guest
  const guestsReservations = `
    SELECT reservations.id, properties.title, properties.cost_per_night, reservations.start_date, AVG(property_reviews.rating) AS average_rating
    FROM reservations
    JOIN properties ON properties.id = reservations.property_id
    JOIN property_reviews ON property_reviews.property_id = properties.id
    WHERE reservations.guest_id = $1
    GROUP BY reservations.id, properties.title, reservations.start_date, properties.cost_per_night
    ORDER BY start_date ASC
    LIMIT $2;
  `;
  return pool
    .query(guestsReservations, [guest_id, limit])
    .then((result) => {
      return Promise.resolve(result.rows);
    })
    .catch((err) => {
      console.error('Error querying database:', err.message);
      throw err; // Rethrow the error to be handled elsewhere
    });
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (options, limit = 10) => {
  const queryParams = [];
  let queryString = `
    SELECT properties.*, AVG(property_reviews.rating) AS average_rating
    FROM properties
    JOIN property_reviews ON properties.id = property_id
  `;

  // Filter by city
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `  WHERE city LIKE $${queryParams.length} `;
  }

  // Filter by owner
  if (options.owner_id) {
    queryParams.push(options.owner_id);
    if (queryParams.length === 1) {
      queryString += `WHERE owner_id = $${queryParams.length} `;
    } else {
      queryString += `AND owner_id = $${queryParams.length} `;
    }
  }

  // Filter by price range (in cents)
  if (options.minimum_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100);
    if (queryParams.length === 1) {
      queryString += `WHERE cost_per_night >= $${queryParams.length} `;
    } else {
      queryString += `AND cost_per_night >= $${queryParams.length} `;
    }
  }

  if (options.maximum_price_per_night) {
    queryParams.push(options.maximum_price_per_night * 100);
    if (queryParams.length === 1) {
      queryString += `WHERE cost_per_night <= $${queryParams.length} `;
    } else {
      queryString += `AND cost_per_night <= $${queryParams.length} `;
    }
  }

  // Add grouping
  queryString += `GROUP BY properties.id `;

  // Filter by minimum_rating
  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    if (queryParams.length === 1) {
      queryString += `WHERE AVG(property_reviews.rating) >= $${queryParams.length} `;
    } else {
      queryString += `HAVING AVG(property_reviews.rating) >= $${queryParams.length} `;
    }
  }

  // Apply limit to the query
  queryParams.push(limit);

  // Add grouping, ordering, and limit
  queryString += `
    ORDER BY cost_per_night
    LIMIT $${queryParams.length};
  `;

  return pool
    .query(queryString, queryParams)
    .then((result) => {
      return Promise.resolve(result.rows)
    }) // Return the rows
    .catch((err) => {
      console.error('Error querying database:', err.message);
      throw err; // Rethrow the error to be handled elsewhere
    });
};


/**
 * Add a new property to the properties table.
 * @param {Object} property The property object to be added.
 * @return {Promise<[{}]>} A promise to the saved version of the property.
 */
const addProperty = (property) => {
  // Define the query parameters and query values
  const queryParams = [];
  const queryValues = [];

  // Convert string values to integers where needed
  property.number_of_bedrooms = parseInt(property.number_of_bedrooms, 10);
  property.number_of_bathrooms = parseInt(property.number_of_bathrooms, 10);
  property.parking_spaces = parseInt(property.parking_spaces, 10);
  property.cost_per_night = parseInt(property.cost_per_night, 10);

  // Construct the query string dynamically based on the provided property object
  let queryString = `
    INSERT INTO properties (
      owner_id,
      title,
      description,
      thumbnail_photo_url,
      cover_photo_url,
      cost_per_night,
      street,
      city,
      province,
      post_code,
      country,
      parking_spaces,
      number_of_bathrooms,
      number_of_bedrooms
    ) VALUES (
  `;

  // Define an array of column names that correspond to the properties in the object
  const columnNames = [
    'owner_id',
    'title',
    'description',
    'thumbnail_photo_url',
    'cover_photo_url',
    'cost_per_night',
    'street',
    'city',
    'province',
    'post_code',
    'country',
    'parking_spaces',
    'number_of_bathrooms',
    'number_of_bedrooms',
  ];

  // Loop through the column names and add the corresponding values to queryParams
  for (const columnName of columnNames) {
    queryParams.push(property[columnName]);
    queryValues.push(`$${queryParams.length}`);
  }

  queryString += queryValues.join(', '); // Join the values with commas
  queryString += `) RETURNING *;`; // Add RETURNING * to return the saved property

  // Execute the query and return the saved property
  return pool
    .query(queryString, queryParams)
    .then((result) => console.log(result.rows[0])) // Return the first row (saved property)
    .catch((err) => {
      console.error('Error inserting property:', err.message);
      throw err; // Rethrow the error to be handled elsewhere
    });
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
