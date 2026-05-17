import { useScroll, useTransform, motion } from "framer-motion";
import { useRef } from "react";

export default function Hero() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0vh", "50vh"]);

  return (
    <div
      ref={container}
      className="relative flex items-center justify-center h-screen overflow-hidden"
    >
      <motion.div
        style={{ y }}
        className="absolute inset-0 w-full h-full"
      >
        <img
          src="https://cdn.poehali.dev/projects/3ee6cd3d-ee0f-4b2c-8be0-4f6eaf545754/files/381f2607-ad9b-4fb9-9624-eabf4bb0e4b2.jpg"
          alt="Lada Niva offroad"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
      </motion.div>

      <div className="relative z-10 text-center text-white">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
          НИВА — ЕДЕТ
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto px-6 opacity-90">
          Оригинальные и качественные запчасти для Lada Niva. Быстрая доставка по всей России.
        </p>
        <button className="mt-8 bg-white text-black px-8 py-3 uppercase tracking-wide text-sm font-bold hover:bg-neutral-200 transition-colors duration-300 cursor-pointer">
          Смотреть каталог
        </button>
      </div>
    </div>
  );
}