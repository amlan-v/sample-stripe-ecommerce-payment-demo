const express = require('express'); //Powers the web server, handles routes (like / and /checkout), and serves web pages
const path = require('path');
const exphbs = require('express-handlebars'); //The templating engine that injects backend variables (like book titles, prices, and Stripe keys) into .hbs HTML templates.
require('dotenv').config(); //Reads the hidden .env file in your root folder and loads your secret keys into process.env.
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Imports the official Stripe SDK and authenticates your server using your private Stripe secret key

var app = express();

// view engine setup (Handlebars)
app.engine('hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs'
}));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }))
app.use(express.json({}));

/**
 * Home route
 */
app.get('/', async function(req, res) {
  res.render('index');
});

/**
 * Checkout route
 */
app.get('/checkout', async function(req, res) {
  // Just hardcoding amounts here to avoid using a database
  const item = req.query.item;
  let title, amount, error;

  switch (item) {
    case '1':
      title = "The Art of Doing Science and Engineering"
      amount = 2300      
      break;
    case '2':
      title = "The Making of Prince of Persia: Journals 1985-1993"
      amount = 2500
      break;     
    case '3':
      title = "Working in Public: The Making and Maintenance of Open Source"
      amount = 2800  
      break;     
    default:
      // Included in layout view, feel free to assign error
      error = "No item selected"      
      break;
  }

  if (error) {
    return res.render('checkout', { error });
  }

  try {
    // Create a PaymentIntent for the selected item
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
    });

    res.render('checkout', {
      title: title,
      amount: amount,
      clientSecret: paymentIntent.client_secret,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    });
  } catch (err) {
    res.render('checkout', { error: err.message });
  }
});

/**
 * Success route
 */
app.get('/success',async function(req, res) {
  const payment_intent = req.query.payment_intent;

  if(!payment_intent){
    return res.render('success', {error: 'No Payment intent found'});
  }
  try {
    // Retrieve the PaymentIntent object from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent);

    // Verify payment actually succeeded
    if (paymentIntent.status !== 'succeeded') {
      return res.render('success', {
        error: `Payment status is ${paymentIntent.status}. Card was not charged.`
      });
    }
    
    res.render('success', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount, 
    });
  } catch (err) {
    console.error('Error fetching PaymentIntent:', err);
    res.render('success', { error: err.message });
  }
});

/**
 * Start server
 */
app.listen(3000, () => {
  console.log('Getting served on port 3000');
});