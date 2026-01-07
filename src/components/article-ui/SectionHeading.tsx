/**
 * SectionHeading.tsx
 * ------------------
 * Judul section + divider 3 warna.
 */
export default function SectionHeading({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-end justify-between">
        <h2 className="text-[28px] font-semibold leading-tight tracking-tight">
          {title}
        </h2>
        {right}
      </div>
      {/* Divider 3 warna */}
      <div className="mt-2 flex h-1.5 w-44 overflow-hidden rounded-full">
        <div className="h-full w-1/3 bg-emerald-500" />
        <div className="h-full w-1/3 bg-sky-500" />
        <div className="h-full w-1/3 bg-amber-500" />
      </div>
    </div>
  );
}
