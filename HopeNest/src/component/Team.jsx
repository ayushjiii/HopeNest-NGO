import React from "react";
import { motion } from "framer-motion";

// Branding colors
const primary = "#05496c"; // HopeNest primary
const accent = "#ffcf00";  // HopeNest accent

const teamMembers = [
  { name: "Divyesh Moradiya", role: "Lead Developer(backend)", image: "src/assets/img/user.png" },
  { name: "Ayush Beladiya", role: "UI/UX designer(frontend)", image: "src/assets/img/user.png" },
  { name: "Neel Bhuva", role: "Chairman", image: "src/assets/img/user.png" },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] } }
};

const Team = () => {
  return (
    <section className="py-16 px-4 sm:px-6 md:px-10">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.45 }}
            className="text-3xl md:text-4xl font-extrabold"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#05496c] via-[#0b6e92] to-[#2aa1c0]">
              Our Team
            </span>
          </motion.h2>
          <p className="mt-2 text-slate-600">Simple, focused, and impactful.</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
          {teamMembers.map((m, idx) => (
            <motion.div
              key={m.name + idx}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45, delay: idx * 0.05 }}
              className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-6 text-center"
            >
              <img
                src={m.image}
                alt={m.name}
                className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover mx-auto ring-4 ring-white shadow"
              />
              <h3 className="mt-5 text-lg font-semibold text-slate-900">{m.name}</h3>
              <p className="text-sm" style={{ color: primary }}>{m.role}</p>
              <div className="mt-4 h-px w-12 mx-auto bg-gradient-to-r from-transparent via-[#ffcf00] to-transparent" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Team;
