/**
 * Printify API Client for MyStation
 * Documentation: https://developers.printify.com/docs/
 */

const PRINTIFY_API = 'https://api.printify.com/v1';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

class PrintifyClient {
  constructor(apiKey, shopId) {
    this.apiKey = apiKey;
    this.shopId = shopId;
  }

  /**
   * Sleep helper for retry delays
   */
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Core request method with retry logic and error handling
   */
  async request(endpoint, options = {}, retries = MAX_RETRIES) {
    const url = `${PRINTIFY_API}${endpoint}`;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[Printify] ${options.method || 'GET'} ${endpoint}`);

        const response = await fetch(url, {
          ...options,
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'MyStation-NextJS',
            ...options.headers
          }
        });

        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after');
          const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : RETRY_DELAY_MS * attempt;
          console.warn(`[Printify] Rate limited. Retrying in ${delay}ms (attempt ${attempt}/${retries})`);
          await this._sleep(delay);
          continue;
        }

        if (response.status >= 500 && attempt < retries) {
          console.warn(`[Printify] Server error ${response.status}. Retrying in ${RETRY_DELAY_MS * attempt}ms (attempt ${attempt}/${retries})`);
          await this._sleep(RETRY_DELAY_MS * attempt);
          continue;
        }

        if (!response.ok) {
          let errorBody;
          try {
            errorBody = await response.json();
          } catch {
            errorBody = await response.text();
          }
          const message = typeof errorBody === 'object'
            ? errorBody.message || errorBody.errors || JSON.stringify(errorBody)
            : errorBody;
          throw new Error(`Printify API error ${response.status}: ${message}`);
        }

        // 204 No Content
        if (response.status === 204) {
          return null;
        }

        const data = await response.json();
        return data;
      } catch (error) {
        if (error.message?.startsWith('Printify API error')) {
          throw error;
        }
        if (attempt < retries) {
          console.warn(`[Printify] Request failed: ${error.message}. Retrying (attempt ${attempt}/${retries})`);
          await this._sleep(RETRY_DELAY_MS * attempt);
          continue;
        }
        console.error(`[Printify] Request failed after ${retries} attempts: ${error.message}`);
        throw error;
      }
    }
  }

  // ============ SHOPS ============

  /**
   * Get all shops associated with the account
   */
  async getShops() {
    return this.request('/shops.json');
  }

  // ============ STORE PRODUCTS ============

  /**
   * Get all products in the shop (handles pagination automatically)
   */
  async getStoreProducts() {
    let all = [], page = 1;
    while (true) {
      const response = await this.request(`/shops/${this.shopId}/products.json?page=${page}&limit=100`);
      const products = response?.data || response || [];
      if (!products.length) break;
      all = all.concat(products);
      // If fewer than 100 returned, we've hit the last page
      if (products.length < 100) break;
      page++;
    }
    return all;
  }

  /**
   * Get a single product by ID
   */
  async getStoreProduct(productId) {
    return this.request(`/shops/${this.shopId}/products/${productId}.json`);
  }

  // ============ ORDERS ============

  /**
   * Create a new order, optionally send to production immediately
   * @param {Object} orderData - Order details (line_items, address_to, shipping_method, etc.)
   * @param {boolean} confirm - If true, immediately sends order to production
   */
  async createOrder(orderData, confirm = false) {
    const order = await this.request(`/shops/${this.shopId}/orders.json`, {
      method: 'POST',
      body: JSON.stringify(orderData)
    });

    if (confirm && order?.id) {
      console.log(`[Printify] Sending order ${order.id} to production`);
      await this.request(`/shops/${this.shopId}/orders/${order.id}/send_to_production.json`, {
        method: 'POST'
      });
      order.sent_to_production = true;
    }

    return order;
  }

  /**
   * Get a single order by ID
   */
  async getOrder(orderId) {
    return this.request(`/shops/${this.shopId}/orders/${orderId}.json`);
  }

  /**
   * Get all orders for the shop
   */
  async getOrders() {
    return this.request(`/shops/${this.shopId}/orders.json`);
  }

  // ============ CATALOG ============

  /**
   * Get all available blueprints from the Printify catalog
   */
  async getCatalogBlueprints() {
    return this.request('/catalog/blueprints.json');
  }

  // ============ SHIPPING ============

  /**
   * Calculate shipping rates for an order
   * @param {Object} orderData - Order data with line_items and address_to
   */
  async getShippingRates(orderData) {
    return this.request(`/shops/${this.shopId}/orders/shipping.json`, {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }
}

// Export singleton instance
export const printify = new PrintifyClient(
  process.env.PRINTIFY_API_KEY,
  process.env.PRINTIFY_SHOP_ID
);

// Export class for custom instances
export { PrintifyClient };
