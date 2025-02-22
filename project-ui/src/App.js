import React from "react";
import HomePage from "./pages/HomePage";
import { Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import { useEffect } from "react";

function App() {
  return (
    <div>
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
      {/* <h1>hello guys</h1> */}
    </div>
  );
}

export default App;
