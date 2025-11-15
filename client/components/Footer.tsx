"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Instagram } from 'lucide-react';
import XLogo from './XLogo';

const Footer = () => {
  const socialLinks = [
    { name: 'GitHub', icon: Github, url: '#' },
    { name: 'X', icon: XLogo, url: '#' },
    { name: 'Instagram', icon: Instagram, url: '#' },
  ];

  const footerNav = [
    { to: "/bloglar", label: "Bloglar" },
    { to: "/duyurular", label: "Duyurular" },
    { to: "/hakkimizda", label: "Hakkımızda" },
  ];

  return (
    <footer className="bg-[#090a0c] text-white py-8 md:py-12 border-t border-[#2a2d31]">
      <div className="container mx-auto px-5 md:px-10 lg:px-20">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8 md:gap-12">
          {/* Logo and Description */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <Link to="/" className="flex items-center mb-4">
              <div className="rounded-[25px] bg-[#d9d9d9] px-6 py-1 shrink-0">
                <div className="font-outfit text-lg font-normal text-[#090a0c] whitespace-nowrap">
                  Logo
                </div>
              </div>
            </Link>
            <p className="text-sm text-[#eeeeee] max-w-xs">
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
                className="font-roboto text-sm text-[#eeeeee] hover:text-gray-400 transition-colors"
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
                  className="text-[#eeeeee] hover:text-gray-400 transition-colors"
                  aria-label={link.name}
                >
                  <link.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-[#2a2d31] mt-8 pt-6 text-center text-sm text-[#eeeeee]">
          <p>Bu proje açık kaynaklıdır.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;