async function run() {
  const url = "http://127.0.0.1:5000/api/auth/login";
  const body = {
    identifier: "admin@myjourney.com",
    password: "Password123!",
    remember: true
  };

  console.log(`Sending POST to ${url}...`);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
