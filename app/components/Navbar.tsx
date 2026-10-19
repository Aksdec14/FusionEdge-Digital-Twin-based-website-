"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (dropdownTimeoutRef.current) {
                clearTimeout(dropdownTimeoutRef.current);
            }
        };
    }, []);

    const handleMouseEnter = (dropdown: string) => {
        if (dropdownTimeoutRef.current) {
            clearTimeout(dropdownTimeoutRef.current);
        }
        setOpenDropdown(dropdown);
    };

    const handleMouseLeave = () => {
        dropdownTimeoutRef.current = setTimeout(() => {
            setOpenDropdown(null);
        }, 200);
    };

    // ── Order: About Us · Solutions (dropdown) · Industries (dropdown) · Resources · Careers · Contact
    const navLinks = [
        { name: 'About Us', href: '/about' },
    ];

    const solutionsDropdown = {
        title: 'Solutions',
        description: 'Comprehensive facility management solutions tailored to your needs',
        items: [
            { name: 'Asset & Maintenance Management', href: '/solutions/asset-maintenance', description: 'Track and optimize all your assets in real-time' },
            { name: 'Compliance & Audit Management', href: '/solutions/compliance-audit', description: 'Ensure regulatory compliance and streamline audits' },
            { name: 'Work Order Management', href: '/solutions/work-order', description: 'Efficient work order creation and tracking' },
            { name: 'Preventive Maintenance', href: '/solutions/preventive-maintenance', description: 'Proactive maintenance to reduce downtime' },
            { name: 'Integrated Asset Management', href: '/solutions/integrated-asset', description: 'Complete asset lifecycle management' },
        ]
    };

    const industriesDropdown = {
        title: 'Industries',
        description: 'Specialized solutions for diverse industry verticals',
        items: [
            { name: 'Construction', href: '/industries/construction', description: 'Comprehensive tools for construction projects' },
            { name: 'Manufacturing', href: '/industries/manufacturing', description: 'Streamline manufacturing operations' },
            { name: 'Food & Beverages', href: '/industries/food-beverages', description: 'Ensure quality and compliance in F&B' },
            { name: 'Hospitality', href: '/industries/hospitality', description: 'Enhance guest experience and operations' },
        ]
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-3 group">
                        <div className="relative">
                            <Image
                                src="/FusionEdge_logo.png"
                                alt="FusionEdge Logo"
                                width={180}
                                height={56}
                                className="h-14 w-auto"
                                style={{ width: 'auto' }}
                            />
                        </div>
                    </Link>

                    {/* Desktop Navigation — About Us · Solutions · Industries · Resources · Careers · Contact */}
                    <div className="hidden md:flex items-center space-x-1">

                        {/* About Us */}
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#5D1F73] rounded-lg hover:bg-purple-50 transition-all duration-200"
                            >
                                {link.name}
                            </Link>
                        ))}

                        {/* Solutions Mega Dropdown */}
                        <div
                            className="relative"
                            onMouseEnter={() => handleMouseEnter('solutions')}
                            onMouseLeave={handleMouseLeave}
                        >
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#5D1F73] rounded-lg hover:bg-purple-50 transition-all duration-200 flex items-center gap-1">
                                Solutions
                                <svg className={`w-4 h-4 transition-transform ${openDropdown === 'solutions' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {openDropdown === 'solutions' && (
                                <div
                                    className="absolute left-0 top-full pt-2 w-[600px] z-50"
                                    onMouseEnter={() => handleMouseEnter('solutions')}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6">
                                        <div className="mb-4">
                                            <h3 className="text-lg font-bold text-[#5D1F73] mb-1">{solutionsDropdown.title}</h3>
                                            <p className="text-sm text-gray-600">{solutionsDropdown.description}</p>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2">
                                            {solutionsDropdown.items.map((item) => (
                                                <Link
                                                    key={item.name}
                                                    href={item.href}
                                                    className="group p-3 rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-teal-50 transition-all duration-200"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-1">
                                                            <svg className="w-5 h-5 text-[#1ABC9C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold text-gray-900 group-hover:text-[#5D1F73] transition-colors mb-1">
                                                                {item.name}
                                                            </h4>
                                                            <p className="text-xs text-gray-600">{item.description}</p>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Industries Mega Dropdown */}
                        <div
                            className="relative"
                            onMouseEnter={() => handleMouseEnter('industries')}
                            onMouseLeave={handleMouseLeave}
                        >
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#5D1F73] rounded-lg hover:bg-purple-50 transition-all duration-200 flex items-center gap-1">
                                Industries
                                <svg className={`w-4 h-4 transition-transform ${openDropdown === 'industries' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {openDropdown === 'industries' && (
                                <div
                                    className="absolute left-0 top-full pt-2 w-[500px] z-50"
                                    onMouseEnter={() => handleMouseEnter('industries')}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6">
                                        <div className="mb-4">
                                            <h3 className="text-lg font-bold text-[#5D1F73] mb-1">{industriesDropdown.title}</h3>
                                            <p className="text-sm text-gray-600">{industriesDropdown.description}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {industriesDropdown.items.map((item) => (
                                                <Link
                                                    key={item.name}
                                                    href={item.href}
                                                    className="group p-4 rounded-lg border border-gray-200 hover:border-[#1ABC9C] hover:bg-gradient-to-br hover:from-purple-50 hover:to-teal-50 transition-all duration-200"
                                                >
                                                    <div className="flex flex-col gap-2">
                                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#5D1F73] to-[#1ABC9C] flex items-center justify-center mb-1">
                                                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                            </svg>
                                                        </div>
                                                        <h4 className="font-semibold text-gray-900 group-hover:text-[#5D1F73] transition-colors">
                                                            {item.name}
                                                        </h4>
                                                        <p className="text-xs text-gray-600">{item.description}</p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Resources */}
                        <Link href="/resources" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#5D1F73] rounded-lg hover:bg-purple-50 transition-all duration-200">
                            Resources
                        </Link>

                        {/* Careers */}
                        <Link href="/careers" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#5D1F73] rounded-lg hover:bg-purple-50 transition-all duration-200">
                            Careers
                        </Link>

                        {/* Contact */}
                        <Link href="/contact" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#5D1F73] rounded-lg hover:bg-purple-50 transition-all duration-200">
                            Contact
                        </Link>
                    </div>

                    {/* Desktop CTA */}
                    <div className="hidden md:flex items-center space-x-4">
                        <Link
                            href="/request-demo"
                            className="group relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white overflow-hidden rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#5D1F73] to-[#1ABC9C]"></div>
                            <div className="absolute inset-0 bg-[#5D1F73] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <span className="relative">Request a Demo</span>
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu — same order: About Us · Solutions · Industries · Resources · Careers · Contact */}
            <div className={`md:hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="px-6 sm:px-8 lg:px-16 py-4 bg-white border-t border-gray-200 shadow-lg max-h-[80vh] overflow-y-auto">
                    <div className="space-y-2">

                        {/* About Us */}
                        {navLinks.map((link) => (
                            <Link key={link.name} href={link.href} onClick={() => setIsMobileMenuOpen(false)}
                                className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-[#5D1F73] hover:bg-purple-50 rounded-lg transition-all duration-200">
                                {link.name}
                            </Link>
                        ))}

                        {/* Solutions */}
                        <div>
                            <button onClick={() => setOpenDropdown(openDropdown === 'solutions' ? null : 'solutions')}
                                className="w-full flex items-center justify-between px-4 py-3 text-base font-medium text-gray-700 hover:text-[#5D1F73] hover:bg-purple-50 rounded-lg transition-all duration-200">
                                Solutions
                                <svg className={`w-4 h-4 transition-transform ${openDropdown === 'solutions' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {openDropdown === 'solutions' && (
                                <div className="mt-2 ml-4 space-y-2">
                                    {solutionsDropdown.items.map((item) => (
                                        <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)}
                                            className="block px-4 py-2 text-sm text-gray-600 hover:text-[#5D1F73] hover:bg-purple-50 rounded-lg transition-all duration-200">
                                            {item.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Industries */}
                        <div>
                            <button onClick={() => setOpenDropdown(openDropdown === 'industries' ? null : 'industries')}
                                className="w-full flex items-center justify-between px-4 py-3 text-base font-medium text-gray-700 hover:text-[#5D1F73] hover:bg-purple-50 rounded-lg transition-all duration-200">
                                Industries
                                <svg className={`w-4 h-4 transition-transform ${openDropdown === 'industries' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {openDropdown === 'industries' && (
                                <div className="mt-2 ml-4 space-y-2">
                                    {industriesDropdown.items.map((item) => (
                                        <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)}
                                            className="block px-4 py-2 text-sm text-gray-600 hover:text-[#5D1F73] hover:bg-purple-50 rounded-lg transition-all duration-200">
                                            {item.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Resources */}
                        <Link href="/resources" onClick={() => setIsMobileMenuOpen(false)}
                            className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-[#5D1F73] hover:bg-purple-50 rounded-lg transition-all duration-200">
                            Resources
                        </Link>

                        {/* Careers */}
                        <Link href="/careers" onClick={() => setIsMobileMenuOpen(false)}
                            className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-[#5D1F73] hover:bg-purple-50 rounded-lg transition-all duration-200">
                            Careers
                        </Link>

                        {/* Contact */}
                        <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)}
                            className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-[#5D1F73] hover:bg-purple-50 rounded-lg transition-all duration-200">
                            Contact
                        </Link>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                        <Link href="/request-demo" onClick={() => setIsMobileMenuOpen(false)}
                            className="block w-full px-4 py-3 text-center text-base font-semibold text-white bg-gradient-to-r from-[#5D1F73] to-[#1ABC9C] rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-200">
                            Request a Demo
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}