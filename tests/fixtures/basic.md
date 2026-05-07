# Markdown Viewer Test

This is a **basic** fixture with _inline_ formatting and `code`.

## Lists

- apples
- oranges
- bananas

1. first
2. second
3. third

## Code block

```js
function hello(name) {
  return `Hello, ${name}!`;
}
```

## Table

| Col A | Col B |
|-------|-------|
| 1     | one   |
| 2     | two   |

## Quote

> Markdown is meant to be easy to read.

## Links and images

[Anthropic](https://anthropic.com) and a [relative link](./basic.md).

![local image](images/logo.png)

## XSS probe

<img src="x" onerror="alert('xss')">
<script>alert('xss')</script>

End.
