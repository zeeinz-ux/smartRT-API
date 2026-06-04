import React from "react";
import "../../assets/style/css/Footer.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-small">
      <div className="footer-small-container">
        <p>© {currentYear} RT-003 · Kelurahan Cipondoh. All rights reserved.</p>
        <span className="footer-small-status">Online</span>
      </div>
    </footer>
  );
}
