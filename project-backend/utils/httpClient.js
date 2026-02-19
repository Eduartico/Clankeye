import axios from 'axios';

/**
 * Enhanced HTTP client with retry logic and cookie support
 */
class HttpClient {
  constructor() {
    this.defaultHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
    };
    this.cookieCache = new Map();
  }

  /**
   * Make a GET request with optional retry
   */
  async get(url, options = {}) {
    const config = {
      method: 'GET',
      url,
      headers: { ...this.defaultHeaders, ...options.headers },
      params: options.params,
      timeout: options.timeout || 15000,
      maxRedirects: options.maxRedirects ?? 5,
    };

    return this.request(config, options.retries || 0);
  }

  /**
   * Make a POST request
   */
  async post(url, data, options = {}) {
    const config = {
      method: 'POST',
      url,
      headers: { ...this.defaultHeaders, ...options.headers },
      data,
      timeout: options.timeout || 15000,
    };

    return this.request(config, options.retries || 0);
  }

  /**
   * Execute request with retry logic
   */
  async request(config, retries = 0) {
    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await axios(config);
        return response;
      } catch (error) {
        lastError = error;
        
        if (attempt < retries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Fetch and cache cookies from a URL
   */
  async fetchCookies(url, forceRefresh = false) {
    const domain = new URL(url).hostname;
    
    if (!forceRefresh && this.cookieCache.has(domain)) {
      const cached = this.cookieCache.get(domain);
      // Cache for 10 minutes
      if (Date.now() - cached.timestamp < 10 * 60 * 1000) {
        return cached.cookies;
      }
    }

    try {
      const response = await axios.get(url, {
        headers: this.defaultHeaders,
        maxRedirects: 0,
        validateStatus: (status) => status < 400 || status === 302,
      });

      const cookies = response.headers['set-cookie'] || [];
      this.cookieCache.set(domain, {
        cookies,
        timestamp: Date.now(),
      });

      return cookies;
    } catch (error) {
      // Try to extract cookies even from error response
      if (error.response?.headers?.['set-cookie']) {
        const cookies = error.response.headers['set-cookie'];
        this.cookieCache.set(domain, {
          cookies,
          timestamp: Date.now(),
        });
        return cookies;
      }
      throw error;
    }
  }

  /**
   * Make a GET request with cookies
   */
  async getWithCookies(url, cookies, params = {}, options = {}) {
    const cookieString = Array.isArray(cookies) 
      ? cookies.map(c => c.split(';')[0]).join('; ')
      : cookies;

    const response = await this.get(url, {
      ...options,
      headers: {
        ...options.headers,
        'Cookie': cookieString,
      },
      params,
    });

    return response.data;
  }

  /**
   * Sleep utility for retry delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear cookie cache
   */
  clearCookies() {
    this.cookieCache.clear();
  }
}

// Export singleton instance
export const httpClient = new HttpClient();

// Also export legacy functions for backward compatibility
export const getWithCookies = async (url, cookies, params = {}) => {
  return httpClient.getWithCookies(url, cookies, params);
};

export const fetchCookies = async (url) => {
  return httpClient.fetchCookies(url);
};

export default httpClient;
