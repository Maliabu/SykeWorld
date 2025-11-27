import {jwtDecode} from "jwt-decode";

export function scheduleAutoLogout(token: string, logoutFn: () => void) {
  try {
    const decoded: any = jwtDecode(token);
    if (!decoded.exp) return;

    const expiresAt = decoded.exp * 1000; // convert to ms
    const now = Date.now();
    const delay = expiresAt - now;

    if (delay <= 0) {
      logoutFn(); // already expired
      return;
    }

    console.log("🔐 Auto logout scheduled in", delay / 1000, "seconds");

    setTimeout(() => {
      console.log("⏳ Access token expired → auto logout");
      logoutFn();
    }, delay);

  } catch (err) {
    console.warn("Failed to decode token", err);
  }
}
