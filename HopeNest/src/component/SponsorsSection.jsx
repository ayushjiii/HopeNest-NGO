import React, { useEffect } from "react";
import { motion, useAnimation } from "framer-motion";

const sponsors = [
  {
    name: "Greater Reston Chamber of Commerce",
    logo: "https://i.shgcdn.com/a0b48cb7-e900-4502-8f25-2817a95bdf0c/",
  },
  {
    name: "Central Fairfax Chamber of Commerce",
    logo: "https://i.shgcdn.com/0ac933c2-e8ea-46bd-abfc-85acd861bb52/",
  },
  {
    name: "NVC | Advancing Business for a Greater Washington",
    logo: "https://i.shgcdn.com/3f576b7d-3939-413c-87cd-fb3babf101c5/",
  },
  {
    name: "Tysons Regional Chamber of Commerce",
    logo: "https://i.shgcdn.com/52eca15a-6bd4-4464-9cae-13d383b42b7d/",
  },
  {
    name: "Northern Virginia Black Chamber of Commerce",
    logo: "https://i.shgcdn.com/4b92f4ad-6664-47bf-8d22-c5812beef76e/",
  },
];

const extendedSponsors = [...sponsors, ...sponsors];

const SponsorsSection = () => {
  const controls = useAnimation();

  const startScroll = async () => {
    await controls.start({
      x: "-50%",
      transition: {
        repeat: Infinity,
        repeatType: "loop",
        duration: 20,
        ease: "linear",
      },
    });
  };

  const stopScroll = () => {
    controls.stop();
  };

  useEffect(() => {
    startScroll();
  }, []);

  return (
    <div className="overflow-hidden py-12 bg-white mx-[50px]">
      <h2 className="text-2xl font-semibold text-center mb-10">– Our Sponsors –</h2>
      <div
        className="relative"
        onMouseEnter={stopScroll}
        onMouseLeave={startScroll}
      >
        <motion.div className="flex gap-16" animate={controls}>
          {extendedSponsors.map((sponsor, index) => (
            <div key={index} className="min-w-[200px] flex-shrink-0 text-center">
              <img
                src={sponsor.logo}
                alt={sponsor.name}
                className="w-40 h-auto mx-auto mb-2 object-contain"
              />
              <p className="text-sm text-gray-700 w-40 mx-auto">{sponsor.name}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default SponsorsSection;
