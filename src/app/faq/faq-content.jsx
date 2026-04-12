'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const faqs = [
  {
    category: 'Subscription',
    items: [
      { q: 'How do I subscribe to MyStation?', a: 'Tap the "Subscribe" button on any page. Choose your plan ($4.99/month) and complete checkout with your card. You get a 30-day free trial, and your card won\'t be charged until the trial ends.' },
      { q: 'What\'s included with a subscription?', a: 'Full access to the entire music catalog, exclusive tracks, early releases, merch discounts, and a FREE Early Bird ticket to Love on the Lawn Day 2026 (if you subscribe before April 12, 2026 and stay subscribed through the event).' },
      { q: 'How do I cancel my subscription?', a: 'Email us at mystationlive@gmail.com with the subject "Cancel Subscription" and we\'ll take care of it. You\'ll keep access through the end of your current billing period.' },
      { q: 'When am I billed?', a: 'After your 30-day free trial, you\'re billed $4.99 on the same date each month. Your card on file is charged automatically.' },
    ],
  },
  {
    category: 'Music',
    items: [
      { q: 'Why are some songs locked?', a: 'MyStation offers 2 free tracks for everyone: "I Want This One" and "R.U.N or R U Out." The full catalog (50+ tracks) is exclusively for subscribers.' },
      { q: 'How do I play music?', a: 'Tap any unlocked track to start playing. The player appears at the bottom of the screen. Use the controls to play, pause, skip, and adjust volume.' },
      { q: 'Can I download songs?', a: 'Streaming only at this time. Your subscription gives you unlimited streaming access to the full catalog.' },
    ],
  },
  {
    category: 'Merch',
    items: [
      { q: 'How long does shipping take?', a: 'Most orders ship within 3-7 business days. Delivery typically takes 5-10 business days within the US. International orders may take 2-4 weeks.' },
      { q: 'How do I track my order?', a: 'You\'ll receive a confirmation email with tracking info once your order ships. Check your email (including spam folder) for updates from our print partners.' },
      { q: 'What is the return policy?', a: 'We accept returns within 30 days for defective or damaged items. Since merch is printed on demand, we can\'t accept returns for sizing, so please check the size chart before ordering.' },
      { q: 'Do you ship internationally?', a: 'Yes! We ship worldwide. International shipping rates and delivery times vary by location.' },
    ],
  },
  {
    category: 'Account',
    items: [
      { q: 'How do I sign in?', a: 'Tap the user icon in the top navigation bar. Enter your email to sign in. If you\'re a subscriber, your access is restored automatically.' },
      { q: 'What is the access code?', a: 'The access code (MPFAMILY) gives friends and family special access to MyStation. Enter it when prompted to unlock friend-tier content.' },
      { q: 'I\'m having trouble accessing my account. What should I do?', a: 'Try clearing your browser cache and cookies, then sign in again. If the issue persists, email us at mystationlive@gmail.com and we\'ll help you out.' },
    ],
  },
  {
    category: 'LOTL Deal',
    items: [
      { q: 'How do I get a free LOTL ticket?', a: 'Subscribe to MyStation ($4.99/mo) before April 12, 2026 and remain subscribed through Love on the Lawn Day (September 5, 2026). You\'ll receive a free Early Bird ticket, a $35 value!' },
    ],
  },
  {
    category: 'General',
    items: [
      { q: 'What is MyStation?', a: 'MyStation is the official music streaming platform for IDMG (Impossible Dreamz Music Group). Stream exclusive music, shop official merch, and connect with the community, all in one place.' },
      { q: 'How do I contact support?', a: 'Email us at mystationlive@gmail.com. We typically respond within 24 hours.' },
    ],
  },
]

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-white/8">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="text-base font-medium text-white pr-4">{q}</span>
        <motion.svg
          className="w-5 h-5 text-blue-500 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-5 text-sm text-white/50 leading-relaxed">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQContent() {
  return (
    <div className="min-h-screen bg-[#020617] pt-28 pb-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-sm font-bold tracking-[0.3em] text-blue-500 uppercase mb-3">Help & FAQ</h1>
          <p className="text-3xl sm:text-4xl font-bold text-white">Questions & Answers</p>
          <p className="mt-3 text-white/40 max-w-xl mx-auto">
            Everything you need to know about MyStation
          </p>
        </div>

        {/* FAQ Sections */}
        {faqs.map((section) => (
          <div key={section.category} className="mb-8">
            <h2 className="text-xs font-bold tracking-[0.2em] text-blue-400 uppercase mb-4">
              {section.category}
            </h2>
            <div className="rounded-2xl bg-black/45 backdrop-blur-xl border border-white/8 p-6 sm:p-8 shadow-lg shadow-black/40">
              {section.items.map((faq) => (
                <FAQItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>
        ))}

        {/* Contact CTA */}
        <div className="mt-12 text-center rounded-2xl bg-black/45 backdrop-blur-xl border border-white/8 p-8">
          <h3 className="text-lg font-bold text-white mb-2">Still have questions?</h3>
          <p className="text-sm text-white/40 mb-4">
            We&apos;re here to help. Reach out anytime.
          </p>
          <a
            href="mailto:mystationlive@gmail.com"
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-8 py-3 text-sm font-bold text-white uppercase tracking-wider transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/30"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  )
}
