import { Client, Databases, ID, Query, Users } from "node-appwrite";
const sdk = require('node-appwrite');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const requiredEnvVars = [
      'APPWRITE_ENDPOINT',
      'APPWRITE_PROJECT_ID',
      'APPWRITE_API_KEY',
      'APPWRITE_DATABASE_ID',
      'APPWRITE_SUBSCRIBERS_COLLECTION_ID',
      'APPWRITE_EMAIL_PROVIDER_ID'
    ];
    
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        console.error(`Missing environment variable: ${envVar}`);
        return res.status(500).json({ error: `Server configuration error: ${envVar} not set` });
      }
    }

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const users = new Users(client);
    const messaging = new sdk.Messaging(client);
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    if (!email.includes('@') || !email.includes('.')) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const existingSubscriber = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_SUBSCRIBERS_COLLECTION_ID,
      [Query.equal('email', email)]
    );

    if (existingSubscriber.documents.length > 0) {
      return res.status(400).json({ error: 'Email already subscribed' });
    }

    const document = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_SUBSCRIBERS_COLLECTION_ID,
      ID.unique(),
      {
        email,
      }
    );

    console.log('Subscriber created successfully:', document.$id);
    
    const name = email.split('@')[0];
    const password = ID.unique();
    
    // Try to create a user account
    let userId;
    try {
      // Try to create a new user
      const user = await users.create(
        ID.unique(),
        email,
        undefined, // No phone
        password,
        name
      );
      userId = user.$id;
      console.log('User created successfully:', userId);
    } catch (error) {
      if (error.code === 409) { // User already exists code
        try {
          const usersList = await users.list([Query.equal('email', email)]);
          if (usersList.users.length > 0) {
            userId = usersList.users[0].$id;
            console.log('Found existing user:', userId);
          }
        } catch (userListError) {
          console.error('Error finding user:', userListError.message);
        }
      } else {
        console.error('Error creating user:', error.message);
      }
    }
    if (userId) {
      try {
        const target = await users.createTarget(
          userId,
          ID.unique(),
          'email',
          email,
          process.env.APPWRITE_EMAIL_PROVIDER_ID
        );
        
        console.log('Email target created:', target.$id);

        // Send welcome email
        const welcomeEmailContent = getWelcomeEmailHTML(name);
        
        const message = await messaging.createEmail(
          ID.unique(),
          'Welcome to Glitch Hounds Newsletter!',
          welcomeEmailContent,
          [],        // topics
          [userId],  // users
          [],        // targets
          [],        // cc
          [],        // bcc
          [],        // attachments
          false,     // not a draft
          true,      // HTML format
          ''         // send immediately
        );
        
        console.log('Welcome email sent successfully:', message.$id);
      } catch (error) {
        console.error('Error setting up email target/message:', error.message);
      }
    }
    
    const submittedAt = new Date().toISOString();
    return res.status(200).json({ 
      success: true,
      documentId: document.$id,
      submittedAt: submittedAt 
    });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error.message);
    if (error.code) {
      console.error('Appwrite error code:', error.code);
    }
    return res.status(500).json({ 
      error: 'Server error',
      message: error.message 
    });
  }
}

function getWelcomeEmailHTML(name) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Glitch Hounds Newsletter</title>
    <style>
      body {
        font-family: 'Inter', sans-serif;
        line-height: 1.6;
        color: #ffffff;
        background-color: #121212;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        text-align: center;
        padding: 20px 0;
        border-bottom: 1px solid rgba(255,255,255,0.1);
      }
      .logo {
        font-size: 24px;
        font-weight: bold;
        color: #B76EFF;
      }
      .content {
        padding: 30px 0;
      }
      .footer {
        text-align: center;
        padding: 20px 0;
        font-size: 12px;
        color: rgba(255,255,255,0.6);
        border-top: 1px solid rgba(255,255,255,0.1);
      }
      .button {
        display: inline-block;
        padding: 12px 24px;
        background: linear-gradient(to right, #8A2BE2, #B76EFF);
        color: white;
        text-decoration: none;
        border-radius: 5px;
        font-weight: bold;
        margin: 20px 0;
      }
      h1, h2 {
        color: #B76EFF;
      }
      p {
        margin-bottom: 15px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">Glitch Hounds</div>
      </div>
      <div class="content">
        <h1>Welcome to the Glitch Hounds Newsletter!</h1>
        <p>Hi ${name},</p>
        <p>Thank you for subscribing to our newsletter! We're excited to keep you updated on our latest UEFN developments, projects, and tips for Fortnite Creative.</p>
        <p>As a professional Fortnite map creation service, we specialize in:</p>
        <ul>
          <li>Custom Map Creation</li>
          <li>Game Mechanics Development</li>
          <li>Performance Optimization</li>
        </ul>
        <p>Check out our latest projects by visiting our website:</p>
        <div style="text-align: center;">
          <a href="https://glitchhounds.games" class="button">Visit Our Website</a>
        </div>
      </div>
      <div class="footer">
        <p>© 2025 Glitch Hounds. All rights reserved.</p>
        <p>If you wish to unsubscribe, please click <a href="#" style="color: #B76EFF;">here</a>.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}