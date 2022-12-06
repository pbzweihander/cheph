import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AuthRequired } from "./Auth";
import { createClient } from "./Axios";
import { AxiosClientProvider } from "./AxiosContext";
import Hello from "./Hello";
import Main from "./Main";
import NavBar from "./NavBar";

const queryClient = new QueryClient();
const axiosClient = createClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AxiosClientProvider value={axiosClient}>
        <BrowserRouter>
          <Routes>
            <Route element={<NavBar />}>
              <Route path="/" element={<Main />} />
              <Route
                path="/hello"
                element={
                  <AuthRequired>
                    <Hello />
                  </AuthRequired>
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </AxiosClientProvider>
    </QueryClientProvider>
  );
}

export default App;
