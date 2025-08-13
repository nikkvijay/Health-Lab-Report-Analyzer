import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../button'
import { describe, it, expect, vi } from 'vitest'

describe('Button', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: 'Click me' })
    expect(button).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('handles click events', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    const button = screen.getByRole('button')
    
    await user.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('can be disabled', () => {
    render(<Button disabled>Disabled button</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('renders as different element when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/link">Link button</a>
      </Button>
    )
    const link = screen.getByRole('link')
    expect(link).toBeInTheDocument()
    expect(link).toHaveTextContent('Link button')
  })

  it('forwards ref correctly', () => {
    const ref = { current: null }
    render(<Button ref={ref}>Button with ref</Button>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })
})