# 🏥 Pharmacy Finder - User Guide

## Overview

The Pharmacy Finder feature helps users locate nearby pharmacies using their GPS location. It's powered by **OpenStreetMap**, a free and open-source mapping service - **no API keys or credit cards required!**

## ✨ Features

- **GPS Location Detection** - Automatically finds your current location
- **Radius Search** - Search within 1km, 5km, 10km, 25km, or 50km
- **Real-time Results** - Shows nearby pharmacies with accurate information
- **Distance Calculation** - Displays distance from your location
- **Contact Information** - Phone numbers and websites (when available)
- **Operating Hours** - Shows pharmacy hours (when available)
- **Direct Navigation** - Click to get directions in Google Maps
- **Offline Support** - Caches results for offline access
- **Manual Location** - Enter coordinates if GPS fails

## 🚀 How to Use

### 1. Access Pharmacy Finder

- Navigate to the Pharmacy Finder page from the sidebar
- Or click the "Pharmacy Finder" icon in the navigation

### 2. Select Search Radius

- Click the "Search Radius" dropdown
- Choose your preferred radius (1km - 50km)
- Default is 10km

### 3. Find Pharmacies

- Click the "Find Pharmacies" button
- Grant location permission when prompted
- Wait for results to load (usually 2-5 seconds)

### 4. View Results

Each pharmacy card shows:
- **Name** - Pharmacy name
- **Distance** - How far away it is
- **Address** - Full address
- **Status** - Open/Closed (when available)
- **Phone** - Contact number (when available)
- **Hours** - Operating hours (when available)

### 5. Get Directions

- Click "Get Directions" on any pharmacy card
- Opens Google Maps with navigation to that pharmacy

## 🔧 Technical Details

### Data Source

- **OpenStreetMap (OSM)** - Community-driven mapping project
- **Overpass API** - Real-time OSM data query service
- **100% Free** - No API keys, no credit cards, no limits

### How It Works

1. **Location Detection**
   - Uses browser's Geolocation API
   - Gets precise GPS coordinates (latitude/longitude)
   - Accuracy typically within 10-50 meters

2. **Pharmacy Search**
   - Queries OpenStreetMap's Overpass API
   - Searches for amenity=pharmacy within radius
   - Returns all pharmacies with available data

3. **Distance Calculation**
   - Uses Haversine formula for accuracy
   - Calculates straight-line distance
   - Sorts results by proximity

4. **Caching**
   - Stores results in browser cache
   - Works offline after first search
   - Updates when online

## 📱 Browser Compatibility

Works on all modern browsers:
- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Opera
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🔒 Privacy & Permissions

### Location Permission

- Required for GPS-based search
- Only used when you click "Find Pharmacies"
- Never stored or transmitted to servers
- Can be revoked anytime in browser settings

### Data Collection

- **No personal data collected**
- **No tracking**
- **No analytics on location**
- All searches are anonymous

## 🆘 Troubleshooting

### "Location permission denied"

**Solution**: 
1. Click the location icon in your browser's address bar
2. Allow location access for this site
3. Refresh the page and try again

**Alternative**: Use manual location entry
1. Click "Enter Location Manually"
2. Enter your latitude and longitude
3. Click "Search"

### "No pharmacies found"

**Solutions**:
1. **Increase radius** - Try 25km or 50km
2. **Check location** - Verify you're in an area with pharmacies
3. **Try manual location** - GPS might be inaccurate
4. **Different area** - Some rural areas have limited data

### "Unable to fetch pharmacy data"

**Solutions**:
1. **Check internet connection**
2. **Try again** - API might be temporarily busy
3. **Use cached results** - If you've searched before
4. **Wait a moment** - Rate limiting protection

### Results seem inaccurate

**Reasons**:
- OpenStreetMap data is community-maintained
- Some areas have better coverage than others
- Data might be outdated in some regions

**What you can do**:
- Verify results with a phone call
- Contribute to OpenStreetMap to improve data
- Report issues to help improve the service

## 🌍 Data Coverage

### Best Coverage
- Urban areas in North America, Europe, Australia
- Major cities worldwide
- Well-mapped regions

### Good Coverage
- Suburban areas
- Medium-sized cities
- Tourist destinations

### Limited Coverage
- Rural areas
- Developing regions
- Recently built areas

## 💡 Tips & Best Practices

1. **Start with smaller radius** - Faster results, more relevant
2. **Grant location permission** - More accurate than manual entry
3. **Call ahead** - Verify hours and availability
4. **Save favorites** - Note down frequently visited pharmacies
5. **Check offline** - Results are cached for offline access

## 🔄 Updates & Improvements

The Pharmacy Finder uses real-time data from OpenStreetMap, which is constantly updated by contributors worldwide. Data accuracy improves over time as more people contribute.

## 🤝 Contributing to Better Data

Want to improve pharmacy data in your area?

1. Visit [OpenStreetMap.org](https://www.openstreetmap.org/)
2. Create a free account
3. Add or update pharmacy information
4. Your changes appear in MedAdhere within 24 hours!

## 📊 Performance

- **Search time**: 2-5 seconds (typical)
- **Results**: Up to 100 pharmacies per search
- **Accuracy**: Within 10-50 meters
- **Offline**: Full functionality with cached data

## 🆓 Cost

**Completely FREE!**
- No API keys required
- No credit card needed
- No usage limits
- No hidden costs
- Open-source technology

## 📞 Support

Having issues? Check:
1. Browser console for error messages
2. Location permission settings
3. Internet connection
4. This troubleshooting guide

## 🎯 Future Enhancements

Planned improvements:
- [ ] Pharmacy ratings and reviews
- [ ] Filter by services (24-hour, drive-through, etc.)
- [ ] Save favorite pharmacies
- [ ] Prescription transfer integration
- [ ] Real-time inventory checking
- [ ] Appointment booking

---

**Enjoy finding pharmacies near you with MedAdhere! 🏥💊**
