import { NextRequest, NextResponse } from "next/server";
import https from 'https';
import fetch from 'node-fetch';
import FormData from 'form-data';

// Configure route to handle large file uploads
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout for large uploads

// Ensure .php extension is included - the file MUST be editor.php
const defaultUrl = 'https://uploads.sykeworld.com/editor.php';
const envUrl = process.env.CPANEL_UPLOAD_URL;
// Force .php extension if missing from env variable
let cpanelUrl = envUrl || defaultUrl;
if (!cpanelUrl.endsWith('.php')) {
  // If it ends with /editor, add .php
  if (cpanelUrl.endsWith('/editor')) {
    cpanelUrl = cpanelUrl + '.php';
  } else {
    // Otherwise use default
    cpanelUrl = defaultUrl;
  }
}
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert File to Buffer for node-fetch
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create FormData for cPanel upload using form-data package
    // node-fetch requires Buffer/Stream, not File objects
    const uploadFormData = new FormData();
    uploadFormData.append('file', buffer, {
      filename: file.name,
      contentType: file.type,
    });
    
    // Add category if provided (for folder organization)
    if (category) {
      uploadFormData.append('category', category);
    }

    // Upload to cPanel server
    // Handle SSL certificate issues (common with shared hosting)
    const ignoreSSL = process.env.CPANEL_IGNORE_SSL === 'true' && process.env.NODE_ENV !== 'production';
    
    // Create custom https agent if SSL verification needs to be disabled
    const httpsAgent = ignoreSSL 
      ? new https.Agent({ rejectUnauthorized: false })
      : undefined;

    // Use node-fetch which supports custom agents
    const fetchOptions: any = {
      method: 'POST',
      body: uploadFormData as any, // node-fetch accepts FormData
    };

    // Add custom agent for SSL handling
    if (httpsAgent) {
      fetchOptions.agent = httpsAgent;
      console.warn('⚠️ SSL verification disabled for cPanel uploads (development only)');
    }

    console.log('========================================');
    console.log('Uploading to cPanel');
    console.log('URL:', cpanelUrl);
    console.log('File:', file.name);
    console.log('Size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('Type:', file.type);
    console.log('Category:', category || 'none');
    console.log('========================================');
    
    let response: any;
    try {
      response = await fetch(cpanelUrl, fetchOptions);
      console.log('cPanel response status:', response.status, response.statusText);
      console.log('cPanel response URL:', response.url); // Shows final URL after redirects
    } catch (fetchError: any) {
      console.error('cPanel fetch error:', fetchError);
      // Handle SSL certificate errors with helpful message
      if (fetchError.code === 'ERR_TLS_CERT_ALTNAME_INVALID' || 
          fetchError.message?.includes('certificate') ||
          fetchError.message?.includes('TLS')) {
        
        if (!ignoreSSL) {
          throw new Error(
            `SSL certificate error: The certificate for the upload URL doesn't match. ` +
            `Error: ${fetchError.message}. ` +
            `Please fix the SSL certificate on your cPanel server (see web/SSL_CERTIFICATE_FIX.md) ` +
            `or set CPANEL_IGNORE_SSL=true in .env.local for development only.`
          );
        }
      }
      throw fetchError;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('========================================');
      console.error('cPanel Upload Failed');
      console.error('URL called:', cpanelUrl);
      console.error('Status:', response.status, response.statusText);
      console.error('Response (first 500 chars):', errorText.substring(0, 500));
      console.error('========================================');
      
      // If it's a 404, provide specific guidance
      if (response.status === 404) {
        return NextResponse.json(
          { 
            error: `File not found at ${cpanelUrl}. Please verify the file exists at public_html/uploads/editor.php on your cPanel server.`,
            details: 'The editor.php file was not found. Make sure you uploaded it to the correct location.'
          },
          { status: 404 }
        );
      }
      
      let errorMessage = 'Failed to upload to cPanel server';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorMessage;
      } catch {
        // If it's HTML (like a 404 page), extract just the error
        if (errorText.includes('404') || errorText.includes('Not Found')) {
          errorMessage = `File not found at ${cpanelUrl}. Please check that editor.php exists on your server.`;
        } else {
          errorMessage = errorText.substring(0, 200) || errorMessage;
        }
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    let result: any;
    try {
      const responseText = await response.text();
      console.log('cPanel response body:', responseText);
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse cPanel response:', parseError);
      return NextResponse.json(
        { error: 'Invalid response from cPanel server' },
        { status: 500 }
      );
    }
    
    const fileUrl = result.url || result.fileUrl || result.path || result.location;
    console.log('Extracted file URL:', fileUrl);

    if (!fileUrl) {
      console.error('No file URL in response:', result);
      return NextResponse.json(
        { error: 'No file URL returned from server. Response: ' + JSON.stringify(result) },
        { status: 500 }
      );
    }

    console.log('Upload successful, returning URL:', fileUrl);
    return NextResponse.json({ fileUrl });
  } catch (error: any) {
    console.error('Server upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}

