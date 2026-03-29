import React from "react";
import { TESTIMONIALS } from "../data";

const Testimonials = () => {
  return (
    <section className="section" id="testimonials">
      <div className="container">
        <div className="section-header">
          <p className="badge badge-glass">Love from the Khazana family</p>
          <h2 className="section-title">Foodies who keep coming back</h2>
          <p className="section-subtitle">Real people, real cravings, real stories.</p>
        </div>

        <div className="testimonial-grid">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="testimonial-card">
              <div className="testimonial-mark">"</div>
              <blockquote>{t.text}</blockquote>
              <figcaption>
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-role">{t.role}</div>
                </div>
                <div className="testimonial-verified">Verified foodie</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
