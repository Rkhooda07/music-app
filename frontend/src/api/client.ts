import axios from "axios";

// Kinda backend's address book
export const api = axios.create({
  baseURL: "http://192.168.0.189:3000",
});