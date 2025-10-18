const Vehicle = require('../models/Vehicle.model');
const Route = require('../models/Route.model');
const User = require('../models/User.model');
const { successResponse, errorResponse } = require('../utils/response');
const { buildPaginationResponse } = require('../middleware/queryBuilder');

/**
 * Get all vehicles with filtering
 * GET /api/coordinator/vehicles
 */
exports.getVehicles = async (req, res) => {
  try {
    const { page, limit, sort } = req.dbOptions;
    const skip = (page - 1) * limit;

    const sortOrder = Object.keys(sort).length > 0 ? sort : { vehicleId: 1 };

    const [vehicles, total] = await Promise.all([
      Vehicle.find(req.dbQuery)
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .populate('assignedCrewId', 'name email phone')
        .populate('currentRouteId', 'routeName status scheduledDate'),
      Vehicle.countDocuments(req.dbQuery),
    ]);

    const pagination = buildPaginationResponse(page, limit, total);

    return successResponse(
      res,
      'Vehicles retrieved successfully',
      vehicles,
      200,
      pagination
    );
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get single vehicle details
 * GET /api/coordinator/vehicles/:id
 */
exports.getVehicleDetails = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('assignedCrewId', 'name email phone')
      .populate('currentRouteId', 'routeName status scheduledDate');

    if (!vehicle) {
      return errorResponse(res, 'Vehicle not found', 404);
    }

    return successResponse(res, 'Vehicle details retrieved', vehicle);
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Create new vehicle
 * POST /api/coordinator/vehicles
 */
exports.createVehicle = async (req, res) => {
  try {
    const {
      vehicleId,
      licensePlate,
      vehicleType,
      capacity,
      manufacturer,
      model,
      year,
      fuelType,
      insuranceExpiryDate,
      registrationExpiryDate,
      notes,
    } = req.body;

    // Validate required fields
    if (!vehicleId || !licensePlate || !vehicleType || !capacity) {
      return errorResponse(
        res,
        'Vehicle ID, license plate, type, and capacity are required',
        400
      );
    }

    // Check if vehicleId already exists
    const existingVehicle = await Vehicle.findOne({
      $or: [
        { vehicleId: vehicleId.toUpperCase() },
        { licensePlate: licensePlate.toUpperCase() },
      ],
    });

    if (existingVehicle) {
      return errorResponse(
        res,
        'Vehicle ID or license plate already exists',
        400
      );
    }

    // Create vehicle
    const vehicle = await Vehicle.create({
      vehicleId: vehicleId.toUpperCase(),
      licensePlate: licensePlate.toUpperCase(),
      vehicleType,
      capacity,
      manufacturer,
      model,
      year,
      fuelType,
      insuranceExpiryDate: insuranceExpiryDate ? new Date(insuranceExpiryDate) : null,
      registrationExpiryDate: registrationExpiryDate ? new Date(registrationExpiryDate) : null,
      notes,
      status: 'available',
    });

    return successResponse(res, 'Vehicle created successfully', vehicle, 201);
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Update vehicle
 * PUT /api/coordinator/vehicles/:id
 */
exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return errorResponse(res, 'Vehicle not found', 404);
    }

    const {
      vehicleId,
      licensePlate,
      vehicleType,
      capacity,
      status,
      manufacturer,
      model,
      year,
      mileage,
      fuelType,
      lastMaintenanceDate,
      nextMaintenanceDate,
      insuranceExpiryDate,
      registrationExpiryDate,
      notes,
    } = req.body;

    // Check for duplicate vehicleId or licensePlate if they're being changed
    if (vehicleId && vehicleId.toUpperCase() !== vehicle.vehicleId) {
      const existing = await Vehicle.findOne({ vehicleId: vehicleId.toUpperCase() });
      if (existing) {
        return errorResponse(res, 'Vehicle ID already exists', 400);
      }
      vehicle.vehicleId = vehicleId.toUpperCase();
    }

    if (licensePlate && licensePlate.toUpperCase() !== vehicle.licensePlate) {
      const existing = await Vehicle.findOne({ licensePlate: licensePlate.toUpperCase() });
      if (existing) {
        return errorResponse(res, 'License plate already exists', 400);
      }
      vehicle.licensePlate = licensePlate.toUpperCase();
    }

    // Update fields
    if (vehicleType) vehicle.vehicleType = vehicleType;
    if (capacity) vehicle.capacity = capacity;
    if (status) vehicle.status = status;
    if (manufacturer !== undefined) vehicle.manufacturer = manufacturer;
    if (model !== undefined) vehicle.model = model;
    if (year) vehicle.year = year;
    if (mileage !== undefined) vehicle.mileage = mileage;
    if (fuelType) vehicle.fuelType = fuelType;
    if (lastMaintenanceDate) vehicle.lastMaintenanceDate = new Date(lastMaintenanceDate);
    if (nextMaintenanceDate) vehicle.nextMaintenanceDate = new Date(nextMaintenanceDate);
    if (insuranceExpiryDate) vehicle.insuranceExpiryDate = new Date(insuranceExpiryDate);
    if (registrationExpiryDate) vehicle.registrationExpiryDate = new Date(registrationExpiryDate);
    if (notes !== undefined) vehicle.notes = notes;

    await vehicle.save();

    return successResponse(res, 'Vehicle updated successfully', vehicle);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Delete vehicle
 * DELETE /api/coordinator/vehicles/:id
 */
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return errorResponse(res, 'Vehicle not found', 404);
    }

    // Check if vehicle is currently in use
    if (vehicle.status === 'in-use' && vehicle.currentRouteId) {
      return errorResponse(
        res,
        'Cannot delete vehicle that is currently assigned to a route',
        400
      );
    }

    await Vehicle.findByIdAndDelete(req.params.id);

    return successResponse(res, 'Vehicle deleted successfully', { id: req.params.id });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Update vehicle status
 * PUT /api/coordinator/vehicles/:id/status
 */
exports.updateVehicleStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['available', 'in-use', 'maintenance', 'decommissioned'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, 'Invalid status', 400);
    }

    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return errorResponse(res, 'Vehicle not found', 404);
    }

    // If changing to maintenance or decommissioned, check if it's currently in use
    if ((status === 'maintenance' || status === 'decommissioned') && vehicle.currentRouteId) {
      return errorResponse(
        res,
        'Cannot change status while vehicle is assigned to a route',
        400
      );
    }

    vehicle.status = status;

    // If changing to available, clear assignments
    if (status === 'available') {
      vehicle.assignedCrewId = null;
      vehicle.currentRouteId = null;
    }

    await vehicle.save();

    return successResponse(res, 'Vehicle status updated', {
      vehicleId: vehicle.vehicleId,
      status: vehicle.status,
    });
  } catch (error) {
    console.error('Error updating vehicle status:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Add maintenance record
 * POST /api/coordinator/vehicles/:id/maintenance
 */
exports.addMaintenanceRecord = async (req, res) => {
  try {
    const { type, description, cost, technicianName, mileageAtService, date } = req.body;

    if (!type || !description) {
      return errorResponse(res, 'Maintenance type and description are required', 400);
    }

    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return errorResponse(res, 'Vehicle not found', 404);
    }

    const maintenanceRecord = {
      date: date ? new Date(date) : new Date(),
      type,
      description,
      cost,
      technicianName,
      mileageAtService,
    };

    await vehicle.addMaintenanceRecord(maintenanceRecord);

    return successResponse(res, 'Maintenance record added successfully', vehicle);
  } catch (error) {
    console.error('Error adding maintenance record:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get available vehicles (not in use)
 * GET /api/coordinator/vehicles/available
 */
exports.getAvailableVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({
      status: { $in: ['available', 'in-use'] },
    }).select('vehicleId licensePlate vehicleType capacity status assignedCrewId currentRouteId');

    return successResponse(res, 'Available vehicles retrieved', vehicles);
  } catch (error) {
    console.error('Error fetching available vehicles:', error);
    return errorResponse(res, error.message, 500);
  }
};

