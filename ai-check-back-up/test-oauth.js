import fetch from "node-fetch";
import https from "https";

const auth = "MDE5YTExZjMtMmQ3OS03MGYxLTk4NzEtZmIzODkxZTliZTJjOmU1NTc0NGE4LTc1ZjQtNDA4NS1hODIwLTk0MzQ0YTM0OWE4OQ==";

const res = await fetch("https://ngw.devices.sberbank.ru:9443/api/v2/oauth", {
  method: "POST",
  headers: {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/x-www-form-urlencoded"
  },
  body: new URLSearchParams({
    scope: "GIGACHAT_API_PERS",
    grant_type: "client_credentials"
  }).toString()
});

console.log("Status:", res.status);
console.log("Response:", await res.text());
