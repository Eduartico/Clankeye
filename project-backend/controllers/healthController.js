import platformRegistry from '../platforms/index.js';

/**
 * Health Controller - API health and status endpoints
 */

/**
 * Basic health check
 * GET /api/health
 */
export const check = async (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
};

/**
 * Detailed health status
 * GET /api/status
 */
export const detailed = async (req, res) => {
  try {
    const platforms = platformRegistry.getAll();
    
    // Get basic platform info without full health check
    const platformStatus = platforms.map(p => ({
      name: p.name,
      displayName: p.displayName,
      enabled: p.enabled,
      region: p.region,
    }));

    res.status(200).json({
      success: true,
      data: {
        api: {
          status: 'healthy',
          version: '2.0.0',
          timestamp: new Date().toISOString(),
        },
        platforms: {
          total: platforms.length,
          enabled: platforms.filter(p => p.enabled).length,
          list: platformStatus,
        },
      },
    });
  } catch (error) {
    console.error('Error getting detailed status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export default {
  check,
  detailed,
};
