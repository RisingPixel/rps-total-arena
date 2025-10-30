import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import RockPaperScissors from "./pages/RockPaperScissors";
import NotFound from "./pages/NotFound";

const Router = import.meta.env.PROD ? HashRouter : BrowserRouter;

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<RockPaperScissors />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Router>
);

export default App;
