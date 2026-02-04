# MYSTATION SYSTEM GUIDE
## Complete Technical Documentation

**Entity:** MYSTATION LLC (Wyoming)
**EIN:** 41-4002675
**Domain:** mystationlive.com
**App:** mystation.vercel.app
**Built:** February 2, 2026

---

## TABLE OF CONTENTS

1. [System Overview](#1-system-overview)
2. [File Structure](#2-file-structure)
3. [API Routes Reference](#3-api-routes-reference)
4. [Setup Instructions](#4-setup-instructions)
5. [Printful Integration](#5-printful-integration)
6. [Running Locally](#6-running-locally)
7. [Deployment](#7-deployment)
8. [Testing the APIs](#8-testing-the-apis)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. SYSTEM OVERVIEW

MyStation is a Next.js 14 application that serves as a music streaming and merchandise platform for IDMG (Impossible Dreamz Music Group).

### Core Features
- Music streaming with track pages
- Artist dashboard for uploads
- Merchandise store (Printful print-on-demand)
- Fan zone / community
- Love on the Lawn Festival (LOTL) page
- Video content

### Tech Stack
- **Frontend:** Next.js 14, React, Tailwind CSS
- **Backend:** Next.js API Routes (serverless)
- **Hosting:** Vercel
- **Print-on-Demand:** Printful API
- **Domain:** GoDaddy (DNS pointing to Vercel)

---

## 2. FILE STRUCTURE

```
apps/mystation/
├── src/
│   ├── app/
│   │   ├── api/                    # API Routes (Backend)
│   │   │   ├── orders/
│   │   │   │   ├── route.js        # POST: Create order, GET: List orders
│   │   │   │   └── [id]/
│   │   │   │       └── route.js    # GET/POST/DELETE single order
│   │   │   ├── printful/
│   │   │   │   ├── catalog/
│   │   │   │   │   └── route.js    # GET: Browse Printful catalog
│   │   │   │   ├── estimate/
│   │   │   │   │   └── route.js    # POST: Estimate order costs
│   │   │   │   ├── products/
│   │   │   │   │   ├── route.js    # GET/POST: Store products
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── route.js # GET/DELETE single product
│   │   │   │   └── webhook/
│   │   │   │       └── route.js    # POST: Printful webhook handler
│   │   │   └── shipping/
│   │   │       └── route.js        # POST: Calculate shipping rates
│   │   ├── merch/
│   │   │   └── page.jsx            # Merchandise store page
│   │   ├── music/
│   │   │   └── page.jsx            # Music streaming page
│   │   ├── lotl/
│   │   │   └── page.jsx            # Love on the Lawn Festival
│   │   └── ... (other pages)
│   └── lib/
│       └── printful.js             # Printful API client library
├── public/
│   └── images/
│       └── merch/                  # Product images
├── .env.local                      # Environment variables (SECRET)
├── .env.example                    # Environment template
├── package.json
└── next.config.js
```

---

## 3. API ROUTES REFERENCE

### Orders API

#### `POST /api/orders` - Create Order
```javascript
// Request Body
{
  "items": [
    { "variantId": 123456, "quantity": 1, "price": 35.00 }
  ],
  "shipping": {
    "name": "John Doe",
    "address1": "123 Main St",
    "city": "Atlanta",
    "state": "GA",
    "zip": "30301",
    "country": "US"
  },
  "customer": {
    "email": "john@example.com",
    "phone": "404-555-1234"
  },
  "confirm": false  // true = submit immediately
}

// Response
{
  "success": true,
  "order": {
    "id": 12345,
    "externalId": "mystation_1706900000_abc123",
    "status": "draft",
    "costs": { "subtotal": "15.00", "shipping": "4.99", "total": "19.99" }
  }
}
```

#### `GET /api/orders` - List Orders
```
GET /api/orders                    # All orders
GET /api/orders?status=pending     # Filter by status
GET /api/orders?id=12345           # Single order by Printful ID
GET /api/orders?external_id=mystation_xxx  # By external ID
```

#### `POST /api/orders/[id]` - Confirm Order
Confirms a draft order for fulfillment (you get charged).

#### `DELETE /api/orders/[id]` - Cancel Order
Cancels an order before it ships.

---

### Products API

#### `GET /api/printful/products` - List Store Products
Returns all products synced to your Printful store.

#### `GET /api/printful/products/[id]` - Single Product
Returns product details with all variants (sizes, colors).

#### `POST /api/printful/products` - Create Product
```javascript
{
  "sync_product": {
    "name": "IDMG Classic Tee",
    "thumbnail": "https://example.com/design.png"
  },
  "sync_variants": [
    {
      "variant_id": 4011,  // Printful catalog variant
      "retail_price": "29.99",
      "files": [
        { "url": "https://example.com/design.png" }
      ]
    }
  ]
}
```

---

### Catalog API

#### `GET /api/printful/catalog` - Browse All Products
Returns Printful's full product catalog (t-shirts, hoodies, mugs, etc.)

#### `GET /api/printful/catalog?id=71` - Single Catalog Product
Returns product details with all available variants.

---

### Shipping API

#### `POST /api/shipping` - Calculate Rates
```javascript
// Request
{
  "address": {
    "zip": "30301",
    "state": "GA",
    "country": "US"
  },
  "items": [
    { "variantId": 123456, "quantity": 2 }
  ]
}

// Response
{
  "success": true,
  "rates": [
    { "id": "STANDARD", "name": "Standard", "rate": "4.99", "minDeliveryDays": 5, "maxDeliveryDays": 8 },
    { "id": "EXPRESS", "name": "Express", "rate": "12.99", "minDeliveryDays": 2, "maxDeliveryDays": 3 }
  ]
}
```

---

### Estimate API

#### `POST /api/printful/estimate` - Estimate Costs
Get order costs without creating an order.

---

### Webhook API

#### `POST /api/printful/webhook` - Receive Events
Printful sends these events:
- `package_shipped` - Order shipped with tracking
- `order_created` - Order received
- `order_updated` - Status changed
- `order_failed` - Problem with order
- `order_canceled` - Order canceled
- `product_updated` - Product changed

---

## 4. SETUP INSTRUCTIONS

### Step 1: Create Printful Account

1. Go to [printful.com](https://www.printful.com)
2. Sign up (free)
3. Dashboard → Stores → **Add Store**
4. Select **"Manual order platform / API"**
5. Name: "MyStation Merch"

### Step 2: Generate API Token

1. Go to [developers.printful.com](https://developers.printful.com/login)
2. Click **"+ Add new Token"**
3. Select store: "MyStation Merch"
4. Permissions: **Select ALL**
5. Expiration: 1 year
6. **COPY THE TOKEN** (shown only once!)

### Step 3: Add Environment Variable

**Local Development:**
```bash
# Create .env.local in apps/mystation/
echo "PRINTFUL_API_KEY=your_token_here" > .env.local
```

**Vercel (Production):**
```bash
cd apps/mystation
vercel env add PRINTFUL_API_KEY
# Paste your token when prompted
```

Or in Vercel Dashboard:
1. Project Settings → Environment Variables
2. Add: `PRINTFUL_API_KEY` = your token

### Step 4: Register Webhook

Run this once to tell Printful where to send updates:

```bash
curl -X POST https://api.printful.com/webhooks \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://mystationlive.com/api/printful/webhook",
    "types": ["package_shipped", "order_created", "order_updated", "order_failed", "order_canceled"]
  }'
```

---

## 5. PRINTFUL INTEGRATION

### Order Flow

```
Customer → MyStation Merch Page → Checkout
                 ↓
         POST /api/orders (creates draft)
                 ↓
         Payment (Stripe/CashApp)
                 ↓
         POST /api/orders/[id] (confirm)
                 ↓
         Printful prints & ships
                 ↓
         Webhook → package_shipped
                 ↓
         Customer gets tracking email
```

### Creating Products in Printful

1. Log into Printful Dashboard
2. Product Templates → Create Template
3. Choose product (T-shirt, hoodie, etc.)
4. Upload your design (IDMG logo, LOTL artwork)
5. Set print areas
6. Save to "MyStation Merch" store
7. Products appear in `GET /api/printful/products`

### Sync Variant IDs

Each product variant (size + color combo) has a unique `sync_variant_id`. Use this ID when creating orders:

```javascript
// Get all variants for a product
fetch('/api/printful/products/123456')
  .then(r => r.json())
  .then(data => {
    data.product.sync_variants.forEach(v => {
      console.log(`${v.name}: ${v.id}`);
      // "Black / S: 789001"
      // "Black / M: 789002"
      // etc.
    });
  });
```

---

## 6. RUNNING LOCALLY

### Prerequisites
- Node.js 18+
- npm or yarn

### Commands

```bash
# Navigate to app
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation

# Install dependencies (if needed)
npm install

# Start development server
npm run dev

# App runs at http://localhost:3000
```

### Test API Routes Locally

```bash
# Get products
curl http://localhost:3000/api/printful/products

# Create test order (draft mode)
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"variantId": 123, "quantity": 1}],
    "shipping": {"name": "Test", "address1": "123 Test St", "city": "Atlanta", "state": "GA", "zip": "30301"},
    "customer": {"email": "test@example.com"},
    "confirm": false
  }'
```

---

## 7. DEPLOYMENT

### Deploy to Vercel

```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation

# Deploy
vercel --prod

# Or push to GitHub and auto-deploy
git add .
git commit -m "Add Printful API routes"
git push
```

### Verify Deployment

```bash
# Test production API
curl https://mystationlive.com/api/printful/products
```

---

## 8. TESTING THE APIs

### Quick Test Script

```bash
#!/bin/bash
# Save as test-printful.sh

BASE_URL="https://mystationlive.com"
# BASE_URL="http://localhost:3000"  # for local testing

echo "=== Testing Printful APIs ==="

echo "\n1. Get Products:"
curl -s "$BASE_URL/api/printful/products" | head -c 200

echo "\n\n2. Get Catalog:"
curl -s "$BASE_URL/api/printful/catalog" | head -c 200

echo "\n\n3. Get Shipping Rates:"
curl -s -X POST "$BASE_URL/api/shipping" \
  -H "Content-Type: application/json" \
  -d '{"address":{"zip":"30301","state":"GA","country":"US"},"items":[{"variantId":1,"quantity":1}]}'

echo "\n\n=== Tests Complete ==="
```

---

## 9. TROUBLESHOOTING

### "Printful API error"

**Cause:** Invalid or expired API token
**Fix:** Generate new token at developers.printful.com

### "No products found"

**Cause:** Haven't created products in Printful dashboard yet
**Fix:** Log into Printful → Product Templates → Create products

### "sync_variant_id not found"

**Cause:** Using wrong variant ID
**Fix:** Get correct IDs from `/api/printful/products/[id]`

### "Order failed" webhook

**Possible causes:**
- Invalid shipping address
- Payment issue
- Product out of stock

**Fix:** Check Printful dashboard for specific error

### Build errors

```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

---

## QUICK REFERENCE

| Task | Command/URL |
|------|-------------|
| Start local server | `npm run dev` |
| Build for production | `npm run build` |
| Deploy | `vercel --prod` |
| Get products | `GET /api/printful/products` |
| Create order | `POST /api/orders` |
| Confirm order | `POST /api/orders/[id]` |
| Shipping rates | `POST /api/shipping` |
| Printful Dashboard | printful.com/dashboard |
| API Tokens | developers.printful.com |

---

## CONTACTS & RESOURCES

- **Printful API Docs:** https://developers.printful.com/docs/
- **Vercel Dashboard:** https://vercel.com/dashboard
- **GoDaddy DNS:** https://dcc.godaddy.com/manage/mystationlive.com/dns

---

*Generated by CHANDLA for Mike Page Empire*
*MYSTATION LLC | EIN: 41-4002675*
*February 2, 2026*
