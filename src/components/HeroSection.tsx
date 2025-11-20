import heroImage from "@/assets/hero-juice.jpg";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div 
        className="container relative px-4 py-12 text-center"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay',
        }}
      >
        <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-foreground">
          Turn what you have into delicious juices
        </h2>
        <p className="text-lg text-foreground/90 max-w-2xl mx-auto drop-shadow-sm">
          Pick your ingredients below — we'll show recipes that fit perfectly (or almost).
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
