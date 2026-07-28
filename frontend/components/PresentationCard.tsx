"use client";

interface PresentationCardProps {
  item: SessionItemPayload;
}

// §5 PresentationCard — shows title, description, image, audio. No
// answering. Advanced by the CONTINUE event (the parent renders the button).
export const PresentationCard = ({ item }: PresentationCardProps) => {
  return (
    <div className="w-full max-w-2xl flex flex-col rounded-3xl bg-white border border-zinc-200 p-6 max-h-[75vh] overflow-y-auto dark:bg-zinc-900 dark:border-zinc-800">
      <span className="self-start px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 mb-4">
        معلومة
      </span>

      {item.title && (
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">{item.title}</p>
      )}

      {item.description && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 whitespace-pre-wrap">
          {item.description}
        </p>
      )}

      {item.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt=""
          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 object-cover mb-4"
        />
      )}

      {item.audioUrl && <audio controls src={item.audioUrl} className="w-full" />}
    </div>
  );
};
