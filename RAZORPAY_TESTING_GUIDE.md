# Razorpay Test Mode Guide

Since we are using a **Test Key** (`rzp_test_...`), no real money is deducted. You can simulate successful and failed payments using Razorpay's test credentials.

## 1. How to "Pay" (Simulate Success)

When the Razorpay popup opens, choose any of the following methods:

### Option A: Test Card (Credit/Debit)
- **Card Number**: `4111 1111 1111 1111`
- **Expiry**: Any future date (e.g., `12/30`)
- **CVV**: `123`
- **OTP**: When asked for OTP, enter `123456` to succeed, or any other number to fail.

### Option B: Test UPI
- **UPI ID**: `success@razorpay` (Simulates instant success)
- **UPI ID**: `failure@razorpay` (Simulates failure)

### Option C: Netbanking
- Select any bank (e.g., **HDFC** or **SBI**).
- A simulation window will appear asking if you want the payment to **Succeed** or **Fail**. Click **Success**.

---

## 2. How to Verify in Razorpay Dashboard

To see these transactions in your Razorpay account:

1.  Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/).
2.  **Critical Step**: Ensure the toggle in the top-right corner is switched to **Test Mode** (Orange color).
    - *If it is Blue (Live Mode), you will not see these test transactions.*
3.  Go to **Transactions** in the left menu.
4.  You will see the payment with the **Payment ID** (e.g., `pay_Op...`) corresponding to the one shown in your Patient Dashboard.

## 3. Troubleshooting
- If the popup says "Invalid Key", check your `.env` file.
- If the payment succeeds but the appointment isn't booked, check the server logs (`npm run dev` terminal).

---

## 4. QR Code & Real Device Testing

### Can I scan the QR with my real PhonePe/GPay?
- **In Test Mode (Current Setup): NO.**
  - The QR code generated in test mode is **simulated**.
  - If you scan it with a real app (GPay, PhonePe), it will likely fail or show "Invalid VPA" because "success@razorpay" is not a real bank address.
  - To "test" the QR flow in Test Mode, simply select "UPI / QR" on the popup and look for the onscreen options to **Simulate Success**.

- **In Live Mode: YES.**
  - If you replace your API Keys with **Live Mode Keys**, the QR code becomes real.
  - You can scan it with your phone, and **real money will be deducted**.

### Does the QR code change?
- **Yes.** Every time you click "Pay", a unique **Order ID** is created (e.g., `order_EKxyz...`).
- The QR code is dynamically generated for that specific order and amount. It is not a static image.

