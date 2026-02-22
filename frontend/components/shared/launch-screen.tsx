import Image from "next/image";

export function LaunchScreen() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-6 py-8 text-foreground">
      <div className="relative h-48 w-48 overflow-hidden rounded-full sm:h-65 sm:w-65">
        <Image
          src="/poco.JPG"
          alt="Poco avatar"
          fill
          priority
          sizes="140px"
          className="object-cover"
        />
      </div>

      <p className="absolute bottom-10 text-center text-sm font-medium tracking-wide text-muted-foreground sm:text-base">
        <span className="font-brand">Poco: Your Pocket Coworker</span>
      </p>
    </div>
  );
}
