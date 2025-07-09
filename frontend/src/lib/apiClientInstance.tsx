import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_LAMBDA_API_URL,
  headers: {'authorization': import.meta.env.VITE_ACCESS_TOKEN}
})