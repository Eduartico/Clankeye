import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { useEffect, useMemo, useState } from "react";
import NoImage from "../../assets/no-image.png";

/** Accept a single URL, an array of URLs, or nothing — always produces a clean string[] */
interface ImageCarouselProps {
  images?: string | string[] | null;
}

export default function ImageCarousel({ images: imagesProp }: ImageCarouselProps) {
  // Normalise: string → [string], array → filtered array, null/undefined → []
  const images: string[] = useMemo(() => {
    if (!imagesProp) return [];
    if (typeof imagesProp === "string") return imagesProp ? [imagesProp] : [];
    return imagesProp.filter(Boolean);
  }, [imagesProp]);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Preload all images
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
    // Reset index when image set changes
    setCurrentIndex(0);
  }, [images]);

  const handleImageShown = (direction: string) => {
    if (images.length <= 1) return;
    if (direction === "next") {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    } else {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  return (
    <div className="w-full h-[500px] overflow-hidden relative z-0 rounded-2xl bg-zinc-100 dark:bg-zinc-800">
      <img
        src={images[currentIndex] || NoImage}
        alt={`Product ${currentIndex}`}
        className="absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-500 opacity-100"
        loading="lazy"
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = NoImage; }}
      />

      {images.length > 1 && (
        <>
          <div
            className="absolute top-1/2 left-3 transform -translate-y-1/2 cursor-pointer z-10 text-primary-500 drop-shadow"
            onClick={() => handleImageShown("prev")}
          >
            <ArrowBackIosNewIcon />
          </div>
          <div
            className="absolute top-1/2 right-3 transform -translate-y-1/2 cursor-pointer z-10 text-primary-500 drop-shadow"
            onClick={() => handleImageShown("next")}
          >
            <ArrowForwardIosIcon />
          </div>
        </>
      )}
    </div>
  );
}
