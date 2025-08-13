import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-md hover:shadow-lg hover:bg-destructive/90 hover:scale-[1.02] active:scale-[0.98]",
        outline:
          "border border-input bg-background shadow-sm hover:shadow-md hover:bg-accent hover:text-accent-foreground hover:scale-[1.02] active:scale-[0.98]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-md hover:shadow-lg hover:bg-secondary/80 hover:scale-[1.02] active:scale-[0.98]",
        ghost:
          "hover:bg-accent hover:text-accent-foreground hover:scale-[1.02] active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        medical:
          "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800 hover:scale-[1.02] active:scale-[0.98] border border-blue-600",
        healthy:
          "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md hover:shadow-lg hover:from-emerald-600 hover:to-emerald-700 hover:scale-[1.02] active:scale-[0.98]",
        clinical:
          "bg-white text-slate-700 border-2 border-slate-300 shadow-sm hover:shadow-md hover:border-blue-400 hover:text-blue-700 hover:scale-[1.02] active:scale-[0.98]",
        critical:
          "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md hover:shadow-lg hover:from-red-600 hover:to-red-700 hover:scale-[1.02] active:scale-[0.98]",
        gradient:
          "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md hover:shadow-lg hover:from-blue-700 hover:to-purple-700 hover:scale-[1.02] active:scale-[0.98]",
        success:
          "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md hover:shadow-lg hover:from-emerald-600 hover:to-teal-600 hover:scale-[1.02] active:scale-[0.98]",
        warning:
          "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:shadow-lg hover:from-amber-600 hover:to-orange-600 hover:scale-[1.02] active:scale-[0.98]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
