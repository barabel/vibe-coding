---
name: write-test
description: Write a single well-structured test that verifies behavior through public interfaces. Use when user asks to write a test, add tests, or check if a test is written correctly.
---

# Write Test

## Rule: test behavior, not implementation

Test describes WHAT the system does, not HOW. It must survive internal refactors.

```typescript
// GOOD — observable behavior through public interface
test("user can checkout with valid cart", async () => {
  const cart = createCart();
  cart.add(product);
  const result = await checkout(cart, paymentMethod);
  expect(result.status).toBe("confirmed");
});

// BAD — coupled to internals
test("checkout calls paymentService.process", async () => {
  const mock = jest.mock(paymentService);
  await checkout(cart, payment);
  expect(mock.process).toHaveBeenCalledWith(cart.total);
});
```

## Test name

Format: `"<subject> <behavior>"` — reads like a spec.

- `"user can checkout with valid cart"` ✓
- `"checkout calls paymentService.process"` ✗ (describes HOW)

## Structure: Arrange → Act → Assert

```typescript
test("createUser makes user retrievable", async () => {
  // Arrange
  const input = { name: "Alice" };

  // Act
  const user = await createUser(input);

  // Assert
  const retrieved = await getUser(user.id);
  expect(retrieved.name).toBe("Alice");
});
```

One logical assertion per test.

## Mocking

Mock **only at system boundaries**: external APIs, email/SMS, time, randomness.  
Never mock your own code or internal collaborators.

```typescript
// OK to mock
const stripe = { charge: jest.fn().mockResolvedValue({ id: "ch_123" }) };

// NOT OK — mocks internal logic
const orderService = { calculateTotal: jest.fn() };
```

## Red flags

- Name describes HOW, not WHAT
- Mocks internal collaborators or private methods
- Asserts on call counts / call order
- Test breaks on refactor even though behavior didn't change ← this is the warning sign

## Checklist

- [ ] Name describes behavior, not implementation
- [ ] Uses public interface only — no private methods, no internal spies
- [ ] Would pass after internal refactor without changes
- [ ] One logical assertion
- [ ] Mocks only at system boundary (if at all)
