import React from "react";
import HomePage from "./pages/HomePage";
import { Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import { useEffect } from "react";
import { QueryProvider } from "./contexts/QueryContextType";

function App() {
  return (
    <div>
      <QueryProvider>
        <Routes>
          <Route
            path="/"
            element={
              <Layout>
                <HomePage />
              </Layout>
            }
          />
        </Routes>
      </QueryProvider>
      {/* <h1>hello guys</h1> */}
    </div>
  );
}

export default App;
