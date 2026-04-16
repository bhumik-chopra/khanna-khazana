import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import { ADMIN_CLERK_PUBLISHABLE_KEY, adminClerkEnabled } from "./clerkConfig";

import "./index.css";
import "./App.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    {adminClerkEnabled ? (
      <ClerkProvider publishableKey={ADMIN_CLERK_PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </BrowserRouter>
);
