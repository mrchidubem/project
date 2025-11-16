// src/utils/googlePlacesService.js
// Free OpenStreetMap Nominatim API service for finding nearby pharmacies
// NO API KEY REQUIRED - 100% FREE!

/**
 * GooglePlacesService class - manages pharmacy search using OpenStreetMap
 * Note: Despite the name, this now uses OpenStreetMap's free Nominatim API
 */
class GooglePlacesService {
  constructor() {
    this.baseUrl = "https://nominatim.openstreetmap.org";
    this.overpassUrl = "https://overpass-api.de/api/interpreter";
    this.logEvent("PharmacyService initialized (using OpenStreetMap)");
  }

  /**
   * Search for nearby pharmacies using OpenStreetMap Overpass API
   * @param {Object} location - User's GPS location {latitude, longitude}
   * @param {number} radius - Search radius in meters
   * @returns {Promise<Array>} Array of pharmacy results
   */
  async searchNearbyPharmacies(location, radius) {
    try {
      this.logEvent("Searching for pharmacies", {
        location,
        radius: `${radius}m`
      });

      // Use Overpass API for better pharmacy data
      const radiusKm = radius / 1000;
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="pharmacy"](around:${radius},${location.latitude},${location.longitude});
          way["amenity"="pharmacy"](around:${radius},${location.latitude},${location.longitude});
          relation["amenity"="pharmacy"](around:${radius},${location.latitude},${location.longitude});
        );
        out body;
        >;
        out skel qt;
      `;

      const response = await fetch(this.overpassUrl, {
        method: "POST",
        body: query,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      });

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.elements || data.elements.length === 0) {
        this.logEvent("No pharmacies found");
        return [];
      }

      // Process and enhance results
      const pharmacies = data.elements
        .filter(element => element.tags && element.tags.amenity === "pharmacy")
        .map(element => {
          const lat = element.lat || element.center?.lat;
          const lon = element.lon || element.center?.lon;
          
          if (!lat || !lon) return null;

          const distance = this.calculateDistance(
            location.latitude,
            location.longitude,
            lat,
            lon
          );

          // Extract pharmacy information
          const tags = element.tags || {};
          const name = tags.name || tags.brand || "Pharmacy";
          const address = this.formatAddress(tags);
          const phone = tags.phone || tags["contact:phone"] || null;
          const website = tags.website || tags["contact:website"] || null;
          const openingHours = tags.opening_hours || null;
          
          // Determine if open now (basic check)
          let isOpenNow = null;
          if (openingHours) {
            if (openingHours.includes("24/7") || openingHours.includes("24 hours")) {
              isOpenNow = true;
            }
          }

          return {
            place_id: element.id,
            name: name,
            vicinity: address,
            formatted_address: address,
            lat: lat,
            lon: lon,
            distance: distance,
            distanceFormatted: this.formatDistance(distance),
            phone: phone,
            website: website,
            opening_hours: openingHours ? { open_now: isOpenNow, weekday_text: [openingHours] } : null,
            business_status: "OPERATIONAL",
            tags: tags
          };
        })
        .filter(pharmacy => pharmacy !== null);

      // Sort by distance
      pharmacies.sort((a, b) => a.distance - b.distance);

      this.logEvent("Pharmacies found", { count: pharmacies.length });
      return pharmacies;

    } catch (error) {
      this.logEvent("Search error", { error: error.message, level: "error" });
      throw error;
    }
  }

  /**
   * Format address from OSM tags
   * @param {Object} tags - OSM tags
   * @returns {string} Formatted address
   */
  formatAddress(tags) {
    const parts = [];
    
    if (tags["addr:housenumber"]) parts.push(tags["addr:housenumber"]);
    if (tags["addr:street"]) parts.push(tags["addr:street"]);
    if (tags["addr:suburb"]) parts.push(tags["addr:suburb"]);
    if (tags["addr:city"]) parts.push(tags["addr:city"]);
    if (tags["addr:state"]) parts.push(tags["addr:state"]);
    if (tags["addr:postcode"]) parts.push(tags["addr:postcode"]);
    
    return parts.length > 0 ? parts.join(", ") : "Address not available";
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
   * Format distance for display
   * @param {number} distance - Distance in kilometers
   * @returns {string} Formatted distance string
   */
  formatDistance(distance) {
    return distance < 1 
      ? `${Math.round(distance * 1000)} m`
      : `${distance.toFixed(1)} km`;
  }

  /**
   * Log service events
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  logEvent(message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      component: "PharmacyService",
      message,
      ...data
    };

    const level = data.level || "info";
    switch (level) {
      case "error":
        console.error(`[PharmacyService] ${message}`, logEntry);
        break;
      case "warn":
        console.warn(`[PharmacyService] ${message}`, logEntry);
        break;
      default:
        console.log(`[PharmacyService] ${message}`, logEntry);
    }

    // Store logs for debugging
    if (!window.__pharmacyServiceLogs) {
      window.__pharmacyServiceLogs = [];
    }
    window.__pharmacyServiceLogs.push(logEntry);
    if (window.__pharmacyServiceLogs.length > 50) {
      window.__pharmacyServiceLogs.shift();
    }
  }

  /**
   * Get recent logs for debugging
   * @returns {Array}
   */
  getRecentLogs() {
    return window.__pharmacyServiceLogs || [];
  }
}

// Create and export singleton instance
const googlePlacesService = new GooglePlacesService();

export default googlePlacesService;

// Development/debugging utilities
if (typeof window !== "undefined") {
  window.__medAdherePharmacyDebug = {
    pharmacyService: googlePlacesService,
    getLogs: () => googlePlacesService.getRecentLogs()
  };
}
