import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, Input, Select, Alert, Badge, Skeleton, Spinner } from "./ui";
import locationService from "../utils/locationService";
import googlePlacesService from "../utils/googlePlacesService";
import pharmacyCache from "../utils/pharmacyCache";
import "./PharmacyFinder.css";

const RADIUS_OPTIONS = [1, 5, 10, 25, 50];
const DEFAULT_RADIUS = 10;
const RADIUS_STORAGE_KEY = "medadhere_pharmacy_radius";
const RATE_LIMIT_KEY = "medadhere_pharmacy_rate_limit";
const MAX_REQUESTS_PER_MINUTE = 10;
const RATE_LIMIT_WINDOW = 60000;
const MAX_RETRY_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY = 1000;

const PharmacyFinder = () => {
  const { t } = useTranslation();
  const [location, setLocation] = useState(null);
  const [country, setCountry] = useState(null);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchRadius, setSearchRadius] = useState(DEFAULT_RADIUS);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [usingCache, setUsingCache] = useState(false);
  const [cacheTimestamp, setCacheTimestamp] = useState(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualLocation, setManualLocation] = useState({ lat: "", lon: "" });
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const retryTimeoutRef = useRef(null);

  // Rate limiting check
  const checkRateLimit = () => {
    try {
      const rateLimitData = localStorage.getItem(RATE_LIMIT_KEY);
      const now = Date.now();
      
      if (!rateLimitData) {
        localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({
          requests: [now],
          windowStart: now
        }));
        return true;
      }

      const { requests, windowStart } = JSON.parse(rateLimitData);
      
      if (now - windowStart < RATE_LIMIT_WINDOW) {
        const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
        
        if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
          const oldestRequest = Math.min(...recentRequests);
          const waitTime = Math.ceil((RATE_LIMIT_WINDOW - (now - oldestRequest)) / 1000);
          setError(t("pharmacy_rate_limit_error", { seconds: waitTime }) || `Rate limit exceeded. Please wait ${waitTime} seconds.`);
          return false;
        }
        
        recentRequests.push(now);
        localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({
          requests: recentRequests,
          windowStart
        }));
        return true;
      } else {
        localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({
          requests: [now],
          windowStart: now
        }));
        return true;
      }
    } catch (err) {
      console.error("Rate limit check error:", err);
      return true;
    }
  };

  // Exponential backoff retry logic
  const retryWithBackoff = async (fn, attempt = 0) => {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= MAX_RETRY_ATTEMPTS - 1) {
        throw error;
      }

      const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS} after ${delay}ms`);
      
      setIsRetrying(true);
      setRetryCount(attempt + 1);
      
      await new Promise(resolve => {
        retryTimeoutRef.current = setTimeout(resolve, delay);
      });
      
      return retryWithBackoff(fn, attempt + 1);
    }
  };

  // Cleanup retry timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Load saved radius preference
  useEffect(() => {
    try {
      const savedRadius = localStorage.getItem(RADIUS_STORAGE_KEY);
      if (savedRadius) {
        const radius = parseInt(savedRadius, 10);
        if (RADIUS_OPTIONS.includes(radius)) {
          setSearchRadius(radius);
        }
      }
    } catch (err) {
      console.error("Error loading radius preference:", err);
    }
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      console.log("Connection restored");
    };

    const handleOffline = () => {
      setIsOffline(true);
      console.log("Connection lost - offline mode");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Save radius preference
  const handleRadiusChange = (newRadius) => {
    setSearchRadius(newRadius);
    try {
      localStorage.setItem(RADIUS_STORAGE_KEY, newRadius.toString());
    } catch (err) {
      console.error("Error saving radius preference:", err);
    }
    
    if (location && pharmacies.length > 0) {
      findPharmacies(newRadius);
    }
  };

  const findPharmacies = async (customRadius = null) => {
    setLoading(true);
    setError(null);
    setUsingCache(false);
    setCacheTimestamp(null);
    setRetryCount(0);
    setIsRetrying(false);

    if (!checkRateLimit()) {
      setLoading(false);
      return;
    }

    try {
      const userLocation = await retryWithBackoff(async () => {
        return await locationService.getCurrentLocation();
      });
      
      setLocation(userLocation);
      setShowManualEntry(false);

      if (isOffline) {
        const cachedSearch = pharmacyCache.getCachedResults(userLocation);
        if (cachedSearch) {
          setPharmacies(cachedSearch.results);
          setCountry(cachedSearch.location.country);
          setUsingCache(true);
          setCacheTimestamp(cachedSearch.timestamp);
          console.log("Using cached results (offline mode)");
          return;
        } else {
          throw new Error(t("pharmacy_offline_no_cache") || "No cached results available offline");
        }
      }

      const detectedCountry = await retryWithBackoff(async () => {
        return await locationService.detectCountry(
          userLocation.latitude,
          userLocation.longitude
        );
      });
      setCountry(detectedCountry);

      // Use Google Places API to search for pharmacies
      const radiusInMeters = (customRadius !== null ? customRadius : searchRadius) * 1000;
      
      const results = await retryWithBackoff(async () => {
        return await googlePlacesService.searchNearbyPharmacies(
          userLocation,
          radiusInMeters
        );
      });

      setPharmacies(results);

      if (results.length > 0) {
        pharmacyCache.cacheResults(
          {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            country: detectedCountry
          },
          results,
          customRadius !== null ? customRadius : searchRadius
        );
        console.log(`Cached ${results.length} pharmacy results`);
      }
    } catch (err) {
      console.error("Error finding pharmacies:", err);
      
      if (err.code === 1) {
        setError(t("pharmacy_permission_denied") || "Location permission denied. Please enable location access or enter your location manually.");
        setShowManualEntry(true);
      } else if (err.code === 2) {
        setError(t("pharmacy_location_unavailable") || "Unable to determine your location. Please try again or enter your location manually.");
        setShowManualEntry(true);
      } else if (err.code === 3) {
        setError(t("pharmacy_location_timeout") || "Location request timed out. Please try again.");
      } else {
        if (location) {
          const cachedSearch = pharmacyCache.getCachedResults(location);
          if (cachedSearch) {
            setPharmacies(cachedSearch.results);
            setCountry(cachedSearch.location.country);
            setUsingCache(true);
            setCacheTimestamp(cachedSearch.timestamp);
            setError(t("pharmacy_using_cached_fallback") || "Using cached results due to connection error");
            console.log("Using cached results as fallback");
            return;
          }
        }
        
        setError(err.message || t("pharmacy_unknown_error") || "An unexpected error occurred");
      }
    } finally {
      setLoading(false);
      setIsRetrying(false);
      setRetryCount(0);
    }
  };

  // Handle manual location search
  const handleManualLocationSearch = async () => {
    const lat = parseFloat(manualLocation.lat);
    const lon = parseFloat(manualLocation.lon);

    if (isNaN(lat) || isNaN(lon)) {
      setError(t("pharmacy_invalid_coordinates") || "Please enter valid coordinates");
      return;
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setError(t("pharmacy_invalid_coordinates") || "Coordinates out of range");
      return;
    }

    setLoading(true);
    setError(null);
    setUsingCache(false);
    setCacheTimestamp(null);

    if (!checkRateLimit()) {
      setLoading(false);
      return;
    }

    try {
      const userLocation = { latitude: lat, longitude: lon };
      setLocation(userLocation);
      setShowManualEntry(false);

      const detectedCountry = await retryWithBackoff(async () => {
        return await locationService.detectCountry(lat, lon);
      });
      setCountry(detectedCountry);

      // Use Google Places API to search for pharmacies
      const radiusInMeters = searchRadius * 1000;
      
      const results = await retryWithBackoff(async () => {
        return await googlePlacesService.searchNearbyPharmacies(
          userLocation,
          radiusInMeters
        );
      });

      setPharmacies(results);

      if (results.length > 0) {
        pharmacyCache.cacheResults(
          {
            latitude: lat,
            longitude: lon,
            country: detectedCountry
          },
          results,
          searchRadius
        );
      }
    } catch (err) {
      console.error("Error with manual location:", err);
      setError(err.message || t("pharmacy_unknown_error") || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Expand radius
  const handleExpandRadius = () => {
    const currentIndex = RADIUS_OPTIONS.indexOf(searchRadius);
    if (currentIndex < RADIUS_OPTIONS.length - 1) {
      const newRadius = RADIUS_OPTIONS[currentIndex + 1];
      handleRadiusChange(newRadius);
    }
  };

  return (
    <div className="pharmacy-finder">
      {/* Header */}
      <div className="pharmacy-finder__header">
        <h1 className="pharmacy-finder__title">{t("pharmacy_finder_title") || "Pharmacy Finder"}</h1>
        <p className="pharmacy-finder__subtitle">
          {t("pharmacy_finder_description") || "Find nearby pharmacies using your location."}
        </p>
      </div>

      {/* Status Alerts */}
      {isOffline && (
        <Alert variant="warning" className="pharmacy-finder__alert">
          ⚠️ {t("pharmacy_offline_mode") || "Offline mode - cached results only"}
        </Alert>
      )}

      {isRetrying && retryCount > 0 && (
        <Alert variant="info" className="pharmacy-finder__alert">
          🔄 {t("pharmacy_retrying", { count: retryCount, max: MAX_RETRY_ATTEMPTS }) || `Retrying... (Attempt ${retryCount}/${MAX_RETRY_ATTEMPTS})`}
        </Alert>
      )}

      {/* Sticky Filter Bar */}
      <div className="filter-bar">
        <div className="filter-bar__content">
          <div className="filter-bar__radius">
            <label htmlFor="radius-selector" className="filter-bar__label">
              {t("search_radius") || "Search Radius"}:
            </label>
            <Select
              id="radius-selector"
              value={searchRadius}
              onChange={(e) => handleRadiusChange(parseInt(e.target.value, 10))}
              disabled={loading}
            >
              <option value="" disabled>
                {t("select_radius") || "Select radius"}
              </option>
              {RADIUS_OPTIONS.map((radius) => (
                <option key={radius} value={radius}>
                  {radius} km
                </option>
              ))}
            </Select>
          </div>

          <Button
            onClick={() => findPharmacies()}
            disabled={loading}
            variant="primary"
            loading={loading}
          >
            {loading ? (t("pharmacy_loading_location") || "Searching...") : (t("pharmacy_search") || "Find Pharmacies")}
          </Button>
        </div>

        {country && !loading && (
          <div className="filter-bar__info">
            📍 {t("pharmacy_country_detected", { country }) || `Searching in ${country}`}
          </div>
        )}
      </div>

      {/* Manual Location Entry */}
      {showManualEntry && (
        <Card className="manual-entry">
          
            <div className="manual-entry__header">
              <h3 className="manual-entry__title">
                📍 {t("pharmacy_manual_location_entry") || "Enter Location Manually"}
              </h3>
              <p className="manual-entry__description">
                {t("pharmacy_manual_location_hint") || "Enter latitude and longitude coordinates"}
              </p>
            </div>

            <div className="manual-entry__inputs">
              <Input
                type="number"
                step="any"
                placeholder={t("pharmacy_latitude") || "Latitude"}
                value={manualLocation.lat}
                onChange={(e) => setManualLocation({ ...manualLocation, lat: e.target.value })}
              />
              <Input
                type="number"
                step="any"
                placeholder={t("pharmacy_longitude") || "Longitude"}
                value={manualLocation.lon}
                onChange={(e) => setManualLocation({ ...manualLocation, lon: e.target.value })}
              />
            </div>

            <div className="manual-entry__actions">
              <Button
                onClick={handleManualLocationSearch}
                disabled={loading}
                variant="primary"
              >
                {t("pharmacy_search") || "Search"}
              </Button>
              <Button
                onClick={() => setShowManualEntry(false)}
                variant="secondary"
              >
                {t("cancel") || "Cancel"}
              </Button>
            </div>
          
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="error" className="pharmacy-finder__alert">
          <div className="error-content">
            <div>{error}</div>
            <div className="error-actions">
              {!showManualEntry && (
                <Button
                  onClick={() => findPharmacies()}
                  disabled={loading}
                  variant="secondary"
                  size="small"
                >
                  🔄 {t("pharmacy_retry_search") || "Retry"}
                </Button>
              )}
              {(error.includes("permission") || error.includes("location")) && !showManualEntry && (
                <Button
                  onClick={() => setShowManualEntry(true)}
                  variant="primary"
                  size="small"
                >
                  📍 {t("pharmacy_use_manual_location") || "Enter Location"}
                </Button>
              )}
            </div>
          </div>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="pharmacy-list">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="pharmacy-card pharmacy-card--loading">
              
                <Skeleton height={24} width="70%" />
                <Skeleton height={16} width="90%" style={{ marginTop: "8px" }} />
                <Skeleton height={16} width="60%" style={{ marginTop: "8px" }} />
              
            </Card>
          ))}
        </div>
      )}

      {/* Pharmacy Results */}
      {!loading && pharmacies.length > 0 && (
        <div className="pharmacy-results">
          <div className="pharmacy-results__header">
            <h2 className="pharmacy-results__title">
              {t("pharmacy_results_count", { count: pharmacies.length }) || `${pharmacies.length} pharmacies found`}
            </h2>
            {usingCache && (
              <Badge variant="info">
                📦 {t("pharmacy_cached_results") || "Cached"}
              </Badge>
            )}
          </div>

          {usingCache && cacheTimestamp && (
            <p className="pharmacy-results__cache-info">
              {t("pharmacy_cached_at") || "Cached at"}: {new Date(cacheTimestamp).toLocaleString()}
            </p>
          )}

          <div className="pharmacy-list">
            {pharmacies.map((pharmacy, index) => {
              const pharmacyName = pharmacy.name;
              const address = pharmacy.vicinity || pharmacy.formatted_address || "Address not available";
              
              const isOpenNow = pharmacy.opening_hours?.open_now;
              const rating = pharmacy.rating;
              const userRatingsTotal = pharmacy.user_ratings_total;

              return (
                <Card key={pharmacy.place_id || index} className="pharmacy-card">
                  
                    <div className="pharmacy-card__header">
                      <div className="pharmacy-card__info">
                        <h3 className="pharmacy-card__name">{pharmacyName}</h3>
                        {isOpenNow !== undefined && (
                          <Badge variant={isOpenNow ? "success" : "error"}>
                            {isOpenNow ? (t("open_now") || "Open Now") : (t("closed") || "Closed")}
                          </Badge>
                        )}
                      </div>
                      <Badge variant="primary" className="pharmacy-card__distance">
                        {pharmacy.distanceFormatted || `${pharmacy.distance?.toFixed(1)} km`}
                      </Badge>
                    </div>

                    <div className="pharmacy-card__body">
                      <div className="pharmacy-card__detail">
                        <span className="pharmacy-card__icon">📍</span>
                        <span className="pharmacy-card__text">{address}</span>
                      </div>

                      {rating && (
                        <div className="pharmacy-card__detail">
                          <span className="pharmacy-card__icon">⭐</span>
                          <span className="pharmacy-card__text">
                            {rating.toFixed(1)} {userRatingsTotal && `(${userRatingsTotal} reviews)`}
                          </span>
                        </div>
                      )}

                      {pharmacy.business_status && (
                        <div className="pharmacy-card__detail">
                          <span className="pharmacy-card__icon">🏪</span>
                          <span className="pharmacy-card__text">
                            {pharmacy.business_status === "OPERATIONAL" ? "Operational" : pharmacy.business_status}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pharmacy-card__actions">
                      <Button
                        as="a"
                        href={`https://www.google.com/maps/dir/?api=1&destination=${pharmacy.lat},${pharmacy.lon}&destination_place_id=${pharmacy.place_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="primary"
                        size="small"
                        fullWidth
                      >
                        🗺️ {t("pharmacy_get_directions") || "Get Directions"}
                      </Button>
                    </div>
                  
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && pharmacies.length === 0 && location && (
        <div className="empty-state">
          <div className="empty-state__icon">🏥</div>
          <h3 className="empty-state__title">
            {t("pharmacy_no_results_found", { radius: searchRadius }) || `No pharmacies found within ${searchRadius}km`}
          </h3>
          <p className="empty-state__description">
            {t("pharmacy_no_results_expand") || "Try expanding your search radius to find more pharmacies"}
          </p>
          {searchRadius < RADIUS_OPTIONS[RADIUS_OPTIONS.length - 1] && (
            <Button
              onClick={handleExpandRadius}
              variant="accent"
            >
              🔍 {t("pharmacy_expand_radius", { radius: RADIUS_OPTIONS[RADIUS_OPTIONS.indexOf(searchRadius) + 1] }) || `Expand to ${RADIUS_OPTIONS[RADIUS_OPTIONS.indexOf(searchRadius) + 1]}km`}
            </Button>
          )}
          {searchRadius >= RADIUS_OPTIONS[RADIUS_OPTIONS.length - 1] && (
            <p className="empty-state__hint">
              {t("pharmacy_max_radius_reached") || "Already searching at maximum radius. Try a different location."}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PharmacyFinder;
