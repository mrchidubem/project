// src/utils/locationService.js
// Location and distance calculation service for Pharmacy Finder
// Implements GPS location, Haversine distance formula, and country detection

/**
 * LocationService class - manages GPS location and distance calculations
 */
class LocationService {
  constructor() {
    this.logEvent("LocationService initialized");
  }

  /**
   * Get user's current GPS location
   * @returns {Promise<{latitude: number, longitude: number}>}
   */
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = new Error("Geolocation is not supported by your browser");
        this.logEvent("Geolocation not supported", { level: "error" });
        reject(error);
        return;
      }

      this.logEvent("Requesting GPS location");
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          this.logEvent("GPS location obtained", { location });
          resolve(location);
        },
        (error) => {
          this.logEvent("GPS location failed", { 
            error: error.message,
            code: error.code,
            level: "error"
          });
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param {number} lat1 - Latitude of first point
   * @param {number} lon1 - Longitude of first point
   * @param {number} lat2 - Latitude of second point
   * @param {number} lon2 - Longitude of second point
   * @returns {number} Distance in kilometers
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  /**
   * Convert degrees to radians
   * @param {number} degrees
   * @returns {number} Radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Detect country from coordinates using reverse geocoding
   * @param {number} latitude
   * @param {number} longitude
   * @returns {Promise<string>} Country name
   */
  async detectCountry(latitude, longitude) {
    try {
      this.logEvent("Detecting country from coordinates", { latitude, longitude });
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=3&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'MedAdhere/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.status}`);
      }

      const data = await response.json();
      const country = data.address?.country || null;
      
      this.logEvent("Country detected", { country });
      return country;
    } catch (error) {
      this.logEvent("Country detection failed", { 
        error: error.message,
        level: "error"
      });
      return null;
    }
  }

  /**
   * Filter pharmacy results by distance and country
   * @param {Array} results - Array of pharmacy results
   * @param {Object} userLocation - User's GPS location {latitude, longitude}
   * @param {number} maxDistance - Maximum distance in kilometers
   * @param {string} userCountry - User's country name (optional)
   * @returns {Array} Filtered results
   */
  filterByProximity(results, userLocation, maxDistance, userCountry = null) {
    if (!results || results.length === 0) {
      return [];
    }

    this.logEvent("Filtering results by proximity", {
      totalResults: results.length,
      maxDistance,
      userCountry
    });

    // Calculate distance for each result
    const resultsWithDistance = results.map(result => {
      const distance = this.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        parseFloat(result.lat),
        parseFloat(result.lon)
      );

      return {
        ...result,
        distance: distance,
        distanceFormatted: this.formatDistance(distance)
      };
    });

    // Filter by distance
    let filtered = resultsWithDistance.filter(result => result.distance <= maxDistance);

    // Filter by country if provided
    if (userCountry) {
      filtered = filtered.filter(result => {
        const resultCountry = this.extractCountry(result.display_name);
        return resultCountry && resultCountry.toLowerCase().includes(userCountry.toLowerCase());
      });
    }

    this.logEvent("Filtering complete", {
      originalCount: results.length,
      filteredCount: filtered.length
    });

    return filtered;
  }

  /**
   * Sort pharmacy results by distance (ascending)
   * @param {Array} results - Array of pharmacy results with distance property
   * @param {Object} userLocation - User's GPS location {latitude, longitude}
   * @returns {Array} Sorted results
   */
  sortByDistance(results, userLocation) {
    if (!results || results.length === 0) {
      return [];
    }

    // Ensure all results have distance calculated
    const resultsWithDistance = results.map(result => {
      if (result.distance === undefined) {
        result.distance = this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          parseFloat(result.lat),
          parseFloat(result.lon)
        );
        result.distanceFormatted = this.formatDistance(result.distance);
      }
      return result;
    });

    // Sort by distance (closest first)
    const sorted = resultsWithDistance.sort((a, b) => a.distance - b.distance);

    this.logEvent("Results sorted by distance", {
      count: sorted.length,
      closestDistance: sorted[0]?.distance
    });

    return sorted;
  }

  /**
   * Format distance for display
   * @param {number} distance - Distance in kilometers
   * @param {string} unit - Unit system ('metric' or 'imperial')
   * @returns {string} Formatted distance string
   */
  formatDistance(distance, unit = 'metric') {
    if (unit === 'imperial') {
      const miles = distance * 0.621371;
      return miles < 1 
        ? `${Math.round(miles * 5280)} ft`
        : `${miles.toFixed(1)} mi`;
    }
    
    // Metric (default)
    return distance < 1 
      ? `${Math.round(distance * 1000)} m`
      : `${distance.toFixed(1)} km`;
  }

  /**
   * Extract country from display_name string
   * @param {string} displayName - Full address string
   * @returns {string|null} Country name
   */
  extractCountry(displayName) {
    if (!displayName) return null;
    
    // Country is typically the last part of the address
    const parts = displayName.split(',');
    return parts[parts.length - 1]?.trim() || null;
  }

  /**
   * Check if two locations are in the same country
   * @param {string} country1
   * @param {string} country2
   * @returns {boolean}
   */
  isSameCountry(country1, country2) {
    if (!country1 || !country2) return false;
    return country1.toLowerCase().trim() === country2.toLowerCase().trim();
  }

  /**
   * Get distance unit based on country
   * @param {string} country - Country name
   * @returns {string} 'metric' or 'imperial'
   */
  getDistanceUnit(country) {
    const imperialCountries = ['United States', 'USA', 'United Kingdom', 'UK', 'Liberia', 'Myanmar'];
    return imperialCountries.some(c => country?.includes(c)) ? 'imperial' : 'metric';
  }

  /**
   * Log location service events
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  logEvent(message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      component: "LocationService",
      message,
      ...data
    };

    const level = data.level || "info";
    switch (level) {
      case "error":
        console.error(`[LocationService] ${message}`, logEntry);
        break;
      case "warn":
        console.warn(`[LocationService] ${message}`, logEntry);
        break;
      default:
        console.log(`[LocationService] ${message}`, logEntry);
    }

    // Store logs for debugging
    if (!window.__locationServiceLogs) {
      window.__locationServiceLogs = [];
    }
    window.__locationServiceLogs.push(logEntry);
    if (window.__locationServiceLogs.length > 50) {
      window.__locationServiceLogs.shift();
    }
  }

  /**
   * Get recent logs for debugging
   * @returns {Array}
   */
  getRecentLogs() {
    return window.__locationServiceLogs || [];
  }
}

// Create and export singleton instance
const locationService = new LocationService();

export default locationService;

// Export individual methods for convenience
export const {
  getCurrentLocation,
  calculateDistance,
  detectCountry,
  filterByProximity,
  sortByDistance,
  formatDistance,
  getDistanceUnit,
  getRecentLogs
} = locationService;

// Development/debugging utilities
if (typeof window !== "undefined") {
  window.__medAdhereLocationDebug = {
    locationService,
    getLogs: () => locationService.getRecentLogs(),
    testDistance: (lat1, lon1, lat2, lon2) => {
      const distance = locationService.calculateDistance(lat1, lon1, lat2, lon2);
      console.log(`Distance: ${distance.toFixed(2)} km (${locationService.formatDistance(distance)})`);
      return distance;
    }
  };
}