// Simple load test script using k6
// Install k6: https://k6.io/docs/getting-started/installation/
// Run with: k6 run load-test.js

import http from "k6/http";
import { sleep, check } from "k6";

export const options = {
  vus: 10, // 10 virtual users
  duration: "30s", // test duration
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests should be below 500ms
    http_req_failed: ["rate<0.01"], // Less than 1% of requests should fail
  },
};

// Replace with your actual API URL
const API_URL = "https://xssshlqkcnhixkmksgrh.supabase.co";
const ANON_KEY = "your-anon-key"; // Replace with your actual anon key

// Test user credentials - use a test account
const TEST_EMAIL = "loadtest@example.com";
const TEST_PASSWORD = "password123";

export default function () {
  // Login to get access token
  const loginRes = http.post(
    `${API_URL}/auth/v1/token?grant_type=password`,
    JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }),
    {
      headers: {
        "Content-Type": "application/json",
        apikey: ANON_KEY,
      },
    },
  );

  check(loginRes, {
    "login successful": (r) => r.status === 200,
  });

  const accessToken = loginRes.json("access_token");

  // Test dashboard load
  const docsRes = http.get(`${API_URL}/rest/v1/documents?select=*`, {
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  check(docsRes, {
    "documents retrieved": (r) => r.status === 200,
    "documents load time acceptable": (r) => r.timings.duration < 300,
  });

  // Get a specific document (replace with a valid document ID for your test)
  const documentId = "test-document-id";
  const docRes = http.get(
    `${API_URL}/rest/v1/documents?id=eq.${documentId}&select=*`,
    {
      headers: {
        "Content-Type": "application/json",
        apikey: ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  check(docRes, {
    "document retrieved": (r) => r.status === 200,
    "document load time acceptable": (r) => r.timings.duration < 200,
  });

  // Pause between iterations
  sleep(1);
}
