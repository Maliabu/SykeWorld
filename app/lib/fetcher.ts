// lib/fetcher.ts
export const fetcher = async (url: string) => {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      // optionally add auth token for admin
      "Authorization": `Bearer ${localStorage.getItem("admin-token") || ""}`,
    },
  });
  if (!res.ok) {
    throw new Error("Network response was not ok");
  }
  return res.json();
};
