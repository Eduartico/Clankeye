import platformRegistry from '../platforms/index.js';
import searchService from '../services/searchService.js';

/**
 * Platform Controller - Handles platform management endpoints
 */

/**
 * List all platforms
 * GET /api/platforms
 */
export const list = async (req, res) => {
  try {
    const platforms = searchService.getAvailablePlatforms();
    
    res.status(200).json({
      success: true,
      data: platforms,
    });
  } catch (error) {
    console.error('Error listing platforms:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get a specific platform
 * GET /api/platforms/:name
 */
export const get = async (req, res) => {
  try {
    const { name } = req.params;
    const platform = platformRegistry.get(name);

    if (!platform) {
      return res.status(404).json({
        success: false,
        error: `Platform '${name}' not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: platform.getConfig(),
    });
  } catch (error) {
    console.error('Error getting platform:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get platform status/health
 * GET /api/platforms/:name/status
 */
export const status = async (req, res) => {
  try {
    const { name } = req.params;
    const platform = platformRegistry.get(name);

    if (!platform) {
      return res.status(404).json({
        success: false,
        error: `Platform '${name}' not found`,
      });
    }

    const healthStatus = await platform.healthCheck();

    res.status(200).json({
      success: true,
      data: {
        ...platform.getConfig(),
        health: healthStatus,
      },
    });
  } catch (error) {
    console.error('Error checking platform status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get all platforms status
 * GET /api/platforms/status/all
 */
export const allStatus = async (req, res) => {
  try {
    const statusList = await searchService.getStatus();

    res.status(200).json({
      success: true,
      data: statusList,
    });
  } catch (error) {
    console.error('Error checking all platforms status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export default {
  list,
  get,
  status,
  allStatus,
};
