import { google } from 'googleapis';
// Function to exchange JWT for access and refresh tokens
export async function exchangeCodeForTokens(code) {
    const body = {
        grant_type: 'authorization_code',
        redirect_uri: 'postmessage',
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
    };
    // get base64 encoded string
    const basicAuthStr = Buffer.from(`${process.env.GOOGLE_CLIENT_ID}:${process.env.GOOGLE_CLIENT_SECRET}`).toString('base64');
    try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                Authorization: `Basic ${basicAuthStr}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        return (await response.json());
    }
    catch (error) {
        throw error;
    }
}
// Function to update refresh token
export async function reissueRefreshToken(refreshToken) {
    const body = {
        grant_type: 'refresh_token',
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
    };
    try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                //Authorization: `Basic ${basicAuthStr}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        return (await response.json());
    }
    catch (error) {
        throw error;
    }
}
// Function to upload file to Google Drive
export async function uploadFileToGoogleDrive(tokens, fileContent, fileName) {
    try {
        // get the access token and refresh token from jwt
        // eslint-disable-next-line @typescript-eslint/naming-convention
        // const tokens = await verifyIdToken(oauth2token)
        // Initialize the OAuth2 client
        const client = new google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET);
        client.setCredentials({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
        });
        // Initialize the Google Drive API
        const drive = google.drive({ version: 'v3', auth: client });
        // Upload the file to Google Drive
        const response = await drive.files.create({
            requestBody: {
                name: fileName,
                mimeType: 'text/csv',
            },
            media: {
                mimeType: 'text/csv',
                body: fileContent,
            },
            fields: 'id',
        });
        // eslint-disable-next-line no-console
        console.log('File uploaded successfully, File ID:', response.data.id);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error uploading file to Google Drive:', error);
    }
}
