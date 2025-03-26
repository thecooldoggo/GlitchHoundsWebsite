import { Client, Databases, ID } from "node-appwrite";

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
      'APPWRITE_SUBMISSIONS_COLLECTION_ID',
      'DISCORD_WEBHOOK_URL'
    ];
    
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        console.error(`Missing environment variable: ${envVar}`);
        return res.status(500).json({ error: `Server configuration error: ${envVar} not set` });
      }
    }

    const client = new Client();
    client
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const document = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_SUBMISSIONS_COLLECTION_ID,
      ID.unique(),
      {
        name,
        email,
        message,
      }
    );

    console.log('Document created successfully:', document.$id);
    
    try {
      const webhookBody = {
        embeds: [{
          title: "🎮 New Contact Form Submission",
          color: 9055202,
          fields: [
            {
              name: "Name",
              value: name,
              inline: true
            },
            {
              name: "Email",
              value: email,
              inline: true
            },
            {
              name: "Message",
              value: message
            },
            {
              name: "Timestamp",
              value: new Date().toISOString(),
              inline: true
            },
            {
              name: "Document ID",
              value: document.$id,
              inline: true
            }
          ],
          footer: {
            text: "Glitch Hounds Website"
          }
        }]
      };
      
      await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookBody),
      });
      
      console.log('Discord webhook notification sent');
    } catch (webhookError) {
      console.error('Error sending Discord webhook:', webhookError);
    }
    
    return res.status(200).json({ 
      success: true,
      documentId: document.$id,
      submittedAt: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Error submitting contact form:', error.message);
    if (error.code) {
      console.error('Appwrite error code:', error.code);
    }
    return res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
}