import { Heart } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

type WishlistToggleProps = {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void | Promise<void>;
  className?: string;
  size?: "default" | "large";
};

export function WishlistToggle({ pressed, onPressedChange, className, size = "default" }: WishlistToggleProps) {
  const label = pressed ? "إزالة من المفضلة" : "أضف للمفضلة";

  return (
    <Toggle
      type="button"
      variant="outline"
      pressed={pressed}
      onPressedChange={onPressedChange}
      aria-label={label}
      title={label}
      className={cn(
        "group/wishlist relative shrink-0 overflow-hidden rounded-lg border-brand-black bg-background/95 text-brand-black shadow-sm transition-[color,background-color,border-color,transform,box-shadow] duration-200 ease-out hover:border-primary hover:bg-background hover:text-primary active:scale-90 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-brand-black data-[state=on]:shadow-md [&_svg]:size-5",
        size === "large" ? "size-12" : "size-11",
        className,
      )}
    >
      <Heart strokeWidth={2.2} className="transition-[fill,transform] duration-300 ease-out group-data-[state=on]/wishlist:scale-110 group-data-[state=on]/wishlist:fill-current" />
    </Toggle>
  );
}