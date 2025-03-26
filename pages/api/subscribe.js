import { Client, Databases, ID, Query, Messaging } from "node-appwrite";
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
    const messaging = new Messaging(client);
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

    // Create subscriber document
    const document = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_SUBSCRIBERS_COLLECTION_ID,
      ID.unique(),
      {
        email,
      }
    );

    console.log('Subscriber created successfully:', document.$id);
    
    // Generate unsubscribe token and URL
    const unsubscribeToken = crypto
      .createHmac('sha256', process.env.UNSUBSCRIBE_SECRET || 'glitch-hounds-secret')
      .update(email.toLowerCase())
      .digest('hex');

    const unsubscribeUrl = `${process.env.WEBSITE_URL || 'https://glitchhounds.games'}/api/unsubscribe?token=${unsubscribeToken}&email=${encodeURIComponent(email)}`;

    // Send welcome email
    try {
      await messaging.createEmail(
        ID.unique(),
        email,
        'Welcome to Glitch Hounds Newsletter!',
    `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Glitch Hounds Newsletter</title>
        <style>
            /* Base styles */
            body {
                font-family: 'Inter', Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #121212;
                color: #ffffff;
                line-height: 1.6;
            }
            
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #121212;
            }
            
            .header {
                background: linear-gradient(135deg, rgba(138,43,226,0.8), rgba(183,110,255,0.8));
                padding: 30px 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
            }
            
            .logo {
                display: inline-block;
                margin-bottom: 15px;
            }
            
            .logo-container {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #8A2BE2, #B76EFF);
                width: 50px;
                height: 50px;
                border-radius: 8px;
                margin-right: 10px;
                vertical-align: middle;
            }
            
            .logo-text {
                color: #ffffff;
                font-weight: bold;
                font-size: 24px;
            }
            
            .brand-name {
                display: inline-block;
                font-size: 24px;
                font-weight: bold;
                color: #ffffff;
                vertical-align: middle;
            }
            
            .content {
                padding: 30px 20px;
                background-color: #1a1a1a;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 0 0 8px 8px;
            }
            
            h1 {
                color: #B76EFF;
                margin-top: 0;
                font-size: 28px;
            }
            
            .card {
                background-color: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 25px;
            }
            
            .button {
                display: inline-block;
                background: linear-gradient(135deg, #8A2BE2, #B76EFF);
                color: #ffffff;
                text-decoration: none;
                padding: 12px 24px;
                border-radius: 6px;
                font-weight: 500;
                margin: 15px 0;
            }
            
            .social-links {
                text-align: center;
                margin: 25px 0;
            }
            
            .social-icon {
                display: inline-block;
                width: 36px;
                height: 36px;
                background-color: rgba(255, 255, 255, 0.1);
                border-radius: 50%;
                margin: 0 5px;
                text-align: center;
                line-height: 36px;
                color: #B76EFF;
                text-decoration: none;
            }
            
            .footer {
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #999999;
            }
            
            .divider {
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                margin: 20px 0;
            }
            
            /* Responsive adjustments */
            @media screen and (max-width: 480px) {
                .container {
                    width: 100% !important;
                }
                
                .content {
                    padding: 20px 15px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">
                    <span class="logo-container">
                        <span class="logo-text">GH</span>
                    </span>
                    <span class="brand-name">Glitch Hounds</span>
                </div>
                <div style="font-size: 14px; color: rgba(255,255,255,0.8);">UEFN Fortnite Creative Team</div>
            </div>
            
            <div class="content">
                <h1>Welcome to the Glitch Hounds Community!</h1>
                
                <p>Hey there,</p>
                
                <p>Thanks for subscribing to our newsletter! We're thrilled to have you join our growing community of Fortnite creators and enthusiasts.</p>
                
                <div class="card">
                    <h3 style="margin-top: 0; color: #B76EFF;">What to Expect</h3>
                    <p>As a subscriber, you'll receive:</p>
                    <ul>
                        <li>UEFN development tips and tricks</li>
                        <li>Behind-the-scenes looks at our latest projects</li>
                        <li>Early access to our new Fortnite maps</li>
                        <li>Exclusive tutorials and resources</li>
                    </ul>
                </div>
                
                <p>Our next newsletter will arrive in your inbox, packed with valuable content for Fortnite creators.</p>
                
                <div style="text-align: center;">
                    <a href="https://glitchhounds.games" class="button">Explore Our Portfolio</a>
                </div>
                
                <div class="divider"></div>
                
                <div class="social-links">
                    <a href="https://fortnite.com/@isthatciri" class="social-icon">Fortnite</a>
                    <a href="https://github.com/thecooldoggo" class="social-icon">Developer</a>
                </div>
                
                <div class="card" style="background-color: rgba(138,43,226,0.1);">
                    <h3 style="margin-top: 0; color: #B76EFF;">Featured Creation</h3>
                    <p>Check out our latest map: <strong>Squishy Sanctuary</strong> - a no-weapon scavenger hunt experience!</p>
                    <div style="text-align: center;">
                        <a href="https://www.fortnite.com/@isthatciri/5680-8401-9419" style="color: #B76EFF; text-decoration: underline;">Play in Fortnite</a>
                    </div>
                </div>
            </div>
            
            <div class="footer">
                <p>&copy; 2025 Glitch Hounds. All rights reserved.</p>
                <p>
                    <a href="mailto:contact@glitchhounds.games" style="color: #B76EFF; text-decoration: none;">contact@glitchhounds.games</a> | 
                    <a href="https://glitchhounds.games" style="color: #B76EFF; text-decoration: none;">glitchhounds.games</a>
                </p>
                <p style="margin-top: 15px; font-size: 11px;">
                    Don't want these emails? <a href="${unsubscribeUrl}" style="color: #999999;">Unsubscribe</a>
                </p>
            </div>
        </div>
    </body>
    </html>`
      );
      console.log('Welcome email sent to:', email);
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
    }
    
    const submittedAt = new Date().toISOString();
    return res.status(200).json({ 
      success: true,
      documentId: document.$id,
      submittedAt: submittedAt,
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