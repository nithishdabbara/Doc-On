import React from 'react';
import { Stethoscope, Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="footer-section">
            <div className="container">
                <div className="footer-grid">
                    {/* Brand Column */}
                    <div className="footer-col brand-col">
                        <div className="footer-logo">
                            <Stethoscope size={32} className="text-secondary" />
                            <span className="brand-name">DocOn</span>
                        </div>
                        <p className="footer-desc">
                            Your trusted partner in digital healthcare. connecting patients with top-tier specialists for a seamless medical experience.
                        </p>
                        <div className="social-links">
                            <a href="#" className="social-icon"><Facebook size={20} /></a>
                            <a href="#" className="social-icon"><Twitter size={20} /></a>
                            <a href="#" className="social-icon"><Instagram size={20} /></a>
                            <a href="#" className="social-icon"><Linkedin size={20} /></a>
                        </div>
                    </div>

                    {/* Quick Links - Patients */}
                    <div className="footer-col">
                        <h4>For Patients</h4>
                        <ul className="footer-links">
                            <li><Link to="/search">Find a Doctor</Link></li>
                            <li><Link to="/login">Login / Register</Link></li>
                            <li><Link to="/patient/dashboard">My Dashboard</Link></li>
                            <li><a href="#">Health Articles</a></li>
                            <li><a href="#">Insurance Partners</a></li>
                        </ul>
                    </div>

                    {/* Quick Links - Doctors */}
                    <div className="footer-col">
                        <h4>For Doctors</h4>
                        <ul className="footer-links">
                            <li><Link to="/doctor-signup">Join DocOn</Link></li>
                            <li><Link to="/login">Doctor Login</Link></li>
                            <li><a href="#">Success Stories</a></li>
                            <li><a href="#">Practice Management</a></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="footer-col">
                        <h4>Contact Us</h4>
                        <ul className="contact-list">
                            <li>
                                <Phone size={18} className="text-secondary" />
                                <span>+1 (555) 123-4567</span>
                            </li>
                            <li>
                                <Mail size={18} className="text-secondary" />
                                <span>support@docon.com</span>
                            </li>
                            <li>
                                <MapPin size={18} className="text-secondary" />
                                <span>123 Medical Plaza, New York, NY</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} DocOn Healthcare. All rights reserved.</p>
                    <div className="legal-links">
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

