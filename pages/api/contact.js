import { Client, Databases, ID } from "appwrite";

export default async function handler(req, res) {
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


    const { name, email, message } = req.body;


    if (!name || !email || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }


    await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_SUBMISSIONS_COLLECTION_ID,
      ID.unique(),
      {
        name,
        email,
        message,
        createdAt: new Date().toISOString(),
      }
    );


    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}