import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../component/Navbar.jsx';
import Footer from '../component/Footer.jsx';
import Video from '../component/Video.jsx';
import Team from '../component/Team.jsx';
import SponsorsSection from '../component/SponsorsSection.jsx';


const workItems = [
  "A for Apple",
  "B for ball",
  "C for Cat",
];



function About() {
    return (
       <>

       <Navbar />
 <section className="bg-gradient-to-r from-[#e9f3ef] to-white py-16 px-4 sm:px-8 md:px-16 lg:px-24">
      <div className="flex flex-col md:flex-row items-center gap-10">
        {/* Left Side: Text Content */}
        <div className="md:w-1/2 text-center md:text-left">
          <h4 className="text-[#ffcf00] text-sm font-semibold mb-2 uppercase tracking-wider">
            – Who We Are –
          </h4>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">About HopeNest</h1>
          <p className="text-[#0b3e5e] opacity-90 mb-4 leading-relaxed">
            We are a community-driven NGO focused on education, healthcare, clean water, and
            emergency relief. Our programs are designed to create sustainable, measurable change
            for the most vulnerable.
          </p>
          <p className="text-[#0b3e5e] opacity-90 mb-6 leading-relaxed">
            Guided by transparency and impact, we partner with local leaders and global supporters
            to transform lives and build resilient communities.
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-6">
            <span className="text-xs px-3 py-1 rounded-full bg-white border border-[#dfe5e3] text-[#05496c]">80G Registered</span>
            <span className="text-xs px-3 py-1 rounded-full bg-white border border-[#dfe5e3] text-[#05496c]">12A Compliant</span>
            <span className="text-xs px-3 py-1 rounded-full bg-white border border-[#dfe5e3] text-[#05496c]">Audited Annually</span>
            <span className="text-xs px-3 py-1 rounded-full bg-white border border-[#dfe5e3] text-[#05496c]">Secure Donations</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Link to="/donate" className="bg-[#05496c] hover:bg-[#0b3e5e] text-white font-semibold py-3 px-6 rounded-lg transition">
              Donate Now
            </Link>
            <a href="#initiatives" className="border border-[#05496c] text-[#05496c] hover:bg-[#e9f3ef] font-semibold py-3 px-6 rounded-lg transition text-center">
              Explore Our Work
            </a>
          </div>
        </div>

        {/* Right Side: Responsive Image */}
        <div className="md:w-1/2 w-full relative">
          <img
            src="src/assets/img/handpump.png"
            alt="About HopeNest"
            className="w-full h-auto max-w-md mx-auto md:max-w-[550px] object-cover rounded-2xl shadow-lg border border-white"
          />
        </div>
      </div>
    </section>

    {/* Mission, Vision, Values */}
    <section className="py-14 px-4 sm:px-8 md:px-16 lg:px-24">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-[#dfe5e3]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#e9f3ef] flex items-center justify-center">
              <svg className="w-5 h-5 text-[#05496c]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-8-4.438-8-10A8 8 0 1120 11c0 5.563-8 10-8 10z"/></svg>
            </div>
            <h3 className="text-lg font-bold text-[#0b3e5e]">Our Mission</h3>
          </div>
          <p className="text-[#0b3e5e] opacity-90">To empower communities through equitable access to education, healthcare, and safe water while providing timely relief during crises.</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-[#dfe5e3]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#e9f3ef] flex items-center justify-center">
              <svg className="w-5 h-5 text-[#05496c]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7 7 .5-5 4.9 1.6 7.6L12 18l-6.6 4 1.6-7.6-5-4.9L9 9z"/></svg>
            </div>
            <h3 className="text-lg font-bold text-[#0b3e5e]">Our Vision</h3>
          </div>
          <p className="text-[#0b3e5e] opacity-90">A world where every child and family can thrive with dignity, safety, and opportunity.</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-[#dfe5e3]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#e9f3ef] flex items-center justify-center">
              <svg className="w-5 h-5 text-[#05496c]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 6l-2 4H6l4 3-2 4 4-3 4 3-2-4 4-3h-4z"/></svg>
            </div>
            <h3 className="text-lg font-bold text-[#0b3e5e]">Our Values</h3>
          </div>
          <ul className="text-[#0b3e5e] opacity-90 space-y-1 list-disc list-inside">
            <li>Transparency & Accountability</li>
            <li>Community First</li>
            <li>Sustainability & Inclusion</li>
          </ul>
        </div>
      </div>
    </section>

       <Video />

       <SponsorsSection />

    


<section id="initiatives" className="py-16 px-4 sm:px-10 md:px-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Our Core Initiatives</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We focus on four key areas to create sustainable positive change in communities
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Education Initiative */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Education</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Providing quality education to underprivileged children through schools, 
                digital learning programs, and skill development workshops.
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">2,500+</div>
              <div className="text-sm text-gray-500">Children Educated</div>
            </div>
          </div>

          {/* Healthcare Initiative */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Healthcare</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Ensuring access to basic healthcare through medical camps, 
                vaccination drives, and health awareness programs.
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">15,000+</div>
              <div className="text-sm text-gray-500">Lives Impacted</div>
            </div>
          </div>

          {/* Community Development */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-yellow-200 transition-colors">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Community Development</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Building sustainable communities through infrastructure development, 
                women empowerment, and livelihood training programs.
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-1">50+</div>
              <div className="text-sm text-gray-500">Villages Transformed</div>
            </div>
          </div>

          {/* Emergency Relief */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-red-200 transition-colors">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Emergency Relief</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Providing immediate assistance during natural disasters, 
                humanitarian crises, and emergency situations.
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 mb-1">25+</div>
              <div className="text-sm text-gray-500">Crisis Responses</div>
            </div>
          </div>
        </div>

        {/* Simple Impact Strip */}
        <div className="mt-16 bg-white border border-[#dfe5e3] rounded-2xl p-8 md:p-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-[#05496c]">10,000+</div>
              <div className="text-[#0b3e5e] opacity-80 text-sm mt-1">Lives Impacted</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-[#05496c]">500+</div>
              <div className="text-[#0b3e5e] opacity-80 text-sm mt-1">Communities Served</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-[#05496c]">95%</div>
              <div className="text-[#0b3e5e] opacity-80 text-sm mt-1">Program Success</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-[#05496c]">8</div>
              <div className="text-[#0b3e5e] opacity-80 text-sm mt-1">Years of Service</div>
            </div>
          </div>
        </div>
      </div>
    </section>




    <Team />

       <Footer />
       </>
    );
}

export default About;