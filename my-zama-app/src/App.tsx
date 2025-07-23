import React from "react";
import './App.css';
import WalletPanel from "./components/WalletPanel";
import UserPanel from "./components/UserPanel";
import FooterPanel from "./components/FooterPanel";
import MainPanel from "./components/MainPanel";
import { FhevmProvider } from "./providers/FhevmProvider";

function App() {
  return (
    <FhevmProvider>
      <div className="container">
        <div className="main-panel">
          <MainPanel />
        </div>
        <div className="sidebar">
          <WalletPanel onWalletConnected={() => {}} />
          <UserPanel />
          <FooterPanel />
        </div>
      </div>
    </FhevmProvider>
  );
}

export default App;