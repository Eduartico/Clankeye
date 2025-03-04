import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { useEffect, useState } from "react";
import NoImage from "../../assets/no-image.png";

interface ImageCarouselProps {
  images: string[];
}

const preloadImages = (images: string[]) => {
  images.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
};

export default function ImageCarousel({ images }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    preloadImages(images);
  }, [images]);

  const handleImageShown = (direction: string) => {
    if (direction === "next") {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    } else if (direction === "prev") {
      setCurrentIndex(
        (prevIndex) => (prevIndex - 1 + images.length) % images.length
      );
    }
  };

  return (
    <div className="w-full h-[500px] overflow-hidden relative z-0 rounded-2xl">
      <img
        src={images[currentIndex] || NoImage}
        alt={`Product ${currentIndex}`}
        className="absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-500 opacity-100"
        loading="lazy"
      />

      <div
        className="absolute top-1/2 left-3 transform -translate-y-1/2 cursor-pointer z-10 text-thunderbird-500"
        onClick={() => handleImageShown("prev")}
      >
        <ArrowBackIosNewIcon />
      </div>
      <div
        className="absolute top-1/2 right-3 transform -translate-y-1/2 cursor-pointer z-10 text-thunderbird-500"
        onClick={() => handleImageShown("next")}
      >
        <ArrowForwardIosIcon />
      </div>
    </div>
  );
}
