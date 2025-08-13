import { useTheme } from "@/contexts/ThemeContext"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      expand={true}
      richColors={true}
      closeButton={true}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border-border group-[.toaster]:shadow-xl group-[.toaster]:backdrop-blur-md",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:hover:bg-primary/90",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:hover:bg-muted/80",
          closeButton: "group-[.toast]:text-muted-foreground group-[.toast]:hover:text-foreground",
          title: "group-[.toast]:text-card-foreground group-[.toast]:font-semibold",
          success: "group-[.toast]:border-emerald-500/20 group-[.toast]:bg-emerald-50 dark:group-[.toast]:bg-emerald-950/20",
          error: "group-[.toast]:border-red-500/20 group-[.toast]:bg-red-50 dark:group-[.toast]:bg-red-950/20",
          warning: "group-[.toast]:border-amber-500/20 group-[.toast]:bg-amber-50 dark:group-[.toast]:bg-amber-950/20",
          info: "group-[.toast]:border-blue-500/20 group-[.toast]:bg-blue-50 dark:group-[.toast]:bg-blue-950/20",
        },
        duration: 4000,
      }}
      {...props}
    />
  )
}

export { Toaster }
