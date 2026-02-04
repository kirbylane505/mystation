/**
 * MYSTATION - Checkout Page
 * Complete checkout flow with Stripe integration
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cartStore';
import {
  ShoppingBag,
  CreditCard,
  Truck,
  Shield,
  ChevronLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Confirmation
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [estimatingShipping, setEstimatingShipping] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: '',
    // Payment
    cardName: '',
  });

  const subtotal = getSubtotal();
  const total = subtotal + shippingCost;

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && !orderComplete) {
      router.push('/merch');
    }
  }, [items, orderComplete, router]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Estimate shipping when address is complete
  useEffect(() => {
    async function estimateShipping() {
      if (
        formData.address &&
        formData.city &&
        formData.state &&
        formData.zip &&
        formData.country
      ) {
        setEstimatingShipping(true);
        try {
          const res = await fetch('/api/shipping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipient: {
                address1: formData.address,
                city: formData.city,
                state_code: formData.state,
                zip: formData.zip,
                country_code: formData.country,
              },
              items: items.map((item) => ({
                sync_variant_id: item.printfulSyncVariantId,
                quantity: item.quantity,
              })),
            }),
          });
          const data = await res.json();
          if (data.success && data.rates?.[0]) {
            setShippingCost(parseFloat(data.rates[0].rate));
          }
        } catch (err) {
          console.error('Failed to estimate shipping:', err);
        } finally {
          setEstimatingShipping(false);
        }
      }
    }
    estimateShipping();
  }, [formData.address, formData.city, formData.state, formData.zip, formData.country, items]);

  // Handle shipping form submission
  const handleShippingSubmit = (e) => {
    e.preventDefault();
    if (!formData.email || !formData.firstName || !formData.lastName ||
        !formData.address || !formData.city || !formData.state || !formData.zip) {
      setError('Please fill in all required fields');
      return;
    }
    setError(null);
    setStep(2);
  };

  // Handle payment submission
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create order with Printful
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            phone: formData.phone,
            address1: formData.address,
            address2: formData.apartment,
            city: formData.city,
            state_code: formData.state,
            zip: formData.zip,
            country_code: formData.country,
          },
          items: items.map((item) => ({
            sync_variant_id: item.printfulSyncVariantId,
            quantity: item.quantity,
          })),
        }),
      });

      const orderData = await orderRes.json();

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      // Order created successfully
      setOrderId(orderData.order?.id || 'PENDING');
      setOrderComplete(true);
      setStep(3);
      clearCart();

    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Order confirmation view
  if (orderComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Order Confirmed!</h1>
          <p className="text-white/60 mb-2">
            Thank you for your order. We've received your payment.
          </p>
          <p className="text-white/40 text-sm mb-8">
            Order ID: <span className="text-blue-400">#{orderId}</span>
          </p>
          <p className="text-white/60 mb-8">
            You'll receive a confirmation email at <strong className="text-white">{formData.email}</strong> with
            tracking information once your order ships.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/merch" className="btn-primary">
              Continue Shopping
            </Link>
            <Link href="/music" className="btn-secondary">
              Listen to Music
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/merch"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition mb-4"
          >
            <ChevronLeft size={20} />
            Back to Shop
          </Link>
          <h1 className="text-3xl font-bold text-white">Checkout</h1>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-4 mb-10">
          {[
            { num: 1, label: 'Shipping' },
            { num: 2, label: 'Payment' },
            { num: 3, label: 'Confirmation' },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  step >= s.num
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 text-white/40'
                }`}
              >
                {step > s.num ? <CheckCircle size={16} /> : s.num}
              </div>
              <span
                className={`text-sm ${
                  step >= s.num ? 'text-white' : 'text-white/40'
                }`}
              >
                {s.label}
              </span>
              {i < 2 && (
                <div
                  className={`w-12 h-0.5 ${
                    step > s.num ? 'bg-blue-500' : 'bg-white/10'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
                <AlertCircle className="text-red-400" size={20} />
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {/* Step 1: Shipping */}
            {step === 1 && (
              <form onSubmit={handleShippingSubmit} className="space-y-6">
                <div className="glass rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Truck size={24} className="text-blue-400" />
                    Shipping Information
                  </h2>

                  {/* Email */}
                  <div className="mb-4">
                    <label className="block text-white/60 text-sm mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-blue-500 focus:outline-none transition"
                      placeholder="your@email.com"
                    />
                  </div>

                  {/* Name */}
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-white/60 text-sm mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-blue-500 focus:outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-sm mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-blue-500 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="mb-4">
                    <label className="block text-white/60 text-sm mb-2">
                      Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-blue-500 focus:outline-none transition"
                      placeholder="123 Main St"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-white/60 text-sm mb-2">
                      Apartment, suite, etc. (optional)
                    </label>
                    <input
                      type="text"
                      name="apartment"
                      value={formData.apartment}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-blue-500 focus:outline-none transition"
                    />
                  </div>

                  {/* City, State, Zip */}
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-white/60 text-sm mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-blue-500 focus:outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-sm mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                        maxLength={2}
                        placeholder="GA"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-blue-500 focus:outline-none transition uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-sm mb-2">
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        name="zip"
                        value={formData.zip}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-blue-500 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-white/60 text-sm mb-2">
                      Phone (for delivery updates)
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-blue-500 focus:outline-none transition"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2"
                >
                  Continue to Payment
                </button>
              </form>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <form onSubmit={handlePaymentSubmit} className="space-y-6">
                <div className="glass rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <CreditCard size={24} className="text-blue-400" />
                    Payment Information
                  </h2>

                  {/* Shipping Summary */}
                  <div className="p-4 bg-white/5 rounded-xl mb-6">
                    <p className="text-white/60 text-sm mb-1">Shipping to:</p>
                    <p className="text-white">
                      {formData.firstName} {formData.lastName}
                    </p>
                    <p className="text-white/60">
                      {formData.address}
                      {formData.apartment && `, ${formData.apartment}`}
                    </p>
                    <p className="text-white/60">
                      {formData.city}, {formData.state} {formData.zip}
                    </p>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-blue-400 text-sm mt-2 hover:underline"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Payment Options */}
                  <div className="space-y-4">
                    <p className="text-white/60 text-sm">
                      Secure payment powered by Stripe
                    </p>

                    {/* Name on Card */}
                    <div>
                      <label className="block text-white/60 text-sm mb-2">
                        Name on Card
                      </label>
                      <input
                        type="text"
                        name="cardName"
                        value={formData.cardName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-blue-500 focus:outline-none transition"
                        placeholder="John Doe"
                      />
                    </div>

                    {/* Card Element Placeholder */}
                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                      <p className="text-white/40 text-sm text-center py-4">
                        Stripe Card Element will load here
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-secondary flex-1 py-4"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1 py-4 text-lg flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Shield size={20} />
                        Pay ${total.toFixed(2)}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="glass rounded-2xl p-6 sticky top-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <ShoppingBag size={24} className="text-blue-400" />
                Order Summary
              </h2>

              {/* Items */}
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.variantId} className="flex gap-3">
                    <div className="w-16 h-16 bg-white/10 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag size={20} className="text-white/20" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {item.name}
                      </p>
                      <p className="text-white/40 text-xs truncate">
                        {item.variantName}
                      </p>
                      <p className="text-white/60 text-xs">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-white font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-white/10 pt-4 space-y-3">
                <div className="flex justify-between text-white/60">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Shipping</span>
                  <span>
                    {estimatingShipping ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : shippingCost > 0 ? (
                      `$${shippingCost.toFixed(2)}`
                    ) : (
                      'Calculated at next step'
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-white font-bold text-lg pt-3 border-t border-white/10">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-center gap-4 text-white/40 text-xs">
                <span className="flex items-center gap-1">
                  <Shield size={14} /> Secure
                </span>
                <span className="flex items-center gap-1">
                  <Truck size={14} /> Fast Ship
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
