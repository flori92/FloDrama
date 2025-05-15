import React from "react";
import ReactDOM from "react-dom/client";
import App from "../App";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../Context/UserContext";
import { WatchPartyProvider } from "../Context/WatchPartyContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <WatchPartyProvider>
          <App />
        </WatchPartyProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
