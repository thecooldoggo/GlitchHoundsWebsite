import { Client, Users, ID } from "node-appwrite";
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const users = new Users(client);


    const password = crypto.randomBytes(16).toString('hex');
    

    const user = await users.create(
      ID.unique(),
      email.toLowerCase(),
      undefined,
      password,
      "newsletter_subscriber"
    );

    const unsubscribeToken = crypto
      .createHmac('sha256', process.env.UNSUBSCRIBE_SECRET)
      .update(email.toLowerCase())
      .digest('hex');

    const unsubscribeUrl = `${process.env.WEBSITE_URL}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubscribeToken}`;


    return res.status(200).json({ 
      success: true, 
      message: 'Successfully subscribed to the newsletter',
      userId: user.$id
    });
    
  } catch (error) {
    console.error('Error subscribing:', error);
    
    if (error.code === 409) {
      return res.status(409).json({ 
        error: 'Already subscribed', 
        message: 'This email is already subscribed to our newsletter'
      });
    }
    
    return res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
}