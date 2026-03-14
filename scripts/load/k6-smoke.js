import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 5,
  duration: "30s"
};

const baseUrl = __ENV.TELECOSYNC_BASE_URL || "http://localhost:3000";

export default function () {
  const response = http.get(`${baseUrl}/login`);
  check(response, {
    "login page responds": (res) => res.status === 200
  });
  sleep(1);
}
