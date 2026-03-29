import React from "react";

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <div>
          <div className="site-footer-brand">Khanna Khazana</div>
          <div className="site-footer-copy">
            © {new Date().getFullYear()} All rights reserved.
          </div>
        </div>
        <div className="site-footer-tags">
          <span>Food design system</span>
          <span>Orange / White / Green</span>
          <span>Interactive hover UI</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
