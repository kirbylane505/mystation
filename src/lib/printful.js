/**
 * Printful API Client for MyStation
 * Documentation: https://developers.printful.com/docs/
 */

const PRINTFUL_API = 'https://api.printful.com';

class PrintfulClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async request(endpoint, options = {}) {
    const response = await fetch(`${PRINTFUL_API}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    const data = await response.json();

    if (data.code !== 200) {
      throw new Error(data.result || 'Printful API error');
    }

    return data.result;
  }

  // ============ CATALOG ============

  /**
   * Get all products from Printful catalog
   */
  async getCatalogProducts() {
    return this.request('/products');
  }

  /**
   * Get single catalog product with variants
   */
  async getCatalogProduct(productId) {
    return this.request(`/products/${productId}`);
  }

  /**
   * Get product variant info
   */
  async getVariant(variantId) {
    return this.request(`/products/variant/${variantId}`);
  }

  // ============ STORE PRODUCTS ============

  /**
   * Get all synced products in your store
   */
  async getStoreProducts() {
    let all = [], offset = 0;
    while (true) {
      const page = await this.request(`/store/products?offset=${offset}&limit=100`);
      if (!page || page.length === 0) break;
      all = all.concat(page);
      if (page.length < 100) break;
      offset += 100;
    }
    return all;
  }

  /**
   * Get single store product with variants
   */
  async getStoreProduct(syncProductId) {
    return this.request(`/store/products/${syncProductId}`);
  }

  /**
   * Create a new sync product
   */
  async createStoreProduct(productData) {
    return this.request('/store/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }

  /**
   * Delete a sync product
   */
  async deleteStoreProduct(syncProductId) {
    return this.request(`/store/products/${syncProductId}`, {
      method: 'DELETE'
    });
  }

  // ============ ORDERS ============

  /**
   * Create a new order
   * @param {Object} orderData - Order details
   * @param {boolean} confirm - If true, order is submitted immediately
   */
  async createOrder(orderData, confirm = false) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        ...orderData,
        confirm
      })
    });
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId) {
    return this.request(`/orders/${orderId}`);
  }

  /**
   * Get order by external ID
   */
  async getOrderByExternalId(externalId) {
    return this.request(`/orders/@${externalId}`);
  }

  /**
   * Get all orders
   */
  async getOrders(status = null, offset = 0, limit = 100) {
    let endpoint = `/orders?offset=${offset}&limit=${limit}`;
    if (status) endpoint += `&status=${status}`;
    return this.request(endpoint);
  }

  /**
   * Confirm a draft order for fulfillment
   */
  async confirmOrder(orderId) {
    return this.request(`/orders/${orderId}/confirm`, {
      method: 'POST'
    });
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId) {
    return this.request(`/orders/${orderId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Estimate order costs without creating
   */
  async estimateOrderCosts(orderData) {
    return this.request('/orders/estimate-costs', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  // ============ SHIPPING ============

  /**
   * Calculate shipping rates
   */
  async getShippingRates(recipient, items) {
    return this.request('/shipping/rates', {
      method: 'POST',
      body: JSON.stringify({ recipient, items })
    });
  }

  // ============ WEBHOOKS ============

  /**
   * Get webhook configuration
   */
  async getWebhooks() {
    return this.request('/webhooks');
  }

  /**
   * Set up webhooks
   */
  async setWebhook(url, types) {
    return this.request('/webhooks', {
      method: 'POST',
      body: JSON.stringify({ url, types })
    });
  }

  /**
   * Disable webhooks
   */
  async disableWebhooks() {
    return this.request('/webhooks', {
      method: 'DELETE'
    });
  }

  // ============ STORE INFO ============

  /**
   * Get store info
   */
  async getStoreInfo() {
    return this.request('/stores');
  }
}

// Export singleton instance
export const printful = new PrintfulClient(process.env.PRINTFUL_API_KEY);

// Export class for custom instances
export { PrintfulClient };
