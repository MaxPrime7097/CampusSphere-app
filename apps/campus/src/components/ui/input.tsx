import * as React from "react";

import { cn } from "@/lib/utils";

export const REGISTRATION_MAX_LENGTHS = {
  username: 50,
  firstName: 100,
  lastName: 100,
  email: 254,
  phoneNumber: 20,
  password: 128,
  studentId: 50,
  campus: 100,
  town: 100,
  language: 50,
  bio: 1000,
  portfolioName: 100,
  portfolioUrl: 2048,
  educationYear: 30,
  experienceDuration: 60,
  experienceDescription: 1000,
} as const;

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
