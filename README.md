# Restaurant Finder for JIIT Students

**Live Demo:** [https://restaurant-finder-8rec.onrender.com](https://restaurant-finder-8rec.onrender.com)

A full-stack web application designed for students of Jaypee Institute of Information Technology (JIIT) to easily discover, explore, and bookmark nearby food spots, cafes, and restaurants around their campuses (Sector 62 & Sector 128) and other locations.

## Features

- **Geolocation & Campus Fallbacks:** Automatically uses the browser's location to find nearby spots, or defaults to specific campus coordinates if location services are unavailable.
- **Interactive Radius Search:** Discover food within an adjustable radius (up to 5 km) from your location.
- **Detailed Restaurant Info:** View full addresses, specific categories (e.g., Fast Food, Cafés, Restaurants), opening hours, and more.
- **Secure Authentication:** JWT-based user registration and login system.
- **Bookmarking System:** Save your favorite spots to your profile for quick access later.
- **Reviews and Ratings:** Authenticated users can leave 1-5 star ratings and comments on restaurants. Automatically calculates and displays average ratings and total review counts per restaurant.
- **Performance Optimized:** Uses Upstash Redis caching to minimize external API calls and ensure ultra-fast response times.

## Tech Stack

**Frontend:**
- React (Vite)
- TailwindCSS (Styling)
- React Router (Routing)
- Context API (State Management for Authentication and Geolocation)

**Backend:**
- Node.js & Express
- MongoDB (Mongoose)
- Upstash Redis (Serverless Caching)
- Geoapify Places API (Geospatial Data)
- JSON Web Tokens (JWT Authentication)

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster (or local MongoDB)
- Upstash Redis account
- Geoapify API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd restaurant-finder
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   ```
   Create a `.env` file in the `server` directory and add the following:
   ```env
   PORT=5001
   NODE_ENV=development
   
   # MongoDB Atlas
   MONGO_URI=your_mongodb_connection_string
   
   # JWT Secrets
   JWT_ACCESS_SECRET=your_jwt_access_secret
   JWT_REFRESH_SECRET=your_jwt_refresh_secret
   JWT_ACCESS_EXPIRY=15m
   JWT_REFRESH_EXPIRY=7d
   
   # Redis (Upstash)
   UPSTASH_REDIS_REST_URL=your_upstash_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
   
   # Geoapify API
   GEOAPIFY_API_KEY=your_geoapify_api_key
   
   # CORS
   CLIENT_URL=http://localhost:5173
   ```
   Start the backend server:
   ```bash
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd ../client
   npm install
   ```
   Create a `.env` file in the `client` directory (if needed):
   ```env
   VITE_API_URL=http://localhost:5001
   ```
   Start the frontend development server:
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to view the application.

## API Integration Notes
This application recently migrated from the Overpass API to the **Geoapify Places API** for location data.
- The `circle` filter is used to search within a radius, capped at a maximum of **5000 meters** per Geoapify's limits.
- The valid categories currently supported are `catering.restaurant`, `catering.cafe`, `catering.fast_food`, and `catering.food_court`.

## License
This project is open-source and available under the MIT License.
