import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignUp from "../src/pages/SignUp";
import SignIn from "./pages/SignIn";
import ResetPassword from "./pages/ResetPassword";
import Board from "./pages/Board";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Board />} />
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/sign-up" element={<SignUp />} />
      <Route path="/reset-password" element={<ResetPassword />} />
    </Routes>
  );
}

export default App;
