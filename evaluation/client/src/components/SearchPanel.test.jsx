import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchPanel from './SearchPanel';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
  suggestProducts: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  api.suggestProducts.mockResolvedValue({ suggestions: [] });
});

function setup(onAdd = vi.fn().mockResolvedValue(null)) {
  const user = userEvent.setup();
  render(<SearchPanel onAdd={onAdd} />);
  return { user, onAdd };
}

describe('SearchPanel', () => {
  test('ADD stays disabled until the whole form is valid', async () => {
    const { user } = setup();
    const addButton = screen.getByRole('button', { name: /add/i });

    expect(addButton).toBeDisabled();

    await user.type(screen.getByLabelText(/product name/i), 'Hamlet');
    expect(addButton).toBeDisabled(); // type still missing

    await user.selectOptions(screen.getByLabelText(/product type/i), 'Books');
    expect(addButton).toBeEnabled();
  });

  test('shows inline feedback for an invalid product name', async () => {
    const { user } = setup();
    const nameInput = screen.getByLabelText(/product name/i);

    await user.type(nameInput, 'abc123');

    expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(/only contain letters/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add/i })).toBeDisabled();
  });

  test('rejects non-digit characters in the quantity field', async () => {
    const { user } = setup();
    const quantityInput = screen.getByLabelText(/quantity/i);

    await user.clear(quantityInput);
    await user.type(quantityInput, '1e2');

    expect(quantityInput).toHaveValue('12'); // the "e" is filtered out
  });

  test('submits the entered product to onAdd', async () => {
    const { user, onAdd } = setup();

    await user.type(screen.getByLabelText(/product name/i), 'Hamlet');
    await user.selectOptions(screen.getByLabelText(/product type/i), 'Books');
    await user.clear(screen.getByLabelText(/quantity/i));
    await user.type(screen.getByLabelText(/quantity/i), '2');
    await user.click(screen.getByRole('button', { name: /add/i }));

    expect(onAdd).toHaveBeenCalledWith({ name: 'Hamlet', type: 'Books', quantity: 2 });
  });

  test('shows suggestions and fills name and type on selection', async () => {
    api.suggestProducts.mockResolvedValue({
      suggestions: [{ name: 'Hamlet', type: 'Books' }],
    });
    const { user } = setup();

    await user.type(screen.getByLabelText(/product name/i), 'Ha');

    const option = await screen.findByRole('option', { name: /hamlet/i });
    await user.click(option);

    expect(screen.getByLabelText(/product name/i)).toHaveValue('Hamlet');
    expect(screen.getByLabelText(/product type/i)).toHaveValue('Books');
  });
});
