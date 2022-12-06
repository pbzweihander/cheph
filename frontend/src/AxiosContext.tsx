import axios, { AxiosInstance } from "axios";
import { createContext, useContext } from "react";

const AxiosClientContext = createContext(axios.create());

export const AxiosClientProvider = AxiosClientContext.Provider;
export const useAxiosClient = (): AxiosInstance =>
  useContext(AxiosClientContext);

export default AxiosClientContext;
