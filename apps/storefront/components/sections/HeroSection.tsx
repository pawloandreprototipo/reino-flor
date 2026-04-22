import Link from 'next/link'

interface HeroProps {
  title: string
  subtitle: string
  buttonText: string
  buttonUrl: string
  backgroundImage?: string
}

export function HeroSection({ title, subtitle, buttonText, buttonUrl, backgroundImage }: HeroProps) {
  return (
    <section
      className="relative flex min-h-[480px] items-center justify-center overflow-hidden bg-gradient-to-br from-violet-600 to-pink-500"
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
    >
      {backgroundImage && <div className="absolute inset-0 bg-black/40" />}
      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
        <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">{title}</h1>
        <p className="mt-4 text-lg text-white/90">{subtitle}</p>
        <Link
          href={buttonUrl}
          className="mt-8 inline-block rounded-2xl bg-white px-8 py-4 text-base font-bold text-violet-700 shadow-lg hover:bg-violet-50 transition-colors"
        >
          {buttonText}
        </Link>
      </div>
    </section>
  )
}
