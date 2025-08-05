import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { cva, type VariantProps } from "class-variance-authority";

const loadingVariants = cva(
  "flex flex-col items-center justify-center p-6 rounded-lg text-center space-y-4",
  {
    variants: {
      variant: {
        default: "bg-white",
        primary: "bg-primary/5 border border-primary/20",
        success: "bg-green-50 border border-green-100",
        error: "bg-red-50 border border-red-200",
      },
      size: {
        default: "min-h-[200px]",
        sm: "min-h-[150px]",
        lg: "min-h-[300px]"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface LoadingAnimationProps extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof loadingVariants> {
  title?: string;
  description?: string;
  isLoading?: boolean;
  icon?: keyof typeof Icons;
  spinIcon?: boolean;
  showSpinner?: boolean;
  progress?: number;
}

export function LoadingAnimation({
  className,
  variant,
  size,
  title = "Loading...",
  description,
  isLoading = true,
  icon,
  spinIcon = false,
  showSpinner = true,
  progress,
  ...props
}: LoadingAnimationProps) {
  const IconComponent = icon ? Icons[icon] : undefined;
  
  return (
    <div className={cn(loadingVariants({ variant, size, className }))} {...props}>
      {icon && IconComponent && (
        <div className={cn(
          "text-primary", 
          spinIcon && isLoading && "animate-spin"
        )}>
          <IconComponent className="h-12 w-12" />
        </div>
      )}
      
      {showSpinner && isLoading && !icon && (
        <div className="animate-spin text-primary">
          <Icons.spinner className="h-12 w-12" />
        </div>
      )}
      
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      
      {progress !== undefined && (
        <div className="w-full max-w-md space-y-2">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
          <div className="text-sm text-gray-500 text-center">{Math.round(progress)}%</div>
        </div>
      )}
    </div>
  );
}

