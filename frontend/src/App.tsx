import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AuthRequired } from "./Auth";
import { createClient } from "./Axios";
import { AxiosClientProvider } from "./AxiosContext";
import EditPhoto from "./EditPhoto";
import Main from "./Main";
import NavBar from "./NavBar";
import Photo from "./Photo";
import Photos from "./Photos";
import PhotosByTag from "./PhotosByTag";
import Search from "./Search";
import Tags from "./Tags";
import UploadPhoto from "./UploadPhoto";

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
                path="/photo"
                element={
                  <AuthRequired>
                    <Photos />
                  </AuthRequired>
                }
              />
              <Route
                path="/tag"
                element={
                  <AuthRequired>
                    <Tags />
                  </AuthRequired>
                }
              />
              <Route
                path="/search"
                element={
                  <AuthRequired>
                    <Search />
                  </AuthRequired>
                }
              />
              <Route
                path="/upload"
                element={
                  <AuthRequired>
                    <UploadPhoto />
                  </AuthRequired>
                }
              />
              <Route
                path="/photos-by-tag/:tag"
                element={
                  <AuthRequired>
                    <PhotosByTag />
                  </AuthRequired>
                }
              />
              <Route
                path="/photo/:name"
                element={
                  <AuthRequired>
                    <Photo />
                  </AuthRequired>
                }
              />
              <Route
                path="/photo/:name/edit"
                element={
                  <AuthRequired>
                    <EditPhoto />
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
