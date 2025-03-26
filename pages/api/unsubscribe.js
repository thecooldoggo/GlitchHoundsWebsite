import { Client, Databases, Query } from "node-appwrite";
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, email } = req.query;

    if (!token || !email) {
      return res.status(400).json({ error: 'Token and email are required' });
    }

    const expectedToken = crypto
      .createHmac('sha256', process.env.UNSUBSCRIBE_SECRET)
      .update(email.toLowerCase())
      .digest('hex');

    if (token !== expectedToken) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    const subscribers = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_SUBSCRIBERS_COLLECTION_ID,
      [Query.equal('email', email.toLowerCase())]
    );

    if (subscribers.documents.length === 0) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }

    const subscriber = subscribers.documents[0];

    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_SUBSCRIBERS_COLLECTION_ID,
      subscriber.$id,
      {
        status: 'unsubscribed',
        unsubscribedAt: new Date().toISOString()
      }
    );

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribed - Glitch Hounds</title>
        <style>
            body {
                font-family: 'Inter', Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #121212;
                color: #ffffff;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                line-height: 1.6;
            }
            
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #1a1a1a;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 40px;
                text-align: center;
            }
            
            h1 {
                color: #B76EFF;
                margin-top: 0;
                font-size: 28px;
            }
            
            .logo {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #8A2BE2, #B76EFF);
                width: 80px;
                height: 80px;
                border-radius: 12px;
                margin-bottom: 20px;
            }
            
            .logo-text {
                color: #ffffff;
                font-weight: bold;
                font-size: 32px;
            }
            
            .button {
                display: inline-block;
                background: linear-gradient(135deg, #8A2BE2, #B76EFF);
                color: #ffffff;
                text-decoration: none;
                padding: 12px 24px;
                border-radius: 6px;
                font-weight: 500;
                margin: 20px 0;
                border: none;
                cursor: pointer;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">
                <span class="logo-text">GH</span>
            </div>
            <h1>Successfully Unsubscribed</h1>
            <p>You've been removed from the Glitch Hounds newsletter list.</p>
            <p>We're sorry to see you go! If you change your mind, you can always subscribe again from our website.</p>
            <a href="${process.env.WEBSITE_URL}" class="button">Return to Homepage</a>
        </div>
    </body>
    </html>`);
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
}