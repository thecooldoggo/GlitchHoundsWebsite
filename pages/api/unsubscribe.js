import { Client, Databases, Query } from "node-appwrite";
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { token, email } = req.query;

    if (!token || !email) {
      return res.status(400).send(`
        <html>
          <head>
            <title>Invalid Unsubscribe Link</title>
            <style>
              body { font-family: 'Inter', Arial, sans-serif; background-color: #121212; color: #fff; text-align: center; padding: 50px; }
              .container { max-width: 600px; margin: 0 auto; background-color: #1a1a1a; padding: 30px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
              h1 { color: #B76EFF; }
              a { color: #B76EFF; text-decoration: none; }
              a:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Invalid Unsubscribe Link</h1>
              <p>This unsubscribe link appears to be invalid or has expired.</p>
              <p><a href="https://glitchhounds.games">Return to Glitch Hounds</a></p>
            </div>
          </body>
        </html>
      `);
    }


    return res.status(200).send(`
      <html>
        <head>
          <title>Unsubscribe from Glitch Hounds Newsletter</title>
          <style>
            body { font-family: 'Inter', Arial, sans-serif; background-color: #121212; color: #fff; text-align: center; padding: 50px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #1a1a1a; padding: 30px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
            h1 { color: #B76EFF; }
            .button { display: inline-block; background: linear-gradient(135deg, #8A2BE2, #B76EFF); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; margin: 15px 10px; border: none; cursor: pointer; }
            a { color: #B76EFF; text-decoration: none; }
            a:hover { text-decoration: underline; }
            .email { font-weight: bold; color: #B76EFF; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Unsubscribe Confirmation</h1>
            <p>Are you sure you want to unsubscribe <span class="email">${email}</span> from the Glitch Hounds newsletter?</p>
            <form method="POST" action="/api/unsubscribe">
              <input type="hidden" name="token" value="${token}">
              <input type="hidden" name="email" value="${email}">
              <button type="submit" class="button">Yes, Unsubscribe Me</button>
            </form>
            <p><a href="https://glitchhounds.games">Cancel and return to Glitch Hounds</a></p>
          </div>
        </body>
      </html>
    `);
  }

  // Handle POST requests to process unsubscribe
  if (req.method === 'POST') {
    try {
      const { token, email } = req.body;
      
      if (!token || !email) {
        return res.status(400).send(`
          <html>
            <head>
              <title>Unsubscribe Failed</title>
              <style>
                body { font-family: 'Inter', Arial, sans-serif; background-color: #121212; color: #fff; text-align: center; padding: 50px; }
                .container { max-width: 600px; margin: 0 auto; background-color: #1a1a1a; padding: 30px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
                h1 { color: #B76EFF; }
                a { color: #B76EFF; text-decoration: none; }
                a:hover { text-decoration: underline; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Unsubscribe Failed</h1>
                <p>Missing required information to process your request.</p>
                <p><a href="https://glitchhounds.games">Return to Glitch Hounds</a></p>
              </div>
            </body>
          </html>
        `);
      }

      // Verify the token
      const expectedToken = generateUnsubscribeToken(email, process.env.UNSUBSCRIBE_SECRET || 'glitch-hounds-secret');
      
      if (token !== expectedToken) {
        return res.status(400).send(`
          <html>
            <head>
              <title>Invalid Unsubscribe Link</title>
              <style>
                body { font-family: 'Inter', Arial, sans-serif; background-color: #121212; color: #fff; text-align: center; padding: 50px; }
                .container { max-width: 600px; margin: 0 auto; background-color: #1a1a1a; padding: 30px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
                h1 { color: #B76EFF; }
                a { color: #B76EFF; text-decoration: none; }
                a:hover { text-decoration: underline; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Invalid Unsubscribe Link</h1>
                <p>The unsubscribe link appears to be invalid or has expired.</p>
                <p><a href="https://glitchhounds.games">Return to Glitch Hounds</a></p>
              </div>
            </body>
          </html>
        `);
      }

      // Connect to Appwrite
      const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT)
        .setProject(process.env.APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

      const databases = new Databases(client);

      // Find subscriber by email
      const subscribers = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_SUBSCRIBERS_COLLECTION_ID,
        [Query.equal('email', email)]
      );

      if (subscribers.documents.length === 0) {
        return res.status(404).send(`
          <html>
            <head>
              <title>Email Not Found</title>
              <style>
                body { font-family: 'Inter', Arial, sans-serif; background-color: #121212; color: #fff; text-align: center; padding: 50px; }
                .container { max-width: 600px; margin: 0 auto; background-color: #1a1a1a; padding: 30px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
                h1 { color: #B76EFF; }
                a { color: #B76EFF; text-decoration: none; }
                a:hover { text-decoration: underline; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Email Not Found</h1>
                <p>We couldn't find this email address in our subscriber list.</p>
                <p>It may have already been unsubscribed or was never subscribed.</p>
                <p><a href="https://glitchhounds.games">Return to Glitch Hounds</a></p>
              </div>
            </body>
          </html>
        `);
      }

      // Delete subscriber document
      const subscriberId = subscribers.documents[0].$id;
      await databases.deleteDocument(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_SUBSCRIBERS_COLLECTION_ID,
        subscriberId
      );

      // Return success page
      return res.status(200).send(`
        <html>
          <head>
            <title>Successfully Unsubscribed</title>
            <style>
              body { font-family: 'Inter', Arial, sans-serif; background-color: #121212; color: #fff; text-align: center; padding: 50px; }
              .container { max-width: 600px; margin: 0 auto; background-color: #1a1a1a; padding: 30px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
              h1 { color: #B76EFF; }
              a { color: #B76EFF; text-decoration: none; }
              a:hover { text-decoration: underline; }
              .icon { font-size: 48px; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">✓</div>
              <h1>Successfully Unsubscribed</h1>
              <p>You've been successfully unsubscribed from the Glitch Hounds newsletter.</p>
              <p>We're sorry to see you go! If you change your mind, you can always subscribe again from our website.</p>
              <p><a href="https://glitchhounds.games">Return to Glitch Hounds</a></p>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return res.status(500).send(`
        <html>
          <head>
            <title>Unsubscribe Error</title>
            <style>
              body { font-family: 'Inter', Arial, sans-serif; background-color: #121212; color: #fff; text-align: center; padding: 50px; }
              .container { max-width: 600px; margin: 0 auto; background-color: #1a1a1a; padding: 30px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
              h1 { color: #B76EFF; }
              a { color: #B76EFF; text-decoration: none; }
              a:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Unsubscribe Error</h1>
              <p>An error occurred while processing your unsubscribe request.</p>
              <p>Please try again later or contact support.</p>
              <p><a href="https://glitchhounds.games">Return to Glitch Hounds</a></p>
            </div>
          </body>
        </html>
      `);
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

function generateUnsubscribeToken(email, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(email.toLowerCase())
    .digest('hex');
}