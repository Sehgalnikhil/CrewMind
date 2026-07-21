
const COMPANIES = [
  { name: "Acme Inc.", icon: "A" },
  { name: "StartHub", icon: "S" },
  { name: "MeowTalk", icon: "M" },
  { name: "Layers", icon: "L" },
  { name: "Sisyphus", icon: "S" },
  { name: "Peakline", icon: "P" },
];

export function Marquee() {
  return (
    <section className="border-y border-gray-100 bg-gray-50 py-10 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-6 text-center">
         <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Trusted by innovative companies</p>
      </div>
      <div className="relative flex w-full flex-col overflow-hidden">
        {/* Gradient fades for the edges */}
        <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-24 bg-gradient-to-r from-gray-50 to-transparent" />
        <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-24 bg-gradient-to-l from-gray-50 to-transparent" />

        <div className="flex w-fit animate-marquee items-center gap-16 md:gap-24">
          {[...COMPANIES, ...COMPANIES, ...COMPANIES, ...COMPANIES].map((company, i) => (
            <div key={i} className="flex items-center gap-3 grayscale opacity-60 transition-all hover:grayscale-0 hover:opacity-100">
               <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200 text-gray-500 font-bold">
                  {company.icon}
               </div>
               <span className="text-lg font-bold text-gray-500">{company.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
