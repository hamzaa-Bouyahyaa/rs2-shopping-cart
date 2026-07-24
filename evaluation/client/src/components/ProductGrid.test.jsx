import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductGrid from './ProductGrid';

const ITEMS = [
  {
    basketId: 7,
    name: 'Hamlet',
    type: 'Books',
    description: 'Tragedy by William Shakespeare',
    quantity: 2,
  },
];

describe('ProductGrid', () => {
  test('shows an empty state when there are no items', () => {
    render(<ProductGrid items={[]} onRemove={vi.fn()} />);
    expect(screen.getByText(/no products added yet/i)).toBeInTheDocument();
  });

  test('renders basket rows', () => {
    render(<ProductGrid items={ITEMS} onRemove={vi.fn()} />);

    expect(screen.getByText('Hamlet')).toBeInTheDocument();
    expect(screen.getByText('Books')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('calls onRemove with the basket id', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<ProductGrid items={ITEMS} onRemove={onRemove} />);

    await user.click(screen.getByRole('button', { name: /remove hamlet/i }));

    expect(onRemove).toHaveBeenCalledWith(7);
  });
});
