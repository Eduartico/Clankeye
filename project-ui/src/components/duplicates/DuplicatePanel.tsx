import React from "react";
import PlatformBadge from "../cards/PlatformBadge";

interface DuplicateGroup {
  groupId: string;
  items: Array<{
    id: string;
    title: string;
    price: any;
    source: string;
    url: string;
    image: string | null;
    seller: any;
  }>;
  itemCount: number;
  platforms: string[];
  maxSimilarity: number;
}

interface DuplicatePanelProps {
  item: any;
  duplicateGroups: DuplicateGroup[];
  onClose: () => void;
}

/**
 * Slide-in panel that shows "This item has duplicates on these websites"
 */
export default function DuplicatePanel({
  item,
  duplicateGroups,
  onClose,
}: DuplicatePanelProps) {
  // Find the group this item belongs to
  const group = duplicateGroups.find(
    (g) => g.groupId === item.duplicateGroupId
  );

  if (!group) return null;

  // All items in the group except the current one
  const otherItems = group.items.filter(
    (dupItem) => dupItem.id !== (item.id || item.externalId)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay">
      <div className="glass-modal max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 dark:border-white/5">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              Duplicate Items Found
            </h2>
            <p className="text-sm text-text-secondary">
              This item appears on {group.platforms.length} platform
              {group.platforms.length > 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Similarity badge */}
        <div className="px-4 pt-3">
          <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-xs font-semibold px-2.5 py-1 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {Math.round(group.maxSimilarity * 100)}% match
          </span>
        </div>

        {/* Current item */}
        <div className="p-4">
          <p className="text-xs text-text-secondary mb-2 uppercase tracking-wide font-semibold">
            Current item
          </p>
          <div className="flex items-center gap-3 p-3 glass-surface-light rounded-xl">
            {(item.photos?.[0] || item.image) && (
              <img
                src={item.photos?.[0] || item.image}
                alt=""
                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <PlatformBadge platform={item.source} />
              <p className="text-sm font-semibold text-text-primary mt-1 truncate">
                {item.title}
              </p>
              <p className="text-sm font-bold text-primary-500">
                € {item.price}
              </p>
            </div>
          </div>
        </div>

        {/* Duplicate items */}
        <div className="px-4 pb-4">
          <p className="text-xs text-text-secondary mb-2 uppercase tracking-wide font-semibold">
            Also found on
          </p>
          <div className="space-y-2">
            {otherItems.map((dupItem) => (
              <a
                key={dupItem.id}
                href={dupItem.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 glass-surface-light rounded-xl hover:opacity-80 transition-all"
              >
                {dupItem.image && (
                  <img
                    src={dupItem.image}
                    alt=""
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <PlatformBadge platform={dupItem.source} />
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1 truncate">
                    {dupItem.title}
                  </p>
                  <p className="text-sm font-bold text-primary-500">
                    € {dupItem.price}
                  </p>
                  {dupItem.seller && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Seller:{" "}
                      {typeof dupItem.seller === "object"
                        ? dupItem.seller.name
                        : dupItem.seller}
                    </p>
                  )}
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
