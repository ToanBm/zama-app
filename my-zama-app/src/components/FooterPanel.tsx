import React from "react";

const FooterPanel: React.FC = () => (
  <div className="footer-panel">
    <div className="footer-text">
      <div className="line-app">
        A Multi Chain NFT Launch & Trade Hub
      </div>
      <div className="line-version">© 2025 ToanBm - Version 1.0</div>
    </div>
    <div className="social-icons">
      <a
        href="https://github.com/ToanBm"
        target="_blank"
        rel="noreferrer"
        className="social-button"
      >
        <img src="/icon/github.svg" alt="" />
      </a>
      <a
        href="https://x.com/buiminhtoan1985"
        target="_blank"
        rel="noreferrer"
        className="social-button"
      >
        <img src="/icon/x.svg" alt="" />
      </a>
      <a
        href="https://discord.com/users/toanbm"
        target="_blank"
        rel="noreferrer"
        className="social-button"
      >
        <img src="/icon/discord.svg" alt="" />
      </a>
      <a
        href="https://t.me/"
        target="_blank"
        rel="noreferrer"
        className="social-button"
      >
        <img src="/icon/telegram.svg" alt="" />
      </a>
    </div>
  </div>
);

export default FooterPanel; 