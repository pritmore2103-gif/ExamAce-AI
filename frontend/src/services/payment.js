const API_URL = "https://examace-ai-cp3e.onrender.com";

function getToken() {
  return localStorage.getItem("token");
}

async function readError(response, fallback) {
  try {
    const data = await response.json();
    if (typeof data.detail === "string") return data.detail;
    return fallback;
  } catch {
    return fallback;
  }
}

export async function createProSubscription() {
  const token = getToken();

  if (!token) {
    throw new Error("Please log in before starting Pro.");
  }

  const response = await fetch(
    `${API_URL}/payments/create-pro-subscription`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      await readError(response, "Unable to create Pro subscription.")
    );
  }

  return response.json();
}

export async function verifyProPayment(data) {
  const token = getToken();

  const response = await fetch(
    `${API_URL}/payments/verify-pro-payment`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error(
      await readError(response, "Payment verification failed.")
    );
  }

  return response.json();
}

export async function cancelProSubscription() {
  const token = getToken();

  const response = await fetch(
    `${API_URL}/payments/cancel-pro-subscription`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      await readError(response, "Unable to cancel Pro subscription.")
    );
  }

  return response.json();
}

export function loadRazorpayCheckout() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => reject(new Error("Could not load Razorpay Checkout.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Could not load Razorpay Checkout."));
    document.body.appendChild(script);
  });
}
