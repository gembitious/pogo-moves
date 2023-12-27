import { ButtonProps, Button as MuiButton } from '@mui/material'
import { forwardRef } from 'react'

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...others }, ref): JSX.Element => {
    return (
      <MuiButton
        className={`liveconnect-button ${className ?? ''}`}
        style={{ padding: '4px 8px' }}
        {...others}
        ref={ref}
      />
    )
  },
)

Button.displayName = 'liveconnect-button'

export default Button
