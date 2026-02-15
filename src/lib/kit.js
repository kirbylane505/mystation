/**
 * MYSTATION - Kit (ConvertKit) Marketing Email Integration
 * Syncs subscribers to Kit for marketing campaigns
 *
 * Required env: KIT_API_SECRET
 * Free tier: 10,000 subscribers, unlimited emails
 */

const KIT_API_BASE = 'https://api.kit.com/v4';

function getHeaders() {
  const secret = process.env.KIT_API_SECRET;
  if (!secret) return null;
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${secret}`,
  };
}

/**
 * Add or update a subscriber in Kit with optional tags.
 * Tags are created automatically if they don't exist.
 *
 * @param {string} email - Subscriber email
 * @param {string} [firstName] - Subscriber first name
 * @param {string[]} [tags] - Tag names to apply (e.g. ['mystation-signup', 'merch-buyer'])
 * @returns {Promise<{success: boolean, subscriberId?: number}>}
 */
export async function addSubscriber(email, firstName, tags = []) {
  const headers = getHeaders();
  if (!headers) {
    console.warn('Kit not configured — skipping subscriber sync');
    return { success: false };
  }

  try {
    // Create/update subscriber
    const res = await fetch(`${KIT_API_BASE}/subscribers`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email_address: email.toLowerCase().trim(),
        first_name: firstName || undefined,
        state: 'active',
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Kit addSubscriber failed:', res.status, text);
      return { success: false };
    }

    const data = await res.json();
    const subscriberId = data.subscriber?.id;

    // Apply tags if any
    for (const tagName of tags) {
      await tagSubscriber(email, tagName);
    }

    return { success: true, subscriberId };
  } catch (err) {
    console.error('Kit addSubscriber error:', err);
    return { success: false };
  }
}

/**
 * Apply a tag to a subscriber by tag name.
 * Creates the tag first if it doesn't exist.
 *
 * @param {string} email - Subscriber email
 * @param {string} tagName - Tag name (e.g. 'merch-buyer')
 * @returns {Promise<{success: boolean}>}
 */
export async function tagSubscriber(email, tagName) {
  const headers = getHeaders();
  if (!headers) return { success: false };

  try {
    // Find or create the tag
    const tagId = await findOrCreateTag(tagName);
    if (!tagId) return { success: false };

    // Tag the subscriber
    const res = await fetch(`${KIT_API_BASE}/tags/${tagId}/subscribers`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email_address: email.toLowerCase().trim() }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`Kit tag "${tagName}" failed:`, res.status, text);
      return { success: false };
    }

    return { success: true };
  } catch (err) {
    console.error(`Kit tagSubscriber error (${tagName}):`, err);
    return { success: false };
  }
}

// In-memory tag ID cache (per serverless invocation)
const tagCache = new Map();

/**
 * Find a tag by name or create it. Caches tag IDs in memory.
 */
async function findOrCreateTag(tagName) {
  if (tagCache.has(tagName)) return tagCache.get(tagName);

  const headers = getHeaders();
  if (!headers) return null;

  try {
    // List tags and search for match
    const res = await fetch(`${KIT_API_BASE}/tags?per_page=100`, { headers });
    if (!res.ok) return null;

    const data = await res.json();
    const existing = (data.tags || []).find(
      t => t.name.toLowerCase() === tagName.toLowerCase()
    );

    if (existing) {
      tagCache.set(tagName, existing.id);
      return existing.id;
    }

    // Tag not found — create it
    const createRes = await fetch(`${KIT_API_BASE}/tags`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: tagName }),
    });

    if (!createRes.ok) return null;

    const created = await createRes.json();
    const newId = created.tag?.id;
    if (newId) tagCache.set(tagName, newId);
    return newId;
  } catch (err) {
    console.error('Kit findOrCreateTag error:', err);
    return null;
  }
}
