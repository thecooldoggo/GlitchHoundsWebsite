import { Client, Databases, ID, Query } from "appwrite";

export default async function handler(req, res) {
  // Check if method is POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    // Get email from request
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if email already exists
    const existingSubscriber = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_SUBSCRIBERS_COLLECTION_ID,
      [Query.equal('email', email)]
    );

    if (existingSubscriber.documents.length > 0) {
      return res.status(400).json({ error: 'Email already subscribed' });
    }

    // Store in Appwrite database
    await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_SUBSCRIBERS_COLLECTION_ID,
      ID.unique(),
      {
        email,
        createdAt: new Date().toISOString(),
      }
    );

    // Return success
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}