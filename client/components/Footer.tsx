"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Github, Instagram } from 'lucide-react';
import XLogo from './XLogo';
import AppLogo from './AppLogo';

const Footer = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const socialLinks = [
    { name: 'GitHub', icon: Github, url: 'https://github.com/Qptimuss/TeknoAzim' },
    { name: 'X', icon: XLogo, url: '#' },
    { name: 'Instagram', icon: Instagram, url: '#' },
  ];

  const footerNav = [
    { to: "/bloglar", label: "Bloglar" },
    { to: "/duyurular", label: "Duyurular" },
    { to: "/hakkimizda", label: "Hakkımızda" },
  ];

  return (
    <footer className="bg-card text-card-foreground py-8 md:py-12 border-t border-border">
      <div className="container mx-auto px-5 md:px-10 lg:px-20">
        {!isHomePage && (
          <div className="mb-8 text-left">
            <p className="text-xs text-muted-foreground max-w-sm">
              "Okumayan ve yazmayan insan düşünemez."
              <br />
              <span className="italic">- Ali Fuat Başgil, Gençlerle Başbaşa</span>
            </p>
          </div>
        )}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8 md:gap-12">
          {/* Logo and Description */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            {/* Link wrapper already exists in Footer, so we disable the internal link in AppLogo */}
            <Link to="/" className="flex items-center mb-4">
              <AppLogo disableLink />
            </Link>
            <p className="text-sm text-card-foreground max-w-xs">
              Düşüncelerle derinleşen, yazılarla genişleyen bir dünya.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <h3 className="font-outfit text-lg font-semibold mb-2">Hızlı Bağlantılar</h3>
            {footerNav.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="font-roboto text-sm text-card-foreground hover:text-muted-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Social Media Links */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <h3 className="font-outfit text-lg font-semibold mb-2">Bizi Takip Edin</h3>
            <div className="flex gap-4">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-card-foreground hover:text-muted-foreground transition-colors"
                  aria-label={link.name}
                >
                  <link.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 text-center text-sm text-card-foreground">
          <p>Bu proje açık kaynaklıdır.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;