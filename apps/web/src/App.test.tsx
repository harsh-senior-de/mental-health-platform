import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeAll } from 'vitest'
import './i18n'
import App from './App'

describe('App shell — crisis helplines', () => {
  beforeAll(() => {
    // i18n initialised via import above
  })

  it('renders the iCare helpline number', () => {
    render(<App />)
    expect(screen.getByText('9152987821')).toBeInTheDocument()
  })

  it('renders the Vandrevala Foundation helpline number', () => {
    render(<App />)
    expect(screen.getByText('1860-2662-345')).toBeInTheDocument()
  })

  it('crisis helpline section has correct aria role', () => {
    render(<App />)
    expect(
      screen.getByRole('complementary', { name: /crisis/i })
    ).toBeInTheDocument()
  })

  it('iCare number is a tel link', () => {
    render(<App />)
    const link = screen.getByRole('link', { name: /9152987821/ })
    expect(link).toHaveAttribute('href', 'tel:9152987821')
  })

  it('Vandrevala number is a tel link', () => {
    render(<App />)
    const link = screen.getByRole('link', { name: /1860-2662-345/ })
    expect(link).toHaveAttribute('href', 'tel:18602662345')
  })
})
