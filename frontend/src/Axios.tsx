import axios, { AxiosInstance } from "axios";

export function createClient(): AxiosInstance {
  return axios.create();
}
