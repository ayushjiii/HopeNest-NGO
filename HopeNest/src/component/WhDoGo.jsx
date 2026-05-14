import React from 'react';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const WhDoGo = () => {
  const allocations = [
    { label: 'Programs & Services', value: 82, color: 'bg-[#05496c]' },
    { label: 'Operations', value: 8, color: 'bg-[#0b3e5e]' },
    { label: 'Fundraising', value: 6, color: 'bg-[#2a6a88]' },
    { label: 'Future Reserves', value: 4, color: 'bg-[#7aa7bd]' },
  ];

  const pillars = [
    { icon: '📚', title: 'Education', desc: 'Scholarships, classrooms, and teacher training for lasting change.' },
    { icon: '🏥', title: 'Healthcare', desc: 'Clinics, screenings, and life‑saving treatments in remote areas.' },
    { icon: '🛡️', title: 'Women Protection', desc: 'Legal aid, safe shelters, counseling, and awareness programs.' },
    { icon: '🩸', title: 'Blood Camp', desc: 'Community blood drives, screening, and emergency support.' },
  ];

  const total = allocations.reduce((a, b) => a + b.value, 0);

  return (
    <section className="relative isolate">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-[#f5fbff] to-white" />
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-48 bg-[radial-gradient(ellipse_at_top,rgba(5,73,108,0.15),transparent_60%)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-[#05496c]/10 text-[#05496c] px-4 py-1.5 text-sm font-medium ring-1 ring-[#05496c]/20">
            <span className="inline-block h-2 w-2 rounded-full bg-[#ffcf00]" />
            Impact Allocation
          </div>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-[#0b3e5e]">
            Where your donation goes
          </h2>
          <p className="mt-3 text-base md:text-lg text-[#0b3e5e]/80 max-w-2xl mx-auto">
            Transparent, responsible, and designed for maximum community impact.
          </p>
        </motion.div>

        {/* Allocation Bar + Legend */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="mb-14"
        >
          <div className="rounded-2xl bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 ring-1 ring-[#05496c]/10 p-5 shadow-sm">
            <div className="flex h-5 w-full overflow-hidden rounded-full ring-1 ring-[#05496c]/10">
              {allocations.map((a, i) => (
                <div
                  key={a.label}
                  className={`${a.color} h-full`}
                  style={{ width: `${(a.value / total) * 100}%` }}
                  aria-label={`${a.label} ${a.value}%`}
                />
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {allocations.map((a) => (
                <div key={a.label} className="flex items-center gap-3 rounded-lg px-3 py-2">
                  <span className={`h-3 w-3 rounded-sm ${a.color}`} />
                  <div className="text-sm">
                    <p className="font-semibold text-[#0b3e5e]">{a.label}</p>
                    <p className="text-[#0b3e5e]/70">{a.value}% allocation</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
          {pillars.map((p, idx) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: idx * 0.05 }}
              viewport={{ once: true }}
              className="group rounded-2xl bg-white/80 backdrop-blur ring-1 ring-[#05496c]/10 p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="text-4xl mb-4 drop-shadow-sm">{p.icon}</div>
              <h3 className="text-lg font-semibold text-[#0b3e5e]">{p.title}</h3>
              <p className="mt-2 text-sm text-[#0b3e5e]/80">
                {p.desc}
              </p>
              <div className="mt-5 h-px bg-gradient-to-r from-transparent via-[#ffcf00]/60 to-transparent" />
              <div className="mt-4 flex items-center gap-2 text-[#05496c] font-medium">
                <span className="inline-block h-2 w-2 rounded-full bg-[#ffcf00]" />
                Proven outcomes
              </div>
            </motion.div>
          ))}
        </div>

        {/* Impact Stats */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="rounded-2xl bg-[#05496c] text-white p-8 md:p-10 shadow-md ring-1 ring-[#05496c]"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold">Real impact, measurable change</h3>
              <p className="mt-2 text-white/80 max-w-xl">
                Every rupee is tracked end‑to‑end. We publish detailed reports and audits so you always know the difference you create.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 md:gap-8">
              {[
                { number: '₹10M+', label: 'Raised annually' },
                { number: '92%', label: 'Direct to programs' },
                { number: '15+', label: 'Countries reached' },
                { number: '250K+', label: 'Lives impacted' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-3xl font-extrabold tracking-tight">{s.number}</p>
                  <p className="mt-1 text-sm text-white/80">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full bg-[#ffcf00] px-6 py-3 font-semibold text-[#0b3e5e] shadow-sm hover:shadow-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ffcf00]"
            >
              Donate now
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full px-6 py-3 font-semibold ring-1 ring-white/60 text-white hover:bg-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/80"
            >
              Read annual report
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default WhDoGo;