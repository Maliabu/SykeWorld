"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { FaShareAlt, FaStar } from "react-icons/fa";
import { SlStar } from "react-icons/sl";

interface SceneProps {
  title: string;
  image: string;
  description: string;
}

export default function Scenes({ title, image, description }: SceneProps) {
  return (
    <motion.div
      className="bg-white rounded-lg overflow-hidden cursor-pointer "
      whileHover={{ scale: 1.05 }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative w-full h-96">
        <Image src={image} alt={title} fill className="object-cover" />
      </div>
    </motion.div>
  );
}
