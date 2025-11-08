import heroImage from "@/assets/hero-ai-builder.jpg";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-gradient">
              Stack Squad.ai
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Describe your vision and watch as AI transforms your ideas into stunning, 
            fully-functional websites in seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <a 
              href="#builder"
              className="group relative px-8 py-4 bg-gradient-to-r from-primary to-secondary rounded-full font-semibold text-primary-foreground shadow-glow transition-all hover:scale-105 hover:shadow-[0_0_60px_hsla(193,98%,55%,0.5)]"
            >
              Start Building
              <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
            </a>
            
            <button className="px-8 py-4 border border-border rounded-full font-semibold text-foreground backdrop-blur-sm bg-card/50 hover:bg-card/80 transition-all hover:border-primary">
              See Examples
            </button>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>
    </section>
  );
};
