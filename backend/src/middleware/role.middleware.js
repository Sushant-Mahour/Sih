/**
 * Restricts access to users with authorized roles
 * Usage: requireRole(['admin', 'district_officer'])
 */
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required before checking role permissions.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        event: 'UNAUTHORIZED_ACCESS_403',
        userId: req.user._id || req.user.id || req.user.email,
        userRole: req.user.role,
        attemptedResource: req.originalUrl || req.url,
        method: req.method,
        requiredRoles: allowedRoles,
        ip: req.ip || req.connection?.remoteAddress
      };

      console.warn(`[SECURITY AUDIT - 403 FORBIDDEN]`, JSON.stringify(logEntry));

      return res.status(403).json({
        success: false,
        error: `Access denied. Role '${req.user.role}' is not authorized. Allowed roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
}

module.exports = {
  requireRole
};
