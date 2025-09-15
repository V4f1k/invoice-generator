import { render, screen } from '@testing-library/react'
import { Button } from '../button'

describe('ShadCN/UI Configuration', () => {
  it('should render button component successfully', () => {
    render(<Button>Test Button</Button>)
    
    const button = screen.getByRole('button', { name: 'Test Button' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center')
  })

  it('should support button variants', () => {
    render(<Button variant="destructive">Destructive Button</Button>)
    
    const button = screen.getByRole('button', { name: 'Destructive Button' })
    expect(button).toHaveClass('bg-destructive')
  })

  it('should support button sizes', () => {
    render(<Button size="lg">Large Button</Button>)
    
    const button = screen.getByRole('button', { name: 'Large Button' })
    expect(button).toHaveClass('h-10')
  })
})