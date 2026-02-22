# Phase 1 Quick Setup & Deployment Guide

**Time to Deploy**: ~5 minutes  
**Difficulty**: Easy  
**Dependencies**: Stripe Account (free)

---

## ⚡ Quick Start (Do This Now)

### 1️⃣ Get Stripe Account (2 minutes)
```
1. Go to https://stripe.com/
2. Click "Start now" or "Sign up"
3. Create account with email
4. Verify email
5. Go to Dashboard → Developers → API Keys
6. Copy "Publishable key" (pk_test_...)
```

### 2️⃣ Add Stripe Key to Project (1 minute)
```bash
# Open or create .env.local in project root
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxx

# Replace xxxx... with your key from Stripe
```

### 3️⃣ Commit & Push (1 minute)
```bash
git add .
git commit -m "feat: add phase 1 checkout implementation"
git push origin main
```

### 4️⃣ Vercel Auto-Deploys (1 minute)
- Vercel detects your push
- Automatically installs dependencies
- Builds and deploys
- Check your Vercel dashboard for success

✅ **Done!** Your checkout is live!

---

## 🧪 Test It

**Local Testing**:
```bash
# Terminal 1: Start dev server
pnpm dev

# Browser: Go to http://localhost:5173/
# Add items to cart → Click "Proceder al Checkout"
```

**Stripe Test Card**:
- Card Number: `4242 4242 4242 4242`
- Expiry: `12/25` (any future date)
- CVC: `123` (any 3 digits)

**Expected Flow**:
1. ✅ Cart shows items
2. ✅ Click checkout button
3. ✅ Fill in shipping form
4. ✅ Enter test card (4242...)
5. ✅ Click "Pay" button
6. ✅ See success page with order number

---

## 📊 What's Working

| Feature | Status | Notes |
|---------|--------|-------|
| Checkout Page | ✅ Live | 3-step flow |
| Shipping Form | ✅ Live | Validates & saves |
| Payment Form | ✅ Live | Stripe Payment Element |
| Order Creation | ✅ Live | Supabase integration |
| Success Page | ✅ Live | Shows order details |
| Failure Page | ✅ Live | Error handling |
| Tax Calculation | ✅ Live | 19% IVA |
| Cart Integration | ✅ Live | Clears after purchase |

---

## 🔧 What's TODO (Later)

- [ ] Email confirmations (Sendgrid/Resend)
- [ ] PDF receipts
- [ ] Real Stripe webhooks
- [ ] Inventory management
- [ ] Promo codes
- [ ] Shipping methods

---

## 📁 Files Changed

**Created** (5 files):
- ✅ `src/components/checkout/ShippingForm.tsx`
- ✅ `src/components/checkout/PaymentForm.tsx`
- ✅ `src/pages/shop/CheckoutPage.tsx`
- ✅ `src/pages/shop/SuccessPage.tsx`
- ✅ `src/pages/shop/FailurePage.tsx`

**Updated** (4 files):
- ✅ `src/App.tsx` (added 3 routes)
- ✅ `src/services/orderService.ts` (enhanced)
- ✅ `package.json` (added Stripe deps)
- ✅ `.env.example` (added VITE_STRIPE_PUBLIC_KEY)

---

## 🚨 Troubleshooting

### "Stripe key is undefined"
**Fix**: Check `.env.local` has `VITE_STRIPE_PUBLIC_KEY=pk_test_...`

### "Module not found: @stripe/react-stripe-js"
**Fix**: Run `pnpm install` locally or wait for Vercel build to complete

### "Orders not saving to database"
**Fix**: Verify Supabase RLS policies allow inserts for authenticated users

### "Checkout button not showing"
**Fix**: Make sure cart has items and user is logged in

---

## 📞 Support

**Need help?**
- Check [PHASE_1_CHECKOUT_IMPLEMENTATION.md](PHASE_1_CHECKOUT_IMPLEMENTATION.md) for full details
- Check `.env.example` for required env vars
- Test with Stripe test card: `4242 4242 4242 4242`

---

## ✨ Next Phase

After Phase 1 is validated:
- Phase 2: Email notifications & receipts
- Phase 3: Admin order management
- Phase 4: Inventory management
- Phase 5: Shipping integration

**Timeline**: 12-13 weeks to production

---

**You're all set!** 🚀

Push your code and check your live site at your Vercel domain!
