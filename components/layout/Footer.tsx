import Image from "next/image";

export function Footer() {
  return (
    <footer className="relative mt-auto border-t border-slate-800 bg-slate-950 text-white">
      <div className="container flex min-h-20 flex-col justify-center gap-1 py-4 pr-24 text-sm sm:min-h-16 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">Sun & Rain Works</p>
          <p className="text-white/75">Copyright Sun & Rain Works 2026</p>
        </div>
        <Image
          src="/images/Wikidata_stamp.png"
          alt="Wikidata stamp"
          width={1061}
          height={886}
          className="absolute bottom-3 right-4 h-14 w-auto sm:right-6"
        />
      </div>
    </footer>
  );
}
