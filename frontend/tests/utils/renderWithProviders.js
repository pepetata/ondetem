import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";

// Create mock reducers
const createMockReducer = (initialState = {}) => {
  return (state = initialState, action) => state;
};

export function renderWithProviders(ui, options = {}) {
  const { preloadedState = {}, initialEntries = ["/"] } = options;

  const store = configureStore({
    reducer: {
      user: createMockReducer({}),
      auth: createMockReducer({}),
      notification: createMockReducer({}),
      ads: createMockReducer({}),
      adImages: createMockReducer({}),
      favorites: createMockReducer({}),
      comments: createMockReducer({}),
    },
    preloadedState,
  });

  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper }) };
}

export function renderWithRedux(ui, options = {}) {
  const { preloadedState = {} } = options;

  const store = configureStore({
    reducer: {
      user: createMockReducer({}),
      auth: createMockReducer({}),
      notification: createMockReducer({}),
      ads: createMockReducer({}),
      adImages: createMockReducer({}),
      favorites: createMockReducer({}),
      comments: createMockReducer({}),
    },
    preloadedState,
  });

  function Wrapper({ children }) {
    return <Provider store={store}>{children}</Provider>;
  }

  return { store, ...render(ui, { wrapper: Wrapper }) };
}
