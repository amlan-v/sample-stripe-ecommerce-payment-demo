# Application Overview

This sample application demonstrates how to accept payments with Stripe. Customers select a book, check out, and receive a confirmation showing the total charged and the Stripe PaymentIntent ID (beginning with `pi_`). Instead of redirecting to Stripe Checkout, it embeds Stripe Elements in the app's own checkout page, with the server creating the payment through the PaymentIntents API. This gives full control over the experience while Stripe handles sensitive card data.

## Prerequisites

- **Node.js**: Install it from the [Node.js website](https://nodejs.org/en) if you don't already have it. It works on both macOS and Windows.
- **Stripe account**: [Create a Stripe account](https://dashboard.stripe.com/register). After logging in, find your **test mode** API keys under **Developers > API keys**. You need the publishable key (`pk_test_...`) and the secret key (`sk_test_...`). Keep them handy, as you will need them in the setup steps below.

## Installation Instructions

### 1. Open a terminal

- **macOS**: Press `Command (⌘) + Space`, type `Terminal`, and press `Enter`.
- **Windows**: Press the `Windows` key, type `Terminal` (or `cmd`), and press `Enter`.

### 2. Clone the repository and install dependencies

```bash
git clone https://github.com/amlan-v/sample-stripe-ecommerce-payment-demo
cd sample-stripe-ecommerce-payment-demo
npm install
```

### 3. Add your Stripe API keys

The repository includes a `sample.env` file. Add your keys to it, then rename it to `.env`, because the application reads its configuration from `.env`.

1. Open the `sample-stripe-ecommerce-payment-demo` folder in Finder (macOS) or File Explorer (Windows).
2. Open `sample.env` in a text editor.
3. Add the Stripe test keys you saved earlier:

   ```
   STRIPE_SECRET_KEY=sk_test_your_secret_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
   ```

4. Save the file.
5. Rename `sample.env` to `.env`. You can also do this from the terminal:

   ```bash
   # macOS / Linux
   mv sample.env .env

   # Windows (Command Prompt)
   ren sample.env .env
   ```

### 4. Start the application

```bash
npm start
```

### 5. Open the app in your browser

Navigate to [http://localhost:3000](http://localhost:3000) to view the home page.

You're all set!

## Application Walkthrough

1. The home page displays three books.
2. Click **Purchase** on the book you would like to buy.
3. On the checkout page, enter your email address and select a payment method (card is recommended).
4. Enter test payment details. Even though the data is for testing, the card number must be a valid test card number. See [Stripe's testing documentation](https://docs.stripe.com/testing) for a list of card numbers you can use.
5. After the payment succeeds, a confirmation page displays your payment intent ID and the amount you paid.

## Test Scenarios and Verification

Use these cases to confirm that success and failure states behave correctly.

| # | Scenario | Steps | Expected result |
| --- | --- | --- | --- |
| 1 | Successful payment | Card `4242 4242 4242 4242`, any future expiry, CVC `123`, ZIP `90210` | The button changes to "Processing...", the payment completes, and the app redirects to `/success` showing the PaymentIntent ID (`pi_...`) and the total charged. |
| 2 | Inline card decline | Card `4000 0000 0000 0002` (expired card) or `4000 0000 0000 0069` (Declined Card) any future expiry, CVC `123`, ZIP `90210` | An inline error message appears, the button unlocks, and the label resets to "Pay Now". |
| 3 | Direct access to `/success` | Open `http://localhost:3000/success` without paying | The success card is hidden. The page shows "Error: No Payment intent found" and a **Return to Shop** button. |

## Approaching the Problem

1. **Set up the project.** I followed the provided setup instructions.
2. **Reviewed the starter code.** I went through the boilerplate to understand which parts I needed to change and how they work together, including the basics of the imported packages and the Stripe SDK in `app.js`. Comments in the code showed which sections belonged to the home, checkout, and success pages, and where to add error handling.
3. **Testing the app before changing anything.** The home page was already complete. The first thing to modify was the checkout page: it had no payment element, and entering an email and clicking Pay returned an error.
4. **Researched the Stripe Elements vs Stripe Checkout.** I watched videos to understand the difference between Stripe Checkout and Stripe Elements.
5. **Built the checkout flow.** I used the PaymentIntent code in Stripe's API documentation and adapted it to Node.js. Because the Node.js code used `await` as the operator, I made the function `async`. The checkout page still didn't show the payment options, so I updated `checkout.hbs` to reflect that.
6. **Fixed the credentials error.** A missing-credentials error remained in checkout page, so I updated `app.js` api key as environment variable and initialized Stripe and render the payment. 
7. **Tested with Stripe test cards.** Using Stripe's testing documentation I testing the credit card payment method, I reached the success page, but it didn't show the PaymentIntent ID or the amount. I added both amount and payment intent ID following the hints in the code comments, and updated `success.hbs` to display them.
8. **Handled edge cases.** The app worked, but edge cases remained, so I made iterative changes to cover them:
   - False success confirmations
   - Double submission
   - Recovery after a failed payment

## Architecture and how the solution works

The server controls pricing and verifies every payment. The browser only displays pages and confirms the payment. Card details go straight to Stripe and never reach the server.

![Stripe Press payment flow](docs/architecture-flow.png)

1. **Browse and select.** The home page (`GET /`) lists three books. Clicking **Purchase** opens `GET /checkout?item=1|2|3`.
2. **Create the payment.** The server looks up the book's price (hardcoded, in cents) and creates a Stripe **PaymentIntent** in USD with automatic payment methods. It sends the `client_secret` and your publishable key to the checkout page.
3. **Pay.** Stripe.js shows the **Payment Element**, a secure form with every payment method enabled on your Stripe account. When the customer clicks **Pay**, the button locks ("Processing...") to prevent double submissions and `stripe.confirmPayment()` runs. If the payment fails inline (for example, a declined card), the button returns as "Pay Now" so the customer can retry. Redirect-based methods and 3D Secure send the customer to the provider and back.
4. **Verify the result.** Stripe sends the customer to `/success?payment_intent=pi_...`. The server retrieves that PaymentIntent and checks that its status is `succeeded`. If it is, the page shows the payment ID and amount. If not, the customer sees an error and a **Return to Shop** button.

## Stripe APIs Used

**Stripe**
- [Stripe Elements overview](https://docs.stripe.com/payments/elements): how Elements fits with Stripe's payment APIs.
- [The Payment Intents API](https://docs.stripe.com/payments/payment-intents): the payment lifecycle and a Node.js example.
- [Create a PaymentIntent](https://docs.stripe.com/api/payment_intents/create) and [Retrieve a PaymentIntent](https://docs.stripe.com/api/payment_intents/retrieve): API reference for the two server calls.
- [PaymentIntent lifecycle and statuses](https://docs.stripe.com/payments/paymentintents/lifecycle): why the success page checks for `succeeded`.
- [Payment Element](https://docs.stripe.com/payments/payment-element) and the [Stripe.js reference](https://docs.stripe.com/js): rendering the payment form and calling `stripe.confirmPayment()`.
- [Stripe API keys](https://dashboard.stripe.com/apikeys) and [API key best practices](https://docs.stripe.com/keys-best-practices): finding and handling test keys.
- [Stripe testing](https://docs.stripe.com/testing): test card numbers and scenarios.


## Design Challenges Encountered and How I Solved Them

### 1. False-positive success confirmations

- **Problem:** In the starter code, `/success` always showed a green checkmark and a "Success!" header, and `app.js` rendered the page without retrieving the PaymentIntent. If a customer cancelled a 3D Secure challenge, had an incomplete payment, or typed `/success` directly into the address bar, the app showed a success card with empty order details.
- **Solution:**
  - In `app.js`, I added retrieval of the PaymentIntent and a strict status check (`if (paymentIntent.status !== 'succeeded')`). If the payment ID is missing or the status is wrong, an error is passed to the view.
  - In `success.hbs`, I wrapped the confirmation card in `{{#unless error}}`. When an error occurs, the success card, checkmark, and receipt details are hidden, and the page shows a clear error message with a **Return to Shop** button.

### 2. Double submission

- **Problem:** Without client-side handling, rapid repeated clicks on **Pay** during network latency could trigger several concurrent payment requests to Stripe.
- **Solution:** In `checkout.hbs`, the submit handler calls `e.preventDefault()`, disables the button (`submitBtn.disabled = true`), and changes its label to "Processing..." before calling `stripe.confirmPayment()`.

### 3. Restoring the form after a card decline (the "Pay $" bug)

- **Problem:** When a payment fails inline (for example, a wrong CVC, an expired card, or insufficient funds), the form has to unlock without a page reload. Restoring the button label with the starter template's currency `<span>` produced the label "Pay $", because the currency formatting script (`custom.js`) runs only once, when the page first loads.
- **Solution:** In `checkout.hbs`, the error handler re-enables the button (`submitBtn.disabled = false`) and sets a static label: `buttonText.textContent = "Pay Now"`. Customers can now correct their card details without refreshing the page.

## General Challenges Encountered and How I Solved Them

### 1. Connecting Existing Templates, Express, and Stripe
* **The Challenge:** While the starter templates and basic Express setup were already provided, I had not wired together a full-stack flow before. Having some JavaScript background helped, but figuring out how to plug the Stripe API into the existing routes and pass data back and forth took trial and error.
* **How I Solved It:** I tackled one piece at a time. I first verified the existing routes rendered properly, tested passing mock data to the templates, and only then integrated the Stripe payment calls into the server and client scripts.

### 2. Adapting Existing Handlebars Templates and Bootstrap Layouts
* **The Challenge:** The starter code already relied on Handlebars (`.hbs`) and Bootstrap. Rather than writing markup from scratch, I had to understand an existing codebase—such as learning how Handlebars injects variables like `{{clientSecret}}` into `<script>` tags and where to replace placeholder `<div>` tags with the live Stripe Element.
* **How I Solved It:** I referenced the Handlebars documentation and inspected the rendered HTML in the browser to confirm where the template logic ended and client JavaScript began. Using the existing Bootstrap classes made it easy to keep error boxes and buttons visually aligned without writing custom CSS.

### 3. Moving from No-Code / cURL to Code Libraries
* **The Challenge:** My usual API experience involves low-code tools or cURL requests where you pass inputs and inspect responses visually. Translating that mental model into writing Node.js code with the official `stripe` SDK was unfamiliar territory.
* **How I Solved It:** Stripe's documentation displays cURL commands side-by-side with Node.js snippets. This let me map parameters I understood in cURL directly to SDK functions like `stripe.paymentIntents.create()`.

## Documentation Used

- [Working with Stripe Elements and Checkout Sessions](https://www.youtube.com/watch?v=aW6AcSR1Oyg&t=2408s)
- [GitHub](https://github.com/stripe-samples)

## Extending This for a Production-Ready Application

If this were a more robust, production-grade application, I would make these improvements:

### 1. Reuse PaymentIntents & Add Idempotency
- **Why:** The checkout route calls `stripe.paymentIntents.create()` on every page load[cite: 6]. If a user refreshes the page, new orphaned intents are created in Stripe, risking duplicate charges during network retries[cite: 6]. Reusing an existing `clientSecret` from a session or passing an idempotency key resolves this with minimal code[cite: 6].

### 2. Enhanced Error & Decline Handling
- **Why:** The current implementation dumps raw error strings (`err.message`) directly into the UI without categorizing decline reasons or sending appropriate HTTP status codes[cite: 4, 6]. Mapping standard Stripe decline codes to actionable client guidance prevents abandoned checkouts with very few lines of code[cite: 4].

### 3. Currency and Locale Formatting (`Intl.NumberFormat`)
- **Why:** Amounts are passed as raw cent integers and injected into DOM data attributes (`data-amount="{{amount}}"`)[cite: 4, 5, 6]. Adding a brief Handlebars helper using the native `Intl.NumberFormat` API formats localized currency directly from the server, removing reliance on client-side script formatting[cite: 4, 6].
