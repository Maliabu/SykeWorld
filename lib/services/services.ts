/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

export const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function username(name: string){
    return name.split(" ").concat(String(Math.floor((Math.random() * 10) + 1)))
}

export function token(){
    function rand(){
        return String((Math.random().toString(36).substring(2)))
    }
    return rand()+rand()+rand()
}

export function extractId(value: string) {
  const match = value.match(/^\d+/); // Regex to match digits at the beginning of the string
  return match ? match[0] : "";  // Return the matched digits (ID) or null if not found
}

export const togglePasswordVisibility = ()=>{
    const pass = document.getElementById("password")
    const see = document.getElementById("see")

    if(pass !== null && see !== null){
    if(pass.getAttribute('type') === "password"){
        pass.setAttribute('type', 'text')
        see.innerHTML = "Password: Now you see me"
    } else{
        pass.setAttribute('type', 'password')
        see.innerHTML = "Password: Now you dont"
    }}
}
export const togglePasswordVisibility2 = ()=>{
  const pass = document.getElementById("pass")
  const see = document.getElementById("seen")

  if(pass !== null && see !== null){
  if(pass.getAttribute('type') === "password"){
      pass.setAttribute('type', 'text')
      see.innerHTML = "Password: Now you see me"
  } else{
      pass.setAttribute('type', 'password')
      see.innerHTML = "Password: Now you dont"
  }}
}

export function onSelection(selection: boolean){
    return selection
}

export function avatar(name: string){
    return name[0].toUpperCase()
}


export function nextCourse(){
  if(window){
      return localStorage.getItem("nextCourse") || ''
  }
}

const encryptData = async (plainData: string, encryptionKey: string) => {
    // Generate a random 96-bit initialization vector (IV)
    const initVector = crypto.getRandomValues(new Uint8Array(12));
  
    // Encode the data to be encrypted
    const encodedData = new TextEncoder().encode(plainData);
  
    // Prepare the encryption key
    // use online aes encryption key generator to get a working key
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      Buffer.from(encryptionKey, "base64"),
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );
  
    // Encrypt the encoded data with the key
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: initVector,
      },
      cryptoKey,
      encodedData
    );
  
    // Return the encrypted data and the IV, both in base64 format
    return {
      encryptedData: Buffer.from(encryptedData).toString("base64"),
      initVector: Buffer.from(initVector).toString("base64"),
    };
  };
  
export const handleEncryption = async (data: string) => {
    return await encryptData(
      JSON.stringify({ data }),
      process.env.NEXT_PUBLIC_SECRET_KEY!
    );
};

export const decryptData = async (
    encryptedData: string,
    initVector: string,
    encryptionKey: string
  ) => {
    // Prepare the decryption key
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      Buffer.from(encryptionKey, "base64"),
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );
  
    try {
      // Decrypt the encrypted data using the key and IV
      const decodedData = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: Buffer.from(initVector, "base64"),
        },
        cryptoKey,
        Buffer.from(encryptedData, "base64")
      );
  
      // Decode and return the decrypted data
      return new TextDecoder().decode(decodedData);
    } catch (error) {
      console.log(error)
      return JSON.stringify({ payload: null });
    }
};
  
export const handleDecryption = async ( encryptedData: string, initVector: string) => {
    const decryptedString = await decryptData(
      encryptedData!,
      initVector!,
      process.env.NEXT_PUBLIC_SECRET_KEY!
    );
  
    const responseData = JSON.parse(decryptedString)?.data;
  
    return responseData;
};

export function checkAdminLoginToken(){
  let token
  if(window){
    // now access your localStorage
  token = localStorage.getItem("token")
  }
  if(token === ""){
    console.log(token)
    // redirect("/admin/auth")
  }
}
export function grouping(arrObj: {key1: string}[]){
  const result = Object.groupBy(arrObj, ({ key1 }) => key1);
  return result
}


interface IObjectKeys {
  [key: string]: string[];
}
interface IObject {
  name: string, datas: string, date: string
}

export const groupBy = (by: string, arr: IObject[]) => {
  // group by date, reduce new arr
  return arr.reduce((accumulatedObject: IObjectKeys, arr: IObject) => {

    // key returns every type in the object
    // had a datas: [] causing errors
    const key = arr[by as keyof IObject]
    accumulatedObject[key] = accumulatedObject[key] || []
    // accumulatedObject[key].push(`${arr.name} / ${arr.datas} / ${arr.date}`)
    accumulatedObject[key].push(arr.name)
    return accumulatedObject
  }, {} as IObjectKeys)
}

export function getMyMonth(num: number){
  switch(num){
    case 0:
      return "January"
    case 1:
      return "February"
    case 2:
      return "March"
    case 3:
      return "April"
    case 4:
      return "May"
    case 5:
      return "June"
    case 6:
      return "July"
    case 7:
      return "August"
    case 8:
      return "September"
    case 9:
      return "October"
    case 10:
      return "November"
    case 11:
      return "December"
  }
}

export function getMyDay(num: number | null){
  switch(num){
    case 1:
      return "Monday"
    case 2:
      return "Tuesday"
    case 3:
      return "Wednesday"
    case 4:
      return "Thursday"
    case 5:
      return "Friday"
    case 6:
      return "Saturday"
    case 7:
      return "Sunday"
  }
}

export function date(dateString: string){
  const date = new Date(dateString)
  return date.toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export async function getArticleBySlug(slug: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/articles/${slug}`)
  if (!res.ok) return null
  return res.json()
}

export function dater(date: Date){
  const ddate = new Date(date)
  return ddate
}