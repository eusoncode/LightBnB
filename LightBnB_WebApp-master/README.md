# LightBnB
LightBnB is a light version of Airbnb. It allows homeowners to rent out all or a part of their homes to people on vacation, creating an alternative to hotels while providing additional source of income to property owners. Users can view property information via LightBnB app, book reservations, view their reservations, and write reviews about the stay.

## Project Structure

```
.
├── db
│   ├── json
│   └── database.js
├── public
│   ├── javascript
│   │   ├── components 
│   │   │   ├── header.js
│   │   │   ├── login_form.js
│   │   │   ├── new_property_form.js
│   │   │   ├── property_listing.js
│   │   │   ├── property_listings.js
│   │   │   ├── search_form.js
│   │   │   └── signup_form.js
│   │   ├── libraries
│   │   ├── index.js
│   │   ├── network.js
│   │   └── views_manager.js
│   ├── styles
│   │   ├── main.css
│   │   └── main.css.map
│   └── index.html
├── routes
│   ├── apiRoutes.js
│   └── userRoutes.js
├── styles  
│   ├── _forms.scss
│   ├── _header.scss
│   ├── _property-listings.scss
│   └── main.scss
├── .gitignore
├── package-lock.json
├── package.json
├── README.md
└── server.js
```
## Brief Description

* `db` contains all the database interaction code.
  * `json` is a directory that contains a bunch of dummy data in `.json` files.
  * `database.js` is responsible for all queries to the database. It doesn't currently connect to any database, all it does is return data from `.json` files.
* `public` contains all of the HTML, CSS, and client side JavaScript. 
  * `index.html` is the entry point to the application. It's the only html page because this is a single page application.
  * `javascript` contains all of the client side javascript files.
    * `index.js` starts up the application by rendering the listings.
    * `network.js` manages all ajax requests to the server.
    * `views_manager.js` manages which components appear on screen.
    * `components` contains all of the individual html components. They are all created using jQuery.
* `routes` contains the router files which are responsible for any HTTP requests to `/users/something` or `/api/something`. 
* `styles` contains all of the sass files. 
* `server.js` is the entry point to the application. This connects the routes to the database.

## LightBnB ERD
!["Screenshot of the LightBnB ERD"]()

## LightBnB Screenshots
!["Screenshot of the LightBnB Homepage"]()
!["Screenshot of the LightBnB Create_Listing page"]()
!["Screenshot of the LightBnB My_Listing page"]()
!["Screenshot of the LightBnB Search_Listing page"]()

## Getting Started
- Clone your repository onto your local device.
- Install dependencies below using the npm install command.
- Start and connect to the postgres database
- Start the web server using the npm start command. The app will be served at http://localhost:8080/.
- Go to http://localhost:8080/ in your browser to view the property listing in LightBnB.

## Dependencies
- pg
- dotenv