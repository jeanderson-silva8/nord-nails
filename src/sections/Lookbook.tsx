import { useEffect, useRef, useState } from 'react';

const topRowVideos = [
  '/videos/reels/reel1.mp4',
  '/videos/reels/reel2.mp4',
  '/videos/reels/reel3.mp4',
  '/videos/reels/reel4.mp4',
  '/videos/reels/reel5.mp4',
  '/videos/reels/reel6.mp4',
];

const bottomRowVideos = [
  '/videos/reels/reel7.mp4',
  '/videos/reels/reel8.mp4',
  '/videos/reels/reel9.mp4',
  '/videos/reels/reel10.mp4',
  '/videos/reels/reel11.mp4',
  '/videos/reels/reel12.mp4',
];

interface VideoCardProps {
  src: string;
}

const VideoCard = ({ src }: VideoCardProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.3 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      if (isVisible) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isVisible]);

  return (
    <div
      ref={cardRef}
      className="flex-shrink-0 w-[220px] md:w-[260px] lg:w-[280px] rounded-2xl overflow-hidden shadow-lg group"
    >
      <div className="relative aspect-[9/16] bg-[#2d2420]">
        <video
          ref={videoRef}
          src={src}
          muted
          loop
          playsInline
          preload="metadata"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </div>
  );
};

interface CarouselRowProps {
  videos: string[];
  direction: 'left' | 'right';
}

const CarouselRow = ({ videos, direction }: CarouselRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Duplicate content for infinite scroll
    const speed = 0.5; // pixels per frame
    let animationId: number;
    let scrollPos = direction === 'left' ? 0 : el.scrollWidth / 2;

    const animate = () => {
      if (!el) return;

      if (direction === 'left') {
        scrollPos += speed;
        if (scrollPos >= el.scrollWidth / 2) {
          scrollPos = 0;
        }
      } else {
        scrollPos -= speed;
        if (scrollPos <= 0) {
          scrollPos = el.scrollWidth / 2;
        }
      }

      el.scrollLeft = scrollPos;
      animationId = requestAnimationFrame(animate);
    };

    // Wait a bit for videos to load metadata
    const timer = setTimeout(() => {
      animationId = requestAnimationFrame(animate);
    }, 500);

    // Pause on hover
    const handleMouseEnter = () => cancelAnimationFrame(animationId);
    const handleMouseLeave = () => {
      animationId = requestAnimationFrame(animate);
    };

    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animationId);
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [direction]);

  // Duplicate the videos array for seamless infinite scroll
  const duplicatedVideos = [...videos, ...videos];

  return (
    <div
      ref={scrollRef}
      className="flex gap-4 overflow-hidden"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {duplicatedVideos.map((video, idx) => (
        <VideoCard key={`${direction}-${idx}`} src={video} />
      ))}
    </div>
  );
};

const Lookbook = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="lookbook" ref={sectionRef} className="section-padding bg-white overflow-hidden">
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20">
        {/* Section Header */}
        <div
          className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <span className="section-subtitle">For You</span>
          <h2 className="section-title mb-6">Inspiração</h2>
          <p className="font-body text-[#5a4a42] leading-relaxed">
            Confira os melhores momentos e trabalhos feitos pelas nossas
            profissionais. Cada vídeo é uma demonstração da perfeição da técnica
            russa original.
          </p>
        </div>
      </div>

      {/* Top Carousel - scrolls LEFT */}
      <div
        className={`mb-6 transition-all duration-1000 delay-200 ${
          isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
        }`}
      >
        <CarouselRow videos={topRowVideos} direction="left" />
      </div>

      {/* Bottom Carousel - scrolls RIGHT */}
      <div
        className={`transition-all duration-1000 delay-400 ${
          isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
        }`}
      >
        <CarouselRow videos={bottomRowVideos} direction="right" />
      </div>
    </section>
  );
};

export default Lookbook;
