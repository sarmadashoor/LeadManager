import React from "react";
import { Routes, Route } from "react-router-dom";
import ChatWindow from "./components/ChatWindow";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/c/:leadId" element={<ChatWindow />} />
    </Routes>
  );
};

export default App;
