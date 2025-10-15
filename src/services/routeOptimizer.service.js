/**
 * Route Optimizer Service
 * Mock route optimization algorithm for MVP
 * Prioritizes bins by fill level and sorts by proximity
 */

const { calculateDistance, calculateRouteDuration } = require('../utils/helpers');

/**
 * Optimize route based on bins and requests
 * @param {Array} bins - Array of bin objects with coordinates and fill levels
 * @param {Array} requests - Array of waste request objects with coordinates
 * @param {Object} options - Optimization options
 * @returns {Object} Optimized route with stops and metadata
 */
exports.optimizeRoute = (bins, requests, options = {}) => {
  const {
    fillLevelThreshold = 90,
    startLocation = { lat: 6.9271, lng: 79.8612 }, // Default: Colombo
    maxStops = 50
  } = options;

  const stops = [];
  
  // Filter and add high-priority bins (above threshold)
  const highPriorityBins = bins
    .filter(bin => bin.fillLevel >= fillLevelThreshold && bin.status === 'active')
    .sort((a, b) => b.fillLevel - a.fillLevel); // Sort by fill level descending
  
  highPriorityBins.forEach(bin => {
    stops.push({
      stopType: 'bin',
      referenceId: bin._id,
      address: bin.location.address || 'Unknown',
      coordinates: {
        lat: bin.location.coordinates.lat,
        lng: bin.location.coordinates.lng
      },
      fillLevel: bin.fillLevel,
      priority: bin.fillLevel >= 90 ? 'urgent' : 'high',
      status: 'pending'
    });
  });
  
  // Add approved waste requests
  const approvedRequests = requests.filter(req => 
    req.status === 'approved' && req.address.coordinates
  );
  
  approvedRequests.forEach(request => {
    stops.push({
      stopType: 'request',
      referenceId: request._id,
      address: request.address.street || 'Unknown',
      coordinates: {
        lat: request.address.coordinates.lat,
        lng: request.address.coordinates.lng
      },
      wasteType: request.wasteType,
      priority: 'normal',
      status: 'pending'
    });
  });
  
  // Limit stops to maxStops
  if (stops.length > maxStops) {
    stops.length = maxStops;
  }
  
  // Sort stops by proximity using nearest neighbor algorithm
  const sortedStops = nearestNeighborSort(stops, startLocation);
  
  // Add sequence numbers
  sortedStops.forEach((stop, index) => {
    stop.sequence = index + 1;
  });
  
  // Calculate total distance
  const totalDistance = calculateTotalDistance(sortedStops, startLocation);
  
  // Calculate estimated duration
  const estimatedDuration = calculateRouteDuration(totalDistance, sortedStops.length);
  
  return {
    stops: sortedStops,
    totalStops: sortedStops.length,
    totalDistance: Math.round(totalDistance * 100) / 100, // Round to 2 decimals
    estimatedDuration,
    metadata: {
      highPriorityBins: highPriorityBins.length,
      requests: approvedRequests.length,
      fillLevelThreshold,
      optimizationTimestamp: new Date()
    }
  };
};

/**
 * Sort stops using nearest neighbor algorithm
 * Simple greedy algorithm: always go to nearest unvisited stop
 */
function nearestNeighborSort(stops, startLocation) {
  if (stops.length === 0) return [];
  
  const sorted = [];
  const remaining = [...stops];
  let currentLocation = startLocation;
  
  while (remaining.length > 0) {
    // Find nearest stop to current location
    let nearestIndex = 0;
    let minDistance = Infinity;
    
    remaining.forEach((stop, index) => {
      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        stop.coordinates.lat,
        stop.coordinates.lng
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    });
    
    // Add nearest stop to sorted list
    const nearest = remaining.splice(nearestIndex, 1)[0];
    sorted.push(nearest);
    
    // Update current location
    currentLocation = nearest.coordinates;
  }
  
  return sorted;
}

/**
 * Calculate total route distance including return to start
 */
function calculateTotalDistance(stops, startLocation) {
  if (stops.length === 0) return 0;
  
  let totalDistance = 0;
  let currentLocation = startLocation;
  
  // Calculate distance to each stop
  stops.forEach(stop => {
    const distance = calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      stop.coordinates.lat,
      stop.coordinates.lng
    );
    totalDistance += distance;
    currentLocation = stop.coordinates;
  });
  
  // Add return distance to start (optional)
  // const returnDistance = calculateDistance(
  //   currentLocation.lat,
  //   currentLocation.lng,
  //   startLocation.lat,
  //   startLocation.lng
  // );
  // totalDistance += returnDistance;
  
  return totalDistance;
}

/**
 * Calculate route efficiency score
 * Higher score = more efficient route
 */
exports.calculateEfficiency = (route) => {
  // Factors: high fill level bins collected, distance per stop, completion rate
  const avgFillLevel = route.stops
    .filter(s => s.fillLevel)
    .reduce((sum, s) => sum + s.fillLevel, 0) / route.stops.length || 0;
  
  const distancePerStop = route.totalDistance / route.stops.length || 0;
  const completionRate = route.completionPercentage || 0;
  
  // Efficiency score (0-100)
  const score = (
    (avgFillLevel * 0.4) + // 40% weight on fill level
    (Math.max(0, 100 - distancePerStop * 10) * 0.3) + // 30% weight on distance efficiency
    (completionRate * 0.3) // 30% weight on completion
  );
  
  return Math.round(score);
};

