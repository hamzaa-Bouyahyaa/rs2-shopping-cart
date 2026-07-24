import '../styles/ProductGrid.css';

// horizontal scroll on narrow screens, see ProductGrid.css
export default function ProductGrid({ items, onRemove }) {
  return (
    <div className="product-grid-container">
      <table className="product-grid">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Type</th>
            <th>Description</th>
            <th className="col-quantity">Quantity</th>
            <th className="col-actions">
              <span className="visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td className="empty-state" colSpan={5}>
                No products added yet.
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.basketId}>
                <td>{item.name}</td>
                <td>{item.type}</td>
                <td>{item.description}</td>
                <td className="col-quantity">{item.quantity}</td>
                <td className="col-actions">
                  <button
                    type="button"
                    className="remove-button"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => onRemove(item.basketId)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
