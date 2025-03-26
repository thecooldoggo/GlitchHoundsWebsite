import { Client, Databases, ID, Query, Users } from "node-appwrite";
import crypto from 'crypto';

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
      'UNSUBSCRIBE_SECRET',
      'WEBSITE_URL'
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
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const existingSubscriber = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_SUBSCRIBERS_COLLECTION_ID,
      [Query.equal('email', email.toLowerCase())]
    );

    if (existingSubscriber.documents.length > 0) {
      return res.status(400).json({ error: 'Email already subscribed' });
    }

    // Save to subscribers collection
    const document = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_SUBSCRIBERS_COLLECTION_ID,
      ID.unique(),
      {
        email: email.toLowerCase(),
        subscribedAt: new Date().toISOString(),
        status: 'active'
      }
    );

    console.log('Subscriber created successfully:', document.$id);
    
    const users = new Users(client);
    const password = crypto.randomBytes(16).toString('hex');
    const username = email.split('@')[0] + '-' + crypto.randomBytes(4).toString('hex');
    
    try {
      const user = await users.create(
        ID.unique(),
        email.toLowerCase(),
        password,
        username
      );
      
      console.log('User created with ID:', user.$id, '- welcome email will be triggered automatically');
    } catch (userError) {
      if (userError.code === 409) {
        console.log('User already exists, welcome email will not be sent');
      } else {
        throw userError;
      }
    }
    
    return res.status(200).json({ 
      success: true,
      documentId: document.$id,
      submittedAt: document.subscribedAt,
      emailSent: true
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