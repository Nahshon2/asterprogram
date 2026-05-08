import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:     'bg-brand-100 text-brand-800',
        secondary:   'bg-medical-light text-medical-text',
        destructive: 'bg-red-100 text-red-800',
        success:     'bg-green-100 text-green-800',
        warning:     'bg-yellow-100 text-yellow-800',
        outline:     'border border-medical-border text-medical-text',
        premium:     'bg-gradient-to-r from-amber-400 to-orange-500 text-white',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
