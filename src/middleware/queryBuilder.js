/**
 * OData-like Query Builder Middleware
 * Supports: filtering, sorting, pagination, field selection
 * 
 * Usage: app.get('/api/resource', buildQuery(['field1', 'field2']), controller)
 * 
 * Query Examples:
 * - /api/resource?field=value
 * - /api/resource?field[eq]=value
 * - /api/resource?field[gt]=100
 * - /api/resource?field[contains]=text
 * - /api/resource?field[in]=val1,val2,val3
 * - /api/resource?sort=field1:asc,field2:desc
 * - /api/resource?page=1&limit=20
 * - /api/resource?select=field1,field2
 */

const buildQuery = (allowedFields = []) => {
  return (req, res, next) => {
    const query = {};
    const options = {
      sort: {},
      select: '',
      page: parseInt(req.query.page) || 1,
      limit: Math.min(
        parseInt(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_SIZE) || 20,
        parseInt(process.env.MAX_PAGE_SIZE) || 100
      )
    };
    
    // Build filter query
    Object.keys(req.query).forEach(key => {
      // Skip special params
      if (['page', 'limit', 'sort', 'select', 'fields'].includes(key)) return;
      
      // Extract field name (handle both simple and operator syntax)
      const fieldMatch = key.match(/^([^\[]+)(\[(.+)\])?$/);
      if (!fieldMatch) return;
      
      const fieldName = fieldMatch[1];
      const operator = fieldMatch[3];
      
      // Check if field is allowed (if whitelist is provided)
      if (allowedFields.length > 0 && !allowedFields.includes(fieldName)) {
        return;
      }
      
      const value = req.query[key];
      
      // Handle operators
      if (operator) {
        switch(operator) {
          case 'eq':
            query[fieldName] = castValue(value);
            break;
          case 'ne':
            query[fieldName] = { $ne: castValue(value) };
            break;
          case 'gt':
            query[fieldName] = { $gt: castValue(value) };
            break;
          case 'gte':
            query[fieldName] = { $gte: castValue(value) };
            break;
          case 'lt':
            query[fieldName] = { $lt: castValue(value) };
            break;
          case 'lte':
            query[fieldName] = { $lte: castValue(value) };
            break;
          case 'contains':
            query[fieldName] = { $regex: value, $options: 'i' };
            break;
          case 'startsWith':
            query[fieldName] = { $regex: `^${value}`, $options: 'i' };
            break;
          case 'endsWith':
            query[fieldName] = { $regex: `${value}$`, $options: 'i' };
            break;
          case 'in':
            query[fieldName] = { $in: value.split(',').map(castValue) };
            break;
          case 'nin':
            query[fieldName] = { $nin: value.split(',').map(castValue) };
            break;
          case 'exists':
            query[fieldName] = { $exists: value === 'true' };
            break;
          default:
            // Unknown operator, skip
            break;
        }
      } else {
        // Default equality
        query[fieldName] = castValue(value);
      }
    });
    
    // Handle sorting
    // Format: sort=field1:asc,field2:desc
    if (req.query.sort) {
      const sortFields = req.query.sort.split(',');
      sortFields.forEach(field => {
        const parts = field.split(':');
        const fieldName = parts[0].trim();
        const order = parts[1]?.trim().toLowerCase() === 'desc' ? -1 : 1;
        
        // Check if field is allowed
        if (allowedFields.length === 0 || allowedFields.includes(fieldName)) {
          options.sort[fieldName] = order;
        }
      });
    }
    
    // Handle field selection
    // Format: select=field1,field2 or fields=field1,field2
    const selectParam = req.query.select || req.query.fields;
    if (selectParam) {
      const fields = selectParam.split(',').map(f => f.trim());
      
      // Filter allowed fields if whitelist is provided
      const allowedSelectedFields = allowedFields.length > 0
        ? fields.filter(f => allowedFields.includes(f))
        : fields;
      
      options.select = allowedSelectedFields.join(' ');
    }
    
    // Attach to request for use in controllers
    req.dbQuery = query;
    req.dbOptions = options;
    
    next();
  };
};

/**
 * Type casting helper
 * Converts string values to appropriate types
 */
function castValue(value) {
  // Null
  if (value === 'null') return null;
  
  // Boolean
  if (value === 'true') return true;
  if (value === 'false') return false;
  
  // Number
  if (!isNaN(value) && value !== '' && value.trim() === value) {
    return Number(value);
  }
  
  // Date (ISO format)
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) return date;
  }
  
  // String (default)
  return value;
}

/**
 * Helper to build pagination response
 */
const buildPaginationResponse = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    prevPage: page > 1 ? page - 1 : null
  };
};

module.exports = buildQuery;
module.exports.buildPaginationResponse = buildPaginationResponse;

