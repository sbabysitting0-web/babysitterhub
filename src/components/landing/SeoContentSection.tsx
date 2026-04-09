import { Link } from "react-router-dom";

const SeoContentSection = () => {
  return (
    <section className="py-16" style={{ background: "#080F0D" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-[#0E1E1A] p-8 sm:p-10">
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white mb-5">
            Hire a Babysitter Online Across Asia with a Trusted Childcare
            Platform
          </h2>
          <p className="text-white/55 leading-relaxed mb-7">
            BabyCare helps families compare babysitter and nanny profiles,
            review qualifications, and book reliable childcare with confidence.
            Whether you need occasional support, after-school help, or regular
            nanny care, you can find verified caregivers across Asia on one
            platform.
          </p>

          <h3 className="text-lg font-heading font-bold text-white mb-3">
            Why Families Choose BabyCare
          </h3>
          <ul className="text-white/50 text-sm leading-7 list-disc pl-5 mb-8">
            <li>
              Verified babysitter and nanny profiles with transparent reviews.
            </li>
            <li>
              Flexible childcare options for weekdays, weekends, and evenings.
            </li>
            <li>
              Direct messaging and secure booking workflows for peace of mind.
            </li>
          </ul>

          <h3 className="text-lg font-heading font-bold text-white mb-3">
            Explore Popular Childcare Pages
          </h3>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/babysitters"
              className="text-teal hover:text-teal/80 text-sm underline underline-offset-4"
            >
              Browse babysitters
            </Link>
            <Link
              to="/babysitting-jobs"
              className="text-teal hover:text-teal/80 text-sm underline underline-offset-4"
            >
              Babysitting jobs
            </Link>
            <Link
              to="/tips/parents"
              className="text-teal hover:text-teal/80 text-sm underline underline-offset-4"
            >
              Childcare tips for parents
            </Link>
            <Link
              to="/tips/babysitters"
              className="text-teal hover:text-teal/80 text-sm underline underline-offset-4"
            >
              Babysitter success tips
            </Link>
            <Link
              to="/special-needs"
              className="text-teal hover:text-teal/80 text-sm underline underline-offset-4"
            >
              Special needs childcare support
            </Link>
            <Link
              to="/help"
              className="text-teal hover:text-teal/80 text-sm underline underline-offset-4"
            >
              Help and support
            </Link>
            <Link
              to="/about"
              className="text-teal hover:text-teal/80 text-sm underline underline-offset-4"
            >
              About our childcare platform
            </Link>
            <Link
              to="/terms"
              className="text-teal hover:text-teal/80 text-sm underline underline-offset-4"
            >
              Privacy and terms
            </Link>
            <Link
              to="/signup"
              className="text-teal hover:text-teal/80 text-sm underline underline-offset-4"
            >
              Hire babysitter online
            </Link>
            <Link
              to="/login"
              className="text-teal hover:text-teal/80 text-sm underline underline-offset-4"
            >
              Parent and nanny login
            </Link>
          </div>

          <h3 className="text-lg font-heading font-bold text-white mt-9 mb-3">
            Childcare Safety and Parenting Resources
          </h3>
          <p className="text-white/50 text-sm leading-7 mb-3">
            Use these trusted external resources for childcare safety guidance,
            parenting support, and first-aid best practices.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://www.unicef.org/parenting"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-teal hover:text-teal/80 text-sm underline underline-offset-4"
            >
              UNICEF parenting resources
            </a>
            <a
              href="https://www.who.int/health-topics/child-health"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-teal hover:text-teal/80 text-sm underline underline-offset-4"
            >
              WHO child health guidance
            </a>
            <a
              href="https://www.redcross.org/take-a-class/cpr/performing-cpr/child-baby-cpr"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-teal hover:text-teal/80 text-sm underline underline-offset-4"
            >
              Red Cross child and baby CPR guide
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SeoContentSection;
