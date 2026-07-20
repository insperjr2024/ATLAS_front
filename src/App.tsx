import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { GlobalStyle } from "@/styles/GlobalStyle";
import { AppRoutes } from "./AppRoutes";

const App = () => (
  <>
    <GlobalStyle />
    <Toaster position="top-right" />
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </>
);

export default App;
