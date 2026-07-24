import { useEffect, useRef, useState } from 'react';
import * as api from '../services/api';
import {
  PRODUCT_NAME_MAX_LENGTH,
  validateProductName,
} from '../validation/productName';
import '../styles/SearchPanel.css';

const PRODUCT_TYPES = ['Books', 'Music', 'Games'];
const QUANTITY_MIN = 1;
const QUANTITY_MAX = 999;
const SUGGESTION_DEBOUNCE_MS = 500;

export default function SearchPanel({ onAdd }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [nameTouched, setNameTouched] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  // Set when the user picks a suggestion, so the resulting name change does
  // not immediately re-open the list.
  const suppressSuggestionsRef = useRef(false);

  const nameError = validateProductName(name);
  const showNameError = nameTouched && nameError !== null;

  const quantityNumber = Number(quantity);
  const quantityValid =
    Number.isInteger(quantityNumber) &&
    quantityNumber >= QUANTITY_MIN &&
    quantityNumber <= QUANTITY_MAX;

  const formValid = nameError === null && type !== '' && quantityValid;

  // Debounced autocomplete lookup, narrowed by the selected type if any.
  useEffect(() => {
    if (suppressSuggestionsRef.current) {
      suppressSuggestionsRef.current = false;
      return undefined;
    }
    if (name === '' || validateProductName(name) !== null) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      api
        .suggestProducts(name, type || undefined)
        .then(({ suggestions: matches }) => {
          if (cancelled) {
            return;
          }
          setSuggestions(matches);
          setSuggestionsOpen(matches.length > 0);
          setActiveIndex(-1);
        })
        .catch(() => {
          // ignore: a failed suggestion lookup shouldn't block the form
        });
    }, SUGGESTION_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [name, type]);

  function closeSuggestions() {
    setSuggestionsOpen(false);
    setActiveIndex(-1);
  }

  function selectSuggestion(suggestion) {
    suppressSuggestionsRef.current = true;
    setName(suggestion.name);
    setNameTouched(true);
    if (type === '') {
      setType(suggestion.type);
    }
    setSubmitError(null);
    closeSuggestions();
  }

  function handleNameChange(event) {
    setName(event.target.value);
    setNameTouched(true);
    setSubmitError(null);
  }

  function handleNameKeyDown(event) {
    if (!suggestionsOpen) {
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (event.key === 'Escape') {
      closeSuggestions();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!formValid || submitting) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    closeSuggestions();

    const error = await onAdd({ name, type, quantity: quantityNumber });
    if (error) {
      setSubmitError(error);
    } else {
      setName('');
      setNameTouched(false);
      setType('');
      setQuantity('1');
    }
    setSubmitting(false);
  }

  return (
    <form className="search-panel" onSubmit={handleSubmit} noValidate>
      <div className="search-field search-field-name">
        <label htmlFor="productName">Product Name</label>
        <div className="autocomplete">
          <input
            id="productName"
            type="text"
            value={name}
            maxLength={PRODUCT_NAME_MAX_LENGTH}
            className={showNameError ? 'input-invalid' : ''}
            role="combobox"
            aria-invalid={showNameError}
            aria-describedby="productNameError"
            aria-expanded={suggestionsOpen}
            aria-controls="productNameSuggestions"
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined
            }
            autoComplete="off"
            placeholder="Letters only, e.g. Hamlet"
            onChange={handleNameChange}
            onKeyDown={handleNameKeyDown}
            onBlur={closeSuggestions}
          />
          {suggestionsOpen && (
            <ul
              id="productNameSuggestions"
              className="autocomplete-list"
              role="listbox"
              aria-label="Product name suggestions"
            >
              {suggestions.map((suggestion, index) => (
                <li
                  key={`${suggestion.name}-${suggestion.type}`}
                  id={`suggestion-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={
                    index === activeIndex
                      ? 'autocomplete-option is-active'
                      : 'autocomplete-option'
                  }
                  // mousedown fires before the input's blur, so the click
                  // still lands while the list is open.
                  onMouseDown={(event) => {
                    event.preventDefault();
                    selectSuggestion(suggestion);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <span className="autocomplete-name">{suggestion.name}</span>
                  <span className="autocomplete-type">{suggestion.type}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p id="productNameError" className="field-error">
          {showNameError ? nameError : ' '}
        </p>
      </div>

      <div className="search-field">
        <label htmlFor="productType">Product Type</label>
        <select
          id="productType"
          value={type}
          onChange={(event) => {
            setType(event.target.value);
            setSubmitError(null);
          }}
        >
          <option value="" disabled>
            Select a type
          </option>
          {PRODUCT_TYPES.map((productType) => (
            <option key={productType} value={productType}>
              {productType}
            </option>
          ))}
        </select>
      </div>

      <div className="search-field search-field-quantity">
        <label htmlFor="quantity">Quantity</label>
        <input
          id="quantity"
          type="text"
          inputMode="numeric"
          value={quantity}
          onChange={(event) => {
            // Digits only: blocks scientific notation, signs and decimals
            // that type="number" would otherwise let through.
            if (!/^\d*$/.test(event.target.value)) {
              return;
            }
            setQuantity(event.target.value);
            setSubmitError(null);
          }}
        />
      </div>

      <button type="submit" className="add-button" disabled={!formValid || submitting}>
        {submitting ? 'Adding...' : 'ADD'}
      </button>

      {submitError && (
        <p className="submit-error" role="alert">
          {submitError}
        </p>
      )}
    </form>
  );
}
