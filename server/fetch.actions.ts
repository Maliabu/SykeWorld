/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use server"

import { activityTable, db, users } from "@/lib/db";
import { sendPasswordResetLInk } from "@/mail/nodemailer";
import { eq } from "drizzle-orm";
import z from "zod";
// import { sendEmail } from "@/nodemailer";

const today = new Date(Date.now()); // UTC

function env(){
    if(process.env.NODE_ENV == "development" || process.env.NODE_ENV == "test"){
        return 'http://localhost:3000'
    } else if(process.env.NODE_ENV == 'production'){
        return 'https://sykeworld.com'
    } else {
        return 'http://localhost:3000'
    }
}

const uuidSchema = z.string().uuid();

export async function sendHtmlEmail(email: string, title:string, name:string, link: string){
    sendPasswordResetLInk(email, title, name, link)
    return true
}
export async function logout(formData: FormData): Promise<{error: boolean}>{
    const data = formData.get("email") as string || ""
     // before logout, update isloggedin to false
     const logout = await db.update(users).set({
         isLoggedIn: false,
     }).where(
         eq(users.email, data)
     )
     if(logout){
        //get user id from email
        const userid = await db.query.users.findMany({where:eq(users.email, data)})
        await logActivity('Logged out', userid[0].id.toString())
     return {error: false}
    } else {
        return {error: true}
    }
 }
export async function checkEmail(email: string) {
  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, email),
  });

  if (!user) {
    return {
      exists: false,
      userId: null,
      email,
    };
  }

  // Validate the ID (extra safety, optional but good)
  const parsedId = uuidSchema.safeParse(user.id);
  if (!parsedId.success) {
    return {
      exists: false,
      userId: null,
      email,
    };
  }

  return {
    exists: true,
    userId: parsedId.data, // ✅ validated UUID
    email: user.email,
  };
}
export async function logActivity(activity: string, userId: string): Promise<{error: boolean, message: string}>{
    //create our data object
    const data = {
        user: userId,
        activity: activity
    }
    if(!activity && !userId){
        return {error: true, message: "missing information"}
    } else{
        // with all the information on what we are doing
        //lets log who did what
        await db.insert(activityTable).values({...data})
        return {error: false, message: "ok"}
    }
}

export async function uploadServerFile(formData: FormData, category?: string) {
    try {
        // Add category to FormData if provided
        if (category) {
            formData.append('category', category);
        }
        
        console.log('Uploading file to:', `${env()}/api/server`);
        const response = await fetch(`${env()}/api/server`, {
          method: 'POST',
          body: formData,
        });
        
        console.log('Upload response status:', response.status, response.statusText);
        
        // Check if response is JSON
        const contentType = response.headers.get('Content-Type');
        let result: any;
        
        if (contentType?.includes('application/json')) {
          result = await response.json();
        } else {
          const text = await response.text();
          console.error('Non-JSON response:', text);
          throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
        }
  
        if (response.ok) {
          let fileUrl = result.fileUrl || result.url || result.path || result.location;
          
          if (!fileUrl) {
            console.error('Upload response missing fileUrl:', result);
            throw new Error(result.error || 'No file URL returned from server');
          }
          
          // Fix: Remove /uploads/ from subdomain URLs
          // If URL is https://uploads.sykeworld.com/uploads/rooms/file.jpg
          // It should be https://uploads.sykeworld.com/rooms/file.jpg
          if (fileUrl.includes('uploads.sykeworld.com/uploads/')) {
            fileUrl = fileUrl.replace('uploads.sykeworld.com/uploads/', 'uploads.sykeworld.com/');
            console.log('🔧 Fixed subdomain URL (removed /uploads/):', fileUrl);
          }
          
          console.log('✅ Upload successful, file URL:', fileUrl);
          return fileUrl;
        } else {
          console.error('Upload failed:', result);
          throw new Error(result.error || `Upload failed with status ${response.status}`);
        }
      } catch (error: any) {
        console.error('Upload error:', error);
        // Re-throw the error so it can be caught by the calling code
        throw new Error(error.message || 'Failed to upload file');
      }
}

// server/fetch.actions.ts
export async function addRoom(data: any) {
  const res = await fetch("/api/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}
