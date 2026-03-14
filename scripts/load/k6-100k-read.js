import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    catalog_reads: {
      executor: "constant-vus",
      vus: 50,
      duration: "2m"
    }
  }
};

const baseUrl = __ENV.TELECOSYNC_BASE_URL || "http://localhost:3000";

export default function () {
  const response = http.get(`${baseUrl}/api/products`, {
    headers: {
      Authorization: __ENV.TELECOSYNC_BEARER || ""
    }
  });
  check(response, {
    "products API responds": (res) => res.status === 200 || res.status === 401 || res.status === 403
  });
  sleep(0.5);
}
