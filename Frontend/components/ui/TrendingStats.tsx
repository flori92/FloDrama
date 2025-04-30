import React from "react";
import { motion } from "framer-motion";

interface StatItem {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "stable";
  percentage?: number;
}

interface TrendingStatsProps {
  title: string;
  subtitle?: string;
  stats: StatItem[];
}

export const TrendingStats: React.FC<TrendingStatsProps> = ({
  title,
  subtitle,
  stats,
}) => {
  // Icônes pour les tendances
  const trendIcons = {
    up: (
      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ),
    down: (
      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    ),
    stable: (
      <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
    ),
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <section className="py-12 bg-gradient-to-br from-black to-blue-900 bg-opacity-30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-fuchsia-500 bg-clip-text text-transparent">
            {title}
          </h2>
          {subtitle && (
            <p className="text-white text-opacity-80">{subtitle}</p>
          )}
        </div>

        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="bg-black bg-opacity-40 border border-white border-opacity-30 rounded-lg p-6 text-center"
              variants={itemVariants}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
            >
              <div className="flex justify-center items-center mb-4">
                {stat.icon && <div className="mr-2">{stat.icon}</div>}
                <h3 className="text-lg font-medium text-white text-opacity-80">{stat.label}</h3>
              </div>
              <div className="text-3xl font-bold mb-2">{stat.value}</div>
              {stat.trend && (
                <div className="flex items-center justify-center">
                  {trendIcons[stat.trend]}
                  <span
                    className={`ml-1 text-sm ${
                      stat.trend === "up"
                        ? "text-green-500"
                        : stat.trend === "down"
                        ? "text-red-500"
                        : "text-yellow-500"
                    }`}
                  >
                    {stat.percentage ? `${stat.percentage}%` : ""}
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
