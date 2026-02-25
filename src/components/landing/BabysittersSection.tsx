import { Star, MapPin, Shield, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const sitters = [
  {
    name: "Aaishah R.",
    location: "Tampines, Singapore",
    rate: 18,
    rating: 4.9,
    reviews: 34,
    bio: "Passionate about childcare with 4+ years experience. CPR certified and great with toddlers.",
    skills: ["Toddlers", "CPR certified", "Bilingual"],
    verified: true,
    photo: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    name: "Victoria L.",
    location: "Woodlands, Singapore",
    rate: 15,
    rating: 4.8,
    reviews: 22,
    bio: "Early childhood educator with special needs experience. Warm, patient and reliable.",
    skills: ["Special needs", "Homework help", "Infant care"],
    verified: true,
    photo: "https://randomuser.me/api/portraits/women/68.jpg",
  },
  {
    name: "Wendy T.",
    location: "Yishun, Singapore",
    rate: 16,
    rating: 4.7,
    reviews: 18,
    bio: "Ex-kindergarten teacher. Love making learning fun and keeping kids engaged and happy.",
    skills: ["Educational play", "Arts & crafts", "Cooking"],
    verified: true,
    photo: "https://randomuser.me/api/portraits/women/32.jpg",
  },
  {
    name: "Raiha K.",
    location: "Bedok, Singapore",
    rate: 14,
    rating: 4.6,
    reviews: 11,
    bio: "Part-time student, full-time kid-lover! Flexible hours including evenings and weekends.",
    skills: ["Flexible hours", "Weekends", "Age 2–10"],
    verified: false,
    photo: "https://randomuser.me/api/portraits/women/12.jpg",
  },
  {
    name: "Priya S.",
    location: "Jurong, Singapore",
    rate: 17,
    rating: 4.8,
    reviews: 29,
    bio: "Certified first-aid trained nanny with 6 years experience. Loving and attentive.",
    skills: ["First Aid", "Newborns", "Meal prep"],
    verified: true,
    photo: "https://randomuser.me/api/portraits/women/55.jpg",
  },
  {
    name: "Clara M.",
    location: "Clementi, Singapore",
    rate: 13,
    rating: 4.5,
    reviews: 9,
    bio: "Patient and creative caregiver. Great at arts, crafts and keeping little ones entertained.",
    skills: ["Arts & crafts", "Age 3–8", "Evenings"],
    verified: false,
    photo: "https://randomuser.me/api/portraits/women/76.jpg",
  },
];

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-1">
    <div className="flex">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={12}
          className={
            s <= Math.round(rating)
              ? "text-amber-400 fill-amber-400"
              : "text-gray-200 fill-gray-200"
          }
        />
      ))}
    </div>
    <span className="text-xs font-bold text-gray-700 ml-0.5">{rating}</span>
  </div>
);

const SitterCard = ({ sitter }: { sitter: (typeof sitters)[0] }) => (
  <Link
    to="/babysitters"
    className="group bg-[#0E1E1A] border border-white/6 rounded-2xl p-5 hover:shadow-xl hover:shadow-teal/10 hover:-translate-y-1 hover:border-teal/25 transition-all duration-300 flex-shrink-0 w-[270px]"
  >
    {/* Avatar + rate */}
    <div className="flex items-start justify-between mb-4">
      <div className="relative">
        <img
          src={sitter.photo}
          alt={sitter.name}
          className="w-14 h-14 rounded-2xl object-cover border border-white/10"
        />
        {sitter.verified && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-teal rounded-full flex items-center justify-center border-2 border-white">
            <Shield size={9} className="text-white" />
          </div>
        )}
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-white">SGD {sitter.rate}/h</p>
        <StarRating rating={sitter.rating} />
        <p className="text-[10px] text-white/40 mt-0.5">{sitter.reviews} reviews</p>
      </div>
    </div>

    {/* Name & location */}
    <h3 className="font-heading font-bold text-white text-base group-hover:text-teal transition-colors">
      {sitter.name}
    </h3>
    <div className="flex items-center gap-1 text-xs text-white/40 mb-3 mt-0.5">
      <MapPin size={10} />
      {sitter.location}
    </div>

    <p className="text-xs text-white/40 leading-relaxed mb-4 line-clamp-2">
      {sitter.bio}
    </p>

    {/* Skills */}
    <div className="flex flex-wrap gap-1.5">
      {sitter.skills.map((skill) => (
        <span
          key={skill}
          className="text-[10px] bg-teal/8 text-teal font-medium border border-teal/10 px-2 py-0.5 rounded-full"
        >
          {skill}
        </span>
      ))}
    </div>
  </Link>
);

const BabysittersSection = () => {
  return (
    <section className="py-20" style={{ background: "#080F0D" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <span className="inline-block text-teal text-xs font-bold uppercase tracking-widest mb-3">
              Top rated sitters
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-white">
              Find a sitter your kids will love
            </h2>
          </div>
          <Link
            to="/babysitters"
            className="inline-flex items-center gap-1.5 text-sm text-teal font-semibold hover:gap-2.5 transition-all"
          >
            View all babysitters <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* ── Infinite marquee ── */}
      <div
        className="overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
        }}
      >
        <div
          className="flex gap-5 pl-4 sm:pl-6 lg:pl-8"
          style={{ animation: "sitter-marquee 32s linear infinite" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLDivElement).style.animationPlayState = "paused")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLDivElement).style.animationPlayState = "running")
          }
        >
          {/* Duplicate 3× so loop is seamless at all screen widths */}
          {[...sitters, ...sitters, ...sitters].map((sitter, idx) => (
            <SitterCard key={idx} sitter={sitter} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes sitter-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {/* Babysitter CTA */}
        <div className="bg-[#0D2B36] rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 mx-4 sm:mx-6 lg:mx-8">
          <div>
            <h3 className="text-xl font-heading font-bold text-white mb-1">
              Are you a babysitter?
            </h3>
            <p className="text-gray-300 text-sm max-w-md">
              Turn your passion into flexible work you love. Connect with families
              in your area — entirely free for babysitters.
            </p>
          </div>
          <Link
            to="/signup"
            className="flex-shrink-0 inline-flex items-center gap-2 bg-teal text-white font-semibold px-7 py-3.5 rounded-full hover:bg-teal/90 transition-all hover:shadow-lg hover:shadow-teal/30 hover:-translate-y-0.5 whitespace-nowrap"
          >
            View babysitting jobs <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BabysittersSection;
