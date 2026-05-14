import React from 'react';
import { FaTimes, FaWhatsapp, FaInstagram, FaMapMarkerAlt } from 'react-icons/fa';
import Gallary from './Gallary';

const features = [
  {
    title: "Save Animals and Save Life’s",
    image: "src/assets/img/ghgh.png",
    shape: "rounded-[12px]"
  },
];



function HeroPart() {
    return (
        <>
            <div className=" relative md:right-10 w-full px-4 py-8 md:px-10 mb-[50px]">
                <div className="relative flex flex-col md:flex-row items-center justify-center bg-white p-4 md:p-12">
                    <div className="md:w-[12%]"></div>
                    {/* Left Side (Image Section) */}
                    <div className="relative w-full md:w-[40%] flex justify-center flex-row-reverse items-center md:mb-0 mb-8">
                        {/* Foreground Image */}
                        <div className="relative z-10 w-4/5 sm:w-3/4 md:w-full h-auto object-cover md:border-[12px] border-white rounded-[15px]">
                            <img
                                src="src/assets/img/hh3.jpg"
                                alt="Cheetah in forest"
                                className="rounded-[12px] w-full h-auto"
                            />
                        </div>
                        <span className="absolute left-[10px] md:bottom-[10px] md:left-[-38px] w-[55%] md:w-[80%] hidden sm:block">
                            <img src="src/assets/img/hh4.png" alt="" className="rounded-[12px] rotate-45" />
                        </span>
                    </div>
                    {/* Right Side (Text Box) */}
                    <div className="bg-[#dbe1df] rounded-[12px] p-6 md:p-10 w-full md:w-[45%] ml-0 md:ml-auto relative z-10 shadow-md flex flex-col items-center md:items-start">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-center md:text-left font-garamond ]">
                            Every Life
                        </h1>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mt-2 mb-4 text-center md:text-left">
                            Deserves Hope
                        </h2>
                        <p className="text-gray-800 text-base sm:text-lg max-w-xl text-center md:text-left">
                            "Every life Deserves hope!". hope is not a luxary , it's a fundamental human need. with the right support and compassion , every life can rise
                        </p>
                        {/* Icon Row */}
                        <div className="relative mt-6 w-full flex justify-center md:justify-end md:bottom-[-20px] md:right-[-20px]">
                            <div className="bg-white inline-flex gap-5 p-3 px-6 rounded-[12px] shadow-md">
                                <FaTimes className="text-2xl cursor-pointer" />
                                <FaWhatsapp className="text-2xl cursor-pointer" />
                                <FaInstagram className="text-2xl cursor-pointer" />
                                <FaMapMarkerAlt className="text-2xl cursor-pointer" />
                            </div>
                        </div>
                        {/* Optional Decorative Shape */}
                        <div
                            className="absolute top-4 right-4 w-6 h-6 bg-amber-300"
                            style={{
                                clipPath:
                                    "polygon(50% 1.25%, 34.6% 20.56%, 9.9% 20.56%, 15.4% 44.64%, 0% 63.95%, 22.25% 74.67%, 27.75% 98.75%, 50% 88.03%, 72.25% 98.75%, 77.75% 74.67%, 100% 63.95%, 84.6% 44.64%, 90.1% 20.56%, 65.4% 20.56%)"
                            }}
                        ></div>
                    </div>
                </div>
            </div>

            <section id='about' className='w-full'>
                    <div className="relative mx-auto mt-20 p-10 md:mx-18 bg-[#dce2e0] rounded-[12px] shadow-md">
      <div className="absolute -top-8 right-14 md:right-20 bg-white px-10 py-4 rounded-b-2xl text-3xl font-bold md:text-[50px]">
        ABOUT <span className="text-[#003c5c]">US</span>
      </div>
      <h2 className="text-4xl font-bold leading-snug mt-2">
        Nourishing Lives <span className="text-[#d1b205]">&</span>
        <br /> Empowering Communities
      </h2>
      <p className="mt-6 text-base text-gray-800 leading-relaxed">
        Our mission revolves around alleviating hunger, providing essential resources, and creating a ripple effect of happiness that extends far beyond mere sustenance. Over the years, we have successfully implemented numerous initiatives that have not only fed thousands of individuals but have also empowered them through education and support programs. Our commitment to social welfare has led to the establishment of community kitchens, food drives, and outreach events that bring people together, reinforcing the bonds of solidarity and compassion. By addressing the root causes of poverty and hunger, we strive to create a brighter future for all, ensuring that no one is left behind. Join us in our journey to spread kindness and make a lasting impact on society. </p>
    </div>
            </section>


<Gallary/>

<section id="detail">

 <div className="relative px-[18px] pb-[18px] bg-white md:top-[80px] md:rounded-2xl flex flex-col items-start max-w-screen-xl mx-auto">
      <h2 className="text-7xl md:text-[150px] font-extrabold text-black mb-4">
        Our <span className="text-yellow-500">i</span>mpact
      </h2>
      <p className="text-2xl font-bold text-black mb-10">
        "creating lasting & meaningful change"
      </p>

      <div className="w-full">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="group relative overflow-hidden transition duration-300"
          >
            <img
              src={feature.image}
              alt={feature.title}
              className={`w-full h-[58vh] object-cover ${feature.shape}`}
            />
          </div>
        ))}
      </div>
    </div>

</section>
     
        </>
    );
}




export default HeroPart;